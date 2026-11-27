import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, aBit, fechaBD } from './base.js';

function juegos(desde) {
  return consulta('juegos as j')
    .leftJoin('prestamos_juego as pr', function () {
      this.on('pr.juego_id', 'j.id').onNull('pr.devuelto_en');
    })
    .leftJoin('mesas as m', 'm.id', 'pr.mesa_id')
    .leftJoin('servicios_mesa as sv', function () {
      this.on('sv.mesa_id', 'm.id').onNull('sv.fin');
    })
    .select(
      'j.*',
      'pr.id as prestamo_id',
      'pr.prestado_en',
      'm.id as mesa_id',
      'm.numero as mesa_numero',
      'sv.comensal',
      consulta('prestamos_juego as x')
        .count('*')
        .whereColumn('x.juego_id', 'j.id')
        .where('x.prestado_en', '>=', fechaBD(desde))
        .as('veces_jugado_mes')
    )
    .where('j.activo', 1);
}
export function listar({ sucursalId, q, estado }, desde) {
  const query = juegos(desde);
  if (sucursalId) query.where('j.sucursal_id', sucursalId);
  if (q)
    query.where(function () {
      this.where('j.nombre', 'like', '%' + q + '%').orWhere('j.categoria', 'like', '%' + q + '%');
    });
  if (estado === 'en_mesa') query.whereNotNull('pr.id');
  if (estado === 'disponible') query.whereNull('pr.id');
  if (estado === 'reposicion') query.where('j.reposicion_requerida', 1);
  return query.orderBy('j.nombre');
}

export const insertarJuego = (datos) =>
  insertar('juegos', {
    nombre: datos.nombre,
    categoria: datos.categoria,
    jugadores: datos.jugadores,
    duracion: datos.duracion,
    dificultad: datos.dificultad,
    piezas_estado: datos.piezasEstado,
    imagen: datos.imagen ?? null,
    sucursal_id: datos.sucursalId,
    creado_en: datos.creadoEn
  });

export const insertarPrestamo = ({ juegoId, mesaId, personalId, prestadoEn }) =>
  insertar('prestamos_juego', {
    juego_id: juegoId,
    mesa_id: mesaId,
    personal_id: personalId,
    prestado_en: prestadoEn
  });

const CAMPOS_JUEGOS = {
  nombre: 'nombre',
  categoria: 'categoria',
  jugadores: 'jugadores',
  duracion: 'duracion',
  dificultad: 'dificultad',
  piezasEstado: 'piezas_estado',
  imagen: 'imagen',
  reposicionRequerida: ['reposicion_requerida', aBit]
};

export const actualizarJuegos = (id, cambios) => actualizar('juegos', id, mapearCampos(cambios, CAMPOS_JUEGOS));

export const porId = ({ desde, id }) => juegos(desde).where('j.id', id).first();

export const desactivar = (id) => actualizar('juegos', id, { activo: 0 });

export const mesa = (id) =>
  consulta('mesas').select('numero', 'sucursal_id', 'estado').where({ id, activa: 1 }).first();

export const devolver = (ahora, id) =>
  consulta('prestamos_juego')
    .where('juego_id', id)
    .whereNull('devuelto_en')
    .update({ devuelto_en: fechaBD(ahora) })
    .then((afectadas) => ({ afectadas }));
