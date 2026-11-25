// Clientes y Club Marfil: cuentas de la PWA, pasaporte de sellos y beneficios.

import crypto from 'node:crypto';
import { cifrarPassword, verificarPassword } from '../utils/password.js';
import { config } from '../config.js';
import { bloquearFila, enTransaccion } from '../db/conexion.js';
import * as repo from '../repositorios/clientes.js';
import * as repoTokens from '../repositorios/tokensCorreo.js';
import { codigoUnico, generarCodigoBeneficio, generarCodigoClub, leerJSON } from '../utils/codigos.js';
import { HttpError, conflicto, noAutenticado, noEncontrado, sinPermiso, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO, fechaEnFrase, hoyLocal } from '../utils/fechas.js';
import { dividirNombreCompleto, resolverNombrePartes } from '../utils/nombres.js';

import { crearNotificacion, registrarEscaneo } from './bitacora.js';
import {
  enviarBienvenida,
  enviarRecuperacionPassword,
  enviarVerificacionCorreo,
  verificarDominioCorreo
} from './correo.js';
import { exigirSucursal } from './sucursales.js';

// recompensa_nombre: premio del pasaporte que el cliente ya ganó y aún no canjea.

function nivelPorVisitas(visitas) {
  if (visitas >= 20) return 'Marfil VIP';
  if (visitas >= 5) return 'Café Lover';
  return 'Explorador';
}

function aCliente(fila) {
  const partes = fila.nombres
    ? {
        nombres: fila.nombres,
        apellidoPaterno: fila.apellido_paterno ?? '',
        apellidoMaterno: fila.apellido_materno ?? ''
      }
    : dividirNombreCompleto(fila.nombre);
  return {
    id: fila.id,
    codigoCliente: fila.codigo_club,
    nombre: fila.nombre,
    nombres: partes.nombres,
    apellidoPaterno: partes.apellidoPaterno,
    apellidoMaterno: partes.apellidoMaterno,
    primerNombre: (partes.nombres || fila.nombre).split(' ')[0],
    email: fila.email,
    telefono: fila.telefono,
    ciudad: fila.ciudad,
    nivel: nivelPorVisitas(fila.visitas_totales),
    sellosActuales: fila.sellos_actuales,
    sellosMeta: fila.sellos_meta,
    puntos: fila.puntos,
    visitasTotales: fila.visitas_totales,
    recompensaDisponible: fila.recompensa_nombre !== null,
    recompensaNombre: fila.recompensa_nombre,
    ultimaVisita: fila.ultima_visita,
    sucursalHabitualId: fila.sucursal_habitual_id,
    sucursalHabitual: fila.sucursal_habitual,
    preferencias: leerJSON(fila.preferencias, {}),
    tieneCuenta: Boolean(fila.password_hash),
    emailVerificado: Boolean(fila.email_verificado_en)
  };
}

// --------------------------------------------------------------------------
// Consulta y alta
// --------------------------------------------------------------------------

export async function listarClientes(filtros = {}) {
  return (await repo.listar(filtros)).map(aCliente);
}

export async function obtenerCliente(id) {
  const fila = await repo.porId(id);
  if (!fila) throw noEncontrado('No existe ese cliente.');
  return aCliente(fila);
}

export async function buscarClientePorCodigo(codigo) {
  const fila = await repo.porCodigo(String(codigo).trim().toUpperCase());
  return fila ? aCliente(fila) : null;
}

export async function obtenerClientePorCodigo(codigo) {
  const cliente = await buscarClientePorCodigo(codigo);
  if (!cliente) throw noEncontrado(`No existe un pasaporte Club Marfil con el código ${codigo}.`);
  return cliente;
}

/** Alta de cliente. Con `password` crea cuenta para la PWA; sin ella es un alta en caja. */
export async function registrarCliente(datos) {
  if (datos.sucursalHabitualId) await exigirSucursal(datos.sucursalHabitualId);
  if (datos.email) {
    await verificarDominioCorreo(datos.email);
    if (await repo.emailExiste(datos.email)) {
      throw conflicto('Ya existe una cuenta con ese correo.');
    }
  }

  const nombrePartes = resolverNombrePartes(datos);
  const codigo = await codigoUnico(generarCodigoClub, (c) => repo.codigoExiste(c));
  const { id } = await repo.insertarCliente({
    codigo,
    nombre: nombrePartes.nombre,
    nombres: nombrePartes.nombres,
    apellidoPaterno: nombrePartes.apellidoPaterno,
    apellidoMaterno: nombrePartes.apellidoMaterno,
    email: datos.email ?? null,
    telefono: datos.telefono ?? null,
    passwordHash: datos.password ? await cifrarPassword(datos.password) : null,
    ciudad: datos.ciudad ?? null,
    sucursalHabitualId: datos.sucursalHabitualId ?? null,
    creadoEn: ahoraISO()
  });
  return obtenerCliente(id);
}

