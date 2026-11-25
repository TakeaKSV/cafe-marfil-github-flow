import { consulta } from '../db/conexion.js';
import { fechaBD } from './base.js';

function sucursal(query, columna, id) {
  return id ? query.where(columna, id) : query;
}
function rango(query, columna, { desde, hasta }) {
  return query.where(columna, '>=', fechaBD(desde)).where(columna, '<', fechaBD(hasta));
}
export const reservasPorEstado = ({ fecha, sucursalId }) =>
  sucursal(
    consulta('reservaciones').select('estado').count({ total: '*' }).where({ fecha }).groupBy('estado'),
    'sucursal_id',
    sucursalId
  );

export const serviciosDelDia = (filtros) =>
  rango(
    sucursal(
      consulta('servicios_mesa as sv')
        .join('mesas as m', 'm.id', 'sv.mesa_id')
        .select('sv.personas', 'sv.ticket_total', 'sv.inicio', 'sv.fin'),
      'm.sucursal_id',
      filtros.sucursalId
    ),
    'sv.inicio',
    filtros
  );

export async function aforo(sucursalId) {
  const maximo = await sucursal(
    consulta('sucursales').sum({ total: 'aforo_max' }).where('activa', 1),
    'id',
    sucursalId
  ).first();
  const actual = await sucursal(
    consulta('servicios_mesa as sv')
      .join('mesas as m', 'm.id', 'sv.mesa_id')
      .sum({ total: 'sv.personas' })
      .whereNull('sv.fin'),
    'm.sucursal_id',
    sucursalId
  ).first();
  return { maximo: Number(maximo.total ?? 0), actual: Number(actual.total ?? 0) };
}
async function contar(query) {
  return Number((await query.count({ total: '*' }).first()).total);
}
export const sellos = (filtros) =>
  contar(
    rango(
      sucursal(consulta('movimientos_club').where('tipo', 'sello'), 'sucursal_id', filtros.sucursalId),
      'creado_en',
      filtros
    )
  );
export const cupones = (filtros) =>
  contar(rango(sucursal(consulta('canjes_promocion'), 'sucursal_id', filtros.sucursalId), 'creado_en', filtros));
// El historial del escáner es global: el esquema no registra su sucursal.
export const escaneos = (filtros) => contar(rango(consulta('escaneos'), 'creado_en', filtros));
