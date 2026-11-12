import { db } from '../db/conexion.js';
import { leerJSON, precioTexto, slugLibre } from '../utils/codigos.js';
import { noEncontrado } from '../utils/errores.js';
import { ahoraISO, fechaCorta, fechaTexto, horaTexto, hoyLocal } from '../utils/fechas.js';
import { aBit, aJSON, armarUpdate } from '../utils/sql.js';
import { exigirSucursal } from './sucursales.js';

// lugares_ocupados: personas con reservación vigente. En actividades sin fecha
// fija (permanentes) el cupo es por día, así que se cuenta el día de hoy.
const SQL_ACTIVIDADES = `
  SELECT a.*, s.nombre AS sucursal_nombre,
    (SELECT COALESCE(SUM(r.personas), 0)
       FROM reservaciones r
      WHERE r.actividad_id = a.id
        AND r.estado NOT IN ('cancelada', 'no_show')
        AND (a.fecha IS NOT NULL OR r.fecha = :hoy)) AS lugares_ocupados
  FROM actividades a JOIN sucursales s ON s.id = a.sucursal_id`;

function aActividad(fila) {
  const horario =
    fila.horario_texto ?? [fila.hora_inicio, fila.hora_fin].filter(Boolean).map(horaTexto).join(' – ');
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
    lugaresOcupados: fila.lugares_ocupados,
    lugaresDisponibles: Math.max(0, fila.cupo_total - fila.lugares_ocupados),
    precio: fila.precio,
    precioTexto: fila.precio_texto ?? (fila.es_gratis ? 'Entrada Libre' : precioTexto(fila.precio)),
    esGratis: fila.es_gratis === 1,
    incluye: leerJSON(fila.incluye, []),
    requisitos: fila.requisitos
  };
}

/** Por defecto solo lo vigente: actividades sin fecha fija o con fecha de hoy en adelante. */
export async function listarActividades({ sucursalId, categoria, incluirPasadas = false } = {}) {
  const filtros = ['a.activa = 1'];
  const valores = { hoy: hoyLocal() };
  if (!incluirPasadas) filtros.push('(a.fecha IS NULL OR a.fecha >= :hoy)');
  if (sucursalId) {
    filtros.push('a.sucursal_id = :sucursalId');
    valores.sucursalId = sucursalId;
  }
  if (categoria) {
    filtros.push('a.categoria_slug = :categoria');
    valores.categoria = categoria;
  }
  // Primero las que tienen fecha (la más próxima arriba), luego las permanentes.
  const filas = await db.todos(
    `${SQL_ACTIVIDADES} WHERE ${filtros.join(' AND ')} ORDER BY a.fecha IS NULL, a.fecha, a.hora_inicio, a.id`,
    valores
  );
  return filas.map(aActividad);
}

/** Acepta el id numérico o el slug ('noche-cine'). */
export async function obtenerActividad(idOSlug) {
  const esId = /^\d+$/.test(String(idOSlug));
  const fila = await db.uno(`${SQL_ACTIVIDADES} WHERE a.activa = 1 AND ${esId ? 'a.id' : 'a.slug'} = :clave`, {
    hoy: hoyLocal(),
    clave: esId ? Number(idOSlug) : String(idOSlug)
  });
  if (!fila) throw noEncontrado('No existe esa actividad.');
  return aActividad(fila);
}

/** Personas ya apartadas en una actividad para una fecha (opcionalmente sin contar una reservación). */
export async function lugaresOcupados(actividadId, fecha, excluirReservacionId = 0) {
  const { total } = await db.uno(
    `SELECT COALESCE(SUM(personas), 0) AS total FROM reservaciones
     WHERE actividad_id = ? AND fecha = ? AND id <> ? AND estado NOT IN ('cancelada', 'no_show')`,
    [actividadId, fecha, excluirReservacionId]
  );
  return total;
}

const COLUMNAS = {
  nombre: 'nombre',
  categoria: 'categoria',
  categoriaSlug: 'categoria_slug',
  sucursalId: 'sucursal_id',
  fecha: 'fecha',
  fechaTexto: 'fecha_texto',
  horaInicio: 'hora_inicio',
  horaFin: 'hora_fin',
  horarioTexto: 'horario_texto',
  duracion: 'duracion',
  imagen: 'imagen',
  resumen: 'resumen',
  descripcion: 'descripcion',
  cupoTotal: 'cupo_total',
  precio: 'precio',
  precioTexto: 'precio_texto',
  esGratis: ['es_gratis', aBit],
  incluye: ['incluye', aJSON],
  requisitos: 'requisitos',
  activa: ['activa', aBit]
};

export async function crearActividad(datos) {
  await exigirSucursal(datos.sucursalId);
  const slug = await slugLibre(datos.nombre, (s) => db.uno('SELECT 1 FROM actividades WHERE slug = ?', [s]));

  const { id } = await db.ejecutar(
    `INSERT INTO actividades
       (slug, nombre, categoria, categoria_slug, sucursal_id, fecha, fecha_texto, hora_inicio, hora_fin,
        horario_texto, duracion, imagen, resumen, descripcion, cupo_total, precio, precio_texto, es_gratis,
        incluye, requisitos, creado_en)
     VALUES
       (:slug, :nombre, :categoria, :categoriaSlug, :sucursalId, :fecha, :fechaTexto, :horaInicio, :horaFin,
        :horarioTexto, :duracion, :imagen, :resumen, :descripcion, :cupoTotal, :precio, :precioTexto, :esGratis,
        :incluye, :requisitos, :creadoEn)`,
    {
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
    }
  );
  return obtenerActividad(id);
}

export async function actualizarActividad(id, cambios) {
  const actual = await db.uno('SELECT id FROM actividades WHERE id = ?', [id]);
  if (!actual) throw noEncontrado('No existe esa actividad.');
  if (cambios.sucursalId) await exigirSucursal(cambios.sucursalId);

  const update = armarUpdate(cambios, COLUMNAS);
  if (update) await db.ejecutar(`UPDATE actividades SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  // Si se desactivó ya no es visible: se responde solo la confirmación.
  return cambios.activa === false ? { id, activa: false } : obtenerActividad(id);
}