const hashToken = (tokenPlano) => crypto.createHash('sha256').update(String(tokenPlano)).digest('hex');

export async function emitirVerificacionCorreo(clienteId) {
  const cliente = await obtenerCliente(clienteId);
  if (!cliente.email) throw solicitudInvalida('Esta cuenta no tiene un correo registrado.');
  const codigo = String(crypto.randomInt(100000, 1000000));
  const ahora = ahoraISO();
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await repoTokens.invalidarPendientes(cliente.id, 'verificacion', ahora);
  await repoTokens.crear({
    clienteId: cliente.id,
    tokenHash: hashToken(`${cliente.id}:${codigo}`),
    tipo: 'verificacion',
    expiraEn,
    creadoEn: ahora
  });

  const resultado = await enviarVerificacionCorreo({
    nombre: cliente.nombre,
    email: cliente.email,
    codigo
  });
  return { enviado: resultado.enviado, cliente };
}

export async function verificarCodigoCorreo(email, codigo) {
  const codigoLimpio = String(codigo || '').trim();
  if (!/^\d{6}$/.test(codigoLimpio)) {
    throw solicitudInvalida('Ingresa el código de 6 dígitos que enviamos a tu correo.');
  }
  const filaCliente = await repo.porEmail(String(email || '').trim().toLowerCase());
  if (!filaCliente) {
    throw solicitudInvalida('El código de verificación no es válido o ya expiró.');
  }
  const hash = hashToken(`${filaCliente.id}:${codigoLimpio}`);
  const registro = await repoTokens.porHash(hash);
  if (!registro || registro.tipo !== 'verificacion' || registro.cliente_id !== filaCliente.id) {
    throw solicitudInvalida('El código de verificación es incorrecto.');
  }
  if (registro.usado_en) {
    throw solicitudInvalida('Este código de verificación ya fue utilizado.');
  }
  if (new Date(registro.expira_en).getTime() < Date.now()) {
    throw solicitudInvalida('El código expiró. Solicita un nuevo código de 6 dígitos.');
  }

  const cliente = await enTransaccion(async () => {
    await bloquearFila('tokens_correo', registro.id);
    const actual = await repoTokens.porHash(hash);
    if (!actual || actual.usado_en) {
      throw solicitudInvalida('Este código de verificación ya fue utilizado.');
    }
    const ahora = ahoraISO();
    await repoTokens.marcarUsado(actual.id, ahora);
    await repo.marcarEmailVerificado(actual.cliente_id, ahora);
    return obtenerCliente(actual.cliente_id);
  });

  await enviarBienvenida({
    nombre: cliente.nombre,
    email: cliente.email,
    codigoCliente: cliente.codigoCliente
  });
  return { cliente, version: filaCliente.session_version };
}

export async function reenviarCodigoPorEmail(email) {
  const fila = await repo.porEmail(String(email || '').trim().toLowerCase());
  if (!fila || !fila.password_hash) return { yaVerificado: false, enviado: false };
  if (fila.email_verificado_en) return { yaVerificado: true, enviado: false };
  const { enviado } = await emitirVerificacionCorreo(fila.id);
  return { yaVerificado: false, enviado };
}

export async function verificarCorreoPorToken(tokenPlano) {
  if (!tokenPlano || typeof tokenPlano !== 'string' || tokenPlano.length < 32) {
    throw solicitudInvalida('El enlace de verificación no es válido o está incompleto.');
  }
  const registro = await repoTokens.porHash(hashToken(tokenPlano));
  if (!registro || registro.tipo !== 'verificacion') {
    throw solicitudInvalida('El enlace de verificación no es válido o ya no existe.');
  }
  if (registro.usado_en) {
    throw solicitudInvalida('Este enlace de verificación ya fue utilizado.');
  }
  if (new Date(registro.expira_en).getTime() < Date.now()) {
    throw solicitudInvalida('El enlace de verificación expiró. Solicita uno nuevo desde tu perfil.');
  }

  const cliente = await enTransaccion(async () => {
    await bloquearFila('tokens_correo', registro.id);
    const actual = await repoTokens.porHash(hashToken(tokenPlano));
    if (!actual || actual.usado_en) {
      throw solicitudInvalida('Este enlace de verificación ya fue utilizado.');
    }
    const ahora = ahoraISO();
    await repoTokens.marcarUsado(actual.id, ahora);
    await repo.marcarEmailVerificado(actual.cliente_id, ahora);
    return obtenerCliente(actual.cliente_id);
  });

  await enviarBienvenida({
    nombre: cliente.nombre,
    email: cliente.email,
    codigoCliente: cliente.codigoCliente
  });
  return cliente;
}

