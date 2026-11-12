import { Router } from 'express';
import { z } from 'zod';
import { esStaff, requiereStaff } from '../middleware/auth.js';
import {
  actualizarReservacion, cancelarReservacion, completarReservacion, crearReservacion, hacerCheckIn,
  listarReservaciones, marcarNoShow, obtenerReservacion, obtenerReservacionPorToken
} from '../servicios/reservaciones.js';
import {
  leer, zEmail, zEntero, zFecha, zHora, zId, zPrecio, zTexto, zTextoOpcional
} from '../utils/validar.js';

const router = Router();

const ESTADOS = ['confirmada', 'en_curso', 'asistida', 'cancelada', 'no_show'];

const esquemaCrear = z.object({
  tipo: z.enum(['mesa', 'juegos', 'actividad', 'evento']).default('mesa'),
  tipoNombre: zTexto(80).optional(),
  sucursalId: zTexto(60).optional(), // se ignora si es una actividad: manda su sucursal
  actividadId: z.union([zId, zTexto(80)]).optional(), // id o slug de la actividad
  fecha: zFecha.optional(), // obligatoria salvo en actividades con fecha fija
  hora: zHora.optional(),
  personas: zEntero(1, 60),
  comensal: zTexto(120).optional(), // con sesión de cliente se toma de su perfil
  telefono: zTexto(30).optional(),
  email: zEmail.optional(),
  mesaId: zId.optional(), // solo la toma en cuenta el panel
  notas: zTextoOpcional(500).optional()
});

const esquemaEditar = z
  .object({
    fecha: zFecha,
    hora: zHora,
    personas: zEntero(1, 60),
    mesaId: zId.nullable(),
    notas: zTextoOpcional(500).nullable(),
    tipoNombre: zTexto(80).nullable(),
    comensal: zTexto(120),
    telefono: zTexto(30),
    email: zEmail.nullable()
  })
  .partial();

const filtros = z.object({
  sucursalId: zTexto(60).optional(),
  fecha: zFecha.optional(),
  desde: zFecha.optional(),
  hasta: zFecha.optional(),
  estado: z.enum(ESTADOS).optional(),
  q: zTexto(80).optional()
});

const esquemaCheckIn = z.object({ mesaId: zId.optional() });
const esquemaCompletar = z.object({ ticketTotal: zPrecio.optional() });

// --------------------------------------------------------------------------
// Público (PWA): reservar, y consultar o cancelar con el token secreto del QR
// --------------------------------------------------------------------------

// La misma ruta sirve a invitados, a clientes con sesión y al host del panel.
router.post('/', async (req, res) => {
  const datos = leer(esquemaCrear, req.body);
  const contexto = esStaff(req)
    ? { personalId: req.usuario.id }
    : { clienteId: req.usuario?.tipo === 'cliente' ? req.usuario.id : null };
  res.status(201).json(await crearReservacion(datos, contexto));
});

router.get('/publica/:token', async (req, res) => {
  res.json(await obtenerReservacionPorToken(req.params.token));
});

router.post('/publica/:token/cancelar', async (req, res) => {
  const reservacion = await obtenerReservacionPorToken(req.params.token);
  res.json(await cancelarReservacion(reservacion.folio));
});

// --------------------------------------------------------------------------
// Panel (personal)
// --------------------------------------------------------------------------

router.get('/', requiereStaff(), async (req, res) => {
  res.json(await listarReservaciones(leer(filtros, req.query)));
});

router.get('/:folio', requiereStaff(), async (req, res) => {
  res.json(await obtenerReservacion(req.params.folio));
});

router.patch('/:folio', requiereStaff(), async (req, res) => {
  res.json(await actualizarReservacion(req.params.folio, leer(esquemaEditar, req.body)));
});

router.post('/:folio/check-in', requiereStaff(), async (req, res) => {
  res.json(await hacerCheckIn(req.params.folio, leer(esquemaCheckIn, req.body), req.usuario.id));
});

router.post('/:folio/completar', requiereStaff(), async (req, res) => {
  res.json(await completarReservacion(req.params.folio, leer(esquemaCompletar, req.body)));
});

router.post('/:folio/cancelar', requiereStaff(), async (req, res) => {
  res.json(await cancelarReservacion(req.params.folio));
});

router.post('/:folio/no-show', requiereStaff(), async (req, res) => {
  res.json(await marcarNoShow(req.params.folio));
});

export default router;
