// Operación en sala, todo exclusivo del personal:
// mesas, Club Marfil, escáner de caja, ludoteca, equipo y métricas.

import { Router } from 'express';
import { z } from 'zod';
import { requiereStaff } from '../middleware/auth.js';
import { historialEscaneos } from '../servicios/bitacora.js';
import {
  canjearBeneficio, canjearRecompensa, listarClientes, obtenerClientePorCodigo, registrarCliente, sumarSello
} from '../servicios/clientes.js';
import { resolverCodigo } from '../servicios/escaner.js';
import {
  actualizarJuego, crearJuego, devolverJuego, eliminarJuego, listarJuegos, prestarJuego
} from '../servicios/juegos.js';
import {
  abrirServicio, actualizarMesa, actualizarTicket, cerrarServicio, listarMesas, marcarLimpia, obtenerMesa
} from '../servicios/mesas.js';
import { metricasDelDia } from '../servicios/metricas.js';
import { actualizarPersona, crearPersona, listarPersonal } from '../servicios/personal.js';
import {
  leer, zEmail, zEntero, zFecha, zHora, zId, zPassword, zPrecio, zTexto, zTextoOpcional
} from '../utils/validar.js';

const router = Router();
router.use(['/mesas', '/club', '/escaner', '/juegos', '/personal', '/metricas'], requiereStaff());

const soloGerencia = requiereStaff('admin', 'gerente');
const soloAdmin = requiereStaff('admin');
const zSucursalId = zTexto(60);
const filtroSucursal = z.object({ sucursalId: zSucursalId.optional() });

// --------------------------------------------------------------------------
// Mesas
// --------------------------------------------------------------------------

const esquemaWalkIn = z.object({
  comensal: zTexto(120).default('Comensal Walk-in'),
  personas: zEntero(1, 60),
  notas: zTextoOpcional(500).optional()
});

const esquemaEditarMesa = z
  .object({
    notas: zTextoOpcional(500).nullable(),
    capacidad: zEntero(1, 60),
    zonaId: zId.nullable(),
    forma: z.enum(['squircle', 'circle', 'rectangle_vertical', 'rectangle_horizontal']),
    ticketTotal: zPrecio // consumo acumulado del servicio abierto
  })
  .partial();

const esquemaLiberar = z.object({ ticketTotal: zPrecio.optional() });

router.get('/mesas', async (req, res) => res.json(await listarMesas(leer(filtroSucursal, req.query))));

router.get('/mesas/:id', async (req, res) => res.json(await obtenerMesa(leer(zId, req.params.id))));

router.patch('/mesas/:id', async (req, res) => {
  const id = leer(zId, req.params.id);
  const { ticketTotal, ...cambios } = leer(esquemaEditarMesa, req.body);
  if (ticketTotal !== undefined) await actualizarTicket(id, ticketTotal);
  res.json(await actualizarMesa(id, cambios));
});

// Sentar a un comensal sin reservación.
router.post('/mesas/:id/walk-in', async (req, res) => {
  const datos = leer(esquemaWalkIn, req.body);
  res.status(201).json(await abrirServicio({ ...datos, mesaId: leer(zId, req.params.id), personalId: req.usuario.id }));
});

// El comensal se va: la mesa pasa a limpieza.
router.post('/mesas/:id/liberar', async (req, res) => {
  res.json(await cerrarServicio(leer(zId, req.params.id), leer(esquemaLiberar, req.body)));
});

// La mesa quedó limpia: vuelve a estar libre.
router.post('/mesas/:id/limpia', async (req, res) => res.json(await marcarLimpia(leer(zId, req.params.id))));

// --------------------------------------------------------------------------
// Club Marfil
// --------------------------------------------------------------------------

const esquemaAltaCliente = z.object({
  nombre: zTexto(120),
  telefono: zTexto(30).optional(),
  email: zEmail.optional(),
  sucursalHabitualId: zSucursalId.optional()
});

router.get('/club/clientes', async (req, res) => {
  res.json(await listarClientes(leer(z.object({ q: zTexto(80).optional() }), req.query)));
});

router.post('/club/clientes', async (req, res) => {
  res.status(201).json(await registrarCliente(leer(esquemaAltaCliente, req.body)));
});

router.get('/club/clientes/:codigo', async (req, res) => res.json(await obtenerClientePorCodigo(req.params.codigo)));

router.post('/club/clientes/:codigo/sello', async (req, res) => {
  const { sucursalId } = leer(filtroSucursal, req.body);
  res.json(await 
    sumarSello(req.params.codigo, {
      sucursalId: sucursalId ?? req.usuario.sucursalId ?? null,
      personalId: req.usuario.id
    })
  );
});

