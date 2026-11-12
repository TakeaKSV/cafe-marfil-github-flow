import { z } from 'zod';
import { solicitudInvalida } from './errores.js';
import { esFechaValida, normalizarHora } from './fechas.js';

z.config(z.locales.es()); // mensajes de validación en español

/**
 * Valida `datos` contra un esquema de zod y devuelve el resultado ya limpio.
 * Si no cumple, responde 400 con la lista de campos que fallaron.
 */
export function leer(esquema, datos) {
  const resultado = esquema.safeParse(datos ?? {});
  if (!resultado.success) {
    throw solicitudInvalida(
      'Datos inválidos.',
      resultado.error.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }))
    );
  }
  return resultado.data;
}

// Piezas reutilizables para armar esquemas ------------------------------------

export const zTexto = (max = 200) => z.string().trim().min(1).max(max);
export const zTextoOpcional = (max = 500) => z.string().trim().max(max);
export const zId = z.coerce.number().int().positive();
export const zEntero = (min = 0, max = 100000) => z.coerce.number().int().min(min).max(max);
export const zPrecio = z.coerce.number().min(0).max(100000);
export const zListaTexto = z.array(zTexto(300)).max(30);
export const zEmail = z.string().trim().toLowerCase().max(190).pipe(z.email());
export const zPassword = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72);

export const zFecha = z.string().refine(esFechaValida, 'Usa el formato AAAA-MM-DD.');

/** Acepta '19:30' o '7:30 PM' y entrega siempre 'HH:MM'. */
export const zHora = z.string().transform((valor, ctx) => {
  const hora = normalizarHora(valor);
  if (!hora) {
    ctx.addIssue({ code: 'custom', message: 'Hora inválida. Ejemplos: 19:30 o 7:30 PM.' });
    return z.NEVER;
  }
  return hora;
});

/** Para parámetros de consulta: ?disponibles=true */
export const zBanderaQuery = z
  .enum(['true', 'false', '1', '0'])
  .transform((valor) => valor === 'true' || valor === '1');
