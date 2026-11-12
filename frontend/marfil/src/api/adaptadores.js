// Traducen lo que entrega la API a la forma que ya esperan las pantallas de la
// PWA (la que tenían los datos simulados de marfilData.js), para no tocar la interfaz.

const sinPrefijo = (nombreSucursal) => (nombreSucursal ?? '').replace('Sucursal ', '');

const fmtDia = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

/** '2026-11-11T15:20:00Z' -> 'Hace 2 horas' */
function haceCuanto(iso) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return 'Justo ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}

// --------------------------------------------------------------------------
// Catálogo
// --------------------------------------------------------------------------

/** El id que usa la PWA es el slug: es texto (como en los mocks) y la API lo acepta. */
export const aActividad = (a) => ({
  ...a,
  id: a.slug,
  fecha: a.fechaTexto,
  fechaISO: a.fecha,
  hora: a.horarioTexto,
  precio: a.precioTexto,
  precioNum: a.precio,
  descripcionCompleta: a.descripcion,
  sucursalNombre: sinPrefijo(a.sucursalNombre)
});

export const aPromocion = (p) => ({
  id: p.id,
  nombre: p.titulo,
  categoria: p.categoria,
  categoriaSlug: p.categoriaSlug,
  descuentoBadge: p.descuentoBadge,
  vigencia: p.vigencia,
  sucursalesAplicables: p.sucursalesNombres.map(sinPrefijo),
  sucursalesValidas: p.sucursalesNombres.map(sinPrefijo),
  imagen: p.imagen,
  resumen: p.descripcion ?? p.beneficio,
  descripcion: p.descripcion ?? p.beneficio,
  beneficioDetalle: p.beneficio,
  codigoCupon: p.codigo,
  condiciones: p.condiciones,
  terminos: p.condiciones,
  comoUsar: p.comoUsar ?? 'Muestra tu código al ordenar en mostrador.'
});

const aProductoDeMenu = (p) => ({
  id: p.slug,
  nombre: p.nombreCorto ?? p.nombre.toUpperCase(),
  nombreCompleto: p.nombre,
  categoria: p.etiqueta ?? p.categoria,
  precio: p.precioStr,
  precioNum: p.precio,
  tamano: p.porcion ?? 'Porción individual',
  calorias: p.calorias ? `${p.calorias} kcal` : 'Consulta en barra',
  imagen: p.imagen,
  colorCard: p.colorCard,
  queTrae: p.ingredientes.length ? p.ingredientes : [p.descripcion],
  alergenos: p.alergenos,
  badge: p.disponibleEnCocina ? (p.badge ?? 'MARFIL') : 'AGOTADO HOY'
});

/**
 * MenuScreen dibuja exactamente dos secciones ('seccion-1' y 'seccion-2'):
 * la barra de frappés y la cocina salada. El carrusel está diseñado para
 * productos con imagen recortada sobre una tarjeta de color, así que solo
 * entran los que tienen `colorCard` en su ficha.
 */
export function aSeccionesDeMenu(productos) {
  const de = (categoriaSlug) =>
    productos.filter((p) => p.categoriaSlug === categoriaSlug && p.colorCard).map(aProductoDeMenu);
  return [
    {
      id: 'seccion-1',
      numero: 'Seccion 1',
      titulo: 'Frappés de Autor & Especialidad',
      subtitulo: 'Indulgencia fría con granos de altura y confitería premium',
      productos: de('frappes')
    },
    {
      id: 'seccion-2',
      numero: 'Seccion 2',
      titulo: 'Cocina Salada, Hamburguesas & Snacks',
      subtitulo: 'Recetas contundentes con carne de res local y pan brioche de masa madre',
      productos: de('salado')
    }
  ];
}

// --------------------------------------------------------------------------
// Cuenta del cliente
// --------------------------------------------------------------------------

export const aPerfil = (c) => ({
  nombre: c.nombre,
  primerNombre: c.primerNombre,
  correo: c.email ?? '',
  telefono: c.telefono ?? '',
  ciudad: c.ciudad ?? 'Durango, Dgo.',
  avatarUrl: '',
  codigoCliente: c.codigoCliente,
  nivelFidelidad: c.nivel,
  visitasRealizadas: c.visitasTotales,
  sellosActuales: c.sellosActuales,
  sellosTotalesParaMeta: c.sellosMeta,
  puntosFidelidad: c.puntos,
  preferencias: {
    ...c.preferencias,
    cafeFavorito: c.preferencias.cafeFavorito ?? c.preferencias.bebidaFavorita,
    sucursalFrecuente: sinPrefijo(c.sucursalHabitual) || 'Aún sin sucursal frecuente'
  }
});

const ESTADOS_RESERVACION = {
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  asistida: 'Completada',
  cancelada: 'Cancelada',
  no_show: 'No asistió'
};

export const aReservacion = (r) => ({
  id: r.folio,
  tipo: r.tipoNombre,
  sucursalId: r.sucursalId,
  sucursalNombre: r.sucursalNombre,
  fecha: r.fechaTexto,
  fechaISO: r.fecha,
  hora: r.horaTexto,
  personas: r.personas,
  nombreCliente: r.comensal,
  telefonoCliente: r.telefono,
  correoCliente: r.email ?? '',
  notas: r.notas ?? '',
  estado: ESTADOS_RESERVACION[r.estado],
  qrCode: r.tokenQR,
  esHistorica: r.esHistorica
});

export const aBeneficio = (b) => ({
  id: b.id ?? 'recompensa-sellos',
  titulo: b.titulo,
  subtitulo: b.subtitulo,
  estado: b.estado === 'vencido' ? 'usado' : b.estado, // la PWA agrupa en disponible | usado | bloqueado
  vigencia: b.vigencia,
  fechaUso:
    b.estado === 'vencido'
      ? 'Venció sin canjearse'
      : b.usadoEn
        ? `Canjeado el ${fmtDia.format(new Date(b.usadoEn))}`
        : undefined,
  progreso: b.progreso,
  codigo: b.codigo ?? 'PROXIMAMENTE',
  icono: b.icono
});

export const aNotificacion = (n) => ({
  id: n.id,
  titulo: n.titulo,
  mensaje: n.mensaje,
  tiempo: haceCuanto(n.fechaHora),
  tipo: n.tipo,
  leida: n.leida,
  screenDestino: n.screenDestino
});

// --------------------------------------------------------------------------
// Fechas del asistente de reservación
// --------------------------------------------------------------------------

const fmtISO = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
const fmtDiaCorto = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Fecha local del dispositivo en 'AAAA-MM-DD', dentro de `dias` días. */
export function fechaEnDias(dias = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fmtISO.format(fecha);
}

/** Hoy, mañana y el próximo fin de semana, siempre a partir del día actual. */
export function fechasSugeridas() {
  const hoy = new Date();
  const hastaSabado = (6 - hoy.getDay() + 7) % 7 || 7; // el sábado que viene (nunca hoy)
  const opciones = [
    { label: 'Hoy', dias: 0 },
    { label: 'Mañana', dias: 1 },
    { label: 'Fin de Semana', dias: hastaSabado },
    { label: 'Domingo Brunch', dias: hastaSabado + 1 }
  ];
  const vistas = new Set();
  return opciones
    .map(({ label, dias }) => {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + dias);
      return { label, iso: fmtISO.format(fecha), dia: capitalizar(fmtDiaCorto.format(fecha)) };
    })
    .filter(({ iso }) => !vistas.has(iso) && vistas.add(iso));
}
