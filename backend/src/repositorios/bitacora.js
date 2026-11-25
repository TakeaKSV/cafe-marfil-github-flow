import { consulta } from '../db/conexion.js';
import { insertar } from './base.js';

export const insertarEscaneo = ({ codigo, tipo, descripcion, resultado, exito, personalId, creadoEn }) =>
  insertar('escaneos', {
    codigo,
    tipo,
    descripcion,
    resultado,
    exito,
    personal_id: personalId,
    creado_en: creadoEn
  });

export const insertarNotificacion = ({ clienteId, titulo, mensaje, tipo, screenDestino, creadoEn }) =>
  insertar('notificaciones', {
    cliente_id: clienteId,
    titulo,
    mensaje,
    tipo,
    screen_destino: screenDestino,
    creado_en: creadoEn
  });

export const historial = (limite) =>
  consulta('escaneos as e')
    .leftJoin('personal as p', 'p.id', 'e.personal_id')
    .select('e.*', 'p.nombre as personal_nombre')
    .orderBy('e.id', 'desc')
    .limit(limite);