export async function reenviarVerificacionCorreo(clienteId) {
  const cliente = await obtenerCliente(clienteId);
  if (!cliente.email) throw solicitudInvalida('Tu cuenta no tiene un correo electrónico asociado.');
  if (cliente.emailVerificado) {
    return { yaVerificado: true, enviado: false };
  }
  const { enviado } = await emitirVerificacionCorreo(cliente.id);
  return { yaVerificado: false, enviado };
}

export async function solicitarRecuperacionPassword(email) {
  const fila = await repo.porEmail(email);
  if (!fila || !fila.password_hash) return { enviado: false };

  const tokenPlano = crypto.randomBytes(32).toString('hex');
  const ahora = ahoraISO();
  const expiraEn = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await repoTokens.invalidarPendientes(fila.id, 'recuperacion', ahora);
  await repoTokens.crear({
    clienteId: fila.id,
    tokenHash: hashToken(tokenPlano),
    tipo: 'recuperacion',
    expiraEn,
    creadoEn: ahora
  });

  const enlace = `${config.correo.appUrl}/?restablecer=${tokenPlano}`;
  const resultado = await enviarRecuperacionPassword({
    nombre: fila.nombre,
    email: fila.email,
    enlace
  });
  return { enviado: resultado.enviado };
}

export async function restablecerPasswordPorToken(tokenPlano, nuevaPassword) {
  if (!tokenPlano || typeof tokenPlano !== 'string' || tokenPlano.length < 32) {
    throw solicitudInvalida('El enlace de recuperación no es válido.');
  }
  const registro = await repoTokens.porHash(hashToken(tokenPlano));
  if (!registro || registro.tipo !== 'recuperacion') {
    throw solicitudInvalida('El enlace de recuperación no es válido o ya no existe.');
  }
  if (registro.usado_en) {
    throw solicitudInvalida('Este enlace de recuperación ya fue utilizado.');
  }
  if (new Date(registro.expira_en).getTime() < Date.now()) {
    throw solicitudInvalida('El enlace de recuperación expiró. Solicita uno nuevo.');
  }

  const passwordHash = await cifrarPassword(nuevaPassword);
  await enTransaccion(async () => {
    await bloquearFila('tokens_correo', registro.id);
    const actual = await repoTokens.porHash(hashToken(tokenPlano));
    if (!actual || actual.usado_en) {
      throw solicitudInvalida('Este enlace de recuperación ya fue utilizado.');
    }
    await repoTokens.marcarUsado(actual.id, ahoraISO());
    await repo.actualizarPassword(actual.cliente_id, passwordHash);
  });
  return { ok: true };
}

export async function autenticarCliente(email, password) {
  const fila = await repo.porEmail(email);
  const valido = await verificarPassword(password, fila?.password_hash);
  if (!valido) throw noAutenticado('Correo o contraseña incorrectos.');
  if (!fila.email_verificado_en) {
    throw new HttpError(
      403,
      'Debes confirmar tu correo con el código de 6 dígitos antes de iniciar sesión.',
      [{ campo: 'verificacion', mensaje: 'requiere_verificacion' }]
    );
  }
  return { cliente: aCliente(fila), version: fila.session_version };
}

export async function actualizarPerfil(id, cambios) {
  let cambioEmail = false;
  if (cambios.email) {
    await verificarDominioCorreo(cambios.email);
  }
  const actualizado = await enTransaccion(async () => {
    await bloquearFila('clientes', id);

    const actual = await obtenerCliente(id);
    if (cambios.email && cambios.email !== actual.email) {
      if (await repo.emailEnUso(cambios.email, id)) {
        throw conflicto('Ese correo ya está en uso por otra cuenta.');
      }
      cambioEmail = true;
    }
    if (cambios.sucursalHabitualId) await exigirSucursal(cambios.sucursalHabitualId);

    // Las preferencias se mezclan con las existentes en lugar de reemplazarlas.
    const preferencias = cambios.preferencias
      ? JSON.stringify({ ...actual.preferencias, ...cambios.preferencias })
      : undefined;

    const nombrePartes = resolverNombrePartes(cambios, actual);
    await repo.actualizarClientes(id, {
      ...cambios,
      ...nombrePartes,
      preferencias,
      ...(cambioEmail ? { emailVerificadoEn: null } : {})
    });

    return obtenerCliente(id);
  });

  if (cambioEmail && actualizado.email) {
    await emitirVerificacionCorreo(id).catch(() => {});
  }
  return actualizado;
}

