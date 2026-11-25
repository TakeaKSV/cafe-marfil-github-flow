import { consulta } from '../db/conexion.js';
import { insertar, mapearCampos, aBit } from './base.js';

function personal() {
  return consulta('personal as p')
    .leftJoin('sucursales as s', 's.id', 'p.sucursal_id')
    .select('p.*', 's.nombre as sucursal_nombre');
}
export function listar({ sucursalId, estado }) {
  const query = personal();
  if (sucursalId) query.where('p.sucursal_id', sucursalId);
  if (estado) query.where('p.estado', estado);
  else query.whereNot('p.estado', 'inactivo');
  return query.orderBy(['p.sucursal_id', 'p.nombre']);
}
export const paraSesion = (id) =>
  consulta('personal')
    .select('rol', 'sucursal_id', 'session_version')
    .where({ id })
    .whereNot('estado', 'inactivo')
    .whereIn('rol', ['admin', 'gerente', 'host'])
    .whereNotNull('password_hash')
    .first();

export const insertarPersona = (datos) =>
  insertar('personal', {
    nombre: datos.nombre,
    email: datos.email,
    password_hash: datos.passwordHash,
    rol: datos.rol,
    puesto: datos.puesto,
    sucursal_id: datos.sucursalId,
    turno_inicio: datos.turnoInicio,
    turno_fin: datos.turnoFin,
    estado: datos.estado,
    es_encargado: datos.esEncargado,
    creado_en: datos.creadoEn
  });

const CAMPOS_PERSONAL = {
  nombre: 'nombre',
  email: 'email',
  passwordHash: 'password_hash',
  rol: 'rol',
  puesto: 'puesto',
  sucursalId: 'sucursal_id',
  turnoInicio: 'turno_inicio',
  turnoFin: 'turno_fin',
  estado: 'estado',
  esEncargado: ['es_encargado', aBit]
};

export async function actualizarPersonal(id, cambios) {
  const valores = mapearCampos(cambios, CAMPOS_PERSONAL);
  if (!Object.keys(valores).length) return;
  const query = consulta('personal').where({ id }).update(valores);
  if (['passwordHash', 'rol', 'estado', 'email'].some((campo) => cambios[campo] !== undefined)) {
    query.increment('session_version', 1);
  }
  await query;
}

export const porId = (id) => personal().where('p.id', id).first();

export const porEmail = (email) => personal().where('p.email', email).whereNot('p.estado', 'inactivo').first();

export const emailEnUso = (email, id) => consulta('personal').select('id').where({ email }).whereNot('id', id).first();
