// Traducen lo que entrega la API al formato que consumen las pantallas de la PWA.

const ORIGEN_API = (() => {
  try {
    const base = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');
    return new URL(base, window.location.origin).origin;
  } catch {
    return '';
  }
})();

export function resolverUrlImagen(url) {
  if (!url) return '/images/Menu/vaso-principal.png';
  if (url.startsWith('/uploads/') && ORIGEN_API) return `${ORIGEN_API}${url}`;
  return url;
}

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
  imagen: resolverUrlImagen(a.imagen),
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
  imagen: p.imagen ? resolverUrlImagen(p.imagen) : '/images/dubai_frappes.jpg',
  resumen: p.descripcion ?? p.beneficio,
  descripcion: p.descripcion ?? p.beneficio,
  beneficioDetalle: p.beneficio,
  codigoCupon: p.codigo,
  canjesHoy: p.canjesHoy ?? 0,
  limiteDiario: p.limiteDiario ?? 50,
  agotadaHoy: (p.canjesHoy ?? 0) >= (p.limiteDiario ?? 50),
  condiciones: p.condiciones,
  terminos: p.condiciones,
  comoUsar: p.comoUsar ?? 'Muestra tu código al ordenar en mostrador.'
});

export const aProductoDeMenu = (p) => ({
  id: p.slug ?? String(p.id),
  productoId: p.id,
  nombre: p.nombreCorto || p.nombre.toUpperCase(),
  nombreCompleto: p.nombre,
  categoria: p.etiqueta || p.categoria,
  categoriaSlug: p.categoriaSlug,
  descripcion: p.descripcion,
  precio: p.precioStr ?? `$${Number(p.precio || 0).toFixed(0)} MXN`,
  precioNum: Number(p.precio || 0),
  tamano: p.porcion || 'Porción individual',
  calorias: p.calorias ? `${p.calorias} kcal` : 'Consulta en barra',
  imagen: resolverUrlImagen(p.imagen),
  colorCard: p.colorCard || '#F5ECE8',
  queTrae: Array.isArray(p.ingredientes) && p.ingredientes.length ? p.ingredientes : [p.descripcion].filter(Boolean),
  alergenos: Array.isArray(p.alergenos) ? p.alergenos : [],
  badge: p.disponibleEnCocina === false ? 'AGOTADO HOY' : (p.badge || 'MARFIL'),
  disponibleEnCocina: p.disponibleEnCocina !== false,
  destacado: Boolean(p.destacado),
  estado: p.estado || 'publicado'
});

const META_SECCIONES = {
  frappes: {
    titulo: 'Frappés de Autor & Especialidad',
    subtitulo: 'Indulgencia fría con granos de altura y confitería premium'
  },
  salado: {
    titulo: 'Cocina Salada, Hamburguesas & Snacks',
    subtitulo: 'Recetas contundentes con carne de res local y pan brioche de masa madre'
  },
  especialidad: {
    titulo: 'Barra de Café de Especialidad',
    subtitulo: 'Granos seleccionados de altura, espresso y métodos artesanales'
  },
  brunch: {
    titulo: 'All-Day Brunch & Desayunos',
    subtitulo: 'Chilaquiles, molletes y platillos servidos todo el día'
  },
  postres: {
    titulo: 'Postres, Waffles & Fresas Dubái',
    subtitulo: 'Dulces de autor con pistache, kataifi y confitería selecta'
  },
  social: {
    titulo: 'Bebidas Sociales & Coctelería',
    subtitulo: 'Cervezas, sodas italianas y tragos para compartir'
  }
};

/**
 * Agrupa los productos del catálogo en secciones por categoría para MenuScreen.
 */
export function aSeccionesDeMenu(productos = []) {
  const grupos = new Map();
  for (const p of productos) {
    const slug = p.categoriaSlug || 'otros';
    if (!grupos.has(slug)) {
      grupos.set(slug, {
        slug,
        categoriaNombre: p.categoria || 'Especialidades',
        productos: []
      });
    }
    grupos.get(slug).productos.push(aProductoDeMenu(p));
  }

  const ordenPreferido = ['frappes', 'salado', 'especialidad', 'brunch', 'postres', 'social'];
  const ordenados = [...grupos.values()].sort((a, b) => {
    const ia = ordenPreferido.indexOf(a.slug);
    const ib = ordenPreferido.indexOf(b.slug);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.categoriaNombre.localeCompare(b.categoriaNombre);
  });

  return ordenados.map((g, idx) => {
    const meta = META_SECCIONES[g.slug];
    return {
      id: `seccion-${idx + 1}`,
      slug: g.slug,
      numero: `Seccion ${idx + 1}`,
      titulo: meta?.titulo || g.categoriaNombre,
      subtitulo: meta?.subtitulo || 'Preparados al momento en nuestras sucursales',
      productos: g.productos
    };
  });
}

// --------------------------------------------------------------------------
// Cuenta del cliente
// --------------------------------------------------------------------------

export const aPerfil = (c) => ({
  nombre: c.nombre,
  nombres: c.nombres ?? '',
  apellidoPaterno: c.apellidoPaterno ?? '',
  apellidoMaterno: c.apellidoMaterno ?? '',
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
  emailVerificado: Boolean(c.emailVerificado),
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
