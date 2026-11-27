import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, aBit, aJSON } from './base.js';

function reservaciones() {
  return consulta('reservaciones as r')
    .join('sucursales as s', 's.id', 'r.sucursal_id')
    .leftJoin('mesas as m', 'm.id', 'r.mesa_id')
    .leftJoin('actividades as a', 'a.id', 'r.actividad_id')
    .leftJoin('juegos as j', 'j.id', 'r.juego_id')
    .select(
      'r.*',
      's.nombre as sucursal_nombre',
      'm.numero as mesa_numero',
      'a.nombre as actividad_nombre',
      'a.precio as actividad_precio',
      'j.nombre as juego_nombre',
      consulta('servicios_mesa as sv')
        .select('sv.ticket_total')
        .whereColumn('sv.reservacion_id', 'r.id')
        .orderBy('sv.id', 'desc')
        .limit(1)
        .as('ticket_total')
    );
}
export function listar({ sucursalId, fecha, desde, hasta, estado, q, clienteId }) {
  const query = reservaciones();
  if (sucursalId) query.where('r.sucursal_id', sucursalId);
  if (fecha) query.where('r.fecha', fecha);
  if (desde) query.where('r.fecha', '>=', desde);
  if (hasta) query.where('r.fecha', '<=', hasta);
  if (estado) query.where('r.estado', estado);
  if (clienteId) query.where('r.cliente_id', clienteId);
  if (q)
    query.where(function () {
      for (const columna of ['r.folio', 'r.nombre_contacto', 'r.telefono_contacto'])
        this.orWhere(columna, 'like', '%' + q + '%');
    });
  return query.orderBy('r.fecha', 'desc').orderBy(['r.hora', 'r.id']).limit(500);
}

export const insertarReservacion = (datos) =>
  insertar('reservaciones', {
    folio: datos.folio,
    token_qr: datos.tokenQR,
    cliente_id: datos.clienteId,
    nombre_contacto: datos.comensal,
    telefono_contacto: datos.telefono,
    email_contacto: datos.email,
    sucursal_id: datos.sucursalId,
    mesa_id: datos.mesaId,
    mesas_solicitadas: datos.mesasSolicitadas?.length ? aJSON(datos.mesasSolicitadas) : null,
    solicita_union_mesas: aBit(datos.solicitaUnionMesas),
    actividad_id: datos.actividadId,
    juego_id: datos.juegoId ?? null,
    tipo: datos.tipo,
    tipo_nombre: datos.tipoNombre,
    fecha: datos.fecha,
    hora: datos.hora,
    personas: datos.personas,
    notas: datos.notas,
    origen: datos.origen,
    registrada_por: datos.personalId,
    creado_en: datos.ahora,
    actualizado_en: datos.ahora
  });

const CAMPOS_RESERVACIONES = {
  fecha: 'fecha',
  hora: 'hora',
  personas: 'personas',
  mesaId: 'mesa_id',
  juegoId: 'juego_id',
  notas: 'notas',
  tipoNombre: 'tipo_nombre',
  comensal: 'nombre_contacto',
  telefono: 'telefono_contacto',
  email: 'email_contacto',
  actualizadoEn: 'actualizado_en'
};

export const actualizarReservaciones = (id, cambios) =>
  actualizar('reservaciones', id, mapearCampos(cambios, CAMPOS_RESERVACIONES));

export const porFolio = (folio) => reservaciones().where('r.folio', folio).first();

export const porCodigo = ({ clave }) =>
  reservaciones()
    .where(function () {
      this.where('r.folio', clave).orWhere('r.token_qr', clave);
    })
    .first();

export const porToken = (token) => reservaciones().where('r.token_qr', token).first();

export const mesaBloqueada = (id) =>
  consulta('mesas as m')
    .leftJoin('zonas as z', 'z.id', 'm.zona_id')
    .select('m.id', 'm.numero', 'm.sucursal_id', 'm.capacidad', 'm.forma', 'm.pos_x', 'm.pos_y', 'm.piso', 'z.nombre as zona')
    .where({ 'm.id': id, 'm.activa': 1 })
    .forUpdate()
    .first();

