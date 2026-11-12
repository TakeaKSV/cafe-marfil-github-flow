import crypto from 'node:crypto';

const digitos = (n) => String(crypto.randomInt(0, 10 ** n)).padStart(n, '0');
const hex = (bytes) => crypto.randomBytes(bytes).toString('hex').toUpperCase();

/** Folio corto y legible: se le puede dictar al host por teléfono. */
export const generarFolio = () => `MF-RES-${digitos(5)}`;

/** Secreto del QR de una reservación: no se puede adivinar a partir del folio. */
export const generarTokenQR = () => `QR-${hex(8)}`;

export const generarCodigoClub = () => `MF-CLUB-${digitos(5)}`;
export const generarCodigoBeneficio = () => `MF-BEN-${hex(3)}`;

/**
 * Genera códigos hasta encontrar uno libre. `existe(codigo)` consulta la base (puede ser async).
 * Con 100 000 folios posibles las colisiones son raras, pero no imposibles.
 */
export async function codigoUnico(generar, existe) {
  for (let intento = 0; intento < 20; intento += 1) {
    const codigo = generar();
    if (!(await existe(codigo))) return codigo;
  }
  throw new Error('No se pudo generar un código único. Intenta de nuevo.');
}

/** 'Frappé Kinder Bueno' -> 'frappe-kinder-bueno' */
export function slugify(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Slug que no choque con uno existente: 'catan', 'catan-2', 'catan-3'... */
export async function slugLibre(texto, existe) {
  const base = slugify(texto) || 'elemento';
  let slug = base;
  for (let n = 2; await existe(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

export const precioTexto = (monto) => `$${Number(monto).toLocaleString('es-MX')} MXN`;

/** Lee una columna JSON; si está corrupta devuelve el valor por defecto. */
export function leerJSON(texto, porDefecto) {
  try {
    return texto ? JSON.parse(texto) : porDefecto;
  } catch {
    return porDefecto;
  }
}
