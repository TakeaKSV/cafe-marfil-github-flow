// Mesas y servicio en sala.
//
// Ciclo de una mesa:  libre -> ocupada -> limpieza -> libre
//   libre -> ocupada     abrirServicio()  (walk-in o check-in de una reservación)
//   ocupada -> limpieza  cerrarServicio() (el comensal se va; se guarda el ticket)
//   limpieza -> libre    marcarLimpia()
// "reservada" no se guarda: se deriva al leer (mesa libre con reservación confirmada hoy).

import { config } from '../config.js';
import { bloquearFila, enTransaccion } from '../db/conexion.js';
import * as repo from '../repositorios/mesas.js';
import { exigirSucursal } from './sucursales.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO, horaTexto, hoyLocal, minutosDesde } from '../utils/fechas.js';

/** Próxima reservación confirmada de hoy por mesa: Map(mesaId -> reservación). */
async function reservasDeHoyPorMesa() {
  const filas = await repo.reservasDeHoy(hoyLocal());
  // ORDER BY hora DESC + Map: la más temprana queda al final y es la que se conserva.
  return new Map(filas.map((fila) => [fila.mesa_id, fila]));
}

function aMesa(fila, reserva) {
  const base = {
    id: fila.id,
    sucursalId: fila.sucursal_id,
    numero: fila.numero,
    zonaId: fila.zona_id,
    zona: fila.zona,
    capacidad: fila.capacidad,
    forma: fila.forma,
    posX: fila.pos_x !== null && fila.pos_x !== undefined ? Number(fila.pos_x) : null,
    posY: fila.pos_y !== null && fila.pos_y !== undefined ? Number(fila.pos_y) : null,
    piso: fila.piso ?? null
  };
  const vacia = { comensal: null, personas: 0, tiempoMinutos: 0, ticketAprox: 0, reservaFolio: null, mesero: null };

  if (fila.estado === 'ocupada' && fila.servicio_id) {
    return {
      ...base,
      estado: 'ocupada',
      comensal: fila.comensal,
      personas: fila.personas,
      tiempoMinutos: minutosDesde(fila.inicio),
      ticketAprox: fila.ticket_total ?? fila.personas * config.ticketEstimadoPorPersona,
      reservaFolio: fila.servicio_folio,
      mesero: fila.mesero,
      notas: fila.servicio_notas ?? fila.notas,
      servicioId: fila.servicio_id
    };
  }
  if (fila.estado === 'limpieza') {
    return { ...base, ...vacia, estado: 'limpieza', tiempoMinutos: minutosDesde(fila.ultimo_fin), notas: fila.notas };
  }
  if (reserva) {
    return {
      ...base,
      ...vacia,
      estado: 'reservada',
      comensal: reserva.nombre_contacto,
      personas: reserva.personas,
      reservaFolio: reserva.folio,
      horaReserva: reserva.hora,
      notas: reserva.notas ?? fila.notas
    };
  }
  return { ...base, ...vacia, estado: 'libre', notas: fila.notas };
}

export async function listarMesas(filtros = {}) {
  const reservas = await reservasDeHoyPorMesa();
  return (await repo.listar(filtros)).map((fila) => aMesa(fila, reservas.get(fila.id)));
}

export async function obtenerMesa(id) {
  const fila = await repo.porId(id);
  if (!fila) throw noEncontrado('No existe esa mesa.');
  return aMesa(fila, (await reservasDeHoyPorMesa()).get(fila.id));
}

export async function actualizarMesa(id, cambios) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', id);

    const mesa = await obtenerMesa(id);
    if (cambios.ticketTotal !== undefined) await actualizarTicket(id, cambios.ticketTotal);
    if (cambios.zonaId) {
      const zona = await repo.zona(cambios.zonaId);
      if (!zona || zona.sucursal_id !== mesa.sucursalId)
        throw conflicto('Esa zona no pertenece a la sucursal de la mesa.');
    }
    await repo.actualizarMesas(id, cambios);

    return obtenerMesa(id);
  });
}

