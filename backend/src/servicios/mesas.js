// Mesas y servicio en sala.
//
// Ciclo de una mesa:  libre -> ocupada -> limpieza -> libre
//   libre -> ocupada     abrirServicio()  (walk-in o check-in de una reservación)
//   ocupada -> limpieza  cerrarServicio() (el comensal se va; se guarda el ticket)
//   limpieza -> libre    marcarLimpia()
// "reservada" no se guarda: se deriva al leer (mesa libre con reservación confirmada hoy).

import { config } from '../config.js';
import { bloquearFila, db, enTransaccion } from '../db/conexion.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO, horaTexto, hoyLocal, minutosDesde } from '../utils/fechas.js';
import { armarUpdate } from '../utils/sql.js';

const SQL_MESAS = `
  SELECT m.*, z.nombre AS zona,
         sv.id AS servicio_id, sv.comensal, sv.personas, sv.notas AS servicio_notas,
         sv.ticket_total, sv.inicio,
         p.nombre AS mesero,
         r.folio AS servicio_folio,
         (SELECT MAX(fin) FROM servicios_mesa WHERE mesa_id = m.id) AS ultimo_fin
  FROM mesas m
  LEFT JOIN zonas z ON z.id = m.zona_id
  LEFT JOIN servicios_mesa sv ON sv.mesa_id = m.id AND sv.fin IS NULL
  LEFT JOIN personal p ON p.id = sv.atendido_por
  LEFT JOIN reservaciones r ON r.id = sv.reservacion_id
  WHERE m.activa = 1`;

/** Próxima reservación confirmada de hoy por mesa: Map(mesaId -> reservación). */
async function reservasDeHoyPorMesa() {
  const filas = await db.todos(
    `SELECT mesa_id, folio, nombre_contacto, personas, hora, notas
     FROM reservaciones
     WHERE estado = 'confirmada' AND fecha = ? AND mesa_id IS NOT NULL
     ORDER BY hora DESC`,
    [hoyLocal()]
  );
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
    forma: fila.forma
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

export async function listarMesas({ sucursalId } = {}) {
  const reservas = await reservasDeHoyPorMesa();
  const filas = sucursalId
    ? await db.todos(`${SQL_MESAS} AND m.sucursal_id = ? ORDER BY m.id`, [sucursalId])
    : await db.todos(`${SQL_MESAS} ORDER BY m.sucursal_id, m.id`);
  return filas.map((fila) => aMesa(fila, reservas.get(fila.id)));
}

export async function obtenerMesa(id) {
  const fila = await db.uno(`${SQL_MESAS} AND m.id = ?`, [id]);
  if (!fila) throw noEncontrado('No existe esa mesa.');
  return aMesa(fila, (await reservasDeHoyPorMesa()).get(fila.id));
}

export async function actualizarMesa(id, cambios) {
  const mesa = await obtenerMesa(id);
  if (cambios.zonaId) {
    const zona = await db.uno('SELECT sucursal_id FROM zonas WHERE id = ?', [cambios.zonaId]);
    if (!zona || zona.sucursal_id !== mesa.sucursalId) throw conflicto('Esa zona no pertenece a la sucursal de la mesa.');
  }
  const update = armarUpdate(cambios, { notas: 'notas', capacidad: 'capacidad', zonaId: 'zona_id', forma: 'forma' });
  if (update) await db.ejecutar(`UPDATE mesas SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  return obtenerMesa(id);
}

/**
 * Sienta comensales en una mesa libre. Lo usan el walk-in (sin reservación) y
 * el check-in de reservaciones (con `reservacionId`).
 */
export function abrirServicio({ mesaId, comensal, personas, notas = null, reservacionId = null, personalId = null }) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId); // dos hosts no pueden sentar gente en la misma mesa a la vez
    const mesa = await obtenerMesa(mesaId);

    if (mesa.estado === 'ocupada') throw conflicto(`La mesa ${mesa.numero} está ocupada por ${mesa.comensal}.`);
    if (mesa.estado === 'limpieza') throw conflicto(`La mesa ${mesa.numero} sigue en limpieza. Márcala como lista primero.`);
    if (mesa.estado === 'reservada' && !reservacionId) {
      throw conflicto(
        `La mesa ${mesa.numero} está reservada para las ${horaTexto(mesa.horaReserva)} (folio ${mesa.reservaFolio}).`
      );
    }
    if (personas > mesa.capacidad) {
      throw conflicto(`La mesa ${mesa.numero} es para ${mesa.capacidad} personas y el grupo es de ${personas}.`);
    }

    await db.ejecutar(
      `INSERT INTO servicios_mesa (mesa_id, reservacion_id, comensal, personas, notas, atendido_por, inicio)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mesaId, reservacionId, comensal, personas, notas, personalId, ahoraISO()]
    );
    await db.ejecutar("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesaId]);

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
    const servicio = await db.uno('SELECT id, reservacion_id FROM servicios_mesa WHERE mesa_id = ? AND fin IS NULL', [mesaId]);
    if (!servicio) throw conflicto(`La mesa ${mesa.numero} no tiene un servicio abierto.`);

    const ahora = ahoraISO();
    await db.ejecutar('UPDATE servicios_mesa SET fin = ?, ticket_total = COALESCE(?, ticket_total) WHERE id = ?', [
      ahora,
      ticketTotal ?? null,
      servicio.id
    ]);
    await db.ejecutar("UPDATE mesas SET estado = 'limpieza' WHERE id = ?", [mesaId]);
    await db.ejecutar('UPDATE prestamos_juego SET devuelto_en = ? WHERE mesa_id = ? AND devuelto_en IS NULL', [ahora, mesaId]);

    if (servicio.reservacion_id) {
      await db.ejecutar(
        "UPDATE reservaciones SET estado = 'asistida', actualizado_en = ? WHERE id = ? AND estado = 'en_curso'",
        [ahora, servicio.reservacion_id]
      );
    }
    return obtenerMesa(mesaId);
  });
}

export async function marcarLimpia(mesaId) {
  const mesa = await obtenerMesa(mesaId);
  if (mesa.estado !== 'limpieza') throw conflicto(`La mesa ${mesa.numero} no está en limpieza (está ${mesa.estado}).`);
  await db.ejecutar("UPDATE mesas SET estado = 'libre' WHERE id = ?", [mesaId]);
  return obtenerMesa(mesaId);
}

/** Actualiza el consumo acumulado del servicio abierto (cuenta en curso). */
export async function actualizarTicket(mesaId, ticketTotal) {
  const mesa = await obtenerMesa(mesaId);
  const { afectadas } = await db.ejecutar('UPDATE servicios_mesa SET ticket_total = ? WHERE mesa_id = ? AND fin IS NULL', [
    ticketTotal,
    mesaId
  ]);
  if (!afectadas) throw conflicto(`La mesa ${mesa.numero} no tiene un servicio abierto.`);
  return obtenerMesa(mesaId);
}
