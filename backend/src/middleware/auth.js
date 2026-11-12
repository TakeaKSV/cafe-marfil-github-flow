import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db/conexion.js';
import { noAutenticado, sinPermiso } from '../utils/errores.js';

/** tipo: 'staff' (panel admin) o 'cliente' (PWA). */
export function firmarToken({ id, tipo }) {
  return jwt.sign({ tipo }, config.jwtSecret, { subject: String(id), expiresIn: config.jwtExpiraEn });
}

/**
 * Si la petición trae `Authorization: Bearer <token>`, deja en req.usuario
 * { id, tipo, rol, sucursalId }. Sin cabecera la petición sigue como anónima.
 * El rol se lee de la base en cada petición: así un cambio de rol o una baja
 * surten efecto de inmediato, sin esperar a que expire el token.
 */
export async function identificar(req, _res, next) {
  const cabecera = req.get('authorization');
  if (!cabecera) return next();

  const [esquema, token] = cabecera.split(' ');
  if (esquema !== 'Bearer' || !token) throw noAutenticado('Cabecera Authorization inválida.');

  let contenido;
  try {
    contenido = jwt.verify(token, config.jwtSecret);
  } catch {
    throw noAutenticado('Tu sesión expiró o no es válida. Inicia sesión de nuevo.');
  }

  const id = Number(contenido.sub);
  if (contenido.tipo === 'staff') {
    const persona = await db.uno("SELECT rol, sucursal_id FROM personal WHERE id = ? AND estado <> 'inactivo'", [id]);
    if (!persona) throw noAutenticado('Tu cuenta ya no está activa.');
    req.usuario = { id, tipo: 'staff', rol: persona.rol, sucursalId: persona.sucursal_id };
  } else if (contenido.tipo === 'cliente') {
    if (!(await db.uno('SELECT 1 FROM clientes WHERE id = ?', [id]))) throw noAutenticado('Tu cuenta ya no existe.');
    req.usuario = { id, tipo: 'cliente' };
  } else {
    throw noAutenticado('Token no reconocido.');
  }
  next();
}

/** requiereStaff() deja pasar a cualquier persona del panel; requiereStaff('admin') solo a ese rol. */
export const requiereStaff = (...roles) => (req, _res, next) => {
  if (!req.usuario) throw noAutenticado();
  if (req.usuario.tipo !== 'staff') throw sinPermiso('Esta sección es solo para el personal.');
  if (roles.length && !roles.includes(req.usuario.rol)) throw sinPermiso();
  next();
};

export function requiereCliente(req, _res, next) {
  if (!req.usuario) throw noAutenticado();
  if (req.usuario.tipo !== 'cliente') throw sinPermiso('Esta sección es solo para clientes.');
  next();
}

export const esStaff = (req) => req.usuario?.tipo === 'staff';
export const esGerencia = (req) => esStaff(req) && ['admin', 'gerente'].includes(req.usuario.rol);
