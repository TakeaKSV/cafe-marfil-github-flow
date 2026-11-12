/** Error con código HTTP. El manejador global lo convierte en respuesta JSON. */
export class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export const solicitudInvalida = (mensaje, detalles) => new HttpError(400, mensaje, detalles);
export const noAutenticado = (mensaje = 'Inicia sesión para continuar.') => new HttpError(401, mensaje);
export const sinPermiso = (mensaje = 'No tienes permiso para esta acción.') => new HttpError(403, mensaje);
export const noEncontrado = (mensaje = 'Recurso no encontrado.') => new HttpError(404, mensaje);
export const conflicto = (mensaje) => new HttpError(409, mensaje);
