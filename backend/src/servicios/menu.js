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
    destacado: fila.destacado === 1
  };
}

export const listarCategorias = () => repo.listarCategorias();

export async function listarProductos(filtros = {}) {
  return (await repo.listar(filtros)).map(aProducto);
}

/** Acepta el id numérico o el slug ('frappe-kinder-bueno'). */
export async function obtenerProducto(idOSlug) {
  const fila = await repo.buscar(idOSlug);
  if (!fila) throw noEncontrado('No existe ese producto en el menú.');
  return aProducto(fila);
}

async function idDeCategoria(slug) {
  const categoria = await repo.categoriaPorSlug(slug);
  if (!categoria) throw solicitudInvalida(`No existe la categoría de menú "${slug}".`);
  return categoria.id;
}

export async function crearProducto(datos) {
  const categoriaId = await idDeCategoria(datos.categoriaSlug);
  const slug = await slugLibre(datos.nombre, (s) => repo.slugExiste(s));
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
    creadoEn: ahoraISO()
  });
  return obtenerProducto(id);
}

export async function actualizarProducto(id, cambios) {
  await obtenerProducto(id);
  await repo.actualizarProductos(id, {
    ...cambios,
    categoriaId: cambios.categoriaSlug ? await idDeCategoria(cambios.categoriaSlug) : undefined
  });

  return obtenerProducto(id);
}

/** Borrado lógico: el producto deja de aparecer pero se conserva su historial. */
export async function eliminarProducto(id) {
  await obtenerProducto(id);
  await repo.desactivar(id);
}
