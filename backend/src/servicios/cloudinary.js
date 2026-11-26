// Subida firmada de imágenes a Cloudinary sin dependencias externas.
// Si CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET no están definidos,
// `cloudinaryConfigurado()` devuelve false y la ruta usa almacenamiento local.

import crypto from 'node:crypto';
import { config } from '../config.js';

const CARPETAS_PERMITIDAS = new Set(['menu', 'actividades', 'promociones']);

export function normalizarCarpeta(carpeta) {
  const limpia = String(carpeta || 'menu')
    .trim()
    .toLowerCase();
  return CARPETAS_PERMITIDAS.has(limpia) ? limpia : 'menu';
}

export function cloudinaryConfigurado(cfg = config.cloudinary) {
  return Boolean(cfg?.cloudName && cfg?.apiKey && cfg?.apiSecret);
}

/**
 * Genera la firma SHA-1 que exige la API REST de Cloudinary:
 * parámetros ordenados alfabéticamente concatenados con `&` + `apiSecret`.
 */
export function firmarParametrosCloudinary(params, apiSecret) {
  const cadena = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${cadena}${apiSecret}`).digest('hex');
}

export async function subirACloudinary(
  { buffer, mimetype, nombreArchivo, carpeta = 'menu' },
  { cfg = config.cloudinary, fetchFn = fetch, timestamp = Math.floor(Date.now() / 1000) } = {}
) {
  if (!cloudinaryConfigurado(cfg)) {
    throw new Error('Cloudinary no está configurado.');
  }

  const subcarpeta = normalizarCarpeta(carpeta);
  const folder = `${cfg.folder}/${subcarpeta}`;
  const signature = firmarParametrosCloudinary({ folder, timestamp }, cfg.apiSecret);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimetype }), nombreArchivo || `marfil.${subcarpeta}`);
  form.append('api_key', cfg.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`;
  const resp = await fetchFn(endpoint, { method: 'POST', body: form });
  const datos = await resp.json().catch(() => ({}));

  if (!resp.ok || !datos.secure_url) {
    const detalle = datos?.error?.message || `HTTP ${resp.status}`;
    throw new Error(`Error al subir imagen a Cloudinary: ${detalle}`);
  }

  return {
    url: datos.secure_url,
    publicId: datos.public_id,
    ancho: datos.width ?? null,
    alto: datos.height ?? null,
    proveedor: 'cloudinary'
  };
}
