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
import { bloquearFila, enTransaccion } from '../db/conexion.js';
import * as repo from '../repositorios/reservaciones.js';
import { codigoUnico, generarFolio, generarTokenQR } from '../utils/codigos.js';
import { conflicto, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO, fechaEnFrase, fechaTexto, horaTexto, hoyLocal, minutosDelDia } from '../utils/fechas.js';

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

export async function listarReservaciones(filtros = {}) {
  return (await repo.listar(filtros)).map(aReservacion);
}

async function filaPorFolio(folio) {
  const fila = await repo.porFolio(String(folio).trim().toUpperCase());
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
  const fila = await repo.porCodigo({ clave });
  return fila ? aReservacion(fila) : null;
}

export async function obtenerReservacionPorToken(token) {
  const fila = await repo.porToken(String(token).trim().toUpperCase());
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
  const mesa = await repo.mesaBloqueada(mesaId);
  if (!mesa) throw noEncontrado('No existe esa mesa.');
  if (mesa.sucursal_id !== sucursalId) throw conflicto(`La mesa ${mesa.numero} no pertenece a esa sucursal.`);
  if (personas > mesa.capacidad) {
    throw conflicto(`La mesa ${mesa.numero} es para ${mesa.capacidad} personas y el grupo es de ${personas}.`);
  }

  const mismaFecha = await repo.reservasDeMesa(mesaId, fecha, excluirReservacionId);
  const choque = mismaFecha.find(
    (otra) => Math.abs(minutosDelDia(otra.hora) - minutosDelDia(hora)) < config.minutosEntreReservasMismaMesa
  );
  if (choque) {
    throw conflicto(
      `La mesa ${mesa.numero} ya está reservada a las ${horaTexto(choque.hora)} (folio ${choque.folio}).`
    );
  }
}

/** Bloquea la actividad mientras se revisa el cupo: dos reservas simultáneas no pueden sobrevenderla. */
async function validarCupo({ id }, fecha, personas, excluirReservacionId = 0) {
  await bloquearFila('actividades', id);
  const actual = await repo.actividad(id);
  if (!actual?.activa) throw conflicto('La actividad ya no está disponible.');
  if (actual.fecha && actual.fecha !== fecha) throw conflicto('La fecha de la actividad cambió. Vuelve a consultarla.');
  const { nombre, cupoTotal } = actual;
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
      await bloquearFila('actividades', actividad.id);
      actividad = await obtenerActividad(actividad.id);
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

    const cliente = clienteId ? await repo.contacto(clienteId) : null;
    const comensal = datos.comensal ?? cliente?.nombre;
    const telefono = datos.telefono ?? cliente?.telefono;
    if (!comensal || !telefono) throw solicitudInvalida('Indica nombre (comensal) y teléfono de contacto.');

    const folio = await codigoUnico(generarFolio, (f) => repo.folioExiste(f));

    await repo.insertarReservacion({
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
    });

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
      const actividad = await repo.actividad(fila.actividad_id);
      if (actividad.fecha && nueva.fecha !== actividad.fecha) {
        throw conflicto(
          `"${actividad.nombre}" tiene fecha fija (${fechaEnFrase(actividad.fecha)}); no se puede mover.`
        );
      }
      await validarCupo(actividad, nueva.fecha, nueva.personas, fila.id);
    }
    if (nueva.mesaId) await validarMesa({ ...nueva, sucursalId: fila.sucursal_id }, fila.id);

    await repo.actualizarReservaciones(fila.id, { ...cambios, actualizadoEn: ahoraISO() });

    return obtenerReservacion(fila.folio);
  });
}

// --------------------------------------------------------------------------
// Cambios de estado
// --------------------------------------------------------------------------

function cambiarEstado(id, estado) {
  return repo.cambiarEstado(estado, ahoraISO(), id);
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
      await validarMesa(
        {
          mesaId: mesaFinal,
          sucursalId: fila.sucursal_id,
          fecha: fila.fecha,
          hora: fila.hora,
          personas: fila.personas
        },
        fila.id
      );
      const mesa = await repo.mesa(mesaFinal);
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

    await repo.iniciar(mesaFinal, ahoraISO(), fila.id);
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

    const servicio = await repo.servicioAbierto(fila.id);
    if (servicio)
      await cerrarServicio(servicio.mesa_id, { ticketTotal }); // también marca la reservación como asistida
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
