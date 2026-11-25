import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, fechaBD } from './base.js';

function clientes() {
  return consulta('clientes as c')
    .leftJoin('sucursales as s', 's.id', 'c.sucursal_habitual_id')
    .select(
      'c.*',
      's.nombre as sucursal_habitual',
      consulta('beneficios as b')
        .select('b.titulo')
        .whereColumn('b.cliente_id', 'c.id')
        .where({ 'b.origen': 'sellos', 'b.estado': 'disponible' })
        .orderBy('b.id')
        .limit(1)
        .as('recompensa_nombre')
    );
}
export function listar({ q }) {
  const query = clientes();
  if (q)
    query.where(function () {
      for (const columna of ['c.nombre', 'c.telefono', 'c.email', 'c.codigo_club'])
        this.orWhere(columna, 'like', '%' + q + '%');
    });
  return query.orderBy('c.nombre').limit(200);
}
export const paraSesion = (id) =>
  consulta('clientes').select('id', 'session_version').where({ id }).whereNotNull('password_hash').first();

export const insertarCliente = (datos) =>
  insertar('clientes', {
    codigo_club: datos.codigo,
    nombre: datos.nombre,
    email: datos.email,
    telefono: datos.telefono,
    password_hash: datos.passwordHash,
    ciudad: datos.ciudad,
    sucursal_habitual_id: datos.sucursalHabitualId,
    creado_en: datos.creadoEn
  });

export const registrarVisita = ({ clienteId, sellos, puntos, descripcion, sucursalId, personalId, creadoEn }) =>
  insertar('movimientos_club', {
    cliente_id: clienteId,
    tipo: 'sello',
    sellos,
    puntos,
    descripcion,
    sucursal_id: sucursalId,
    personal_id: personalId,
    creado_en: creadoEn
  });

export const insertarBeneficio = ({ clienteId, codigo, titulo, subtitulo, icono, origen, venceEn, creadoEn }) =>
  insertar('beneficios', {
    cliente_id: clienteId,
    codigo,
    titulo,
    subtitulo,
    icono,
    origen,
    vence_en: venceEn,
    creado_en: creadoEn
  });

export const registrarCanjeRecompensa = ({ clienteId, descripcion, personalId, creadoEn }) =>
  insertar('movimientos_club', {
    cliente_id: clienteId,
    tipo: 'recompensa_canjeada',
    descripcion,
    personal_id: personalId,
    creado_en: creadoEn
  });

const CAMPOS_CLIENTES = {
  nombre: 'nombre',
  email: 'email',
  telefono: 'telefono',
  ciudad: 'ciudad',
  sucursalHabitualId: 'sucursal_habitual_id',
  preferencias: 'preferencias',
  emailVerificadoEn: 'email_verificado_en'
};

export const actualizarClientes = (id, cambios) => actualizar('clientes', id, mapearCampos(cambios, CAMPOS_CLIENTES));

export const marcarEmailVerificado = (id, ahora) => actualizar('clientes', id, { email_verificado_en: ahora });

export const actualizarPassword = (id, passwordHash) =>
  consulta('clientes').where({ id }).update({ password_hash: passwordHash }).increment('session_version', 1);

export const porId = (id) => clientes().where('c.id', id).first();

export const porCodigo = (codigo) => clientes().where('c.codigo_club', codigo).first();

export const porEmail = (email) => clientes().where('c.email', email).first();

export const emailExiste = (email) => consulta('clientes').select('id').where({ email }).first();

export const codigoExiste = (codigo) => consulta('clientes').select('id').where('codigo_club', codigo).first();

export const emailEnUso = (email, id) => consulta('clientes').select('id').where({ email }).whereNot('id', id).first();

export const acreditarVisita = (sellos, puntos, ahora, id) =>
  consulta('clientes')
    .where({ id })
    .update({ sellos_actuales: sellos, ultima_visita: fechaBD(ahora) })
    .increment({ puntos, visitas_totales: 1 });

export const beneficioExiste = (codigo) => consulta('beneficios').select('id').where({ codigo }).first();

export const beneficioPorId = (id) => consulta('beneficios').where({ id }).first();

export const beneficiosDeCliente = (clienteId) =>
  consulta('beneficios').where('cliente_id', clienteId).orderBy('estado').orderBy('id', 'desc');

export const beneficioPorCodigo = (codigo) =>
  consulta('beneficios as b')
    .join('clientes as c', 'c.id', 'b.cliente_id')
    .select('b.*', 'c.nombre as cliente_nombre', 'c.codigo_club')
    .where('b.codigo', codigo)
    .first();

export const usarBeneficio = (ahora, id) => actualizar('beneficios', id, { estado: 'usado', usado_en: ahora });

export const reiniciarPasaporte = (id) => actualizar('clientes', id, { sellos_actuales: 0 });

export const recompensaPendiente = (clienteId) =>
  consulta('beneficios')
    .select('codigo')
    .where({ cliente_id: clienteId, origen: 'sellos', estado: 'disponible' })
    .orderBy('id')
    .first();

export const notificaciones = (clienteId) =>
  consulta('notificaciones').where('cliente_id', clienteId).orderBy('id', 'desc').limit(50);

export const leerTodas = (clienteId) => consulta('notificaciones').where('cliente_id', clienteId).update({ leida: 1 });

export const leerNotificacion = (id, clienteId) =>
  consulta('notificaciones')
    .where({ id, cliente_id: clienteId })
    .update({ leida: 1 })
    .then((afectadas) => ({ afectadas }));
