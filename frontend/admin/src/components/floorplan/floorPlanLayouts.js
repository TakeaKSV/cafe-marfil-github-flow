/**
 * Configuración de pisos y coordenadas arquitectónicas (0-100%)
 * sobre un lienzo de 1100 x 540 para cada sucursal de Café Marfil.
 */

export const BLUEPRINT_WIDTH = 1100;
export const BLUEPRINT_HEIGHT = 540;
export const PATIO_SPLIT_PERCENT = 82;

const PORRAS_PLANTA_BAJA_SLOTS = {
  // Salón Principal (izquierda de la pared divisoria)
  M01: { x: 10.5, y: 60.5, wing: 'salon', chairsLayout: 'lr' },
  M02: { x: 33.5, y: 21.5, wing: 'salon' },
  M04: { x: 28.5, y: 50.5, wing: 'salon' },
  M03: { x: 56.5, y: 45.5, wing: 'salon' },
  M08: { x: 43.0, y: 81.0, wing: 'salon' },
  // Patio / Terraza lateral (derecha de la pared divisoria)
  M05: { x: 90.8, y: 32.0, wing: 'patio', chairsLayout: 'tb', compact: true },
  M06: { x: 90.8, y: 58.0, wing: 'patio', compact: true },
  M07: { x: 90.8, y: 83.0, wing: 'patio', compact: true }
};

const PORRAS_PLANTA_ALTA_SLOTS = {
  L01: { x: 24.0, y: 31.0, wing: 'salon' },
  L03: { x: 50.5, y: 31.0, wing: 'salon' },
  L04: { x: 37.5, y: 74.0, wing: 'salon' },
  L02: { x: 72.0, y: 49.0, wing: 'salon' }
};

const CALVARIO_PLANTA_BAJA_SLOTS = {
  M01: { x: 11.5, y: 60.5, wing: 'salon', chairsLayout: 'lr' },
  M02: { x: 35.0, y: 23.0, wing: 'salon' },
  M03: { x: 58.5, y: 47.0, wing: 'salon' },
  M04: { x: 39.0, y: 78.0, wing: 'salon' }
};

const FALLBACK_SALON_SLOTS = [
  { x: 49.0, y: 21.5, wing: 'salon' },
  { x: 10.5, y: 79.5, wing: 'salon', chairsLayout: 'lr' },
  { x: 66.5, y: 81.0, wing: 'salon' },
  { x: 74.0, y: 45.5, wing: 'salon' },
  { x: 68.0, y: 22.0, wing: 'salon' },
  { x: 24.0, y: 78.0, wing: 'salon' },
  { x: 90.8, y: 44.0, wing: 'patio', compact: true },
  { x: 90.8, y: 72.0, wing: 'patio', compact: true }
];

const FALLBACK_ALTA_SLOTS = [
  { x: 16.0, y: 65.0, wing: 'salon' },
  { x: 62.0, y: 74.0, wing: 'salon' },
  { x: 37.0, y: 48.0, wing: 'salon' },
  { x: 72.0, y: 24.0, wing: 'salon' },
  { x: 90.8, y: 45.0, wing: 'patio', compact: true },
  { x: 90.8, y: 74.0, wing: 'patio', compact: true }
];

export function isUpperFloorTable(mesa) {
  if (mesa.piso === 'planta-alta') return true;
  if (mesa.piso === 'planta-baja') return false;
  const zona = String(mesa.zona || '').toLowerCase();
  const num = String(mesa.numero || '').toUpperCase();
  return zona.includes('ludoteca') || zona.includes('alta') || num.startsWith('L');
}

/** Limita coordenadas (x%, y%) dentro de los muros interiores del plano. */
export function clampPlanCoords(x, y) {
  return {
    x: Number(Math.max(5.5, Math.min(94.5, x)).toFixed(2)),
    y: Number(Math.max(11.5, Math.min(88.5, y)).toFixed(2))
  };
}

/**
 * Devuelve la lista de pisos disponibles para la sucursal activa, con sus mesas
 * filtradas y configuración arquitectónica correspondiente.
 */
