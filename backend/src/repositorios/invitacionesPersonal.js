import { consulta } from '../db/conexion.js';
import { insertar, actualizar, fechaBD } from './base.js';

function invitaciones() {
  return consulta('invitaciones_personal as i')
    .leftJoin('sucursales as s', 's.id', 'i.sucursal_id')
    .leftJoin('personal as p', 'p.id', 'i.invitado_por')
    .select('i.*', 's.nombre as sucursal_nombre', 'p.nombre as invitado_por_nombre');
}

export const crear = ({
  email,
  rol,
  puesto,
  sucursalId,
  turnoInicio,
  turnoFin,
  tokenHash,
  invitadoPor,
  expiraEn,
  creadoEn
}) =>
  insertar('invitaciones_personal', {
    email,
    rol,
    puesto,
    sucursal_id: sucursalId ?? null,
    turno_inicio: turnoInicio ?? null,
    turno_fin: turnoFin ?? null,
    token_hash: tokenHash,
    invitado_por: invitadoPor ?? null,
    expira_en: expiraEn,
    creado_en: creadoEn
  });

export const porHash = (tokenHash) => invitaciones().where('i.token_hash', tokenHash).first();

export const porId = (id) => invitaciones().where('i.id', id).first();

export const listarPendientes = (ahora) =>
  invitaciones().whereNull('i.usado_en').where('i.expira_en', '>', fechaBD(ahora)).orderBy('i.id', 'desc');

export const invalidarPorEmail = (email, ahora) =>
  consulta('invitaciones_personal')
    .where({ email })
    .whereNull('usado_en')
    .update({ usado_en: fechaBD(ahora) });

export const marcarUsada = (id, usadoEn) => actualizar('invitaciones_personal', id, { usado_en: usadoEn });

export const eliminar = (id) => consulta('invitaciones_personal').where({ id }).delete();
