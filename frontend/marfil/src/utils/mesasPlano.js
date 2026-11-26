/**
 * Utilidades puras de coordenadas y evaluación de unión de mesas para la PWA.
 * Espejo exacto del acomodo del editor de Mesas en Vivo del panel Admin.
 */

export const PATIO_SPLIT_PERCENT = 82;
export const CANVAS_BASE_WIDTH = 1040;
export const CANVAS_BASE_HEIGHT = 510;

const DEFAULT_SLOTS_BAJA = {
  M01: { x: 10.5, y: 60.5, wing: 'salon', chairsLayout: 'lr' },
  M02: { x: 33.5, y: 21.5, wing: 'salon' },
  M04: { x: 28.5, y: 50.5, wing: 'salon' },
  M03: { x: 56.5, y: 45.5, wing: 'salon' },
  M08: { x: 43.0, y: 81.0, wing: 'salon' },
  M05: { x: 90.8, y: 32.0, wing: 'patio', chairsLayout: 'tb', compact: true },
  M06: { x: 90.8, y: 58.0, wing: 'patio', compact: true },
  M07: { x: 90.8, y: 83.0, wing: 'patio', compact: true }
};

const DEFAULT_SLOTS_ALTA = {
  L01: { x: 24.0, y: 31.0, wing: 'salon' },
  L03: { x: 50.5, y: 31.0, wing: 'salon' },
  L04: { x: 37.5, y: 74.0, wing: 'salon' },
  L02: { x: 72.0, y: 49.0, wing: 'salon' }
};

const FALLBACK_COORDS = [
  { x: 49.0, y: 21.5, wing: 'salon' },
  { x: 10.5, y: 79.5, wing: 'salon', chairsLayout: 'lr' },
  { x: 66.5, y: 81.0, wing: 'salon' },
  { x: 74.0, y: 45.5, wing: 'salon' },
  { x: 68.0, y: 22.0, wing: 'salon' },
  { x: 24.0, y: 78.0, wing: 'salon' },
  { x: 90.8, y: 44.0, wing: 'patio', compact: true },
  { x: 90.8, y: 72.0, wing: 'patio', compact: true }
];

export function esPisoAlto(mesa) {
  if (mesa.piso === 'planta-alta') return true;
  if (mesa.piso === 'planta-baja') return false;
  const zona = String(mesa.zona || '').toLowerCase();
  const num = String(mesa.numero || '').toUpperCase();
  return zona.includes('ludoteca') || zona.includes('alta') || num.startsWith('L');
}

export function resolverCoordenadaMesa(mesa, idx) {
  const num = String(mesa.numero || '').toUpperCase();
  const slotsMap = esPisoAlto(mesa) ? DEFAULT_SLOTS_ALTA : DEFAULT_SLOTS_BAJA;
  const mapped = slotsMap[num];

  if (
    mesa.posX !== null &&
    mesa.posX !== undefined &&
    mesa.posY !== null &&
    mesa.posY !== undefined &&
    !Number.isNaN(Number(mesa.posX)) &&
    !Number.isNaN(Number(mesa.posY))
  ) {
    const x = Math.max(5.5, Math.min(94.5, Number(mesa.posX)));
    const y = Math.max(11.5, Math.min(88.5, Number(mesa.posY)));
    const inPatio = x >= PATIO_SPLIT_PERCENT;
    return {
      x,
      y,
      wing: inPatio ? 'patio' : 'salon',
      compact: inPatio,
      chairsLayout: mapped?.chairsLayout || (inPatio ? 'tb' : undefined)
    };
  }

  if (mapped) return mapped;
  return FALLBACK_COORDS[idx % FALLBACK_COORDS.length];
}

export function evaluarUnionMesas(mesasSeleccionadas, personas) {
  const capacidadTotal = mesasSeleccionadas.reduce((acc, m) => acc + Number(m.capacidad || 0), 0);
  const minPersonasUnion = Math.max(2, Math.ceil(capacidadTotal * 0.65));
  const cubreGrupo = capacidadTotal >= personas;
  const elegibleUnion =
    mesasSeleccionadas.length >= 2 && cubreGrupo && personas >= minPersonasUnion;

  return {
    capacidadTotal,
    minPersonasUnion,
    cubreGrupo,
    elegibleUnion
  };
}
