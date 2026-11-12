import { db } from '../db/conexion.js';
import { leerJSON } from '../utils/codigos.js';
import { noEncontrado } from '../utils/errores.js';

// aforo_actual = comensales sentados ahora mismo (servicios de mesa abiertos).
const SQL_SUCURSALES = `
  SELECT s.*,
    (SELECT COALESCE(SUM(sv.personas), 0)
       FROM servicios_mesa sv JOIN mesas m ON m.id = sv.mesa_id
      WHERE m.sucursal_id = s.id AND sv.fin IS NULL) AS aforo_actual,
    (SELECT CONCAT(p.nombre, ' (', p.puesto, ')')
       FROM personal p
      WHERE p.sucursal_id = s.id AND p.es_encargado = 1 AND p.estado <> 'inactivo'
      ORDER BY p.id LIMIT 1) AS encargado
  FROM sucursales s
  WHERE s.activa = 1`;

function aSucursal(fila, zonas) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    subtitulo: fila.subtitulo,
    direccion: fila.direccion,
    horario: fila.horario,
    telefono: fila.telefono,
    imagen: fila.imagen,
    aforoMax: fila.aforo_max,
    aforoActual: fila.aforo_actual,
    zonas,
    encargado: fila.encargado,
    caracteristicas: leerJSON(fila.caracteristicas, []),
    servicios: leerJSON(fila.servicios, []),
    mapsUrl: fila.maps_url,
    mapEmbedUrl: fila.map_embed_url,
    destacada: fila.destacada === 1
  };
}

async function zonasPorSucursal() {
  const mapa = new Map();
  for (const zona of await db.todos('SELECT id, sucursal_id, nombre FROM zonas ORDER BY id')) {
    if (!mapa.has(zona.sucursal_id)) mapa.set(zona.sucursal_id, []);
    mapa.get(zona.sucursal_id).push({ id: zona.id, nombre: zona.nombre });
  }
  return mapa;
}

export async function listarSucursales() {
  const zonas = await zonasPorSucursal();
  const filas = await db.todos(`${SQL_SUCURSALES} ORDER BY s.destacada DESC, s.nombre`);
  return filas.map((fila) => aSucursal(fila, zonas.get(fila.id) ?? []));
}

export async function obtenerSucursal(id) {
  const fila = await db.uno(`${SQL_SUCURSALES} AND s.id = ?`, [id]);
  if (!fila) throw noEncontrado(`No existe la sucursal "${id}".`);
  return aSucursal(fila, (await zonasPorSucursal()).get(fila.id) ?? []);
}

/** Lanza 404 si la sucursal no existe o está inactiva. Devuelve su fila. */
export async function exigirSucursal(id) {
  const fila = await db.uno('SELECT id, nombre FROM sucursales WHERE id = ? AND activa = 1', [id]);
  if (!fila) throw noEncontrado(`No existe la sucursal "${id}".`);
  return fila;
}
