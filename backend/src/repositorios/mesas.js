import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, fechaBD } from './base.js';

function mesas() {
  return consulta('mesas as m')
    .leftJoin('zonas as z', 'z.id', 'm.zona_id')
    .leftJoin('servicios_mesa as sv', function () {
      this.on('sv.mesa_id', 'm.id').onNull('sv.fin');
    })
    .leftJoin('personal as p', 'p.id', 'sv.atendido_por')
    .leftJoin('reservaciones as r', 'r.id', 'sv.reservacion_id')
    .select(
      'm.*',
      'z.nombre as zona',
      'sv.id as servicio_id',
      'sv.comensal',
      'sv.personas',
      'sv.notas as servicio_notas',
      'sv.ticket_total',
      'sv.inicio',
      'p.nombre as mesero',
      'r.folio as servicio_folio',
      consulta('servicios_mesa').max('fin').whereColumn('mesa_id', 'm.id').as('ultimo_fin')
    )
    .where('m.activa', 1);
}
export function listar({ sucursalId }) {
  const query = mesas();
  if (sucursalId) query.where('m.sucursal_id', sucursalId);
  return query.orderBy(['m.sucursal_id', 'm.id']);
}

export const insertarServicio = ({ mesaId, reservacionId, comensal, personas, notas, atendidoPor, inicio }) =>
  insertar('servicios_mesa', {
    mesa_id: mesaId,
    reservacion_id: reservacionId,
    comensal,
    personas,
    notas,
    atendido_por: atendidoPor,
    inicio
  });

const CAMPOS_MESAS = {
  notas: 'notas',
  capacidad: 'capacidad',
  zonaId: 'zona_id',
  forma: 'forma',
  numero: 'numero',
  posX: 'pos_x',
  posY: 'pos_y',
  piso: 'piso'
};

export const actualizarMesas = (id, cambios) => actualizar('mesas', id, mapearCampos(cambios, CAMPOS_MESAS));

export const porSucursalYNumero = (sucursalId, numero) =>
  consulta('mesas').where({ sucursal_id: sucursalId, numero }).first();

export const crearMesa = ({ sucursalId, zonaId = null, numero, capacidad, forma = 'squircle', notas = null, posX = null, posY = null, piso = null }) =>
  insertar('mesas', {
    sucursal_id: sucursalId,
    zona_id: zonaId,
    numero,
    capacidad,
    forma,
    estado: 'libre',
    notas,
    pos_x: posX,
    pos_y: posY,
    piso,
    activa: 1
  });

export const reactivarMesa = (id, { zonaId = null, capacidad, forma = 'squircle', notas = null, posX = null, posY = null, piso = null }) =>
  actualizar('mesas', id, {
    zona_id: zonaId,
    capacidad,
    forma,
    estado: 'libre',
    notas,
    pos_x: posX,
    pos_y: posY,
    piso,
    activa: 1
  });

export const desactivarMesa = (id) => actualizar('mesas', id, { activa: 0 });

export const reservasDeHoy = (fecha) =>
  consulta('reservaciones')
    .select('mesa_id', 'folio', 'nombre_contacto', 'personas', 'hora', 'notas')
    .where({ estado: 'confirmada', fecha })
    .whereNotNull('mesa_id')
    .orderBy('hora', 'desc');

export const porId = (id) => mesas().where('m.id', id).first();

export const zona = (id) => consulta('zonas').select('sucursal_id').where({ id }).first();

export const ocupar = (id) => actualizar('mesas', id, { estado: 'ocupada' });

export const servicioAbierto = (mesaId) =>
  consulta('servicios_mesa').select('id', 'reservacion_id').where('mesa_id', mesaId).whereNull('fin').first();

export const cerrarServicio = (ahora, ticketTotal, id) =>
  actualizar('servicios_mesa', id, { fin: ahora, ...(ticketTotal !== null && { ticket_total: ticketTotal }) });

export const ponerEnLimpieza = (id) => actualizar('mesas', id, { estado: 'limpieza' });

export const devolverJuegos = (ahora, mesaId) =>
  consulta('prestamos_juego')
    .where('mesa_id', mesaId)
    .whereNull('devuelto_en')
    .update({ devuelto_en: fechaBD(ahora) });

export const completarReserva = (ahora, id) =>
  consulta('reservaciones')
    .where({ id, estado: 'en_curso' })
    .update({ estado: 'asistida', actualizado_en: fechaBD(ahora) });

export const liberar = (id) => actualizar('mesas', id, { estado: 'libre' });

export const ticket = (ticketTotal, mesaId) =>
  consulta('servicios_mesa')
    .where('mesa_id', mesaId)
    .whereNull('fin')
    .update({ ticket_total: ticketTotal })
    .then((afectadas) => ({ afectadas }));
