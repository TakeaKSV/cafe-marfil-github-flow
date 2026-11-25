// Registros que otros servicios escriben como efecto secundario:
// la bitácora del escáner de caja y las notificaciones de la PWA.

import * as repo from '../repositorios/bitacora.js';
import { ahoraISO, horaLocal, horaTexto } from '../utils/fechas.js';

const ETIQUETAS_ESCANEO = {
  reservacion: 'Pase de Reservación',
  promocion: 'Cupón de Promoción',
  club: 'Club Marfil Pasaporte',
  beneficio: 'Beneficio de Cliente',
  desconocido: 'Código no reconocido'
};

export async function registrarEscaneo({ codigo, tipo, descripcion, resultado, exito = true, personalId = null }) {
  await repo.insertarEscaneo({
    codigo: codigo.slice(0, 80),
    tipo: tipo,
    descripcion: descripcion.slice(0, 255),
    resultado: resultado.slice(0, 160),
    exito: exito,
    personalId: personalId,
    creadoEn: ahoraISO()
  });
}

export async function historialEscaneos({ limite = 30 } = {}) {
  const filas = await repo.historial(limite);
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
  await repo.insertarNotificacion({
    clienteId: clienteId,
    titulo: titulo,
    mensaje: mensaje.slice(0, 500),
    tipo: tipo,
    screenDestino: screenDestino,
    creadoEn: ahoraISO()
  });
}
