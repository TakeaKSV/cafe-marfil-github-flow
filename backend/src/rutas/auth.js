import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { firmarToken, requiereCliente } from '../middleware/auth.js';
import {
  autenticarCliente,
  emitirVerificacionCorreo,
  obtenerCliente,
  reenviarVerificacionCorreo,
  registrarCliente,
  restablecerPasswordPorToken,
  solicitarRecuperacionPassword,
  verificarCorreoPorToken
} from '../servicios/clientes.js';
import { autenticarStaff, obtenerPersona } from '../servicios/personal.js';
import { noAutenticado } from '../utils/errores.js';
import { leer, zEmail, zPassword, zPasswordLogin, zTexto } from '../utils/validar.js';

const router = Router();

const esquemaLogin = z.object({ email: zEmail, password: zPasswordLogin });

const esquemaRegistro = z.object({
  nombre: zTexto(120),
  email: zEmail,
  password: zPassword,
  telefono: zTexto(30).optional(),
  ciudad: zTexto(80).optional()
});

const esquemaOlvidePassword = z.object({ email: zEmail });
const esquemaRestablecerPassword = z.object({
  token: zTexto(128),
  password: zPassword
});

// Panel de administración
router.post('/staff/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const { usuario, version } = await autenticarStaff(email, password);
  res.json({ token: firmarToken({ id: usuario.id, tipo: 'staff', version }), usuario });
});

// PWA de clientes
router.post('/clientes/registro', async (req, res) => {
  const cliente = await registrarCliente(leer(esquemaRegistro, req.body));
  const { enviado } = await emitirVerificacionCorreo(cliente.id).catch(() => ({ enviado: false }));
  res.status(201).json({
    token: firmarToken({ id: cliente.id, tipo: 'cliente' }),
    cliente,
    verificacionEnviada: enviado
  });
});

router.post('/clientes/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const { cliente, version } = await autenticarCliente(email, password);
  res.json({ token: firmarToken({ id: cliente.id, tipo: 'cliente', version }), cliente });
});

// Verificación de correo electrónico
router.get('/verificar', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  const quiereJson =
    req.query.formato === 'json' ||
    req.get('accept')?.includes('application/json') ||
    req.accepts(['json', 'html']) === 'json';

  try {
    const cliente = await verificarCorreoPorToken(token);
    if (quiereJson) {
      return res.json({
        ok: true,
        mensaje: '¡Tu correo electrónico fue verificado correctamente!',
        cliente
      });
    }
    return res.redirect(`${config.correo.appUrl}/?verificado=ok`);
  } catch (err) {
    if (quiereJson) throw err;
    return res.redirect(`${config.correo.appUrl}/?verificado=error`);
  }
});

router.post('/verificacion/reenviar', requiereCliente, async (req, res) => {
  const resultado = await reenviarVerificacionCorreo(req.usuario.id);
  res.json({
    ok: true,
    ...resultado,
    mensaje: resultado.yaVerificado
      ? 'Tu correo ya estaba verificado.'
      : 'Te enviamos un nuevo correo de verificación. Revisa tu bandeja.'
  });
});

// Recuperación de contraseña
router.post('/password/olvide', async (req, res) => {
  const { email } = leer(esquemaOlvidePassword, req.body);
  await solicitarRecuperacionPassword(email);
  res.json({
    ok: true,
    mensaje: 'Si ese correo está registrado en Club Marfil, recibirás un enlace para restablecer tu contraseña.'
  });
});

router.post('/password/restablecer', async (req, res) => {
  const { token, password } = leer(esquemaRestablecerPassword, req.body);
  await restablecerPasswordPorToken(token, password);
  res.json({
    ok: true,
    mensaje: 'Tu contraseña se actualizó correctamente. Inicia sesión con tu nueva contraseña.'
  });
});

// ¿De quién es este token? Sirve para restaurar la sesión al recargar la página.
router.get('/me', async (req, res) => {
  if (!req.usuario) throw noAutenticado();
  if (req.usuario.tipo === 'staff') return res.json({ tipo: 'staff', usuario: await obtenerPersona(req.usuario.id) });
  res.json({ tipo: 'cliente', cliente: await obtenerCliente(req.usuario.id) });
});

export default router;
