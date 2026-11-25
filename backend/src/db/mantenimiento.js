import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../config.js';
import { conexion, opcionesConexion } from './conexion.js';

const opcionesMigracion = {
  directory: fileURLToPath(new URL('./migraciones/', import.meta.url)),
  loadExtensions: ['.js'],
  disableTransactions: true
};

export async function prepararBase() {
  const servidor = await mysql.createConnection({ ...opcionesConexion, database: undefined });
  try {
    // Identificador validado al cargar configuración y escapado por el driver.
    await servidor.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci', [
      config.bd.nombre
    ]);
  } finally {
    await servidor.end();
  }
  await conexion.migrate.latest(opcionesMigracion);
}

export async function verificarBase() {
  await conexion('personal').select('id', 'session_version').limit(1);
  await conexion('clientes').select('id', 'session_version').limit(1);
}

export async function borrarTodo() {
  if (config.esProduccion || process.env.DB_RESET_CONFIRM !== config.bd.nombre) {
    throw new Error('Reset bloqueado: requiere desarrollo/pruebas y DB_RESET_CONFIRM igual a DB_NAME.');
  }
  const esquema = await fs.readFile(new URL('./migraciones/001_inicial.sql', import.meta.url), 'utf8');
  const tablas = [...esquema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]);
  tablas.push('tokens_correo');
  const existentes = await conexion('information_schema.tables')
    .select('table_name')
    .where('table_schema', config.bd.nombre);
  const permitidas = new Set([...tablas, 'knex_migrations', 'knex_migrations_lock']);
  if (existentes.some((t) => !permitidas.has(t.table_name ?? t.TABLE_NAME))) {
    throw new Error('Reset bloqueado: la base contiene tablas ajenas al proyecto.');
  }
  for (const tabla of [...tablas].reverse()) await conexion.schema.dropTableIfExists(tabla);
  await conexion.schema.dropTableIfExists('knex_migrations');
  await conexion.schema.dropTableIfExists('knex_migrations_lock');
}
