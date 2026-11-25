import jwt from 'jsonwebtoken';
import { paraSesion as sesionPersonal } from '../repositorios/personal.js';
import { paraSesion as sesionCliente } from '../repositorios/clientes.js';
import { config } from '../config.js';

import { noAutenticado, sinPermiso } from '../utils/errores.js';

export function firmarToken({ id, tipo, version = 0 }) {
  return jwt.sign({ tipo, version }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(id),
    expiresIn: config.jwtExpiraEn,
    issuer: config.jwtEmisor,
    audience: config.jwtAudiencia
  });
}

export async function identificar(req, _res, next) {
  const cabecera = req.get('authorization');
  if (!cabecera) return next();
  const token = /^Bearer ([^\s]+)$/i.exec(cabecera)?.[1];
  if (!token) throw noAutenticado('Cabecera Authorization inválida.');
  let contenido;
  try {
    contenido = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.jwtEmisor,
      audience: config.jwtAudiencia
    });
    if (
      !contenido ||
      typeof contenido !== 'object' ||
      !/^[1-9]\d*$/.test(contenido.sub) ||
      !Number.isSafeInteger(Number(contenido.sub)) ||
      !Number.isInteger(contenido.exp) ||
      !Number.isInteger(contenido.version) ||
      contenido.version < 0
    )
      throw new Error('Claims inválidos');
  } catch {
    throw noAutenticado('Tu sesión expiró o no es válida. Inicia sesión de nuevo.');
  }

  const id = Number(contenido.sub);
  const persona =
    contenido.tipo === 'staff'
      ? await sesionPersonal(id)
      : contenido.tipo === 'cliente'
        ? await sesionCliente(id)
        : null;
  if (!persona || persona.session_version !== contenido.version) throw noAutenticado('Tu sesión ya no está activa.');
  req.usuario =
    contenido.tipo === 'staff'
      ? { id, tipo: 'staff', rol: persona.rol, sucursalId: persona.sucursal_id }
      : { id, tipo: 'cliente' };
  next();
}

export const requiereStaff =
  (...roles) =>
  (req, _res, next) => {
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