// --------------------------------------------------------------------------
// Pasaporte de sellos
// --------------------------------------------------------------------------

/**
 * Suma un sello por visita. Al llegar a la meta se genera el beneficio de
 * recompensa; mientras no lo canjee, las visitas siguen dando puntos pero el
 * pasaporte se queda lleno (igual que en el panel).
 */
export function sumarSello(codigo, { sucursalId = null, personalId = null } = {}) {
  return enTransaccion(async () => {
    const { id } = await obtenerClientePorCodigo(codigo);
    await bloquearFila('clientes', id);
    const cliente = await obtenerCliente(id); // se vuelve a leer ya con la fila bloqueada
    if (sucursalId) await exigirSucursal(sucursalId);

    const yaEstabaLleno = cliente.sellosActuales >= cliente.sellosMeta;
    const sellos = yaEstabaLleno ? cliente.sellosMeta : cliente.sellosActuales + 1;
    const completoAhora = !yaEstabaLleno && sellos >= cliente.sellosMeta;
    const ahora = ahoraISO();

    await repo.acreditarVisita(sellos, config.puntosPorSello, ahora, cliente.id);

    await repo.registrarVisita({
      clienteId: cliente.id,
      sellos: yaEstabaLleno ? 0 : 1,
      puntos: config.puntosPorSello,
      descripcion: `Sello por visita (${sellos}/${cliente.sellosMeta})`,
      sucursalId: sucursalId,
      personalId: personalId,
      creadoEn: ahora
    });

    if (completoAhora) {
      await otorgarBeneficio(cliente.id, {
        titulo: config.recompensaSellos,
        subtitulo: `Premio por completar tus ${cliente.sellosMeta} sellos de visita`,
        origen: 'sellos'
      });
    }

    await registrarEscaneo({
      codigo: cliente.codigoCliente,
      tipo: 'club',
      descripcion: `${cliente.nombre} · ${sellos}/${cliente.sellosMeta} sellos`,
      resultado: completoAhora ? '¡Pasaporte completado!' : `Sello acreditado (+${config.puntosPorSello} pts)`,
      personalId
    });

    return { cliente: await obtenerCliente(cliente.id), pasaporteCompletado: completoAhora };
  });
}

// --------------------------------------------------------------------------
// Beneficios
// --------------------------------------------------------------------------

function aBeneficio(fila) {
  const vencido = fila.estado === 'disponible' && fila.vence_en !== null && fila.vence_en < hoyLocal();
  return {
    id: fila.id,
    codigo: fila.codigo,
    titulo: fila.titulo,
    subtitulo: fila.subtitulo,
    icono: fila.icono,
    origen: fila.origen,
    estado: vencido ? 'vencido' : fila.estado, // disponible | usado | vencido
    venceEn: fila.vence_en,
    vigencia: fila.vence_en ? `Vence el ${fechaEnFrase(fila.vence_en)}` : 'Sin fecha de vencimiento',
    usadoEn: fila.usado_en
  };
}

export async function otorgarBeneficio(
  clienteId,
  { titulo, subtitulo = null, icono = 'Gift', origen = 'manual', venceEn = null }
) {
  const codigo = await codigoUnico(generarCodigoBeneficio, (c) => repo.beneficioExiste(c));
  const { id } = await repo.insertarBeneficio({
    clienteId: clienteId,
    codigo: codigo,
    titulo: titulo,
    subtitulo: subtitulo,
    icono: icono,
    origen: origen,
    venceEn: venceEn,
    creadoEn: ahoraISO()
  });

  await crearNotificacion(clienteId, {
    titulo: '¡Nuevo beneficio disponible!',
    mensaje: `Desbloqueaste "${titulo}". Muestra el código ${codigo} en caja para canjearlo.`,
    tipo: 'beneficio',
    screenDestino: 'beneficios'
  });
  return aBeneficio(await repo.beneficioPorId(id));
}

/**
 * Beneficios del cliente para la PWA. Si todavía no completa su pasaporte se
 * agrega al final la recompensa "bloqueada" con su avance.
 */
