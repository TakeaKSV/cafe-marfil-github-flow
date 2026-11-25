import { consulta } from '../db/conexion.js';
import { insertar, actualizar, fechaBD } from './base.js';

export const crear = ({ clienteId, tokenHash, tipo, expiraEn, creadoEn }) =>
  insertar('tokens_correo', {
    cliente_id: clienteId,
    token_hash: tokenHash,
    tipo,
    expira_en: expiraEn,
    creado_en: creadoEn
  });

export const porHash = (tokenHash) => consulta('tokens_correo').where({ token_hash: tokenHash }).first();

export const marcarUsado = (id, usadoEn) => actualizar('tokens_correo', id, { usado_en: usadoEn });

export const invalidarPendientes = (clienteId, tipo, ahora) =>
  consulta('tokens_correo')
    .where({ cliente_id: clienteId, tipo })
    .whereNull('usado_en')
    .update({ usado_en: fechaBD(ahora) });
