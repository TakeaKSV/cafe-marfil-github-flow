import { Router } from 'express';
import { z } from 'zod';
import { firmarToken } from '../middleware/auth.js';
import { autenticarCliente, obtenerCliente, registrarCliente } from '../servicios/clientes.js';
import { autenticarStaff, obtenerPersona } from '../servicios/personal.js';
import { noAutenticado } from '../utils/errores.js';
import { leer, zEmail, zPassword, zTexto } from '../utils/validar.js';

const router = Router();

const esquemaLogin = z.object({ email: zEmail, password: z.string().min(1).max(72) });

const esquemaRegistro = z.object({
  nombre: zTexto(120),
  email: zEmail,
  password: zPassword,
  telefono: zTexto(30).optional(),
  ciudad: zTexto(80).optional()
});

// Panel de administración
router.post('/staff/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const usuario = await autenticarStaff(email, password);
  res.json({ token: firmarToken({ id: usuario.id, tipo: 'staff' }), usuario });
});

// PWA de clientes
router.post('/clientes/registro', async (req, res) => {
  const cliente = await registrarCliente(leer(esquemaRegistro, req.body));
  res.status(201).json({ token: firmarToken({ id: cliente.id, tipo: 'cliente' }), cliente });
});

router.post('/clientes/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const cliente = await autenticarCliente(email, password);
  res.json({ token: firmarToken({ id: cliente.id, tipo: 'cliente' }), cliente });
});

// ¿De quién es este token? Sirve para restaurar la sesión al recargar la página.
router.get('/me', async (req, res) => {
  if (!req.usuario) throw noAutenticado();
  if (req.usuario.tipo === 'staff') return res.json({ tipo: 'staff', usuario: await obtenerPersona(req.usuario.id) });
  res.json({ tipo: 'cliente', cliente: await obtenerCliente(req.usuario.id) });
});

export default router;
