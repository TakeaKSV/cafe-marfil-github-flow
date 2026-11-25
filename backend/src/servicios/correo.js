// Servicio de correos transaccionales y verificación de dominios MX.
// En desarrollo apunta por defecto a Mailpit (127.0.0.1:1025); en producción usa SMTP de .env.

import dns from 'node:dns/promises';
import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { solicitudInvalida } from '../utils/errores.js';

export const DOMINIOS_DESECHABLES = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'yopmail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com'
]);

const TIMEOUT_MX_MS = 3500;

let transportePersonalizado = null;
let transportePorDefecto = null;

/** Permite inyectar un transporte en pruebas automatizadas para inspeccionar correos. */
export function establecerTransporteCorreo(transporte) {
  transportePersonalizado = transporte;
}

export function restaurarTransporteCorreo() {
  transportePersonalizado = null;
}

function obtenerTransporte() {
  if (transportePersonalizado) return transportePersonalizado;
  if (!config.correo.habilitado) return null;
  if (!transportePorDefecto) {
    const opciones = {
      host: config.correo.host,
      port: config.correo.puerto,
      secure: config.correo.seguro,
      connectionTimeout: 5000,
      greetingTimeout: 5000
    };
    if (config.correo.usuario) {
      opciones.auth = {
        user: config.correo.usuario,
        pass: config.correo.password
      };
    }
    transportePorDefecto = nodemailer.createTransport(opciones);
  }
  return transportePorDefecto;
}

/**
 * Valida que el correo no sea temporal y que su dominio tenga registros MX válidos en DNS.
 */
