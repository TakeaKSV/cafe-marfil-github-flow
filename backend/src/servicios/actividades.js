import { enTransaccion, bloquearFila } from '../db/conexion.js';
import * as repo from '../repositorios/actividades.js';
import { leerJSON, precioTexto, slugLibre } from '../utils/codigos.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO, fechaCorta, fechaTexto, horaTexto, hoyLocal } from '../utils/fechas.js';
import { aBit, aJSON } from '../repositorios/base.js';
import { exigirSucursal } from './sucursales.js';

// lugares_ocupados: personas con reservación vigente. En actividades sin fecha
// fija (permanentes) el cupo es por día, así que se cuenta el día de hoy.

function aActividad(fila) {
  const horario = fila.horario_texto ?? [fila.hora_inicio, fila.hora_fin].filter(Boolean).map(horaTexto).join(' – ');
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    categoria: fila.categoria,
    categoriaSlug: fila.categoria_slug,
    sucursalId: fila.sucursal_id,
    sucursalNombre: fila.sucursal_nombre,
    fecha: fila.fecha, // 'AAAA-MM-DD' o null si no tiene fecha fija
    fechaTexto: fila.fecha_texto ?? fechaTexto(fila.fecha),
    fechaCorta: fila.fecha ? fechaCorta(fila.fecha) : fila.fecha_texto,
    horaInicio: fila.hora_inicio,
    horaFin: fila.hora_fin,
    horarioTexto: horario || null,
    duracion: fila.duracion,
    imagen: fila.imagen,
    resumen: fila.resumen,
    descripcion: fila.descripcion,
    cupoTotal: fila.cupo_total,
    lugaresOcupados: Number(fila.lugares_ocupados ?? 0),
    lugaresDisponibles: Math.max(0, fila.cupo_total - fila.lugares_ocupados),
    precio: fila.precio,
    precioTexto: fila.precio_texto ?? (fila.es_gratis ? 'Entrada Libre' : precioTexto(fila.precio)),
    esGratis: fila.es_gratis === 1,
    activa: fila.activa === 1,
    incluye: leerJSON(fila.incluye, []),
    requisitos: fila.requisitos
  };
}

/** Por defecto solo lo vigente: actividades sin fecha fija o con fecha de hoy en adelante. */
export async function listarActividades(filtros = {}) {
  return (await repo.listar({ ...filtros, hoy: hoyLocal() })).map(aActividad);
}

/** Acepta el id numérico o el slug ('noche-cine'). */
export async function obtenerActividad(idOSlug) {
  const fila = await repo.buscar(idOSlug, hoyLocal());
  if (!fila) throw noEncontrado('No existe esa actividad.');
  return aActividad(fila);
}

/** Personas ya apartadas en una actividad para una fecha (opcionalmente sin contar una reservación). */
export const lugaresOcupados = (actividadId, fecha, excluirReservacionId = 0) =>
  repo.ocupados(actividadId, fecha, excluirReservacionId);

export async function crearActividad(datos) {
  await exigirSucursal(datos.sucursalId);
  const slug = await slugLibre(datos.nombre, (s) => repo.slugExiste(s));

  const { id } = await repo.insertarActividad({
    slug,
    nombre: datos.nombre,
    categoria: datos.categoria,
    categoriaSlug: datos.categoriaSlug,
    sucursalId: datos.sucursalId,
    fecha: datos.fecha ?? null,
    fechaTexto: datos.fechaTexto ?? null,
    horaInicio: datos.horaInicio ?? null,
    horaFin: datos.horaFin ?? null,
    horarioTexto: datos.horarioTexto ?? null,
    duracion: datos.duracion ?? null,
    imagen: datos.imagen ?? null,
    resumen: datos.resumen,
    descripcion: datos.descripcion ?? null,
    cupoTotal: datos.cupoTotal,
    precio: datos.precio,
    precioTexto: datos.precioTexto ?? null,
    esGratis: aBit(datos.esGratis ?? datos.precio === 0),
    incluye: aJSON(datos.incluye),
    requisitos: datos.requisitos ?? null,
    creadoEn: ahoraISO()
  });
  return obtenerActividad(id);
}

export async function actualizarActividad(id, cambios) {
  return enTransaccion(async () => {
    await bloquearFila('actividades', id);

    const actual = await repo.porId(id);
    if (!actual) throw noEncontrado('No existe esa actividad.');
    const reservas = await repo.reservasPorFecha(id);
    if (cambios.cupoTotal !== undefined && reservas.some((r) => Number(r.personas) > cambios.cupoTotal)) {
      throw conflicto('El cupo no puede ser menor que los lugares ya reservados.');
    }
    if (
      reservas.length &&
      [
        ['fecha', 'fecha'],
        ['sucursalId', 'sucursal_id']
      ].some(([campo, columna]) => cambios[campo] !== undefined && cambios[campo] !== actual[columna])
    ) {
      throw conflicto('No se puede mover la fecha o sucursal de una actividad con reservaciones vigentes.');
    }
    if (cambios.sucursalId) await exigirSucursal(cambios.sucursalId);

    const cambiosFinales = { ...cambios };
    const cambioHora =
      (cambios.horaInicio !== undefined && cambios.horaInicio !== actual.hora_inicio) ||
      (cambios.horaFin !== undefined && cambios.horaFin !== actual.hora_fin);
    if (
      cambioHora &&
      (cambios.horarioTexto === undefined || cambios.horarioTexto === actual.horario_texto)
    ) {
      cambiosFinales.horarioTexto = null;
    }

    await repo.actualizarActividades(id, cambiosFinales);

    // Si se desactivó ya no es visible: se responde solo la confirmación.
    return cambios.activa === false ? { id, activa: false } : obtenerActividad(id);
  });
}
