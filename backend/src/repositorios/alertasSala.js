import { consulta } from '../db/conexion.js';
import { insertar, actualizar } from './base.js';

export function listarActivas({ sucursalId } = {}) {
  const query = consulta('alertas_sala').where({ activa: 1 });
  if (sucursalId) {
    query.andWhere(function () {
      this.whereNull('sucursal_id').orWhere('sucursal_id', sucursalId);
    });
  }
  return query.orderBy('id', 'desc').limit(10);
}

export const crear = ({ mensaje, sucursalId, creadoPorId, creadoPorNombre, creadoEn }) =>
  insertar('alertas_sala', {
    mensaje,
    sucursal_id: sucursalId ?? null,
    creado_por_id: creadoPorId ?? null,
    creado_por_nombre: creadoPorNombre,
    activa: 1,
    creado_en: creadoEn
  });

export const porId = (id) => consulta('alertas_sala').where({ id }).first();

export const descartar = (id) => actualizar('alertas_sala', id, { activa: 0 });