export async function verificarDominioCorreo(email, { forzar = false, resolverMx = null } = {}) {
  const limpio = String(email || '').trim().toLowerCase();
  const partes = limpio.split('@');
  if (partes.length !== 2 || !partes[1]) {
    throw solicitudInvalida('Ingresa un correo electrónico válido.', [
      { campo: 'email', mensaje: 'Ingresa un correo electrónico válido.' }
    ]);
  }
  const dominio = partes[1];

  if (DOMINIOS_DESECHABLES.has(dominio)) {
    throw solicitudInvalida('No se permiten correos temporales o desechables. Usa un correo personal.', [
      { campo: 'email', mensaje: 'Usa un correo personal válido, no temporal.' }
    ]);
  }

  if (!forzar && !config.correo.verificarMx) {
    return { ok: true, omitido: true };
  }

  const buscarMx = resolverMx || ((dom) => dns.resolveMx(dom));
  try {
    const registros = await Promise.race([
      buscarMx(dominio),
      new Promise((_, reject) => {
        const err = new Error('DNS timeout');
        err.code = 'ETIMEOUT';
        setTimeout(() => reject(err), TIMEOUT_MX_MS).unref();
      })
    ]);

    const tieneMxValido =
      Array.isArray(registros) &&
      registros.some((r) => typeof r?.exchange === 'string' && r.exchange.trim() !== '' && r.exchange.trim() !== '.');

    if (!tieneMxValido) {
      throw solicitudInvalida(
        'El dominio del correo no existe o no puede recibir mensajes. Revisa que esté bien escrito.',
        [{ campo: 'email', mensaje: 'Este dominio de correo no recibe mensajes. Revisa si hay un error de dedo.' }]
      );
    }
    return { ok: true, registros: registros.length };
  } catch (err) {
    if (err.status === 400) throw err;
    if (['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'ENOTIMP', 'EREFUSED'].includes(err.code)) {
      throw solicitudInvalida(
        'El dominio del correo no existe o no puede recibir mensajes. Revisa que esté bien escrito.',
        [{ campo: 'email', mensaje: 'Este dominio de correo no existe o no recibe mensajes.' }]
      );
    }
    // Si el DNS local tardó demasiado o no hay red, no bloqueamos el registro injustamente.
    return { ok: true, advertencia: err.code || 'DNS_UNAVAILABLE' };
  }
}

export function escaparHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function construirPlantillaHtml({ preheader, titulo, cuerpoHtml, botonTexto, botonUrl, pieNota }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#FCEAE9;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1F1410;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escaparHtml(preheader || titulo)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FCEAE9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #F0D5D4;">
          <tr>
            <td style="background-color:#1F1410;padding:24px 28px;border-bottom:4px solid #E12927;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#FCEAE9;font-family:'Space Mono',monospace;font-weight:700;">
                CAFÉ MARFIL · URBAN BRUNCH DURANGO
              </div>
              <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;">
                ${escaparHtml(titulo)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.65;color:#1F1410;">
              ${cuerpoHtml}
              ${
                botonTexto && botonUrl
                  ? `<div style="margin:26px 0 18px 0;text-align:center;">
                      <a href="${escaparHtml(botonUrl)}" style="display:inline-block;background-color:#E12927;color:#FFFFFF;text-decoration:none;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:14px 28px;border-radius:10px;">
                        ${escaparHtml(botonTexto)}
                      </a>
                    </div>
                    <p style="margin:0;font-size:12px;color:#8E7A74;word-break:break-all;">
                      Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                      <a href="${escaparHtml(botonUrl)}" style="color:#E12927;">${escaparHtml(botonUrl)}</a>
                    </p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="background-color:#FFF7F6;padding:18px 28px;border-top:1px solid #F3DCD9;font-size:12px;color:#8E7A74;">
              <p style="margin:0 0 6px 0;">${escaparHtml(pieNota || 'Gracias por ser parte de Club Marfil en Durango.')}</p>
              <p style="margin:0;font-family:'Space Mono',monospace;font-size:11px;">Sucursal Porras (Matriz) · Sucursal Calvario · Durango, Dgo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function enviarCorreoSeguro({ para, asunto, texto, html }) {
  if (!para) return { enviado: false, motivo: 'sin_destinatario' };
  const transporte = obtenerTransporte();
  if (!transporte) return { enviado: false, motivo: 'deshabilitado' };
  try {
    const info = await transporte.sendMail({
      from: config.correo.remitente,
      to: para,
      subject: asunto,
      text: texto,
      html
    });
    return { enviado: true, messageId: info?.messageId || null };
  } catch (err) {
    if (!config.esProduccion) {
      console.warn(`[correo] No se pudo enviar "${asunto}" a ${para}: ${err.message}`);
    }
    return { enviado: false, error: err.message };
  }
}

export async function enviarVerificacionCorreo({ nombre, email, codigo }) {
  const saludo = escaparHtml(nombre || 'cliente');
  const codigoSeguro = escaparHtml(codigo || '');
  const html = construirPlantillaHtml({
    preheader: `Tu código de verificación Café Marfil es ${codigoSeguro}.`,
    titulo: 'Confirma tu identidad',
    cuerpoHtml: `
      <p style="margin:0 0 14px 0;">Hola <strong>${saludo}</strong>,</p>
      <p style="margin:0 0 18px 0;">Para activar tu cuenta de <strong>Club Marfil</strong> y poder iniciar sesión, ingresa el siguiente código de 6 dígitos en la aplicación:</p>
      <div style="background-color:#FCEAE9;border:2px solid #E12927;border-radius:14px;padding:22px 16px;text-align:center;margin:20px 0;">
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#8E7A74;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:8px;">CÓDIGO DE VERIFICACIÓN</div>
        <div style="font-size:34px;line-height:1;font-family:'Space Mono',monospace;font-weight:700;color:#E12927;letter-spacing:0.35em;padding-left:0.35em;">${codigoSeguro}</div>
      </div>
      <p style="margin:0;color:#6E5A52;font-size:13px;">Este código es válido por <strong>15 minutos</strong> y solo puede usarse una vez.</p>
    `,
    pieNota: 'Si no intentaste crear una cuenta en Café Marfil, puedes ignorar este correo.'
  });
  return enviarCorreoSeguro({
    para: email,
    asunto: `Tu código de verificación: ${codigo} · Café Marfil`,
    texto: `Hola ${nombre || ''},\n\nTu código de verificación de 6 dígitos para Café Marfil es: ${codigo}\n\nEste código es válido por 15 minutos y solo puede usarse una vez.\nSi no creaste esta cuenta, ignora este mensaje.`,
    html
  });
}

export async function enviarBienvenida({ nombre, email, codigoCliente }) {
  const saludo = escaparHtml(nombre || 'cliente');
  const codigo = escaparHtml(codigoCliente || '');
  const html = construirPlantillaHtml({
    preheader: 'Tu cuenta Club Marfil está verificada y lista para sumar sellos.',
    titulo: '¡Bienvenido a Club Marfil!',
    cuerpoHtml: `
      <p style="margin:0 0 14px 0;">Hola <strong>${saludo}</strong>,</p>
      <p style="margin:0 0 14px 0;">Tu correo quedó verificado con éxito. Ya puedes acumular sellos en cada visita y canjear tus beneficios en barra.</p>
      ${
        codigo
          ? `<div style="background-color:#FCEAE9;border:1px solid #F2B5B4;border-radius:12px;padding:16px;text-align:center;margin:18px 0;">
              <div style="font-size:11px;font-family:'Space Mono',monospace;color:#8E7A74;letter-spacing:0.12em;text-transform:uppercase;">TU CÓDIGO CLUB MARFIL</div>
              <div style="font-size:22px;font-family:'Space Mono',monospace;font-weight:700;color:#E12927;margin-top:4px;">${codigo}</div>
            </div>`
          : ''
      }
      <p style="margin:0;">¡Te esperamos con chilaquiles, frappés y juegos de mesa en cualquiera de nuestras sucursales!</p>
    `,
    botonTexto: 'Abrir Café Marfil',
    botonUrl: config.correo.appUrl
  });
  return enviarCorreoSeguro({
    para: email,
    asunto: '¡Tu cuenta Club Marfil ya está activa!',
    texto: `Hola ${nombre || ''},\n\nTu correo fue verificado con éxito. Tu código Club Marfil es: ${codigoCliente || ''}.\nEntra en ${config.correo.appUrl}`,
    html
  });
}

export async function enviarRecuperacionPassword({ nombre, email, enlace }) {
  const saludo = escaparHtml(nombre || 'cliente');
  const html = construirPlantillaHtml({
    preheader: 'Solicitud para restablecer tu contraseña de Café Marfil.',
    titulo: 'Restablece tu contraseña',
    cuerpoHtml: `
      <p style="margin:0 0 14px 0;">Hola <strong>${saludo}</strong>,</p>
      <p style="margin:0 0 14px 0;">Recibimos una solicitud para cambiar la contraseña de tu cuenta en Café Marfil. Haz clic en el botón de abajo para elegir una nueva contraseña.</p>
      <p style="margin:0;color:#6E5A52;font-size:13px;">Este enlace caduca en <strong>1 hora</strong> y al cambiar tu contraseña cerraremos las sesiones anteriores por seguridad.</p>
    `,
    botonTexto: 'Crear nueva contraseña',
    botonUrl: enlace,
    pieNota: 'Si tú no solicitaste restablecer tu contraseña, ignora este correo; tu cuenta sigue segura.'
  });
  return enviarCorreoSeguro({
    para: email,
    asunto: 'Restablece tu contraseña de Café Marfil',
    texto: `Hola ${nombre || ''},\n\nRestablece tu contraseña de Café Marfil en este enlace (válido 1 hora):\n${enlace}\n\nSi no lo solicitaste, ignora este mensaje.`,
    html
  });
}

export async function enviarConfirmacionReservacion({
  email,
  nombre,
  folio,
  sucursalNombre,
  fechaTexto,
  horaTexto,
  personas,
  tipoNombre,
  tokenQR
}) {
  const html = construirPlantillaHtml({
    preheader: `Tu reservación ${folio} en Café Marfil está confirmada.`,
    titulo: '¡Reservación confirmada!',
    cuerpoHtml: `
      <p style="margin:0 0 14px 0;">Hola <strong>${escaparHtml(nombre)}</strong>,</p>
      <p style="margin:0 0 16px 0;">Tu lugar en <strong>Café Marfil</strong> está apartado. Aquí tienes los detalles:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF7F6;border:1px solid #F2CBC9;border-radius:12px;padding:16px;margin-bottom:16px;">
        <tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Folio:</td><td style="padding:4px 0;font-size:14px;font-weight:700;color:#E12927;font-family:'Space Mono',monospace;text-align:right;">${escaparHtml(folio)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Sucursal:</td><td style="padding:4px 0;font-size:14px;font-weight:700;text-align:right;">${escaparHtml(sucursalNombre)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Fecha y hora:</td><td style="padding:4px 0;font-size:14px;font-weight:700;text-align:right;">${escaparHtml(fechaTexto)} · ${escaparHtml(horaTexto)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Personas:</td><td style="padding:4px 0;font-size:14px;font-weight:700;text-align:right;">${escaparHtml(personas)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Experiencia:</td><td style="padding:4px 0;font-size:14px;font-weight:700;text-align:right;">${escaparHtml(tipoNombre)}</td></tr>
        ${tokenQR ? `<tr><td style="padding:4px 0;font-size:13px;color:#8E7A74;">Código pase:</td><td style="padding:4px 0;font-size:12px;font-weight:700;font-family:'Space Mono',monospace;text-align:right;">${escaparHtml(tokenQR)}</td></tr>` : ''}
      </table>
      <p style="margin:0;font-size:13px;color:#6E5A52;">Presenta tu folio en recepción al llegar. ¡Te esperamos!</p>
    `,
    botonTexto: 'Ver mis reservaciones',
    botonUrl: config.correo.appUrl
  });
  return enviarCorreoSeguro({
    para: email,
    asunto: `Reservación confirmada ${folio} · Café Marfil`,
    texto: `Hola ${nombre},\n\nTu reservación ${folio} está confirmada.\nSucursal: ${sucursalNombre}\nFecha: ${fechaTexto} · ${horaTexto}\nPersonas: ${personas}\nExperiencia: ${tipoNombre}\nCódigo: ${tokenQR || folio}`,
    html
  });
}

export async function enviarCancelacionReservacion({
  email,
  nombre,
  folio,
  sucursalNombre,
  fechaTexto,
  horaTexto
}) {
  const html = construirPlantillaHtml({
    preheader: `Tu reservación ${folio} fue cancelada.`,
    titulo: 'Reservación cancelada',
    cuerpoHtml: `
      <p style="margin:0 0 14px 0;">Hola <strong>${escaparHtml(nombre)}</strong>,</p>
      <p style="margin:0 0 14px 0;">Te confirmamos que la reservación <strong style="color:#E12927;font-family:'Space Mono',monospace;">${escaparHtml(folio)}</strong> para el <strong>${escaparHtml(fechaTexto)}</strong> a las <strong>${escaparHtml(horaTexto)}</strong> en <strong>${escaparHtml(sucursalNombre)}</strong> fue cancelada.</p>
      <p style="margin:0;font-size:13px;color:#6E5A52;">Cuando gustes, puedes agendar una nueva fecha desde nuestra app.</p>
    `,
    botonTexto: 'Hacer nueva reservación',
    botonUrl: config.correo.appUrl
  });
  return enviarCorreoSeguro({
    para: email,
    asunto: `Reservación cancelada ${folio} · Café Marfil`,
    texto: `Hola ${nombre},\n\nTu reservación ${folio} del ${fechaTexto} a las ${horaTexto} en ${sucursalNombre} fue cancelada.`,
    html
  });
}
