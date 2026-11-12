import { db } from '../db/conexion.js';
import { leerJSON, precioTexto, slugLibre } from '../utils/codigos.js';
import { noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit, aJSON, armarUpdate } from '../utils/sql.js';

const SQL_PRODUCTOS = `
  SELECT p.*, c.slug AS categoria_slug, c.nombre AS categoria
  FROM productos p JOIN categorias_menu c ON c.id = p.categoria_id
  WHERE p.activo = 1`;

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

export function listarCategorias() {
  return db.todos(
    `SELECT c.id, c.slug, c.nombre,
            (SELECT COUNT(*) FROM productos p WHERE p.categoria_id = c.id AND p.activo = 1) AS productos
     FROM categorias_menu c ORDER BY c.orden, c.id`
  );
}

export async function listarProductos({ categoria, q, disponibles, destacados } = {}) {
  const filtros = [];
  const valores = {};
  if (categoria) {
    filtros.push('c.slug = :categoria');
    valores.categoria = categoria;
  }
  if (q) {
    filtros.push('(p.nombre LIKE :q OR p.descripcion LIKE :q)');
    valores.q = `%${q}%`;
  }
  if (disponibles) filtros.push('p.disponible = 1');
  if (destacados) filtros.push('p.destacado = 1');
  const extra = filtros.length ? `AND ${filtros.join(' AND ')}` : '';
  const filas = await db.todos(`${SQL_PRODUCTOS} ${extra} ORDER BY c.orden, p.id`, valores);
  return filas.map(aProducto);
}

/** Acepta el id numérico o el slug ('frappe-kinder-bueno'). */
export async function obtenerProducto(idOSlug) {
  const esId = /^\d+$/.test(String(idOSlug));
  const fila = await db.uno(`${SQL_PRODUCTOS} AND ${esId ? 'p.id' : 'p.slug'} = ?`, [
    esId ? Number(idOSlug) : String(idOSlug)
  ]);
  if (!fila) throw noEncontrado('No existe ese producto en el menú.');
  return aProducto(fila);
}

async function idDeCategoria(slug) {
  const categoria = await db.uno('SELECT id FROM categorias_menu WHERE slug = ?', [slug]);
  if (!categoria) throw solicitudInvalida(`No existe la categoría de menú "${slug}".`);
  return categoria.id;
}

export async function crearProducto(datos) {
  const categoriaId = await idDeCategoria(datos.categoriaSlug);
  const slug = await slugLibre(datos.nombre, (s) => db.uno('SELECT 1 FROM productos WHERE slug = ?', [s]));
  const { id } = await db.ejecutar(
    `INSERT INTO productos
       (slug, nombre, nombre_corto, categoria_id, etiqueta, descripcion, porcion, precio, imagen, badge, calorias,
        color_card, ingredientes, alergenos, disponible, stock_diario, tiempo_prep_min, destacado, creado_en)
     VALUES
       (:slug, :nombre, :nombreCorto, :categoriaId, :etiqueta, :descripcion, :porcion, :precio, :imagen, :badge,
        :calorias, :colorCard, :ingredientes, :alergenos, :disponible, :stockDiario, :tiempoPrepMin, :destacado, :creadoEn)`,
    {
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
    }
  );
  return obtenerProducto(id);
}

export async function actualizarProducto(id, cambios) {
  await obtenerProducto(id);
  const update = armarUpdate(
    { ...cambios, categoriaId: cambios.categoriaSlug ? await idDeCategoria(cambios.categoriaSlug) : undefined },
    {
      nombre: 'nombre',
      nombreCorto: 'nombre_corto',
      categoriaId: 'categoria_id',
      etiqueta: 'etiqueta',
      descripcion: 'descripcion',
      porcion: 'porcion',
      precio: 'precio',
      imagen: 'imagen',
      badge: 'badge',
      calorias: 'calorias',
      colorCard: 'color_card',
      ingredientes: ['ingredientes', aJSON],
      alergenos: ['alergenos', aJSON],
      disponibleEnCocina: ['disponible', aBit],
      stockDiario: 'stock_diario',
      vendidosHoy: 'vendidos_hoy',
      tiempoPrepMin: 'tiempo_prep_min',
      destacado: ['destacado', aBit]
    }
  );
  if (update) await db.ejecutar(`UPDATE productos SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  return obtenerProducto(id);
}

/** Borrado lógico: el producto deja de aparecer pero se conserva su historial. */
export async function eliminarProducto(id) {
  await obtenerProducto(id);
  await db.ejecutar('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
}