router.post('/club/clientes/:codigo/canjear-recompensa', async (req, res) => {
  res.json(await canjearRecompensa(req.params.codigo, { personalId: req.usuario.id }));
});

router.post('/club/beneficios/:codigo/canjear', async (req, res) => {
  res.json(await canjearBeneficio(req.params.codigo, { personalId: req.usuario.id }));
});

// --------------------------------------------------------------------------
// Escáner de caja
// --------------------------------------------------------------------------

// Va antes de /escaner/:codigo para que "historial" no se tome como un código.
router.get('/escaner/historial', async (req, res) => {
  const { limite } = leer(z.object({ limite: zEntero(1, 200).default(30) }), req.query);
  res.json(await historialEscaneos({ limite }));
});

router.get('/escaner/:codigo', async (req, res) => res.json(await resolverCodigo(req.params.codigo, req.usuario.id)));

// --------------------------------------------------------------------------
// Ludoteca
// --------------------------------------------------------------------------

const camposJuego = {
  nombre: zTexto(120),
  categoria: zTexto(80),
  jugadores: zTexto(40),
  duracion: zTexto(40),
  dificultad: zTexto(40),
  piezasEstado: zTexto(120)
};

const esquemaCrearJuego = z.object({
  ...camposJuego,
  piezasEstado: camposJuego.piezasEstado.default('100% Completo (Verificado)'),
  sucursalId: zSucursalId
});

const esquemaEditarJuego = z.object({ ...camposJuego, reposicionRequerida: z.boolean() }).partial();

const filtrosJuegos = z.object({
  sucursalId: zSucursalId.optional(),
  q: zTexto(80).optional(),
  estado: z.enum(['disponible', 'en_mesa', 'reposicion']).optional()
});

router.get('/juegos', async (req, res) => res.json(await listarJuegos(leer(filtrosJuegos, req.query))));

router.post('/juegos', soloGerencia, async (req, res) => {
  res.status(201).json(await crearJuego(leer(esquemaCrearJuego, req.body)));
});

router.patch('/juegos/:id', async (req, res) => {
  res.json(await actualizarJuego(leer(zId, req.params.id), leer(esquemaEditarJuego, req.body)));
});

router.delete('/juegos/:id', soloGerencia, async (req, res) => {
  await eliminarJuego(leer(zId, req.params.id));
  res.status(204).end();
});

router.post('/juegos/:id/prestar', async (req, res) => {
  const { mesaId } = leer(z.object({ mesaId: zId }), req.body);
  res.json(await prestarJuego(leer(zId, req.params.id), mesaId, req.usuario.id));
});

router.post('/juegos/:id/devolver', async (req, res) => res.json(await devolverJuego(leer(zId, req.params.id))));

// --------------------------------------------------------------------------
// Equipo
// --------------------------------------------------------------------------

const camposPersona = {
  nombre: zTexto(120),
  email: zEmail.nullable(),
  password: zPassword,
  rol: z.enum(['admin', 'gerente', 'host', 'staff']),
  puesto: zTexto(80),
  sucursalId: zSucursalId.nullable(),
  turnoInicio: zHora.nullable(),
  turnoFin: zHora.nullable(),
  estado: z.enum(['activo', 'descanso', 'inactivo']),
  esEncargado: z.boolean()
};

const esquemaCrearPersona = z.object({
  ...camposPersona,
  email: camposPersona.email.optional(),
  password: zPassword.optional(),
  rol: camposPersona.rol.default('staff'),
  sucursalId: camposPersona.sucursalId.optional(),
  turnoInicio: camposPersona.turnoInicio.optional(),
  turnoFin: camposPersona.turnoFin.optional(),
  estado: camposPersona.estado.default('activo'),
  esEncargado: z.boolean().default(false)
});

const esquemaEditarPersona = z.object(camposPersona).partial();

const filtrosPersonal = z.object({
  sucursalId: zSucursalId.optional(),
  estado: camposPersona.estado.optional()
});

router.get('/personal', async (req, res) => res.json(await listarPersonal(leer(filtrosPersonal, req.query))));

router.post('/personal', soloAdmin, async (req, res) => {
  res.status(201).json(await crearPersona(leer(esquemaCrearPersona, req.body)));
});

router.patch('/personal/:id', soloAdmin, async (req, res) => {
  res.json(await actualizarPersona(leer(zId, req.params.id), leer(esquemaEditarPersona, req.body)));
});

// --------------------------------------------------------------------------
// Métricas del dashboard
// --------------------------------------------------------------------------

router.get('/metricas/hoy', async (req, res) => {
  const { sucursalId, fecha } = leer(filtroSucursal.extend({ fecha: zFecha.optional() }), req.query);
  res.json(await metricasDelDia({ sucursalId, fecha }));
});

export default router;
