// Catálogo público: sucursales, menú, actividades y promociones.
// Cualquiera puede leer; solo gerencia (admin/gerente) puede crear o editar.

import { Router } from 'express';
import { z } from 'zod';
import { esGerencia, esStaff, requiereStaff } from '../middleware/auth.js';
import {
  actualizarActividad, crearActividad, listarActividades, obtenerActividad
} from '../servicios/actividades.js';
import {
  actualizarProducto, crearProducto, eliminarProducto, listarCategorias, listarProductos, obtenerProducto
} from '../servicios/menu.js';
import {
  actualizarPromocion, canjearPromocion, crearPromocion, listarPromociones, obtenerPromocion
} from '../servicios/promociones.js';
import { listarSucursales, obtenerSucursal } from '../servicios/sucursales.js';
import { noEncontrado, sinPermiso } from '../utils/errores.js';
import {
  leer, zBanderaQuery, zEntero, zFecha, zHora, zId, zListaTexto, zPrecio, zTexto, zTextoOpcional
} from '../utils/validar.js';

const router = Router();
const soloGerencia = requiereStaff('admin', 'gerente');
const zSucursalId = zTexto(60);

// --------------------------------------------------------------------------
// Sucursales
// --------------------------------------------------------------------------

router.get('/sucursales', async (_req, res) => res.json(await listarSucursales()));
router.get('/sucursales/:id', async (req, res) => res.json(await obtenerSucursal(req.params.id)));

// --------------------------------------------------------------------------
// Menú
// --------------------------------------------------------------------------

const filtrosProductos = z.object({
  categoria: zTexto(40).optional(),
  q: zTexto(80).optional(),
  disponibles: zBanderaQuery.optional(),
  destacados: zBanderaQuery.optional()
});

const camposProducto = {
  nombre: zTexto(120),
  nombreCorto: zTexto(40).nullable(),
  categoriaSlug: zTexto(40),
  etiqueta: zTexto(80).nullable(),
  descripcion: zTextoOpcional(600),
  porcion: zTexto(80).nullable(),
  precio: zPrecio,
  imagen: zTexto(300).nullable(),
  badge: zTexto(40).nullable(),
  calorias: zEntero(0, 5000).nullable(),
  colorCard: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usa un color hexadecimal, ej. #E12927.').nullable(),
  ingredientes: zListaTexto,
  alergenos: zListaTexto,
  disponibleEnCocina: z.boolean(),
  stockDiario: zEntero(),
  tiempoPrepMin: zEntero(0, 240),
  destacado: z.boolean()
};

const esquemaCrearProducto = z.object({
  ...camposProducto,
  nombreCorto: camposProducto.nombreCorto.optional(),
  etiqueta: camposProducto.etiqueta.optional(),
  descripcion: camposProducto.descripcion.default(''),
  porcion: camposProducto.porcion.optional(),
  imagen: camposProducto.imagen.optional(),
  badge: camposProducto.badge.optional(),
  calorias: camposProducto.calorias.optional(),
  colorCard: camposProducto.colorCard.optional(),
  ingredientes: zListaTexto.default([]),
  alergenos: zListaTexto.default([]),
  disponibleEnCocina: z.boolean().default(true),
  stockDiario: zEntero().default(30),
  tiempoPrepMin: zEntero(0, 240).default(10),
  destacado: z.boolean().default(false)
});

const esquemaEditarProducto = z.object({ ...camposProducto, vendidosHoy: zEntero() }).partial();

// Lo que cocina y barra pueden cambiar durante el turno sin ser gerencia.
const CAMPOS_OPERATIVOS = ['disponibleEnCocina', 'stockDiario', 'vendidosHoy'];

router.get('/menu/categorias', async (_req, res) => res.json(await listarCategorias()));

router.get('/menu/productos', async (req, res) => res.json(await listarProductos(leer(filtrosProductos, req.query))));

router.get('/menu/productos/:id', async (req, res) => res.json(await obtenerProducto(req.params.id)));

router.post('/menu/productos', soloGerencia, async (req, res) => {
  res.status(201).json(await crearProducto(leer(esquemaCrearProducto, req.body)));
});

router.patch('/menu/productos/:id', requiereStaff(), async (req, res) => {
  const cambios = leer(esquemaEditarProducto, req.body);
  const soloOperativo = Object.keys(cambios).every((campo) => CAMPOS_OPERATIVOS.includes(campo));
  if (!soloOperativo && !esGerencia(req)) {
    throw sinPermiso('Solo gerencia puede editar la ficha del producto (precio, nombre, etc.).');
  }
  res.json(await actualizarProducto(leer(zId, req.params.id), cambios));
});

router.delete('/menu/productos/:id', soloGerencia, async (req, res) => {
  await eliminarProducto(leer(zId, req.params.id));
  res.status(204).end();
});

// --------------------------------------------------------------------------
// Actividades
// --------------------------------------------------------------------------

const filtrosActividades = z.object({
  sucursalId: zSucursalId.optional(),
  categoria: zTexto(40).optional(),
  incluirPasadas: zBanderaQuery.optional()
});

