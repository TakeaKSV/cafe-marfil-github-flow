export function validarReserva({ nombre, personas } = {}) {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return { ok: false, error: 'El nombre es obligatorio.' };
  }
  if (!Number.isFinite(personas) || personas <= 0) {
    return { ok: false, error: 'Indica una cantidad positiva de personas.' };
  }
  return { ok: true, datos: { nombre: nombre.trim(), personas } };
}
