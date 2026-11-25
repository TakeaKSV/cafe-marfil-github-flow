import { HttpError } from '../utils/errores.js';

// Códigos de error de MySQL (mysql2 los entrega en err.code).
const ERRORES_DE_INTEGRIDAD = new Set([
  'ER_DUP_ENTRY', // índice UNIQUE
  'ER_NO_REFERENCED_ROW_2', // llave foránea: el registro referido no existe
  'ER_ROW_IS_REFERENCED_2', // llave foránea: aún hay registros que dependen de este
  'ER_CHECK_CONSTRAINT_VIOLATED',
  'ER_DATA_TOO_LONG'
]);
const ERRORES_DE_CONEXION = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR'
]);

export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'No existe esa ruta.' });
}

/** Todas las respuestas de error tienen la forma { error: string, detalles?: [] }. */
export function manejarErrores(err, _req, res, _next) {
  if (res.headersSent) return _next(err);
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.detalles && { detalles: err.detalles }) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido.' });
  }
  if (err.type === 'entity.too.large')
    return res.status(413).json({ error: 'El cuerpo de la petición excede el límite permitido.' });
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported')
    return res.status(415).json({ error: 'Codificación no admitida.' });
  if (ERRORES_DE_INTEGRIDAD.has(err.code)) {
    // Red de seguridad: los servicios validan antes, pero la base tiene la última palabra.
    return res.status(409).json({ error: 'La operación choca con una regla de integridad de los datos.' });
  }
  if (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT') {
    return res.status(409).json({ error: 'Otra persona estaba modificando lo mismo. Intenta de nuevo.' });
  }
  if (ERRORES_DE_CONEXION.has(err.code)) {
    console.error(`Sin conexión a MySQL (${err.code}). ¿Está encendido el servidor de base de datos?`);
    return res.status(503).json({ error: 'No hay conexión con la base de datos. Intenta de nuevo en un momento.' });
  }
  console.error('Error interno de la API.', { codigo: err.code ?? 'INTERNAL_ERROR' });
  res.status(500).json({ error: 'Error interno del servidor.' });
}

/** Bitácora mínima de peticiones para desarrollo. */
export function registrarPeticiones(req, res, next) {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    console.log(
      `${req.method} ${req.route?.path ?? '[ruta no encontrada]'} -> ${res.statusCode} (${ms.toFixed(1)} ms)`
    );
  });
  next();
}
