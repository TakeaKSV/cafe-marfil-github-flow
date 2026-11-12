// Utilidades de fecha y hora.
//
// La base guarda las marcas de tiempo en UTC, pero "hoy" para el café es el día
// en su zona horaria (config.zonaHoraria). Estas funciones hacen esa traducción.

import { config } from '../config.js';

const zona = config.zonaHoraria;
const dosDigitos = (n) => String(n).padStart(2, '0');
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const fmtFechaLocal = new Intl.DateTimeFormat('en-CA', {
  timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit'
});
const fmtDesfase = new Intl.DateTimeFormat('en-US', { timeZone: zona, timeZoneName: 'longOffset' });
const fmtHoraLocal = new Intl.DateTimeFormat('en-GB', {
  timeZone: zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
const fmtFechaLarga = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});
const fmtFechaCorta = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short'
});

export const ahoraISO = () => new Date().toISOString();

/** Fecha de calendario ('YYYY-MM-DD') de un instante, vista desde el café. */
export const fechaLocal = (instante = new Date()) => fmtFechaLocal.format(instante);
export const hoyLocal = () => fechaLocal();

/** Hora de reloj ('HH:MM') de un instante, vista desde el café. */
export const horaLocal = (instante = new Date()) => fmtHoraLocal.format(instante);

function desfaseZona(fecha) {
  const partes = fmtDesfase.formatToParts(new Date(`${fecha}T12:00:00Z`));
  const nombre = partes.find((p) => p.type === 'timeZoneName').value; // 'GMT-06:00' o 'GMT'
  return nombre === 'GMT' ? '+00:00' : nombre.slice(3);
}

/** Convierte fecha + hora locales del café en un Date (instante absoluto). */
export function instanteLocal(fecha, hora = '00:00') {
  return new Date(`${fecha}T${hora}:00${desfaseZona(fecha)}`);
}

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Límites en UTC de un día local: sirve para filtrar marcas de tiempo "de hoy". */
export function rangoDia(fecha = hoyLocal()) {
  return {
    desde: instanteLocal(fecha).toISOString(),
    hasta: instanteLocal(sumarDias(fecha, 1)).toISOString()
  };
}

export function esFechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

/**
 * Acepta '19:30', '7:30 PM' o '07:30 pm' y devuelve 'HH:MM' en 24 h.
 * Devuelve null si el texto no es una hora válida.
 */
export function normalizarHora(valor) {
  const m = /^(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?$|^(\d{1,2}):(\d{2})$/i.exec(String(valor ?? '').trim());
  if (!m) return null;

  const esDoceHoras = m[3] !== undefined;
  let hora = Number(esDoceHoras ? m[1] : m[4]);
  const minuto = Number(esDoceHoras ? m[2] : m[5]);
  if (minuto > 59) return null;

  if (esDoceHoras) {
    if (hora < 1 || hora > 12) return null;
    const esPM = m[3].toLowerCase() === 'p';
    if (esPM && hora !== 12) hora += 12;
    if (!esPM && hora === 12) hora = 0;
  } else if (hora > 23) {
    return null;
  }
  return `${dosDigitos(hora)}:${dosDigitos(minuto)}`;
}

/** '19:30' -> '7:30 PM' */
export function horaTexto(hora) {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  return `${h % 12 || 12}:${dosDigitos(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** '2026-10-03' -> 'Sábado, 3 de octubre de 2026' */
export function fechaTexto(fecha) {
  if (!fecha) return null;
  return capitalizar(fmtFechaLarga.format(new Date(`${fecha}T12:00:00Z`)));
}

/** Igual que fechaTexto pero en minúscula, para usarla a media oración: "el sábado, 3 de octubre de 2026". */
export function fechaEnFrase(fecha) {
  if (!fecha) return null;
  return fmtFechaLarga.format(new Date(`${fecha}T12:00:00Z`));
}

/** '2026-10-03' -> 'Sáb, 3 Oct' */
export function fechaCorta(fecha) {
  if (!fecha) return null;
  const partes = Object.fromEntries(
    fmtFechaCorta.formatToParts(new Date(`${fecha}T12:00:00Z`)).map((p) => [p.type, p.value.replace('.', '')])
  );
  return `${capitalizar(partes.weekday)}, ${partes.day} ${capitalizar(partes.month)}`;
}

export const minutosDelDia = (hora) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/** Minutos transcurridos desde una marca de tiempo ISO (nunca negativo). */
export function minutosDesde(iso, hasta = new Date()) {
  if (!iso) return 0;
  return Math.max(0, Math.round((hasta.getTime() - new Date(iso).getTime()) / 60000));
}
