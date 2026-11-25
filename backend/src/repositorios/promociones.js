import { consulta } from '../db/conexion.js';
import { insertar, actualizar, mapearCampos, aJSON, fechaBD } from './base.js';

function promociones({ desde, hasta }) {
  return consulta('promociones as p').select(
    'p.*',
    consulta('canjes_promocion as c')
      .count('*')
      .whereColumn('c.promocion_id', 'p.id')
      .where('c.creado_en', '>=', fechaBD(desde))
      .where('c.creado_en', '<', fechaBD(hasta))
      .as('canjes_hoy')
  );
}
export function listar({ soloActivas = false, sucursalId }, rango) {
  const query = promociones(rango);
  if (soloActivas) query.where('p.estado', 'activo');
  if (sucursalId)
    query.whereExists(
      consulta('promocion_sucursal as ps')
        .select('ps.promocion_id')
        .whereColumn('ps.promocion_id', 'p.id')
        .where('ps.sucursal_id', sucursalId)
    );
  return query.orderBy('p.id');
}
export const buscar = (clave, rango) =>
  promociones(rango)
    .where(/^\d+$/.test(String(clave)) ? 'p.id' : 'p.codigo', String(clave).trim().toUpperCase())
    .first();

export const insertarSucursal = ({ promocionId, sucursalId }) =>
  insertar('promocion_sucursal', {
    promocion_id: promocionId,
    sucursal_id: sucursalId
  });

export const insertarPromocion = (datos) =>
  insertar('promociones', {
    codigo: datos.codigo,
    titulo: datos.titulo,
    categoria: datos.categoria,
    categoria_slug: datos.categoriaSlug,
    descuento_badge: datos.descuentoBadge,
    beneficio: datos.beneficio,
    descripcion: datos.descripcion,
    vigencia: datos.vigencia,
    imagen: datos.imagen,
    condiciones: datos.condiciones,
    como_usar: datos.comoUsar,
    limite_diario: datos.limiteDiario,
    estado: datos.estado,
    creado_en: datos.creadoEn
  });

export const insertarCanje = ({ promocionId, clienteId, sucursalId, personalId, creadoEn }) =>
  insertar('canjes_promocion', {
    promocion_id: promocionId,
    cliente_id: clienteId,
    sucursal_id: sucursalId,
    personal_id: personalId,
    creado_en: creadoEn
  });

const CAMPOS_PROMOCIONES = {
  codigo: 'codigo',
  titulo: 'titulo',
  categoria: 'categoria',
  categoriaSlug: 'categoria_slug',
  descuentoBadge: 'descuento_badge',
  beneficio: 'beneficio',
  descripcion: 'descripcion',
  vigencia: 'vigencia',
  imagen: 'imagen',
  condiciones: ['condiciones', aJSON],
  comoUsar: 'como_usar',
  limiteDiario: 'limite_diario',
  estado: 'estado'
};

export const actualizarPromociones = (id, cambios) =>
  actualizar('promociones', id, mapearCampos(cambios, CAMPOS_PROMOCIONES));

export const sucursales = () =>
  consulta('promocion_sucursal as ps')
    .join('sucursales as s', 's.id', 'ps.sucursal_id')
    .select('ps.promocion_id', 's.id', 's.nombre')
    .orderBy('s.nombre');

export const borrarSucursales = (promocionId) =>
  consulta('promocion_sucursal').where('promocion_id', promocionId).delete();

export const codigoExiste = (codigo) => consulta('promociones').select('id').where({ codigo }).first();

export const codigoEnUso = (codigo, id) =>
  consulta('promociones').select('id').where({ codigo }).whereNot('id', id).first();

export const sucursalesActivas = () => consulta('sucursales').select('id').where('activa', 1);
