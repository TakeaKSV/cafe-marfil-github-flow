// Conexión a MySQL.
//
// Los servicios no usan mysql2 directamente: usan `db.todos / db.uno / db.ejecutar`
// y `enTransaccion`. Este módulo se encarga de tres traducciones para que el
// resto del código trabaje siempre con los mismos formatos que la API:
//
//   DATE      <->  'AAAA-MM-DD'
//   TIME      <->  'HH:MM'
//   DATETIME  <->  ISO-8601 en UTC ('2026-11-11T06:00:00.000Z')
//
// Parámetros de las consultas:  `?` con un arreglo, o `:nombre` con un objeto.

import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const ISO_UTC = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)Z$/;

/** Cómo se convierte cada tipo de columna al leer. */
function typeCast(campo, siguiente) {
  switch (campo.type) {
    case 'DATE':
      return campo.string();
    case 'TIME': {
      const valor = campo.string();
      return valor && valor.slice(0, 5);
    }
    case 'DATETIME':
    case 'TIMESTAMP': {
      const valor = campo.string();
      return valor && `${valor.replace(' ', 'T')}Z`;
    }
    case 'DECIMAL':
    case 'NEWDECIMAL': {
      const valor = campo.string();
      return valor === null ? null : Number(valor);
    }
    case 'JSON':
      return campo.string('utf8'); // se entrega como texto; los servicios lo leen con leerJSON()
    default:
      return siguiente();
  }
}

const opcionesConexion = {
  host: config.bd.host,
  port: config.bd.puerto,
  user: config.bd.usuario,
  password: config.bd.password,
  charset: 'utf8mb4',
  timezone: 'Z', // todas las marcas de tiempo viajan en UTC
  namedPlaceholders: true,
  typeCast
};

const pool = mysql.createPool({ ...opcionesConexion, database: config.bd.nombre, connectionLimit: 10 });

/** Conexión de la transacción en curso (si la hay) para la petición actual. */
const transaccionActual = new AsyncLocalStorage();

/** MySQL no acepta fechas ISO con 'Z': se pasan a 'AAAA-MM-DD HH:MM:SS.mmm'. */
function aValorSQL(valor) {
  if (valor === undefined) return null;
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (typeof valor === 'string') {
    const iso = ISO_UTC.exec(valor);
    if (iso) return `${iso[1]} ${iso[2]}`;
  }
  return valor;
}

function prepararParametros(parametros) {
  if (parametros === undefined) return undefined;
  if (Array.isArray(parametros)) return parametros.map(aValorSQL);
  return Object.fromEntries(Object.entries(parametros).map(([clave, valor]) => [clave, aValorSQL(valor)]));
}

async function consultar(sql, parametros) {
  const ejecutor = transaccionActual.getStore() ?? pool;
  const [resultado] = await ejecutor.query(sql, prepararParametros(parametros));
  return resultado;
}

export const db = {
  /** SELECT: todas las filas. */
  todos: (sql, parametros) => consultar(sql, parametros),

  /** SELECT: la primera fila, o undefined si no hay ninguna. */
  uno: async (sql, parametros) => (await consultar(sql, parametros))[0],

  /** INSERT / UPDATE / DELETE: devuelve el id generado y cuántas filas coincidieron. */
  ejecutar: async (sql, parametros) => {
    const resultado = await consultar(sql, parametros);
    return { id: resultado.insertId, afectadas: resultado.affectedRows };
  }
};

/**
 * Ejecuta `fn` dentro de una transacción: si lanza un error se revierte todo.
 * Las consultas que haga `fn` (y las funciones que llame) usan la misma
 * conexión automáticamente. Si ya hay una transacción abierta, se une a ella.
 */
export async function enTransaccion(fn) {
  if (transaccionActual.getStore()) return fn();

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await transaccionActual.run(conexion, fn);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

/**
 * Bloquea una fila hasta que termine la transacción (SELECT ... FOR UPDATE).
 * Evita que dos peticiones simultáneas pasen la misma validación a la vez,
 * por ejemplo dos hosts sentando gente en la misma mesa.
 */
export async function bloquearFila(tabla, id) {
  return db.uno(`SELECT id FROM ${tabla} WHERE id = ? FOR UPDATE`, [id]);
}

// --------------------------------------------------------------------------
// Preparación de la base (arranque, comandos db:* y pruebas)
// --------------------------------------------------------------------------

async function leerEsquema() {
  return fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');
}

/** Crea la base de datos y las tablas que falten. Es seguro ejecutarlo en cada arranque. */
export async function prepararBase() {
  const servidor = await mysql.createConnection({ ...opcionesConexion, multipleStatements: true });
  try {
    await servidor.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.bd.nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );
    await servidor.query(`USE \`${config.bd.nombre}\``);
    await servidor.query(await leerEsquema());
  } finally {
    await servidor.end();
  }
}

/**
 * Borra todas las tablas del proyecto (solo para `npm run db:reset` y pruebas).
 * Se niega a continuar si la base contiene tablas que no son de este esquema:
 * así un DB_NAME mal escrito no puede borrar la base de otro proyecto.
 */
export async function borrarTodo() {
  const propias = [...(await leerEsquema()).matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]);
  const existentes = (
    await db.todos('SELECT table_name AS nombre FROM information_schema.tables WHERE table_schema = ?', [config.bd.nombre])
  ).map((tabla) => tabla.nombre);

  const ajenas = existentes.filter((nombre) => !propias.includes(nombre));
  if (ajenas.length) {
    throw new Error(
      `La base "${config.bd.nombre}" tiene tablas que no son de Café Marfil (${ajenas.join(', ')}). ` +
        'No se borra nada: revisa DB_NAME en backend/.env.'
    );
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const nombre of existentes) await conexion.query(`DROP TABLE \`${nombre}\``);
  } finally {
    await conexion.query('SET FOREIGN_KEY_CHECKS = 1');
    conexion.release();
  }
}

/** Cierra el pool para que los scripts y las pruebas puedan terminar. */
export const cerrarConexion = () => pool.end();
