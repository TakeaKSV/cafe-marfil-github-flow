import { AsyncLocalStorage } from 'node:async_hooks';
import knex from 'knex';
import { config } from '../config.js';

export function typeCast(campo, siguiente) {
  if (campo.type === 'DATE') return campo.string();
  if (campo.type === 'TIME') return campo.string()?.slice(0, 5) ?? null;
  if (['DATETIME', 'TIMESTAMP'].includes(campo.type)) {
    const valor = campo.string();
    return valor && `${valor.replace(' ', 'T')}Z`;
  }
  if (['DECIMAL', 'NEWDECIMAL'].includes(campo.type)) {
    const valor = campo.string();
    return valor === null ? null : Number(valor);
  }
  if (campo.type === 'JSON') return campo.string('utf8');
  return siguiente();
}

export const opcionesConexion = {
  host: config.bd.host,
  port: config.bd.puerto,
  user: config.bd.usuario,
  password: config.bd.password,
  database: config.bd.nombre,
  charset: 'utf8mb4',
  timezone: 'Z',
  multipleStatements: false,
  typeCast
};

export const conexion = knex({
  client: 'mysql2',
  connection: opcionesConexion,
  pool: { min: 0, max: 10 },
  acquireConnectionTimeout: 10000,
  compileSqlOnError: false
});

const contexto = new AsyncLocalStorage();
export const consulta = (tabla) => (contexto.getStore() ?? conexion)(tabla);

/** Una unidad de trabajo usa la misma conexión, incluso entre servicios. */
export function enTransaccion(fn) {
  if (contexto.getStore()) return fn();
  // Después de esperar un bloqueo, las lecturas deben ver el último commit.
  return conexion.transaction((trx) => contexto.run(trx, fn), { isolationLevel: 'read committed' });
}

export async function bloquearFila(tabla, id) {
  if (!contexto.getStore()) throw new Error('Un bloqueo requiere una transacción.');
  return consulta(tabla).select('id').where({ id }).forUpdate().first();
}

export const cerrarConexion = () => conexion.destroy();
