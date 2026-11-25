import { enTransaccion, bloquearFila } from '../db/conexion.js';
import { cifrarPassword, verificarPassword } from '../utils/password.js';
import * as repo from '../repositorios/personal.js';
import { conflicto, noAutenticado, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit } from '../repositorios/base.js';
import { exigirSucursal } from './sucursales.js';

const ROLES_CON_ACCESO = ['admin', 'gerente', 'host'];

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
