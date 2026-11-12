// Cliente HTTP de la PWA: agrega el token de sesión (si lo hay) y unifica los errores.
//
// La URL de la API se puede cambiar con VITE_API_URL (archivo .env de Vite).

const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const CLAVE_TOKEN = 'marfil_cliente_token';
const CLAVE_RESERVAS_INVITADO = 'marfil_reservas_invitado';

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

/**
 * Quien reserva sin cuenta no tiene "mis reservaciones" en el servidor: se
 * guarda en este dispositivo el token secreto de cada una para poder
 * consultarla o cancelarla después.
 */
export const reservasDeInvitado = {
  tokens() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_RESERVAS_INVITADO)) ?? [];
    } catch {
      return [];
    }
  },
  agregar(token) {
    localStorage.setItem(CLAVE_RESERVAS_INVITADO, JSON.stringify([token, ...this.tokens()].slice(0, 30)));
  }
};

let avisarSesionExpirada = () => {};
/** Registra qué hacer cuando la API responde 401 con una sesión que ya no sirve. */
export function alExpirarSesion(fn) {
  avisarSesionExpirada = fn;
}

/**
 * Llama a la API y devuelve el JSON de respuesta.
 *   api('/actividades')
 *   api('/reservaciones', { metodo: 'POST', body: { ... } })
 * Si algo sale mal lanza ErrorApi con un mensaje listo para mostrar.
 */
export async function api(ruta, { metodo = 'GET', body } = {}) {
  const token = sesion.token;
  let respuesta;
  try {
    respuesta = await fetch(URL_BASE + ruta, {
      method: metodo,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ErrorApi('No pudimos conectar con Café Marfil. Revisa tu conexión e intenta de nuevo.');
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (respuesta.ok) return datos;

  if (respuesta.status === 401 && token) {
    sesion.cerrar();
    avisarSesionExpirada();
  }
  // En errores de validación se muestra el mensaje del primer campo que falló.
  const detalle = datos.detalles?.[0];
  throw new ErrorApi(detalle?.mensaje || datos.error || `Error ${respuesta.status} del servidor.`, respuesta.status);
}
