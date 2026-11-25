import * as repo from '../repositorios/menu.js';
import { leerJSON, precioTexto, slugLibre } from '../utils/codigos.js';
import { noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit, aJSON } from '../repositorios/base.js';

function aProducto(fila) {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    nombreCorto: fila.nombre_corto,
    categoria: fila.categoria,
    categoriaSlug: fila.categoria_slug,
    etiqueta: fila.etiqueta,
    descripcion: fila.descripcion,
    porcion: fila.porcion,
    precio: fila.precio,
    precioStr: precioTexto(fila.precio),
    imagen: fila.imagen,
    badge: fila.badge,
    calorias: fila.calorias,
    colorCard: fila.color_card,
    ingredientes: leerJSON(fila.ingredientes, []),
    alergenos: leerJSON(fila.alergenos, []),
    disponibleEnCocina: fila.disponible === 1,
    stockDiario: fila.stock_diario,
    vendidosHoy: fila.vendidos_hoy,
    tiempoPrepMin: fila.tiempo_prep_min,
    destacado: fila.destacado === 1,
    estado: fila.estado || 'publicado',
    orden: fila.orden ?? 0,
    actualizadoEn: fila.actualizado_en ?? null
  };
}

export const listarCategorias = () => repo.listarCategorias();

export async function listarProductos(filtros = {}) {
  return (await repo.listar(filtros)).map(aProducto);
}

/** Acepta el id numérico o el slug ('frappe-kinder-bueno'). */
export async function obtenerProducto(idOSlug, { incluirBorradores = false } = {}) {
  const fila = await repo.buscar(idOSlug);
  if (!fila || (!incluirBorradores && fila.estado === 'borrador')) {
    throw noEncontrado('No existe ese producto en el menú.');
  }
  return aProducto(fila);
}

async function idDeCategoria(slug) {
  const categoria = await repo.categoriaPorSlug(slug);
  if (!categoria) throw solicitudInvalida(`No existe la categoría de menú "${slug}".`);
  return categoria.id;
}

export async function crearProducto(datos, personalId = null) {
  const categoriaId = await idDeCategoria(datos.categoriaSlug);
  const slug = await slugLibre(datos.nombre, (s) => repo.slugExiste(s));
  const ahora = ahoraISO();
  const { id } = await repo.insertarProducto({
    slug,
    nombre: datos.nombre,
    nombreCorto: datos.nombreCorto ?? null,
    categoriaId,
    etiqueta: datos.etiqueta ?? null,
    descripcion: datos.descripcion,
    porcion: datos.porcion ?? null,
    precio: datos.precio,
    imagen: datos.imagen ?? null,
    badge: datos.badge ?? null,
    calorias: datos.calorias ?? null,
    colorCard: datos.colorCard ?? null,
    ingredientes: aJSON(datos.ingredientes),
    alergenos: aJSON(datos.alergenos),
    disponible: aBit(datos.disponibleEnCocina),
    stockDiario: datos.stockDiario,
    tiempoPrepMin: datos.tiempoPrepMin,
    destacado: aBit(datos.destacado),
    estado: datos.estado ?? 'publicado',
    orden: datos.orden ?? 0,
    actualizadoPor: personalId,
    actualizadoEn: ahora,
    creadoEn: ahora
  });
  return obtenerProducto(id, { incluirBorradores: true });
}

export async function actualizarProducto(id, cambios, personalId = null) {
  await obtenerProducto(id, { incluirBorradores: true });
  await repo.actualizarProductos(id, {
    ...cambios,
    categoriaId: cambios.categoriaSlug ? await idDeCategoria(cambios.categoriaSlug) : undefined,
    actualizadoPor: personalId,
    actualizadoEn: ahoraISO()
  });

  return obtenerProducto(id, { incluirBorradores: true });
}

export async function publicarProducto(id, personalId = null) {
  return actualizarProducto(id, { estado: 'publicado' }, personalId);
}

export async function despublicarProducto(id, personalId = null) {
  return actualizarProducto(id, { estado: 'borrador' }, personalId);
}

export async function reordenarProductos(items, personalId = null) {
  if (!items.length) return [];
  await repo.reordenar(items, personalId, ahoraISO());
  return listarProductos({ incluirBorradores: true });
}

/** Borrado lógico: el producto deja de aparecer pero se conserva su historial. */
export async function eliminarProducto(id) {
  await obtenerProducto(id, { incluirBorradores: true });
  await repo.desactivar(id);
}
