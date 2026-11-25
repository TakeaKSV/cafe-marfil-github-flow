import { consulta, enTransaccion } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, aBit, aJSON } from './base.js';

function productos() {
  return consulta('productos as p')
    .join('categorias_menu as c', 'c.id', 'p.categoria_id')
    .select('p.*', 'c.slug as categoria_slug', 'c.nombre as categoria')
    .where('p.activo', 1);
}

export const listarCategorias = () =>
  consulta('categorias_menu as c')
    .select(
      'c.id',
      'c.slug',
      'c.nombre',
      consulta('productos as p')
        .count('*')
        .whereColumn('p.categoria_id', 'c.id')
        .where('p.activo', 1)
        .where('p.estado', 'publicado')
        .as('productos')
    )
    .orderBy(['c.orden', 'c.id']);

export function listar({ categoria, q, disponibles, destacados, incluirBorradores = false }) {
  const query = productos();
  if (!incluirBorradores) query.where('p.estado', 'publicado');
  if (categoria) query.where('c.slug', categoria);
  if (q)
    query.where(function () {
      this.where('p.nombre', 'like', '%' + q + '%').orWhere('p.descripcion', 'like', '%' + q + '%');
    });
  if (disponibles) query.where('p.disponible', 1);
  if (destacados) query.where('p.destacado', 1);
  return query.orderBy(['c.orden', 'p.orden', 'p.id']);
}

export const buscar = (clave) =>
  productos()
    .where(/^\d+$/.test(String(clave)) ? 'p.id' : 'p.slug', clave)
    .first();

export const insertarProducto = (datos) =>
  insertar('productos', {
    slug: datos.slug,
    nombre: datos.nombre,
    nombre_corto: datos.nombreCorto,
    categoria_id: datos.categoriaId,
    etiqueta: datos.etiqueta,
    descripcion: datos.descripcion,
    porcion: datos.porcion,
    precio: datos.precio,
    imagen: datos.imagen,
    badge: datos.badge,
    calorias: datos.calorias,
    color_card: datos.colorCard,
    ingredientes: datos.ingredientes,
    alergenos: datos.alergenos,
    disponible: datos.disponible,
    stock_diario: datos.stockDiario,
    tiempo_prep_min: datos.tiempoPrepMin,
    destacado: datos.destacado,
    estado: datos.estado ?? 'publicado',
    orden: datos.orden ?? 0,
    actualizado_por: datos.actualizadoPor ?? null,
    actualizado_en: datos.actualizadoEn ?? null,
    creado_en: datos.creadoEn
  });

const CAMPOS_PRODUCTOS = {
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
  destacado: ['destacado', aBit],
  estado: 'estado',
  orden: 'orden',
  actualizadoPor: 'actualizado_por',
  actualizadoEn: 'actualizado_en'
};

export const actualizarProductos = (id, cambios) =>
  actualizar('productos', id, mapearCampos(cambios, CAMPOS_PRODUCTOS));

export const reordenar = (items, personalId, actualizadoEn) =>
  enTransaccion(async () => {
    for (const item of items) {
      await actualizar('productos', item.id, {
        orden: item.orden,
        actualizado_por: personalId ?? null,
        actualizado_en: actualizadoEn
      });
    }
  });

export const categoriaPorSlug = (slug) => consulta('categorias_menu').select('id').where({ slug }).first();

export const slugExiste = (slug) => consulta('productos').select('id').where({ slug }).first();

export const desactivar = (id) => actualizar('productos', id, { activo: 0 });
