import { consulta } from '../db/conexion.js';

function sucursales() {
  return consulta('sucursales as s')
    .select(
      's.*',
      consulta('servicios_mesa as sv')
        .join('mesas as m', 'm.id', 'sv.mesa_id')
        .sum('sv.personas')
        .whereColumn('m.sucursal_id', 's.id')
        .whereNull('sv.fin')
        .as('aforo_actual'),
      consulta('personal as p')
        .select('p.nombre')
        .whereColumn('p.sucursal_id', 's.id')
        .where('p.es_encargado', 1)
        .whereNot('p.estado', 'inactivo')
        .orderBy('p.id')
        .limit(1)
        .as('encargado_nombre'),
      consulta('personal as p')
        .select('p.puesto')
        .whereColumn('p.sucursal_id', 's.id')
        .where('p.es_encargado', 1)
        .whereNot('p.estado', 'inactivo')
        .orderBy('p.id')
        .limit(1)
        .as('encargado_puesto')
    )
    .where('s.activa', 1);
}
export const listar = () => sucursales().orderBy('s.destacada', 'desc').orderBy('s.nombre');
export const buscar = (id) => sucursales().where('s.id', id).first();

export const zonas = () => consulta('zonas').select('id', 'sucursal_id', 'nombre').orderBy('id');

export const activa = (id) => consulta('sucursales').select('id', 'nombre').where({ id, activa: 1 }).first();
