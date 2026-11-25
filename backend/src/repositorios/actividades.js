import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, aBit, aJSON } from './base.js';

function actividades(hoy) {
  return consulta('actividades as a')
    .join('sucursales as s', 's.id', 'a.sucursal_id')
    .select(
      'a.*',
      's.nombre as sucursal_nombre',
      consulta('reservaciones as r')
        .sum('r.personas')
        .whereColumn('r.actividad_id', 'a.id')
        .whereNotIn('r.estado', ['cancelada', 'no_show'])
        .where(function () {
          this.whereNotNull('a.fecha').orWhere('r.fecha', hoy);
        })
        .as('lugares_ocupados')
    );
}
export function listar({ sucursalId, categoria, incluirPasadas = false, hoy }) {
  const query = actividades(hoy).where('a.activa', 1);
  if (!incluirPasadas)
    query.where(function () {
      this.whereNull('a.fecha').orWhere('a.fecha', '>=', hoy);
    });
  if (sucursalId) query.where('a.sucursal_id', sucursalId);
  if (categoria) query.where('a.categoria_slug', categoria);
  return query.orderBy([{ column: 'a.fecha', order: 'asc', nulls: 'last' }, 'a.hora_inicio', 'a.id']);
}
export const buscar = (clave, hoy) =>
  actividades(hoy)
    .where('a.activa', 1)
    .where(/^\d+$/.test(String(clave)) ? 'a.id' : 'a.slug', clave)
    .first();
export async function ocupados(actividadId, fecha, excluirReservacionId) {
  const fila = await consulta('reservaciones')
    .sum({ total: 'personas' })
    .where({ actividad_id: actividadId, fecha })
    .whereNot('id', excluirReservacionId)
    .whereNotIn('estado', ['cancelada', 'no_show'])
    .first();
  return Number(fila.total ?? 0);
}

export const insertarActividad = (datos) =>
  insertar('actividades', {
    slug: datos.slug,
    nombre: datos.nombre,
    categoria: datos.categoria,
    categoria_slug: datos.categoriaSlug,
    sucursal_id: datos.sucursalId,
    fecha: datos.fecha,
    fecha_texto: datos.fechaTexto,
    hora_inicio: datos.horaInicio,
    hora_fin: datos.horaFin,
    horario_texto: datos.horarioTexto,
    duracion: datos.duracion,
    imagen: datos.imagen,
    resumen: datos.resumen,
    descripcion: datos.descripcion,
    cupo_total: datos.cupoTotal,
    precio: datos.precio,
    precio_texto: datos.precioTexto,
    es_gratis: datos.esGratis,
    incluye: datos.incluye,
    requisitos: datos.requisitos,
    creado_en: datos.creadoEn
  });

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

export const actualizarActividades = (id, cambios) => actualizar('actividades', id, mapearCampos(cambios, COLUMNAS));

export const slugExiste = (slug) => consulta('actividades').select('id').where({ slug }).first();

export const porId = (id) => consulta('actividades').where({ id }).first();

export const reservasPorFecha = (id) =>
  consulta('reservaciones')
    .select('fecha')
    .sum({ personas: 'personas' })
    .where('actividad_id', id)
    .whereNotIn('estado', ['cancelada', 'no_show'])
    .groupBy('fecha');
