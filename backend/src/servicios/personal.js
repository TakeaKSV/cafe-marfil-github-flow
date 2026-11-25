import crypto from 'node:crypto';
import { config } from '../config.js';
import { enTransaccion, bloquearFila } from '../db/conexion.js';
import { cifrarPassword, verificarPassword } from '../utils/password.js';
import * as repo from '../repositorios/personal.js';
import * as repoInv from '../repositorios/invitacionesPersonal.js';
import { conflicto, noAutenticado, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit } from '../repositorios/base.js';
import { enviarInvitacionPersonal, verificarDominioCorreo } from './correo.js';
import { exigirSucursal } from './sucursales.js';

const ROLES_CON_ACCESO = ['admin', 'gerente', 'host'];
const VIGENCIA_INVITACION_MS = 12 * 60 * 60 * 1000; // 12 horas
const hashToken = (tokenPlano) => crypto.createHash('sha256').update(String(tokenPlano)).digest('hex');

function aInvitacion(fila) {
  return {
    id: fila.id,
    email: fila.email,
    rol: fila.rol,
    puesto: fila.puesto,
    sucursalId: fila.sucursal_id,
    sucursalNombre: fila.sucursal_nombre,
    invitadoPor: fila.invitado_por_nombre,
    expiraEn: fila.expira_en,
    creadoEn: fila.creado_en
  };
}

function aPersona(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    rol: fila.rol,
    puesto: fila.puesto,
    sucursalId: fila.sucursal_id,
    sucursalNombre: fila.sucursal_nombre,
    estado: fila.estado,
    turnoInicio: fila.turno_inicio,
    turnoFin: fila.turno_fin,
    turno: fila.turno_inicio && fila.turno_fin ? `${fila.turno_inicio} - ${fila.turno_fin}` : null,
    esEncargado: fila.es_encargado === 1,
    tieneAcceso: Boolean(fila.password_hash) && ROLES_CON_ACCESO.includes(fila.rol)
  };
}

export async function listarPersonal(filtros = {}) {
  return (await repo.listar(filtros)).map(aPersona);
}

export async function obtenerPersona(id) {
  const fila = await repo.porId(id);
  if (!fila) throw noEncontrado('No existe esa persona en el equipo.');
  return aPersona(fila);
}

async function exigirEmailLibre(email, exceptoId = 0) {
  if (!email) return;
  const existe = await repo.emailEnUso(email, exceptoId);
  if (existe) throw conflicto(`Ya hay una persona registrada con el correo ${email}.`);
}

export async function crearPersona(datos) {
  if (datos.sucursalId) await exigirSucursal(datos.sucursalId);
  if (ROLES_CON_ACCESO.includes(datos.rol) && !(datos.email && datos.password)) {
    throw solicitudInvalida(`El rol "${datos.rol}" entra al panel: necesita correo y contraseña.`);
  }
  await exigirEmailLibre(datos.email);

  const { id } = await repo.insertarPersona({
    nombre: datos.nombre,
    email: datos.email ?? null,
    passwordHash: datos.password ? await cifrarPassword(datos.password) : null,
    rol: datos.rol,
    puesto: datos.puesto,
    sucursalId: datos.sucursalId ?? null,
    turnoInicio: datos.turnoInicio ?? null,
    turnoFin: datos.turnoFin ?? null,
    estado: datos.estado,
    esEncargado: aBit(datos.esEncargado),
    creadoEn: ahoraISO()
  });
  return obtenerPersona(id);
}

export async function actualizarPersona(id, cambios) {
  return enTransaccion(async () => {
    await bloquearFila('personal', id);

    const actual = await repo.porId(id);
    if (!actual) throw noEncontrado('No existe esa persona en el equipo.');
    const email = cambios.email === undefined ? actual.email : cambios.email;
    if (
      ROLES_CON_ACCESO.includes(cambios.rol ?? actual.rol) &&
      !(email && (cambios.password || actual.password_hash))
    ) {
      throw solicitudInvalida('Un rol con acceso necesita correo y contraseña.');
    }
    if (cambios.sucursalId) await exigirSucursal(cambios.sucursalId);
    await exigirEmailLibre(cambios.email, id);

    await repo.actualizarPersonal(id, {
      ...cambios,
      passwordHash: cambios.password ? await cifrarPassword(cambios.password) : undefined
    });

    return obtenerPersona(id);
  });
}