export async function listarBeneficios(clienteId) {
  const cliente = await obtenerCliente(clienteId);
  const filas = await repo.beneficiosDeCliente(clienteId);
  const beneficios = filas.map(aBeneficio);

  if (!cliente.recompensaDisponible) {
    beneficios.push({
      id: null,
      codigo: null,
      titulo: config.recompensaSellos,
      subtitulo: `Se desbloquea al completar tus ${cliente.sellosMeta} sellos de visita`,
      icono: 'Gift',
      origen: 'sellos',
      estado: 'bloqueado',
      progreso: `${cliente.sellosActuales} de ${cliente.sellosMeta} sellos completados`
    });
  }
  return beneficios;
}

export async function buscarBeneficioPorCodigo(codigo) {
  const fila = await repo.beneficioPorCodigo(String(codigo).trim().toUpperCase());
  return fila
    ? {
        ...aBeneficio(fila),
        clienteNombre: fila.cliente_nombre,
        codigoCliente: fila.codigo_club,
        clienteId: fila.cliente_id
      }
    : null;
}

/** Canjea un beneficio en caja. Si es la recompensa del pasaporte, lo reinicia a 0 sellos. */
export function canjearBeneficio(codigo, { personalId = null } = {}) {
  return enTransaccion(async () => {
    const encontrado = await buscarBeneficioPorCodigo(codigo);
    if (!encontrado) throw noEncontrado(`No existe un beneficio con el código ${codigo}.`);
    await bloquearFila('clientes', encontrado.clienteId);
    await bloquearFila('beneficios', encontrado.id);
    const clienteActual = await obtenerCliente(encontrado.clienteId);
    if (clienteActual.tieneCuenta && clienteActual.email && !clienteActual.emailVerificado) {
      throw sinPermiso('El cliente debe verificar su correo electrónico antes de canjear beneficios.');
    }
    const beneficio = await buscarBeneficioPorCodigo(codigo); // estado real, ya con la fila bloqueada

    if (beneficio.estado === 'usado') throw conflicto('Este beneficio ya fue canjeado.');
    if (beneficio.estado === 'vencido') throw conflicto(`Este beneficio venció el ${fechaEnFrase(beneficio.venceEn)}.`);

    const ahora = ahoraISO();
    await repo.usarBeneficio(ahora, beneficio.id);

    if (beneficio.origen === 'sellos') {
      await repo.reiniciarPasaporte(beneficio.clienteId);
      await repo.registrarCanjeRecompensa({
        clienteId: beneficio.clienteId,
        descripcion: `Canjeó: ${beneficio.titulo}. Nuevo pasaporte en 0 sellos.`,
        personalId: personalId,
        creadoEn: ahora
      });
    }

    await registrarEscaneo({
      codigo: beneficio.codigo,
      tipo: 'beneficio',
      descripcion: `${beneficio.clienteNombre} canjeó ${beneficio.titulo}`,
      resultado: beneficio.origen === 'sellos' ? 'Premio entregado · Nuevo pasaporte' : 'Beneficio entregado',
      personalId
    });

    return { beneficio: await buscarBeneficioPorCodigo(codigo), cliente: await obtenerCliente(beneficio.clienteId) };
  });
}

/** Atajo del panel: canjea la recompensa de pasaporte pendiente de un cliente. */
export async function canjearRecompensa(codigoCliente, opciones) {
  const cliente = await obtenerClientePorCodigo(codigoCliente);
  const pendiente = await repo.recompensaPendiente(cliente.id);
  if (!pendiente) throw conflicto(`${cliente.nombre} no tiene una recompensa de pasaporte por canjear.`);
  return canjearBeneficio(pendiente.codigo, opciones);
}

// --------------------------------------------------------------------------
// Notificaciones de la PWA
// --------------------------------------------------------------------------

export async function listarNotificaciones(clienteId) {
  const filas = await repo.notificaciones(clienteId);
  return filas.map((fila) => ({
    id: fila.id,
    titulo: fila.titulo,
    mensaje: fila.mensaje,
    tipo: fila.tipo,
    leida: fila.leida === 1,
    screenDestino: fila.screen_destino,
    fechaHora: fila.creado_en
  }));
}

/** Marca como leída una notificación, o todas si no se pasa id. */
export async function marcarNotificacionesLeidas(clienteId, notificacionId) {
  if (notificacionId === undefined) {
    await repo.leerTodas(clienteId);
  } else {
    const { afectadas } = await repo.leerNotificacion(notificacionId, clienteId);
    if (!afectadas) throw noEncontrado('No existe esa notificación.');
  }
  return listarNotificaciones(clienteId);
}