export function getFloorsForBranch(sucursalId, mesasSucursal) {
  const hasUpperTables = mesasSucursal.some(isUpperFloorTable);

  if (sucursalId === 'porras-matriz' || hasUpperTables) {
    const plantaBajaMesas = mesasSucursal.filter((m) => !isUpperFloorTable(m));
    const plantaAltaMesas = mesasSucursal.filter(isUpperFloorTable);

    return [
      {
        id: 'planta-baja',
        shortName: 'Piso 1 · Planta Baja',
        subtitle: 'Salón Principal, Barra & Patio',
        variant: 'planta_baja',
        slots: PORRAS_PLANTA_BAJA_SLOTS,
        fallbackSlots: FALLBACK_SALON_SLOTS,
        mesas: plantaBajaMesas
      },
      {
        id: 'planta-alta',
        shortName: 'Piso 2 · Planta Alta',
        subtitle: 'Ludoteca & Balcón Colonial',
        variant: 'planta_alta',
        slots: PORRAS_PLANTA_ALTA_SLOTS,
        fallbackSlots: FALLBACK_ALTA_SLOTS,
        mesas: plantaAltaMesas
      }
    ];
  }

  return [
    {
      id: 'planta-baja',
      shortName: 'Piso 1 · Planta Baja',
      subtitle: 'Salón Acogedor & Barra Express',
      variant: 'planta_baja',
      slots: sucursalId === 'calvario' ? CALVARIO_PLANTA_BAJA_SLOTS : PORRAS_PLANTA_BAJA_SLOTS,
      fallbackSlots: FALLBACK_SALON_SLOTS,
      mesas: mesasSucursal
    }
  ];
}

/**
 * Asigna coordenadas exactas (x%, y%) a cada mesa base del piso respetando
 * posiciones personalizadas guardadas en BD o movidas en vivo.
 */
export function buildBaseCoordinates(mesasBase, floorConfig, localOverrides = {}) {
  const coordsById = new Map();
  const usedFallbackIdx = new Set();
  const slots = floorConfig?.slots || {};
  const fallbacks = floorConfig?.fallbackSlots || FALLBACK_SALON_SLOTS;

  let nextFallback = 0;

  for (const mesa of mesasBase) {
    const numKey = String(mesa.numero || '').toUpperCase();
    const mapped = slots[numKey];

    // 1. Posición personalizada en vivo / local o guardada en BD
    const override = localOverrides[mesa.id];
    const hasCustomPos =
      override && typeof override.x === 'number' && typeof override.y === 'number';
    const hasDbPos =
      mesa.posX !== null &&
      mesa.posX !== undefined &&
      mesa.posY !== null &&
      mesa.posY !== undefined &&
      !Number.isNaN(Number(mesa.posX)) &&
      !Number.isNaN(Number(mesa.posY));

    if (hasCustomPos || hasDbPos) {
      const rawX = hasCustomPos ? override.x : Number(mesa.posX);
      const rawY = hasCustomPos ? override.y : Number(mesa.posY);
      const { x, y } = clampPlanCoords(rawX, rawY);
      const inPatio = x >= PATIO_SPLIT_PERCENT;
      coordsById.set(mesa.id, {
        x,
        y,
        wing: inPatio ? 'patio' : 'salon',
        compact: inPatio,
        chairsLayout: mapped?.chairsLayout || (inPatio ? 'tb' : undefined),
        isCustom: true
      });
      continue;
    }

    // 2. Slot arquitectónico por defecto del plano
    if (mapped) {
      coordsById.set(mesa.id, { ...mapped, isCustom: false });
      continue;
    }

    // 3. Slot de respaldo automático
    while (usedFallbackIdx.has(nextFallback) && nextFallback < fallbacks.length) {
      nextFallback += 1;
    }

    if (nextFallback < fallbacks.length) {
      usedFallbackIdx.add(nextFallback);
      coordsById.set(mesa.id, { ...fallbacks[nextFallback], isCustom: false });
      nextFallback += 1;
    } else {
      const extraIndex = nextFallback - fallbacks.length;
      const col = extraIndex % 4;
      const row = Math.floor(extraIndex / 4);
      coordsById.set(mesa.id, {
        x: Math.min(72, 24 + col * 16),
        y: Math.min(82, 26 + row * 24),
        wing: 'salon',
        isCustom: false
      });
      nextFallback += 1;
    }
  }

  return coordsById;
}

