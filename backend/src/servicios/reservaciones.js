// Reservaciones.
//
// Estados:  confirmada -> en_curso -> asistida
//           confirmada -> cancelada | no_show
//   confirmada  creada, aún no llega el comensal
//   en_curso    hizo check-in (si tiene mesa, se abre un servicio de mesa)
//   asistida    terminó su visita
//   cancelada   la canceló el cliente o el host
//   no_show     no llegó

import { config } from '../config.js';
import { bloquearFila, db, enTransaccion } from '../db/conexion.js';
import { codigoUnico, generarFolio, generarTokenQR } from '../utils/codigos.js';
import { conflicto, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO, fechaEnFrase, fechaTexto, horaTexto, hoyLocal, minutosDelDia } from '../utils/fechas.js';
import { armarUpdate } from '../utils/sql.js';
import { lugaresOcupados, obtenerActividad } from './actividades.js';
import { crearNotificacion, registrarEscaneo } from './bitacora.js';
import { abrirServicio, cerrarServicio } from './mesas.js';
import { exigirSucursal } from './sucursales.js';

const NOMBRES_TIPO = {
  mesa: 'Mesa Cafetería & Desayunos',
  juegos: 'Mesa con Juegos de Mesa',
  actividad: 'Actividad Programada',
  evento: 'Reunión Privada / Evento'
};

const NOMBRES_ESTADO = {
  confirmada: 'confirmada',
  en_curso: 'en sala',
  asistida: 'completada',
  cancelada: 'cancelada',
  no_show: 'marcada como no-show'
};

const SQL_RESERVACIONES = `
  SELECT r.*, s.nombre AS sucursal_nombre, m.numero AS mesa_numero,
         a.nombre AS actividad_nombre, a.precio AS actividad_precio,
         (SELECT sv.ticket_total FROM servicios_mesa sv
           WHERE sv.reservacion_id = r.id ORDER BY sv.id DESC LIMIT 1) AS ticket_total
  FROM reservaciones r
  JOIN sucursales s ON s.id = r.sucursal_id
  LEFT JOIN mesas m ON m.id = r.mesa_id
  LEFT JOIN actividades a ON a.id = r.actividad_id`;

/** Consumo: el ticket real si ya existe; si no, una estimación por persona. */
function totalEstimado(fila) {
  if (fila.estado === 'cancelada' || fila.estado === 'no_show') return 0;
  if (fila.ticket_total !== null) return fila.ticket_total;
  if (fila.actividad_precio) return fila.actividad_precio * fila.personas;
  return fila.personas * config.ticketEstimadoPorPersona;
}

function aReservacion(fila) {
  return {
    id: fila.id,
    folio: fila.folio,
    tokenQR: fila.token_qr,
    clienteId: fila.cliente_id,
    comensal: fila.nombre_contacto,
    telefono: fila.telefono_contacto,
    email: fila.email_contacto,
    sucursalId: fila.sucursal_id,
    sucursalNombre: fila.sucursal_nombre,
    fecha: fila.fecha,
    fechaTexto: fechaTexto(fila.fecha),
    hora: fila.hora,
    horaTexto: horaTexto(fila.hora),
    personas: fila.personas,
    mesaId: fila.mesa_id,
    mesaAsignada: fila.mesa_numero,
    tipo: fila.tipo,
    tipoNombre:
      fila.tipo_nombre ?? (fila.actividad_nombre ? `Actividad: ${fila.actividad_nombre}` : NOMBRES_TIPO[fila.tipo]),
    actividadId: fila.actividad_id,
    actividadNombre: fila.actividad_nombre,
    estado: fila.estado,
    esHistorica: ['asistida', 'cancelada', 'no_show'].includes(fila.estado) || fila.fecha < hoyLocal(),
    notas: fila.notas,
    origen: fila.origen,
    totalEstimado: totalEstimado(fila),
    creadoEn: fila.creado_en
  };
}

// --------------------------------------------------------------------------
// Consultas
// --------------------------------------------------------------------------

