import * as repo from '../repositorios/sucursales.js';
import { leerJSON } from '../utils/codigos.js';
import { noEncontrado } from '../utils/errores.js';

// aforo_actual = comensales sentados ahora mismo (servicios de mesa abiertos).

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
    aforoActual: Number(fila.aforo_actual ?? 0),
    zonas,
    encargado: fila.encargado_nombre ? `${fila.encargado_nombre} (${fila.encargado_puesto})` : null,
    caracteristicas: leerJSON(fila.caracteristicas, []),
    servicios: leerJSON(fila.servicios, []),
    mapsUrl: fila.maps_url,
    mapEmbedUrl: fila.map_embed_url,
    destacada: fila.destacada === 1
  };
}

async function zonasPorSucursal() {
  const mapa = new Map();
  for (const zona of await repo.zonas()) {
    if (!mapa.has(zona.sucursal_id)) mapa.set(zona.sucursal_id, []);
    mapa.get(zona.sucursal_id).push({ id: zona.id, nombre: zona.nombre });
  }
  return mapa;
}

export async function listarSucursales() {
  const zonas = await zonasPorSucursal();
  return (await repo.listar()).map((fila) => aSucursal(fila, zonas.get(fila.id) ?? []));
}

export async function obtenerSucursal(id) {
  const fila = await repo.buscar(id);
  if (!fila) throw noEncontrado('No existe esa sucursal.');
  return aSucursal(fila, (await zonasPorSucursal()).get(fila.id) ?? []);
}

/** Lanza 404 si la sucursal no existe o está inactiva. Devuelve su fila. */
export async function exigirSucursal(id) {
  const fila = await repo.activa(id);
  if (!fila) throw noEncontrado(`No existe la sucursal "${id}".`);
  return fila;
}
