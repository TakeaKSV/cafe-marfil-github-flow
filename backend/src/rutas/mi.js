// "Mi cuenta": todo lo que la PWA muestra del cliente que inició sesión.

import { Router } from 'express';
import { z } from 'zod';
import { requiereCliente } from '../middleware/auth.js';
import {
  actualizarPerfil, listarBeneficios, listarNotificaciones, marcarNotificacionesLeidas, obtenerCliente
} from '../servicios/clientes.js';
import { cancelarReservacion, listarReservaciones } from '../servicios/reservaciones.js';
import { leer, zEmail, zId, zTexto } from '../utils/validar.js';

const router = Router();
router.use(requiereCliente);

const esquemaPerfil = z
  .object({
    nombre: zTexto(120),
    email: zEmail,
    telefono: zTexto(30).nullable(),
    ciudad: zTexto(80).nullable(),
    sucursalHabitualId: zTexto(60).nullable(),
    // Objeto libre de gustos del cliente; se mezcla con lo ya guardado.
    preferencias: z.record(z.string().max(40), z.string().max(120))
  })
  .partial();

router.get('/perfil', async (req, res) => res.json(await obtenerCliente(req.usuario.id)));

router.patch('/perfil', async (req, res) => {
  res.json(await actualizarPerfil(req.usuario.id, leer(esquemaPerfil, req.body)));
});

router.get('/reservaciones', async (req, res) => {
  res.json(await listarReservaciones({ clienteId: req.usuario.id }));
});

router.post('/reservaciones/:folio/cancelar', async (req, res) => {
  res.json(await cancelarReservacion(req.params.folio, { clienteId: req.usuario.id }));
});

router.get('/beneficios', async (req, res) => res.json(await listarBeneficios(req.usuario.id)));

router.get('/notificaciones', async (req, res) => res.json(await listarNotificaciones(req.usuario.id)));

router.post('/notificaciones/leer-todas', async (req, res) => {
  res.json(await marcarNotificacionesLeidas(req.usuario.id));
});

router.post('/notificaciones/:id/leer', async (req, res) => {
  res.json(await marcarNotificacionesLeidas(req.usuario.id, leer(zId, req.params.id)));
});

export default router;