export async function listarReservaciones({ sucursalId, fecha, desde, hasta, estado, q, clienteId } = {}) {
  const filtros = [];
  const valores = {};
  const agregar = (condicion, nombre, valor) => {
    filtros.push(condicion);
    valores[nombre] = valor;
  };
  if (sucursalId) agregar('r.sucursal_id = :sucursalId', 'sucursalId', sucursalId);
  if (fecha) agregar('r.fecha = :fecha', 'fecha', fecha);
  if (desde) agregar('r.fecha >= :desde', 'desde', desde);
  if (hasta) agregar('r.fecha <= :hasta', 'hasta', hasta);
  if (estado) agregar('r.estado = :estado', 'estado', estado);
  if (clienteId) agregar('r.cliente_id = :clienteId', 'clienteId', clienteId);
  if (q) {
    agregar('(r.folio LIKE :q OR r.nombre_contacto LIKE :q OR r.telefono_contacto LIKE :q)', 'q', `%${q}%`);
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const filas = await db.todos(`${SQL_RESERVACIONES} ${where} ORDER BY r.fecha DESC, r.hora, r.id LIMIT 500`, valores);
  return filas.map(aReservacion);
}

async function filaPorFolio(folio) {
  const fila = await db.uno(`${SQL_RESERVACIONES} WHERE r.folio = ?`, [String(folio).trim().toUpperCase()]);
  if (!fila) throw noEncontrado(`No existe una reservación con el folio ${folio}.`);
  return fila;
}

/** Como filaPorFolio, pero bloquea la reservación hasta que termine la transacción en curso. */
async function filaPorFolioBloqueada(folio) {
  const { id } = await filaPorFolio(folio);
  await bloquearFila('reservaciones', id);
  return filaPorFolio(folio);
}

export const obtenerReservacion = async (folio) => aReservacion(await filaPorFolio(folio));

/** Busca por folio o por el token del QR. Devuelve null si no hay coincidencia. */
export async function buscarReservacionPorCodigo(codigo) {
  const clave = String(codigo).trim().toUpperCase();
  const fila = await db.uno(`${SQL_RESERVACIONES} WHERE r.folio = :clave OR r.token_qr = :clave`, { clave });
  return fila ? aReservacion(fila) : null;
}

export async function obtenerReservacionPorToken(token) {
  const fila = await db.uno(`${SQL_RESERVACIONES} WHERE r.token_qr = ?`, [String(token).trim().toUpperCase()]);
  if (!fila) throw noEncontrado('No encontramos esa reservación.');
  return aReservacion(fila);
}

// --------------------------------------------------------------------------
// Reglas de negocio
// --------------------------------------------------------------------------

function exigirEstado(fila, esperado, accion) {
  if (fila.estado !== esperado) {
    throw conflicto(`No se puede ${accion}: la reservación ${fila.folio} está ${NOMBRES_ESTADO[fila.estado]}.`);
  }
}

/** La mesa debe ser de la sucursal, tener capacidad y no chocar con otra reservación cercana. */
async function validarMesa({ mesaId, sucursalId, fecha, hora, personas }, excluirReservacionId = 0) {
  const mesa = await db.uno('SELECT numero, sucursal_id, capacidad FROM mesas WHERE id = ? AND activa = 1 FOR UPDATE', [mesaId]);
  if (!mesa) throw noEncontrado('No existe esa mesa.');
  if (mesa.sucursal_id !== sucursalId) throw conflicto(`La mesa ${mesa.numero} no pertenece a esa sucursal.`);
  if (personas > mesa.capacidad) {
    throw conflicto(`La mesa ${mesa.numero} es para ${mesa.capacidad} personas y el grupo es de ${personas}.`);
  }

  const mismaFecha = await db.todos(
    `SELECT folio, hora FROM reservaciones
     WHERE mesa_id = ? AND fecha = ? AND id <> ? AND estado IN ('confirmada', 'en_curso')`,
    [mesaId, fecha, excluirReservacionId]
  );
  const choque = mismaFecha.find(
    (otra) => Math.abs(minutosDelDia(otra.hora) - minutosDelDia(hora)) < config.minutosEntreReservasMismaMesa
  );
  if (choque) {
    throw conflicto(`La mesa ${mesa.numero} ya está reservada a las ${horaTexto(choque.hora)} (folio ${choque.folio}).`);
  }
}

/** Bloquea la actividad mientras se revisa el cupo: dos reservas simultáneas no pueden sobrevenderla. */
async function validarCupo({ id, nombre, cupoTotal }, fecha, personas, excluirReservacionId = 0) {
  await bloquearFila('actividades', id);
  const libres = cupoTotal - (await lugaresOcupados(id, fecha, excluirReservacionId));
  if (personas > libres) {
    throw conflicto(
      libres > 0
        ? `Solo quedan ${libres} lugares en "${nombre}" y el grupo es de ${personas}.`
        : `"${nombre}" ya no tiene lugares disponibles para esa fecha.`
    );
  }
}

// --------------------------------------------------------------------------
// Alta y edición
// --------------------------------------------------------------------------

/**
 * Crea una reservación.
 *   clienteId   cliente con sesión en la PWA (se liga a su cuenta y recibe notificación)
 *   personalId  host que la registra desde el panel (puede asignar mesa)
 * Sin ninguno de los dos es una reservación de invitado.
 */
export function crearReservacion(datos, { clienteId = null, personalId = null } = {}) {
  return enTransaccion(async () => {
    let { sucursalId, fecha, hora } = datos;
    let actividad = null;

    if (datos.tipo === 'actividad') {
      if (!datos.actividadId) throw solicitudInvalida('Indica la actividad que deseas reservar (actividadId).');
      actividad = await obtenerActividad(datos.actividadId);
      sucursalId = actividad.sucursalId;
      // Una actividad con fecha fija manda sobre lo que haya elegido el cliente.
      if (actividad.fecha) {
        fecha = actividad.fecha;
        hora = actividad.horaInicio ?? hora;
      } else {
        hora = hora ?? actividad.horaInicio;
      }
    }

    if (!sucursalId) throw solicitudInvalida('Indica la sucursal (sucursalId).');
    if (!fecha) throw solicitudInvalida('Indica la fecha de la reservación (fecha).');
    if (!hora) throw solicitudInvalida('Indica la hora de la reservación (hora).');
    await exigirSucursal(sucursalId);
    if (fecha < hoyLocal()) throw solicitudInvalida('La fecha de la reservación ya pasó.');
    if (actividad) await validarCupo(actividad, fecha, datos.personas);

    // Solo el personal asigna mesa; en la PWA el host la asigna al llegar.
    const mesaId = personalId ? (datos.mesaId ?? null) : null;
    if (mesaId) await validarMesa({ mesaId, sucursalId, fecha, hora, personas: datos.personas });

    const cliente = clienteId ? await db.uno('SELECT nombre, telefono, email FROM clientes WHERE id = ?', [clienteId]) : null;
    const comensal = datos.comensal ?? cliente?.nombre;
    const telefono = datos.telefono ?? cliente?.telefono;
    if (!comensal || !telefono) throw solicitudInvalida('Indica nombre (comensal) y teléfono de contacto.');

    const folio = await codigoUnico(generarFolio, (f) => db.uno('SELECT 1 FROM reservaciones WHERE folio = ?', [f]));

    await db.ejecutar(
      `INSERT INTO reservaciones
         (folio, token_qr, cliente_id, nombre_contacto, telefono_contacto, email_contacto, sucursal_id, mesa_id,
          actividad_id, tipo, tipo_nombre, fecha, hora, personas, notas, origen, registrada_por, creado_en, actualizado_en)
       VALUES
         (:folio, :tokenQR, :clienteId, :comensal, :telefono, :email, :sucursalId, :mesaId,
          :actividadId, :tipo, :tipoNombre, :fecha, :hora, :personas, :notas, :origen, :personalId, :ahora, :ahora)`,
      {
        folio,
        tokenQR: generarTokenQR(),
        clienteId,
        comensal,
        telefono,
        email: datos.email ?? cliente?.email ?? null,
        sucursalId,
        mesaId,
        actividadId: actividad?.id ?? null,
        tipo: datos.tipo,
        tipoNombre: datos.tipoNombre ?? null,
        fecha,
        hora,
        personas: datos.personas,
        notas: datos.notas || null,
        origen: personalId ? 'host' : 'app',
        personalId,
        ahora: ahoraISO()
      }
    );

    const creada = await obtenerReservacion(folio);
    await crearNotificacion(clienteId, {
      titulo: '¡Reservación confirmada!',
      mensaje: `Tu reservación ${folio} para ${creada.personas} persona(s) el ${fechaEnFrase(creada.fecha)} a las ${creada.horaTexto} en ${creada.sucursalNombre} quedó registrada.`,
      tipo: 'reservacion',
      screenDestino: 'mis_reservaciones'
    });
    return creada;
  });
}

/** Edita una reservación que aún no inicia (solo en estado "confirmada"). */
export function actualizarReservacion(folio, cambios) {
  return enTransaccion(async () => {
    const fila = await filaPorFolioBloqueada(folio);
    exigirEstado(fila, 'confirmada', 'editar');

    const nueva = {
      fecha: cambios.fecha ?? fila.fecha,
      hora: cambios.hora ?? fila.hora,
      personas: cambios.personas ?? fila.personas,
      mesaId: cambios.mesaId === undefined ? fila.mesa_id : cambios.mesaId
    };
    if (cambios.fecha && cambios.fecha < hoyLocal()) throw solicitudInvalida('La nueva fecha ya pasó.');

    if (fila.actividad_id) {
      const actividad = await db.uno('SELECT id, nombre, fecha, cupo_total AS cupoTotal FROM actividades WHERE id = ?', [
        fila.actividad_id
      ]);
      if (actividad.fecha && nueva.fecha !== actividad.fecha) {
        throw conflicto(`"${actividad.nombre}" tiene fecha fija (${fechaEnFrase(actividad.fecha)}); no se puede mover.`);
      }
      await validarCupo(actividad, nueva.fecha, nueva.personas, fila.id);
    }
    if (nueva.mesaId) await validarMesa({ ...nueva, sucursalId: fila.sucursal_id }, fila.id);

    const update = armarUpdate(
      { ...cambios, actualizadoEn: ahoraISO() },
      {
        fecha: 'fecha',
        hora: 'hora',
        personas: 'personas',
        mesaId: 'mesa_id',
        notas: 'notas',
        tipoNombre: 'tipo_nombre',
        comensal: 'nombre_contacto',
        telefono: 'telefono_contacto',
        email: 'email_contacto',
        actualizadoEn: 'actualizado_en'
      }
    );
    await db.ejecutar(`UPDATE reservaciones SET ${update.sets} WHERE id = :id`, { ...update.valores, id: fila.id });
    return obtenerReservacion(fila.folio);
  });
}

// --------------------------------------------------------------------------
// Cambios de estado
// --------------------------------------------------------------------------

function cambiarEstado(id, estado) {
  return db.ejecutar('UPDATE reservaciones SET estado = ?, actualizado_en = ? WHERE id = ?', [estado, ahoraISO(), id]);
}

/**
 * Llegada del comensal. Si la reservación tiene mesa (o se indica una en
 * `mesaId`) se abre el servicio de esa mesa; las actividades sin mesa solo
 * cambian de estado.
 */
export function hacerCheckIn(folio, { mesaId } = {}, personalId = null) {
  return enTransaccion(async () => {
    const fila = await filaPorFolioBloqueada(folio);
    exigirEstado(fila, 'confirmada', 'hacer check-in');
    if (fila.fecha !== hoyLocal()) {
      throw conflicto(`La reservación ${fila.folio} es para el ${fechaEnFrase(fila.fecha)}, no para hoy.`);
    }

    const mesaFinal = mesaId ?? fila.mesa_id;
    let numeroMesa = null;
    if (mesaFinal) {
      const mesa = await db.uno('SELECT numero, sucursal_id FROM mesas WHERE id = ? AND activa = 1', [mesaFinal]);
      if (!mesa) throw noEncontrado('No existe esa mesa.');
      if (mesa.sucursal_id !== fila.sucursal_id) {
        throw conflicto(`La mesa ${mesa.numero} no pertenece a la sucursal de la reservación.`);
      }
      await abrirServicio({
        mesaId: mesaFinal,
        comensal: fila.nombre_contacto,
        personas: fila.personas,
        notas: fila.notas,
        reservacionId: fila.id,
        personalId
      });
      numeroMesa = mesa.numero;
    }

    await db.ejecutar("UPDATE reservaciones SET estado = 'en_curso', mesa_id = ?, actualizado_en = ? WHERE id = ?", [
      mesaFinal,
      ahoraISO(),
      fila.id
    ]);
    await registrarEscaneo({
      codigo: fila.folio,
      tipo: 'reservacion',
      descripcion: `${fila.nombre_contacto} (${fila.personas} personas)`,
      resultado: numeroMesa ? `Check-in realizado (Mesa ${numeroMesa})` : 'Check-in realizado',
      personalId
    });
    return obtenerReservacion(fila.folio);
  });
}

/** Fin de la visita. Si hay un servicio de mesa abierto se cierra con su ticket. */
export function completarReservacion(folio, { ticketTotal } = {}) {
  return enTransaccion(async () => {
    const fila = await filaPorFolioBloqueada(folio);
    exigirEstado(fila, 'en_curso', 'completar');

    const servicio = await db.uno('SELECT mesa_id FROM servicios_mesa WHERE reservacion_id = ? AND fin IS NULL', [fila.id]);
    if (servicio) await cerrarServicio(servicio.mesa_id, { ticketTotal }); // también marca la reservación como asistida
    else await cambiarEstado(fila.id, 'asistida');

    return obtenerReservacion(fila.folio);
  });
}

/** `clienteId`: si se pasa, la reservación debe ser de ese cliente (cancelación desde la PWA). */
export function cancelarReservacion(folio, { clienteId } = {}) {
  return enTransaccion(async () => {
    const fila = await filaPorFolioBloqueada(folio);
    if (clienteId !== undefined && fila.cliente_id !== clienteId) {
      throw noEncontrado(`No existe una reservación con el folio ${folio}.`);
    }
    exigirEstado(fila, 'confirmada', 'cancelar');

    await cambiarEstado(fila.id, 'cancelada');
    await crearNotificacion(fila.cliente_id, {
      titulo: 'Reservación cancelada',
      mensaje: `La reservación ${fila.folio} del ${fechaEnFrase(fila.fecha)} fue cancelada.`,
      tipo: 'reservacion',
      screenDestino: 'mis_reservaciones'
    });
    return obtenerReservacion(fila.folio);
  });
}

export function marcarNoShow(folio) {
  return enTransaccion(async () => {
    const fila = await filaPorFolioBloqueada(folio);
    exigirEstado(fila, 'confirmada', 'marcar como no-show');
    await cambiarEstado(fila.id, 'no_show');
    return obtenerReservacion(fila.folio);
  });
}
