import bcrypt from 'bcryptjs';
import { db } from '../db/conexion.js';
import { conflicto, noAutenticado, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit, armarUpdate } from '../utils/sql.js';
import { exigirSucursal } from './sucursales.js';

const ROLES_CON_ACCESO = ['admin', 'gerente', 'host'];

const SQL_PERSONAL = `
  SELECT p.*, s.nombre AS sucursal_nombre
  FROM personal p LEFT JOIN sucursales s ON s.id = p.sucursal_id`;

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

export async function listarPersonal({ sucursalId, estado } = {}) {
  const filtros = [];
  const valores = {};
  if (sucursalId) {
    filtros.push('p.sucursal_id = :sucursalId');
    valores.sucursalId = sucursalId;
  }
  if (estado) {
    filtros.push('p.estado = :estado');
    valores.estado = estado;
  } else {
    filtros.push("p.estado <> 'inactivo'");
  }
  const filas = await db.todos(
    `${SQL_PERSONAL} WHERE ${filtros.join(' AND ')} ORDER BY p.sucursal_id, p.nombre`,
    valores
  );
  return filas.map(aPersona);
}

export async function obtenerPersona(id) {
  const fila = await db.uno(`${SQL_PERSONAL} WHERE p.id = ?`, [id]);
  if (!fila) throw noEncontrado('No existe esa persona en el equipo.');
  return aPersona(fila);
}

async function exigirEmailLibre(email, exceptoId = 0) {
  if (!email) return;
  const existe = await db.uno('SELECT 1 FROM personal WHERE email = ? AND id <> ?', [email, exceptoId]);
  if (existe) throw conflicto(`Ya hay una persona registrada con el correo ${email}.`);
}

export async function crearPersona(datos) {
  if (datos.sucursalId) await exigirSucursal(datos.sucursalId);
  if (ROLES_CON_ACCESO.includes(datos.rol) && !(datos.email && datos.password)) {
    throw solicitudInvalida(`El rol "${datos.rol}" entra al panel: necesita correo y contraseña.`);
  }
  await exigirEmailLibre(datos.email);

  const { id } = await db.ejecutar(
    `INSERT INTO personal
       (nombre, email, password_hash, rol, puesto, sucursal_id, turno_inicio, turno_fin, estado, es_encargado, creado_en)
     VALUES
       (:nombre, :email, :passwordHash, :rol, :puesto, :sucursalId, :turnoInicio, :turnoFin, :estado, :esEncargado, :creadoEn)`,
    {
      nombre: datos.nombre,
      email: datos.email ?? null,
      passwordHash: datos.password ? await bcrypt.hash(datos.password, 10) : null,
      rol: datos.rol,
      puesto: datos.puesto,
      sucursalId: datos.sucursalId ?? null,
      turnoInicio: datos.turnoInicio ?? null,
      turnoFin: datos.turnoFin ?? null,
      estado: datos.estado,
      esEncargado: aBit(datos.esEncargado),
      creadoEn: ahoraISO()
    }
  );
  return obtenerPersona(id);
}

export async function actualizarPersona(id, cambios) {
  await obtenerPersona(id);
  if (cambios.sucursalId) await exigirSucursal(cambios.sucursalId);
  await exigirEmailLibre(cambios.email, id);

  const update = armarUpdate(
    { ...cambios, passwordHash: cambios.password ? await bcrypt.hash(cambios.password, 10) : undefined },
    {
      nombre: 'nombre',
      email: 'email',
      passwordHash: 'password_hash',
      rol: 'rol',
      puesto: 'puesto',
      sucursalId: 'sucursal_id',
      turnoInicio: 'turno_inicio',
      turnoFin: 'turno_fin',
      estado: 'estado',
      esEncargado: ['es_encargado', aBit]
    }
  );
  if (update) await db.ejecutar(`UPDATE personal SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  return obtenerPersona(id);
}

/** Devuelve la persona si las credenciales son correctas; si no, lanza 401. */
export async function autenticarStaff(email, password) {
  const fila = await db.uno(`${SQL_PERSONAL} WHERE p.email = ? AND p.estado <> 'inactivo'`, [email]);
  const valido =
    fila?.password_hash &&
    ROLES_CON_ACCESO.includes(fila.rol) &&
    (await bcrypt.compare(password, fila.password_hash));
  // Mismo mensaje exista o no el correo: no revelamos qué cuentas hay.
  if (!valido) throw noAutenticado('Correo o contraseña incorrectos.');
  return aPersona(fila);
}