const camposActividad = {
  nombre: zTexto(140),
  categoria: zTexto(80),
  categoriaSlug: zTexto(40),
  sucursalId: zSucursalId,
  fecha: zFecha.nullable(),
  fechaTexto: zTexto(80).nullable(),
  horaInicio: zHora.nullable(),
  horaFin: zHora.nullable(),
  horarioTexto: zTexto(80).nullable(),
  duracion: zTexto(60).nullable(),
  imagen: zTexto(300).nullable(),
  resumen: zTexto(400),
  descripcion: zTexto(1500).nullable(),
  cupoTotal: zEntero(1, 1000),
  precio: zPrecio,
  precioTexto: zTexto(60).nullable(),
  esGratis: z.boolean(),
  incluye: zListaTexto,
  requisitos: zTexto(400).nullable()
};

const esquemaCrearActividad = z.object({
  ...camposActividad,
  fecha: camposActividad.fecha.optional(),
  fechaTexto: camposActividad.fechaTexto.optional(),
  horaInicio: camposActividad.horaInicio.optional(),
  horaFin: camposActividad.horaFin.optional(),
  horarioTexto: camposActividad.horarioTexto.optional(),
  duracion: camposActividad.duracion.optional(),
  imagen: camposActividad.imagen.optional(),
  descripcion: camposActividad.descripcion.optional(),
  precio: zPrecio.default(0),
  precioTexto: camposActividad.precioTexto.optional(),
  esGratis: z.boolean().optional(),
  incluye: zListaTexto.default([]),
  requisitos: camposActividad.requisitos.optional()
});

const esquemaEditarActividad = z.object({ ...camposActividad, activa: z.boolean() }).partial();

router.get('/actividades', async (req, res) => res.json(await listarActividades(leer(filtrosActividades, req.query))));

router.get('/actividades/:id', async (req, res) => res.json(await obtenerActividad(req.params.id)));

router.post('/actividades', soloGerencia, async (req, res) => {
  res.status(201).json(await crearActividad(leer(esquemaCrearActividad, req.body)));
});

router.patch('/actividades/:id', soloGerencia, async (req, res) => {
  res.json(await actualizarActividad(leer(zId, req.params.id), leer(esquemaEditarActividad, req.body)));
});

// --------------------------------------------------------------------------
// Promociones
// --------------------------------------------------------------------------

const zCodigoPromo = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9-]{2,29}$/, 'Usa de 3 a 30 letras, números o guiones, empezando con letra.');

const camposPromocion = {
  codigo: zCodigoPromo,
  titulo: zTexto(140),
  categoria: zTexto(80),
  categoriaSlug: zTexto(40).nullable(),
  descuentoBadge: zTexto(30),
  beneficio: zTexto(300),
  descripcion: zTexto(600).nullable(),
  vigencia: zTexto(140),
  imagen: zTexto(300).nullable(),
  condiciones: zListaTexto,
  comoUsar: zTexto(300).nullable(),
  limiteDiario: zEntero(1, 10000),
  estado: z.enum(['activo', 'pausado']),
  sucursales: z.array(zSucursalId).min(1)
};

const esquemaCrearPromocion = z.object({
  ...camposPromocion,
  categoriaSlug: camposPromocion.categoriaSlug.optional(),
  descripcion: camposPromocion.descripcion.optional(),
  imagen: camposPromocion.imagen.optional(),
  condiciones: zListaTexto.default([]),
  comoUsar: camposPromocion.comoUsar.optional(),
  limiteDiario: zEntero(1, 10000).default(50),
  estado: camposPromocion.estado.default('activo'),
  sucursales: camposPromocion.sucursales.optional()
});

const esquemaEditarPromocion = z.object(camposPromocion).partial();

const esquemaCanje = z.object({
  sucursalId: zSucursalId.optional(),
  codigoCliente: zTexto(30).optional()
});

// Los clientes solo ven las promociones activas; el panel ve también las pausadas.
router.get('/promociones', async (req, res) => {
  const { sucursalId } = leer(z.object({ sucursalId: zSucursalId.optional() }), req.query);
  res.json(await listarPromociones({ soloActivas: !esStaff(req), sucursalId }));
});

router.get('/promociones/:id', async (req, res) => {
  const promocion = await obtenerPromocion(req.params.id);
  if (promocion.estado !== 'activo' && !esStaff(req)) throw noEncontrado('No existe esa promoción.');
  res.json(promocion);
});

router.post('/promociones', soloGerencia, async (req, res) => {
  res.status(201).json(await crearPromocion(leer(esquemaCrearPromocion, req.body)));
});

router.patch('/promociones/:id', soloGerencia, async (req, res) => {
  res.json(await actualizarPromocion(leer(zId, req.params.id), leer(esquemaEditarPromocion, req.body)));
});

router.post('/promociones/:id/canjear', requiereStaff(), async (req, res) => {
  const datos = leer(esquemaCanje, req.body);
  // Si el host no indica sucursal, se toma la suya.
  const sucursalId = datos.sucursalId ?? req.usuario.sucursalId ?? null;
  res.json(await canjearPromocion(req.params.id, { ...datos, sucursalId }, req.usuario.id));
});

export default router;