/** Devuelve la persona si las credenciales son correctas; si no, lanza 401. */
export async function autenticarStaff(email, password) {
  const fila = await repo.porEmail(email);
  const coincide = await verificarPassword(password, fila?.password_hash);
  const valido = coincide && ROLES_CON_ACCESO.includes(fila.rol);
  // Mismo mensaje exista o no el correo: no revelamos qué cuentas hay.
  if (!valido) throw noAutenticado('Correo o contraseña incorrectos.');
  return { usuario: aPersona(fila), version: fila.session_version };
}

// --------------------------------------------------------------------------
// Invitaciones por correo (vigencia 12 horas)
// --------------------------------------------------------------------------

export async function listarInvitacionesPendientes() {
  return (await repoInv.listarPendientes(ahoraISO())).map(aInvitacion);
}

export async function invitarPersona({ email, rol = 'host', puesto = 'Colaborador', sucursalId = null }, adminId = null) {
  const correo = String(email || '').trim().toLowerCase();
  await verificarDominioCorreo(correo);
  await exigirEmailLibre(correo);
  if (sucursalId) await exigirSucursal(sucursalId);

  const tokenPlano = crypto.randomBytes(32).toString('hex');
  const ahora = ahoraISO();
  const expiraEn = new Date(Date.now() + VIGENCIA_INVITACION_MS).toISOString();

  await repoInv.invalidarPorEmail(correo, ahora);
  const { id } = await repoInv.crear({
    email: correo,
    rol,
    puesto: puesto.trim() || 'Colaborador',
    sucursalId: sucursalId ?? null,
    tokenHash: hashToken(tokenPlano),
    invitadoPor: adminId,
    expiraEn,
    creadoEn: ahora
  });

  const fila = await repoInv.porId(id);
  const enlace = `${config.correo.adminUrl}/?invitacion=${tokenPlano}`;
  const resultadoCorreo = await enviarInvitacionPersonal({
    email: fila.email,
    rol: fila.rol,
    puesto: fila.puesto,
    sucursalNombre: fila.sucursal_nombre,
    invitadoPorNombre: fila.invitado_por_nombre,
    enlace
  });

  return {
    invitacion: aInvitacion(fila),
    correoEnviado: resultadoCorreo.enviado
  };
}

export async function cancelarInvitacion(id) {
  const eliminadas = await repoInv.eliminar(id);
  if (!eliminadas) throw noEncontrado('No existe esa invitación.');
}

async function exigirInvitacionValida(tokenPlano) {
  if (!tokenPlano || typeof tokenPlano !== 'string' || tokenPlano.length < 32) {
    throw solicitudInvalida('El enlace de invitación no es válido.');
  }
  const fila = await repoInv.porHash(hashToken(tokenPlano));
  if (!fila) throw solicitudInvalida('El enlace de invitación no es válido o fue cancelado.');
  if (fila.usado_en) throw solicitudInvalida('Esta invitación ya fue utilizada.');
  if (new Date(fila.expira_en).getTime() < Date.now()) {
    throw solicitudInvalida('Esta invitación expiró (vigencia de 12 horas). Pide al administrador una nueva.');
  }
  return fila;
}

export async function consultarInvitacion(tokenPlano) {
  const fila = await exigirInvitacionValida(tokenPlano);
  return aInvitacion(fila);
}

export async function completarInvitacion({ token, nombre, password, puesto, turnoInicio = null, turnoFin = null }) {
  const invitacion = await exigirInvitacionValida(token);
  const passwordHash = await cifrarPassword(password);

  const persona = await enTransaccion(async () => {
    await bloquearFila('invitaciones_personal', invitacion.id);
    const actual = await repoInv.porId(invitacion.id);
    if (!actual || actual.usado_en || new Date(actual.expira_en).getTime() < Date.now()) {
      throw solicitudInvalida('Esta invitación ya fue utilizada o expiró.');
    }
    await exigirEmailLibre(actual.email);

    const ahora = ahoraISO();
    const { id } = await repo.insertarPersona({
      nombre: nombre.trim(),
      email: actual.email,
      passwordHash,
      rol: actual.rol,
      puesto: (puesto && puesto.trim()) || actual.puesto,
      sucursalId: actual.sucursal_id ?? null,
      turnoInicio: turnoInicio || null,
      turnoFin: turnoFin || null,
      estado: 'activo',
      esEncargado: 0,
      creadoEn: ahora
    });

    await repoInv.marcarUsada(actual.id, ahora);
    return obtenerPersona(id);
  });

  return {
    usuario: persona,
    tieneAcceso: ROLES_CON_ACCESO.includes(persona.rol)
  };
}
