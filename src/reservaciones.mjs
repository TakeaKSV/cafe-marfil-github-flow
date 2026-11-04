export function validarReserva({ nombre, personas } = {}) {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return { ok: false, error: 'El nombre es obligatorio.' };
  }
  if (!Number.isInteger(personas) || personas < 1 || personas > 12) {
    return { ok: false, error: 'La reservación debe ser para un número entero de 1 a 12 personas.' };
  }
  return { ok: true, datos: { nombre: nombre.trim(), personas } };
}
