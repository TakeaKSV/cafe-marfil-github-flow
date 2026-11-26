import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { firmarToken } from '../middleware/auth.js';
import {
  autenticarCliente,
  emitirVerificacionCorreo,
  obtenerCliente,
  reenviarCodigoPorEmail,
  reenviarVerificacionCorreo,
  registrarCliente,
  restablecerPasswordPorToken,
  solicitarRecuperacionPassword,
  verificarCodigoCorreo,
  verificarCorreoPorToken
} from '../servicios/clientes.js';
import { autenticarStaff, completarInvitacion, consultarInvitacion, obtenerPersona } from '../servicios/personal.js';
import { noAutenticado, solicitudInvalida } from '../utils/errores.js';
import { leer, zEmail, zPassword, zPasswordLogin, zTexto, zTextoOpcional } from '../utils/validar.js';

const router = Router();

const esquemaLogin = z.object({ email: zEmail, password: zPasswordLogin });

const esquemaRegistro = z
  .object({
    nombre: zTexto(120).optional(),
    nombres: zTexto(80).optional(),
    apellidoPaterno: zTexto(60).optional(),
    apellidoMaterno: zTextoOpcional(60).optional(),
    email: zEmail,
    password: zPassword,
    telefono: zTexto(30).optional(),
    ciudad: zTexto(80).optional()
  })
  .refine((d) => Boolean(d.nombre || (d.nombres && d.apellidoPaterno)), {
    message: 'Ingresa tus nombres y apellido paterno.',
    path: ['nombres']
  });

const esquemaVerificarCodigo = z.object({
  email: zEmail,
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Ingresa el código de 6 dígitos.')
});

const esquemaReenviar = z.object({
  email: zEmail.optional()
});

const esquemaOlvidePassword = z.object({ email: zEmail });
const esquemaRestablecerPassword = z.object({
  token: zTexto(128),
  password: zPassword
});

const esquemaCompletarInvitacion = z
  .object({
    token: zTexto(128),
    nombre: zTexto(120).optional(),
    nombres: zTexto(80).optional(),
    apellidoPaterno: zTexto(60).optional(),
    apellidoMaterno: zTextoOpcional(60).optional(),
    password: zPassword
  })
  .refine((d) => Boolean(d.nombre || (d.nombres && d.apellidoPaterno)), {
    message: 'Ingresa tus nombres y apellido paterno.',
    path: ['nombres']
  });

// Panel de administración
router.post('/staff/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const { usuario, version } = await autenticarStaff(email, password);
  res.json({ token: firmarToken({ id: usuario.id, tipo: 'staff', version }), usuario });
});

router.get('/invitacion/:token', async (req, res) => {
  res.json(await consultarInvitacion(req.params.token));
});

router.post('/invitacion/completar', async (req, res) => {
  const { usuario, tieneAcceso } = await completarInvitacion(leer(esquemaCompletarInvitacion, req.body));
  res.status(201).json({
    ok: true,
    usuario,
    tieneAcceso,
    ...(tieneAcceso ? { token: firmarToken({ id: usuario.id, tipo: 'staff', version: 0 }) } : {})
  });
});

// PWA de clientes: el registro NO entrega sesión hasta confirmar el código de 6 dígitos.
router.post('/clientes/registro', async (req, res) => {
  const cliente = await registrarCliente(leer(esquemaRegistro, req.body));
  const { enviado } = await emitirVerificacionCorreo(cliente.id).catch(() => ({ enviado: false }));
  res.status(201).json({
    requiereVerificacion: true,
    email: cliente.email,
    cliente,
    verificacionEnviada: enviado,
    mensaje: 'Te enviamos un código de 6 dígitos a tu correo para confirmar tu cuenta.'
  });
});

router.post('/clientes/login', async (req, res) => {
  const { email, password } = leer(esquemaLogin, req.body);
  const { cliente, version } = await autenticarCliente(email, password);
  res.json({ token: firmarToken({ id: cliente.id, tipo: 'cliente', version }), cliente });
});

// Verificación por código de 6 dígitos (activa la cuenta e inicia sesión)
router.post('/verificar-codigo', async (req, res) => {
  const { email, codigo } = leer(esquemaVerificarCodigo, req.body);
  const { cliente, version } = await verificarCodigoCorreo(email, codigo);
  res.json({
    ok: true,
    token: firmarToken({ id: cliente.id, tipo: 'cliente', version }),
    cliente,
    mensaje: '¡Tu correo electrónico fue verificado correctamente!'
  });
});

// Compatibilidad con enlaces de verificación
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

router.post('/verificacion/reenviar', async (req, res) => {
  if (req.usuario?.tipo === 'cliente') {
    const resultado = await reenviarVerificacionCorreo(req.usuario.id);
    return res.json({
      ok: true,
      ...resultado,
      mensaje: resultado.yaVerificado
        ? 'Tu correo ya estaba verificado.'
        : 'Te enviamos un nuevo código de 6 dígitos. Revisa tu bandeja.'
    });
  }
  const { email } = leer(esquemaReenviar, req.body || {});
  if (!email) throw solicitudInvalida('Indica el correo para reenviar el código de verificación.');
  const resultado = await reenviarCodigoPorEmail(email);
  return res.json({
    ok: true,
    ...resultado,
    mensaje: resultado.yaVerificado
      ? 'Tu correo ya está verificado. Ya puedes iniciar sesión.'
      : 'Si tu cuenta está pendiente de verificación, te enviamos un nuevo código de 6 dígitos.'
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
