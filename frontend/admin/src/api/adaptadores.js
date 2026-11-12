// Traducen lo que entrega la API a la forma que ya esperan los componentes del
// panel (la que tenían los datos simulados), para no tocar la interfaz.

const pesos = (monto) => `$${Number(monto).toLocaleString('es-MX')} MXN`;

const fmtDiaCorto = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
const fmtHora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDia = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

/** '2026-11-11T15:20:00Z' -> 'Hoy, 09:20 a.m.' / '28 sep 2026' */
function cuandoFue(iso) {
  if (!iso) return 'Sin visitas';
  const fecha = new Date(iso);
  const esHoy = fecha.toDateString() === new Date().toDateString();
  return esHoy ? `Hoy, ${fmtHora.format(fecha)}` : fmtDia.format(fecha);
}

export const aSucursal = (s) => ({
  ...s,
  zonas: s.zonas.map((zona) => zona.nombre)
});

/** `hoy` es la fecha del día según el servidor ('AAAA-MM-DD'). */
export const aReservacion = (hoy) => (r) => ({
  ...r,
  fechaISO: r.fecha,
  fecha:
    r.fecha === hoy
      ? `Hoy (${fmtDiaCorto.format(new Date(`${r.fecha}T12:00:00Z`))})`
      : r.fechaTexto,
  hora24: r.hora,
  hora: r.horaTexto,
  email: r.email ?? '',
  notas: r.notas ?? '',
  monto: r.totalEstimado,
  totalEstimado: pesos(r.totalEstimado)
});

export const aJuego = (j) => ({ ...j, duracionMin: j.duracion });

export const aPersona = (p) => ({
  ...p,
  rolAcceso: p.rol,
  rol: p.puesto,
  sucursal: p.sucursalNombre ? p.sucursalNombre.replace('Sucursal ', '') : 'Sin sucursal',
  turno: p.turno ?? 'Sin turno asignado'
});

export const aClienteClub = (c) => ({
  ...c,
  ultimaVisita: cuandoFue(c.ultimaVisita),
  sucursalHabitual: c.sucursalHabitual ? c.sucursalHabitual.replace('Sucursal ', '') : '—'
});

export const aEscaneo = (e) => ({
  id: e.id,
  codigo: e.codigo,
  tipo: e.tipoNombre,
  descripcion: e.descripcion,
  resultado: e.resultado,
  hora: e.hora,
  exito: e.exito
});

/** Minutos -> '1:05h' (formato del plano de mesas). */
export const tiempoEnMesa = (minutos) => `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}h`;
