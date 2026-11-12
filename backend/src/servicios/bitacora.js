// Registros que otros servicios escriben como efecto secundario:
// la bitácora del escáner de caja y las notificaciones de la PWA.

import { db } from '../db/conexion.js';
import { ahoraISO, horaLocal, horaTexto } from '../utils/fechas.js';

const ETIQUETAS_ESCANEO = {
  reservacion: 'Pase de Reservación',
  promocion: 'Cupón de Promoción',
  club: 'Club Marfil Pasaporte',
  beneficio: 'Beneficio de Cliente',
  desconocido: 'Código no reconocido'
};

export async function registrarEscaneo({ codigo, tipo, descripcion, resultado, exito = true, personalId = null }) {
  await db.ejecutar(
    `INSERT INTO escaneos (codigo, tipo, descripcion, resultado, exito, personal_id, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [codigo.slice(0, 80), tipo, descripcion.slice(0, 255), resultado.slice(0, 160), exito, personalId, ahoraISO()]
  );
}

export async function historialEscaneos({ limite = 30 } = {}) {
  const filas = await db.todos(
    `SELECT e.*, p.nombre AS personal_nombre
     FROM escaneos e LEFT JOIN personal p ON p.id = e.personal_id
     ORDER BY e.id DESC LIMIT ?`,
    [limite]
  );
  return filas.map((fila) => ({
    id: fila.id,
    codigo: fila.codigo,
    tipo: fila.tipo,
    tipoNombre: ETIQUETAS_ESCANEO[fila.tipo],
    descripcion: fila.descripcion,
    resultado: fila.resultado,
    exito: fila.exito === 1,
    registradoPor: fila.personal_nombre,
    fechaHora: fila.creado_en,
    hora: horaTexto(horaLocal(new Date(fila.creado_en)))
  }));
}

export async function crearNotificacion(clienteId, { titulo, mensaje, tipo, screenDestino = null }) {
  if (!clienteId) return;
  await db.ejecutar(
    `INSERT INTO notificaciones (cliente_id, titulo, mensaje, tipo, screen_destino, creado_en)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [clienteId, titulo, mensaje.slice(0, 500), tipo, screenDestino, ahoraISO()]
  );
}
