// Cliente HTTP del panel: agrega el token de sesión y unifica los errores.
//
// La URL de la API se puede cambiar con VITE_API_URL (archivo .env de Vite).

const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const CLAVE_TOKEN = 'marfil_admin_token';

export class ErrorApi extends Error {
  constructor(mensaje, status = 0) {
    super(mensaje);
    this.status = status;
  }
}

export const sesion = {
  get token() {
    return localStorage.getItem(CLAVE_TOKEN);
  },
  guardar(token) {
    localStorage.setItem(CLAVE_TOKEN, token);
  },
  cerrar() {
    localStorage.removeItem(CLAVE_TOKEN);
  }
};

let avisarSesionExpirada = () => {};
/** Registra qué hacer cuando la API responde 401 con una sesión que ya no sirve. */
export function alExpirarSesion(fn) {
  avisarSesionExpirada = fn;
}

/**
 * Llama a la API y devuelve el JSON de respuesta.
 *   api('/mesas', { query: { sucursalId } })
 *   api('/mesas/3/walk-in', { metodo: 'POST', body: { personas: 2 } })
 * Si algo sale mal lanza ErrorApi con un mensaje listo para mostrar.
 */
export async function api(ruta, { metodo = 'GET', body, query } = {}) {
  const url = new URL(URL_BASE + ruta);
  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
  }

  const token = sesion.token;
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Revisa que la API esté encendida.');
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (respuesta.ok) return datos;

  if (respuesta.status === 401 && token) {
    sesion.cerrar();
    avisarSesionExpirada();
  }
  // En errores de validación se muestra el primer campo que falló.
  const detalle = datos.detalles?.[0];
  const mensaje = detalle ? `${datos.error} ${detalle.campo}: ${detalle.mensaje}` : datos.error;
  throw new ErrorApi(mensaje || `Error ${respuesta.status} del servidor.`, respuesta.status);
}