/**
 * Sugiere la siguiente clave disponible de mesa para el piso seleccionado (ej. M09 o L05).
 */
export function suggestNextTableNumber(mesasSucursal, floorId) {
  const prefix = floorId === 'planta-alta' ? 'L' : 'M';
  const existing = new Set(mesasSucursal.map((m) => String(m.numero || '').trim().toUpperCase()));
  for (let n = 1; n <= 99; n += 1) {
    const candidate = `${prefix}${String(n).padStart(2, '0')}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${prefix}${mesasSucursal.length + 1}`;
}

/**
 * Encuentra un punto libre dentro del plano para colocar una mesa recién agregada.
 */
export function findOpenSpotForNewTable(existingCoords, floorConfig) {
  const candidates = [
    ...(floorConfig?.fallbackSlots || FALLBACK_SALON_SLOTS),
    { x: 48, y: 50 },
    { x: 64, y: 28 },
    { x: 24, y: 74 },
    { x: 64, y: 74 }
  ];

  const occupied = Array.from(existingCoords.values());
  for (const spot of candidates) {
    const tooClose = occupied.some(
      (c) => Math.abs(c.x - spot.x) < 9 && Math.abs(c.y - spot.y) < 14
    );
    if (!tooClose) return clampPlanCoords(spot.x, spot.y);
  }
  return { x: 48, y: 50 };
}

/**
 * Calcula la posición y orientación ideal de un grupo de mesas unidas en el plano
 * respetando una posición arrastrada manualmente si existe.
 */
export function computeMergedPlacement(memberCoords, primaryCoord, memberCount, customPos = null) {
  if (customPos && typeof customPos.x === 'number' && typeof customPos.y === 'number') {
    const { x, y } = clampPlanCoords(customPos.x, customPos.y);
    const inPatio = x >= PATIO_SPLIT_PERCENT;
    return {
      x: inPatio ? 90.8 : x,
      y,
      wing: inPatio ? 'patio' : 'salon',
      orientation: inPatio ? 'vertical' : 'horizontal',
      compact: inPatio
    };
  }

  const validCoords = memberCoords.filter(Boolean);
  const anchor = primaryCoord || validCoords[0] || { x: 44, y: 50, wing: 'salon' };

  const inPatio = anchor.wing === 'patio' || anchor.x >= PATIO_SPLIT_PERCENT;

  if (inPatio) {
    const patioCoords = validCoords.filter((c) => c.wing === 'patio' || c.x >= PATIO_SPLIT_PERCENT);
    const avgY =
      patioCoords.length > 0
        ? patioCoords.reduce((acc, c) => acc + c.y, 0) / patioCoords.length
        : anchor.y;

    return {
      x: 90.8,
      y: Math.max(36, Math.min(74, avgY)),
      wing: 'patio',
      orientation: 'vertical',
      compact: true
    };
  }

  const salonCoords = validCoords.filter((c) => c.wing !== 'patio' && c.x < PATIO_SPLIT_PERCENT);
  const sourceCoords = salonCoords.length > 0 ? salonCoords : [anchor];

  const avgX = sourceCoords.reduce((acc, c) => acc + c.x, 0) / sourceCoords.length;
  const avgY = sourceCoords.reduce((acc, c) => acc + c.y, 0) / sourceCoords.length;

  const minX = avgY < 46 ? 30 : 21;
  const maxX = memberCount >= 3 ? 62 : 66;
  const clampedX = Math.max(minX, Math.min(maxX, avgX));
  const clampedY = Math.max(23, Math.min(80, avgY));

  return {
    x: clampedX,
    y: clampedY,
    wing: 'salon',
    orientation: 'horizontal',
    compact: false
  };
}