export const mesasActivasSucursal = (sucursalId, bloquear = false) => {
  const q = consulta('mesas as m')
    .leftJoin('zonas as z', 'z.id', 'm.zona_id')
    .select('m.id', 'm.numero', 'm.sucursal_id', 'm.capacidad', 'm.forma', 'm.pos_x', 'm.pos_y', 'm.piso', 'z.nombre as zona')
    .where({ 'm.sucursal_id': sucursalId, 'm.activa': 1 })
    .orderBy('m.id', 'asc');
  return bloquear ? q.forUpdate() : q;
};

export const reservasDeMesa = (mesaId, fecha, excluirId) =>
  consulta('reservaciones')
    .select('folio', 'hora')
    .where({ mesa_id: mesaId, fecha })
    .whereNot('id', excluirId)
    .whereIn('estado', ['confirmada', 'en_curso']);

export const mesasDisponiblesSucursal = (sucursalId, personas, bloquear = false) => {
  const q = consulta('mesas')
    .select('id', 'numero', 'capacidad')
    .where({ sucursal_id: sucursalId, activa: 1 })
    .where('capacidad', '>=', personas)
    .orderBy('capacidad', 'asc')
    .orderBy('id', 'asc');
  return bloquear ? q.forUpdate() : q;
};

export const reservasActivasSucursalFecha = (sucursalId, fecha, excluirId = 0) =>
  consulta('reservaciones')
    .select('id', 'folio', 'mesa_id', 'mesas_solicitadas', 'hora', 'personas', 'cliente_id')
    .where({ sucursal_id: sucursalId, fecha })
    .whereNot('id', excluirId)
    .whereIn('estado', ['confirmada', 'en_curso']);

export const reservasDeClienteFecha = (clienteId, fecha, excluirId = 0) =>
  consulta('reservaciones')
    .select('id', 'folio', 'hora', 'sucursal_id')
    .where({ cliente_id: clienteId, fecha })
    .whereNot('id', excluirId)
    .whereIn('estado', ['confirmada', 'en_curso']);

export const juegoPorId = (id) => consulta('juegos').select('id', 'nombre').where({ id }).first();

export const contacto = (id) => consulta('clientes').select('nombre', 'telefono', 'email').where({ id }).first();

export const folioExiste = (folio) => consulta('reservaciones').select('id').where({ folio }).first();

export const actividad = (id) =>
  consulta('actividades').select('id', 'nombre', 'fecha', 'activa', 'cupo_total as cupoTotal').where({ id }).first();

export const cambiarEstado = (estado, ahora, id) => actualizar('reservaciones', id, { estado, actualizado_en: ahora });

export const mesa = (id) => consulta('mesas').select('numero', 'sucursal_id').where({ id, activa: 1 }).first();

export const iniciar = (mesaId, ahora, id) =>
  actualizar('reservaciones', id, { estado: 'en_curso', mesa_id: mesaId, actualizado_en: ahora });

export const servicioAbierto = (reservacionId) =>
  consulta('servicios_mesa').select('mesa_id').where('reservacion_id', reservacionId).whereNull('fin').first();

/**
 * Vincula reservaciones hechas como invitado (cliente_id IS NULL) a la cuenta
 * de un cliente cuando coinciden por correo electrónico o por los 10 dígitos del teléfono.
 */
export async function vincularInvitadoPorContacto({ clienteId, email = null, telefono10 = null }) {
  if (!clienteId || (!email && !telefono10)) return 0;
  return consulta('reservaciones')
    .whereNull('cliente_id')
    .where(function () {
      if (email) {
        this.orWhereRaw('LOWER(TRIM(email_contacto)) = ?', [email]);
      }
      if (telefono10) {
        this.orWhereRaw("RIGHT(REGEXP_REPLACE(COALESCE(telefono_contacto, ''), '[^0-9]', ''), 10) = ?", [telefono10]);
      }
    })
    .update({ cliente_id: clienteId });
}