export async function crearMesa({
  sucursalId,
  zonaId = null,
  numero,
  capacidad,
  forma = 'squircle',
  notas = null,
  posX = null,
  posY = null,
  piso = null
}) {
  await exigirSucursal(sucursalId);
  const numeroLimpio = String(numero || '').trim().toUpperCase();
  if (!numeroLimpio) throw conflicto('Indica el número o clave de la mesa (ej. M09).');

  if (zonaId) {
    const zona = await repo.zona(zonaId);
    if (!zona || zona.sucursal_id !== sucursalId) {
      throw conflicto('Esa zona no pertenece a la sucursal seleccionada.');
    }
  }

  return enTransaccion(async () => {
    const existente = await repo.porSucursalYNumero(sucursalId, numeroLimpio);
    if (existente) {
      if (existente.activa === 1) {
        throw conflicto(`Ya existe la mesa "${numeroLimpio}" en esta sucursal.`);
      }
      await repo.reactivarMesa(existente.id, {
        zonaId,
        capacidad,
        forma,
        notas,
        posX,
        posY,
        piso
      });
      return obtenerMesa(existente.id);
    }

    const { id } = await repo.crearMesa({
      sucursalId,
      zonaId,
      numero: numeroLimpio,
      capacidad,
      forma,
      notas,
      posX,
      posY,
      piso
    });
    return obtenerMesa(id);
  });
}

export async function eliminarMesa(id) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', id);
    const mesa = await obtenerMesa(id);
    if (mesa.estado === 'ocupada') {
      throw conflicto(`La mesa ${mesa.numero} está ocupada. Libérala antes de eliminarla.`);
    }
    await repo.desactivarMesa(id);
  });
}

/**
 * Sienta comensales en una mesa libre. Lo usan el walk-in (sin reservación) y
 * el check-in de reservaciones (con `reservacionId`).
 */
export function abrirServicio({
  mesaId,
  comensal,
  personas,
  notas = null,
  reservacionId = null,
  personalId = null,
  ignorarCapacidad = false
}) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId); // dos hosts no pueden sentar gente en la misma mesa a la vez
    const mesa = await obtenerMesa(mesaId);

    if (mesa.estado === 'ocupada') throw conflicto(`La mesa ${mesa.numero} está ocupada por ${mesa.comensal}.`);
    if (mesa.estado === 'limpieza')
      throw conflicto(`La mesa ${mesa.numero} sigue en limpieza. Márcala como lista primero.`);
    if (mesa.estado === 'reservada' && !reservacionId) {
      throw conflicto(
        `La mesa ${mesa.numero} está reservada para las ${horaTexto(mesa.horaReserva)} (folio ${mesa.reservaFolio}).`
      );
    }
    if (!ignorarCapacidad && personas > mesa.capacidad) {
      throw conflicto(`La mesa ${mesa.numero} es para ${mesa.capacidad} personas y el grupo es de ${personas}.`);
    }

    await repo.insertarServicio({
      mesaId: mesaId,
      reservacionId: reservacionId,
      comensal: comensal,
      personas: personas,
      notas: notas,
      atendidoPor: personalId,
      inicio: ahoraISO()
    });
    await repo.ocupar(mesaId);

    return obtenerMesa(mesaId);
  });
}

/**
 * Cierra el servicio abierto de la mesa: guarda el ticket, pasa la mesa a
 * limpieza, devuelve los juegos prestados y completa la reservación ligada.
 */
export function cerrarServicio(mesaId, { ticketTotal } = {}) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId);
    const mesa = await obtenerMesa(mesaId);
    const servicio = await repo.servicioAbierto(mesaId);
    if (!servicio) throw conflicto(`La mesa ${mesa.numero} no tiene un servicio abierto.`);

    const ahora = ahoraISO();
    await repo.cerrarServicio(ahora, ticketTotal ?? null, servicio.id);
    await repo.ponerEnLimpieza(mesaId);
    await repo.devolverJuegos(ahora, mesaId);

    if (servicio.reservacion_id) {
      await repo.completarReserva(ahora, servicio.reservacion_id);
    }
    return obtenerMesa(mesaId);
  });
}

export async function marcarLimpia(mesaId) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId);

    const mesa = await obtenerMesa(mesaId);
    if (mesa.estado !== 'limpieza')
      throw conflicto(`La mesa ${mesa.numero} no está en limpieza (está ${mesa.estado}).`);
    await repo.liberar(mesaId);
    return obtenerMesa(mesaId);
  });
}

/** Actualiza el consumo acumulado del servicio abierto (cuenta en curso). */
export async function actualizarTicket(mesaId, ticketTotal) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId);

    const mesa = await obtenerMesa(mesaId);
    const { afectadas } = await repo.ticket(ticketTotal, mesaId);
    if (!afectadas) throw conflicto(`La mesa ${mesa.numero} no tiene un servicio abierto.`);
    return obtenerMesa(mesaId);
  });
}
