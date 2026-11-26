import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  Plus,
  Minus,
  Check,
  Clock,
  Users,
  X,
  Sparkles,
  UserPlus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Utensils,
  Receipt,
  Link2,
  Unlink2,
  Undo2,
  Move,
  Layers,
  Combine,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { esAdmin } from '../utils/permisos';
import { tiempoEnMesa } from '../api/adaptadores';
import {
  BLUEPRINT_WIDTH,
  BLUEPRINT_HEIGHT,
  PATIO_SPLIT_PERCENT,
  clampPlanCoords,
  getFloorsForBranch,
  buildBaseCoordinates,
  computeMergedPlacement,
  suggestNextTableNumber,
  findOpenSpotForNewTable
} from './floorplan/floorPlanLayouts';
import { FloorPlanArchitecturalSvg } from './floorplan/FloorPlanBlueprints';

const STORAGE_PREFIX = 'marfil_admin_merged_tables_v1_';
const POS_STORAGE_PREFIX = 'marfil_admin_table_positions_v1_';
const CANVAS_BASE_WIDTH = 1040;
const CANVAS_BASE_HEIGHT = Math.round((CANVAS_BASE_WIDTH * BLUEPRINT_HEIGHT) / BLUEPRINT_WIDTH);

const FORMAS_MESA = [
  { id: 'squircle', label: 'Cuadrada', desc: '2 a 4 sillas' },
  { id: 'circle', label: 'Redonda', desc: '2 a 4 sillas' },
  { id: 'rectangle_horizontal', label: 'Horizontal', desc: '6 a 8+ sillas' },
  { id: 'rectangle_vertical', label: 'Vertical', desc: '6+ sillas' }
];

function loadMergedGroups(sucursalId) {
  if (!sucursalId) return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${sucursalId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLocalPositions(sucursalId) {
  if (!sucursalId) return {};
  try {
    const raw = window.localStorage.getItem(`${POS_STORAGE_PREFIX}${sucursalId}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const FloorPlanModule = ({
  mesas,
  usuario,
  onUpdateMesa,
  onCreateMesa,
  onMoveMesa,
  onDeleteMesa,
  selectedSucursal,
  sucursales,
  soundEnabled,
  onOpenWalkInModal
}) => {
  const puedeAdministrarMesas = esAdmin(usuario);

  const [activeFloorId, setActiveFloorId] = useState('planta-baja');
  const [showPropertiesMenu, setShowPropertiesMenu] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [manualZoom, setManualZoom] = useState(null); // null = ajustar automáticamente al contenedor
  const [fitScale, setFitScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal de creación de mesa (solo Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNewMesa, setSavingNewMesa] = useState(false);
  const [newMesaForm, setNewMesaForm] = useState({
    numero: '',
    capacidad: 4,
    forma: 'squircle',
    piso: 'planta-baja',
    zonaId: '',
    notas: ''
  });

  // Modo de agrupación por clic/toque (ideal para tablet, móvil y selección rápida)
  const [isGroupingMode, setIsGroupingMode] = useState(false);
  const [selectedGroupKeys, setSelectedGroupKeys] = useState([]);

  // Propiedades visibles en las mesas
  const [visibleProperties, setVisibleProperties] = useState({
    diningTime: true,
    customers: true,
    waiter: false,
    reservations: false,
    items: false
  });

  // Sucursal activa y pisos arquitectónicos configurados
  const sucursalDelPlano = selectedSucursal === 'todas' ? sucursales[0]?.id : selectedSucursal;
  const sucursalObj = useMemo(
    () => sucursales.find((s) => s.id === sucursalDelPlano),
    [sucursales, sucursalDelPlano]
  );
  const zonasDetalle = useMemo(() => sucursalObj?.zonasDetalle || [], [sucursalObj]);

  const mesasSucursal = useMemo(
    () => mesas.filter((m) => m.sucursalId === sucursalDelPlano),
    [mesas, sucursalDelPlano]
  );

  const floors = useMemo(
    () => getFloorsForBranch(sucursalDelPlano, mesasSucursal),
    [sucursalDelPlano, mesasSucursal]
  );

  const activeFloor = useMemo(
    () => floors.find((f) => f.id === activeFloorId) || floors[0],
    [floors, activeFloorId]
  );

  // Estado de mesas unidas + posiciones locales + historial para deshacer
  const [mergedGroups, setMergedGroups] = useState(() => loadMergedGroups(sucursalDelPlano));
  const [localPositions, setLocalPositions] = useState(() => loadLocalPositions(sucursalDelPlano));
  const [mergeHistory, setMergeHistory] = useState([]);
  const [recentlyMergedKey, setRecentlyMergedKey] = useState(null);

  // Estado de arrastre libre con puntero (mouse y touch)
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const panStateRef = useRef(null);
  const suppressNextClickRef = useRef(false);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);
  const [dragHoverTargetKey, setDragHoverTargetKey] = useState(null);

  // Ajustar automáticamente el plano al ancho disponible en móvil, tablet y escritorio
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const updateFit = () => {
      const padding = window.innerWidth < 640 ? 20 : 40;
      const available = Math.max(260, el.clientWidth - padding);
      setFitScale(Math.min(1, available / CANVAS_BASE_WIDTH));
    };

    updateFit();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateFit);
      return () => window.removeEventListener('resize', updateFit);
    }

    const observer = new ResizeObserver(updateFit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Recargar grupos unidos y posiciones al cambiar de sucursal
  useEffect(() => {
    setMergedGroups(loadMergedGroups(sucursalDelPlano));
    setLocalPositions(loadLocalPositions(sucursalDelPlano));
    setMergeHistory([]);
    setActiveDrag(null);
    setDragHoverTargetKey(null);
    setIsGroupingMode(false);
    setSelectedGroupKeys([]);
    setActiveFloorId('planta-baja');
  }, [sucursalDelPlano]);

  // Persistir grupos unidos en localStorage
  useEffect(() => {
    if (!sucursalDelPlano) return;
    try {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${sucursalDelPlano}`,
        JSON.stringify(mergedGroups)
      );
    } catch {
      // Ignorar si el almacenamiento no está disponible
    }
  }, [mergedGroups, sucursalDelPlano]);

  // Persistir posiciones personalizadas en localStorage como caché instantánea
  useEffect(() => {
    if (!sucursalDelPlano) return;
    try {
      window.localStorage.setItem(
        `${POS_STORAGE_PREFIX}${sucursalDelPlano}`,
        JSON.stringify(localPositions)
      );
    } catch {
      // Ignorar si el almacenamiento no está disponible
    }
  }, [localPositions, sucursalDelPlano]);

  const toggleProperty = (key) => {
    setVisibleProperties((prev) => ({ ...prev, [key]: !prev[key] }));
    if (soundEnabled) playSound('toggle');
  };

  const clearProperties = () => {
    setVisibleProperties({
      diningTime: false,
      customers: false,
      waiter: false,
      reservations: false,
      items: false
    });
    if (soundEnabled) playSound('toggle');
  };

  const activePropsCount = Object.values(visibleProperties).filter(Boolean).length;

  // Mesas base del piso activo
  const mesasBase = useMemo(
    () =>
      (activeFloor?.mesas || []).map((m) => ({
        id: m.id,
        numero: m.numero,
        zona: m.zona,
        zonaId: m.zonaId,
        shape: m.forma,
        capacidad: m.capacidad,
        posX: m.posX ?? null,
        posY: m.posY ?? null,
        piso: m.piso ?? null,
        estado: m.estado === 'reservada' ? 'libre' : m.estado,
        comensal: m.estado === 'ocupada' ? m.comensal : null,
        personas: m.estado === 'ocupada' ? m.personas : m.capacidad,
        tiempoStr: tiempoEnMesa(m.tiempoMinutos),
        mesero: m.mesero || 'Sin asignar',
        notas: m.notas || '',
        verified: Boolean(m.reservaFolio)
      })),
    [activeFloor]
  );

  // Coordenadas arquitectónicas exactas por mesa del piso activo (BD > local > default)
  const baseCoordsById = useMemo(
    () => buildBaseCoordinates(mesasBase, activeFloor, localPositions),
    [mesasBase, activeFloor, localPositions]
  );

  const hasCustomPositionsOnFloor = useMemo(
    () => Array.from(baseCoordsById.values()).some((c) => c.isCustom),
    [baseCoordsById]
  );

  // Construir mesas del plano combinando los grupos unidos + trazas arquitectónicas de origen
  const { mesasDelPlano, mergedGhostLinks } = useMemo(() => {
    const byId = new Map(mesasBase.map((m) => [m.id, m]));
    const absorbedIds = new Set();
    const groupByPrimary = new Map();

    for (const g of mergedGroups) {
      const validMembers = g.memberIds.filter((id) => byId.has(id));
      if (validMembers.length < 2) continue;
      const primaryId = validMembers.includes(g.primaryId) ? g.primaryId : validMembers[0];
      groupByPrimary.set(primaryId, { ...g, primaryId, memberIds: validMembers });
      for (const id of validMembers) {
        if (id !== primaryId) absorbedIds.add(id);
      }
    }

    const result = [];
    const ghostLinks = [];

    for (const mesa of mesasBase) {
      if (absorbedIds.has(mesa.id)) continue;
      const group = groupByPrimary.get(mesa.id);
      const baseCoord = baseCoordsById.get(mesa.id) || { x: 45, y: 50, wing: 'salon' };

      if (!group) {
        result.push({
          ...mesa,
          renderKey: String(mesa.id),
          isMerged: false,
          memberIds: [mesa.id],
          memberNumbers: [mesa.numero],
          coord: baseCoord
        });
        continue;
      }

      const members = group.memberIds.map((id) => byId.get(id)).filter(Boolean);
      const memberCoords = members.map((m) => baseCoordsById.get(m.id)).filter(Boolean);
      const mergedCoord = computeMergedPlacement(
        memberCoords,
        baseCoord,
        members.length,
        group.customPos || null
      );

      for (const member of members) {
        const originCoord = baseCoordsById.get(member.id);
        if (!originCoord) continue;
        const dist = Math.hypot(originCoord.x - mergedCoord.x, originCoord.y - mergedCoord.y);
        if (dist > 3.5) {
          ghostLinks.push({
            id: `${group.id}-${member.id}`,
            numero: member.numero,
            fromX: originCoord.x,
            fromY: originCoord.y,
            toX: mergedCoord.x,
            toY: mergedCoord.y
          });
        }
      }

      const occupiedMember = members.find((m) => m.estado === 'ocupada');
      const cleaningMember = members.find((m) => m.estado === 'limpieza');
      const estadoCombinado = occupiedMember
        ? 'ocupada'
        : cleaningMember
        ? 'limpieza'
        : 'libre';

      const capacidadTotal = members.reduce((sum, m) => sum + (Number(m.capacidad) || 0), 0);
      const personasTotal = occupiedMember
        ? members.reduce((sum, m) => sum + (m.estado === 'ocupada' ? Number(m.personas) || 0 : 0), 0)
        : capacidadTotal;

      result.push({
        ...mesa,
        renderKey: group.id,
        mergeGroupId: group.id,
        isMerged: true,
        shape:
          mergedCoord.orientation === 'vertical'
            ? 'merged_banquet_vertical'
            : 'merged_banquet_horizontal',
        numero: members.map((m) => m.numero).join(' + '),
        memberIds: members.map((m) => m.id),
        memberNumbers: members.map((m) => m.numero),
        capacidad: capacidadTotal,
        estado: estadoCombinado,
        comensal: occupiedMember?.comensal || null,
        personas: personasTotal || capacidadTotal,
        tiempoStr: occupiedMember?.tiempoStr || cleaningMember?.tiempoStr || mesa.tiempoStr,
        mesero: occupiedMember?.mesero || mesa.mesero,
        verified: members.some((m) => m.verified),
        coord: mergedCoord
      });
    }

    return { mesasDelPlano: result, mergedGhostLinks: ghostLinks };
  }, [mesasBase, mergedGroups, baseCoordsById]);

  // Fusionar 2 o más mesas (o grupos ya fusionados)
  const handleMergeKeys = useCallback(
    (renderKeys, preferredTargetKey = null) => {
      const uniqueKeys = Array.from(new Set(renderKeys.filter(Boolean)));
      if (uniqueKeys.length < 2) return;

      const selectedMesas = uniqueKeys
        .map((key) => mesasDelPlano.find((m) => m.renderKey === key))
        .filter(Boolean);
      if (selectedMesas.length < 2) return;

      const targetMesa =
        (preferredTargetKey && selectedMesas.find((m) => m.renderKey === preferredTargetKey)) ||
        selectedMesas[0];

      const combinedMemberIds = Array.from(
        new Set(selectedMesas.flatMap((m) => m.memberIds))
      );
      if (combinedMemberIds.length < 2) return;

      const newGroupId = `merge-${Date.now()}`;
      setMergeHistory((prev) => [...prev.slice(-19), mergedGroups]);
      setMergedGroups((prev) => {
        const remaining = prev.filter(
          (g) => !g.memberIds.some((id) => combinedMemberIds.includes(id))
        );
        return [
          ...remaining,
          {
            id: newGroupId,
            primaryId: targetMesa.id,
            memberIds: combinedMemberIds
          }
        ];
      });

      setRecentlyMergedKey(newGroupId);
      setTimeout(() => setRecentlyMergedKey(null), 650);
      setSelectedGroupKeys([]);
      setIsGroupingMode(false);
      if (soundEnabled) playSound('success');
    },
    [mesasDelPlano, mergedGroups, soundEnabled]
  );

  const handleMergeTables = useCallback(
    (sourceRenderKey, targetRenderKey) => {
      if (!sourceRenderKey || !targetRenderKey || sourceRenderKey === targetRenderKey) return;
      handleMergeKeys([targetRenderKey, sourceRenderKey], targetRenderKey);
    },
    [handleMergeKeys]
  );

  // Separar un grupo unido específico
  const handleUnmergeGroup = useCallback(
    (mergeGroupId) => {
      if (!mergeGroupId) return;
      setMergeHistory((prev) => [...prev.slice(-19), mergedGroups]);
      setMergedGroups((prev) => prev.filter((g) => g.id !== mergeGroupId));
      setSelectedMesa((prev) => (prev?.mergeGroupId === mergeGroupId ? null : prev));
      if (soundEnabled) playSound('toggle');
    },
    [mergedGroups, soundEnabled]
  );

  // Deshacer última acción de unión / separación
  const handleUndoMerge = useCallback(() => {
    if (mergeHistory.length === 0) return;
    const previous = mergeHistory[mergeHistory.length - 1];
    setMergeHistory((prev) => prev.slice(0, -1));
    setMergedGroups(previous);
    setSelectedMesa(null);
    if (soundEnabled) playSound('toggle');
  }, [mergeHistory, soundEnabled]);

  // Separar todas las mesas unidas de la sucursal actual
  const handleResetAllMerges = useCallback(() => {
    if (mergedGroups.length === 0) return;
    setMergeHistory((prev) => [...prev.slice(-19), mergedGroups]);
    setMergedGroups([]);
    setSelectedMesa(null);
    if (soundEnabled) playSound('toggle');
  }, [mergedGroups, soundEnabled]);

  // Restablecer posiciones personalizadas del piso activo al acomodo arquitectónico original
  const handleResetFloorPositions = useCallback(async () => {
    const floorMesaIds = mesasBase.map((m) => m.id);
    if (floorMesaIds.length === 0) return;

    setLocalPositions((prev) => {
      const next = { ...prev };
      for (const id of floorMesaIds) delete next[id];
      return next;
    });

    setMergedGroups((prev) =>
      prev.map((g) => {
        if (!g.memberIds.some((id) => floorMesaIds.includes(id))) return g;
        const { customPos: _removed, ...rest } = g;
        return rest;
      })
    );

    if (onMoveMesa) {
      for (const mesa of mesasBase) {
        if (mesa.posX !== null || mesa.posY !== null) {
          await onMoveMesa(mesa.id, { posX: null, posY: null });
        }
      }
    }
    if (soundEnabled) playSound('toggle');
  }, [mesasBase, onMoveMesa, soundEnabled]);

  // =========================================================================
  // Arrastre libre con puntero (1:1 fluido en mouse y touch + soltar para agrupar)
  // =========================================================================
  const mesasDelPlanoRef = useRef(mesasDelPlano);
  useEffect(() => {
    mesasDelPlanoRef.current = mesasDelPlano;
  }, [mesasDelPlano]);

  const findDropTarget = useCallback((draggedRenderKey, xPct, yPct) => {
    let closestKey = null;
    let closestDist = Infinity;

    for (const candidate of mesasDelPlanoRef.current) {
      if (candidate.renderKey === draggedRenderKey) continue;
      const dx = Math.abs(candidate.coord.x - xPct);
      const dy = Math.abs(candidate.coord.y - yPct);
      if (dx < 5.4 && dy < 8.8) {
        const dist = Math.hypot(dx, dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestKey = candidate.renderKey;
        }
      }
    }

    return closestKey;
  }, []);

  const startPointerDrag = (e, mesa) => {
    if (isGroupingMode) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button')) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
    const pointerY = ((e.clientY - rect.top) / rect.height) * 100;

    const dragSession = {
      renderKey: mesa.renderKey,
      mesaId: mesa.id,
      isMerged: mesa.isMerged,
      mergeGroupId: mesa.mergeGroupId || null,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: mesa.coord.x - pointerX,
      offsetY: mesa.coord.y - pointerY,
      x: mesa.coord.x,
      y: mesa.coord.y,
      moved: false
    };

    const handlePointerMove = (moveEvent) => {
      const distPx = Math.hypot(
        moveEvent.clientX - dragSession.startClientX,
        moveEvent.clientY - dragSession.startClientY
      );
      if (!dragSession.moved && distPx < 6) return;

      dragSession.moved = true;
      const currentRect = canvas.getBoundingClientRect();
      const rawX = ((moveEvent.clientX - currentRect.left) / currentRect.width) * 100 + dragSession.offsetX;
      const rawY = ((moveEvent.clientY - currentRect.top) / currentRect.height) * 100 + dragSession.offsetY;
      const clamped = clampPlanCoords(rawX, rawY);

      dragSession.x = clamped.x;
      dragSession.y = clamped.y;

      setActiveDrag({
        renderKey: dragSession.renderKey,
        x: clamped.x,
        y: clamped.y
      });

      const targetKey = findDropTarget(dragSession.renderKey, clamped.x, clamped.y);
      setDragHoverTargetKey(targetKey);
    };

    const finishDrag = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);

      setActiveDrag(null);
      setDragHoverTargetKey(null);

      if (!dragSession.moved) return;

      suppressNextClickRef.current = true;
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 120);

      const targetKey = findDropTarget(dragSession.renderKey, dragSession.x, dragSession.y);
      if (targetKey) {
        handleMergeTables(dragSession.renderKey, targetKey);
        return;
      }

      // Soltado en espacio libre → guardar nueva ubicación en el plano
      if (dragSession.isMerged && dragSession.mergeGroupId) {
        setMergedGroups((prev) =>
          prev.map((g) =>
            g.id === dragSession.mergeGroupId
              ? { ...g, customPos: { x: dragSession.x, y: dragSession.y } }
              : g
          )
        );
      } else {
        setLocalPositions((prev) => ({
          ...prev,
          [dragSession.mesaId]: { x: dragSession.x, y: dragSession.y }
        }));
        if (onMoveMesa) {
          onMoveMesa(dragSession.mesaId, {
            posX: dragSession.x,
            posY: dragSession.y,
            piso: activeFloor?.id || 'planta-baja'
          });
        }
      }

      if (soundEnabled) playSound('toggle');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  };

  // =========================================================================
  // Alta y eliminación de mesas (solo Admin)
  // =========================================================================
  const pickDefaultZoneForFloor = useCallback(
    (floorId) => {
      if (zonasDetalle.length === 0) return '';
      if (floorId === 'planta-alta') {
        const ludoteca = zonasDetalle.find((z) =>
          String(z.nombre || '').toLowerCase().includes('ludoteca')
        );
        return String((ludoteca || zonasDetalle[0]).id);
      }
      const salon = zonasDetalle.find((z) =>
        String(z.nombre || '').toLowerCase().includes('sal')
      );
      return String((salon || zonasDetalle[0]).id);
    },
    [zonasDetalle]
  );

  const openAddMesaModal = () => {
    const floorId = activeFloor?.id || 'planta-baja';
    setNewMesaForm({
      numero: suggestNextTableNumber(mesasSucursal, floorId),
      capacidad: 4,
      forma: 'squircle',
      piso: floorId,
      zonaId: pickDefaultZoneForFloor(floorId),
      notas: ''
    });
    setShowAddModal(true);
    if (soundEnabled) playSound('toggle');
  };

  const handleFloorChangeInAddModal = (nextFloorId) => {
    setNewMesaForm((prev) => ({
      ...prev,
      piso: nextFloorId,
      numero: suggestNextTableNumber(mesasSucursal, nextFloorId),
      zonaId: pickDefaultZoneForFloor(nextFloorId)
    }));
  };

  const handleSubmitNewMesa = async (e) => {
    e.preventDefault();
    if (!onCreateMesa || !sucursalDelPlano) return;

    const targetFloor = floors.find((f) => f.id === newMesaForm.piso) || activeFloor;
    const targetFloorCoords = buildBaseCoordinates(
      (targetFloor?.mesas || []).map((m) => ({
        ...m,
        posX: m.posX ?? null,
        posY: m.posY ?? null
      })),
      targetFloor,
      localPositions
    );
    const openSpot = findOpenSpotForNewTable(targetFloorCoords, targetFloor);

    setSavingNewMesa(true);
    const ok = await onCreateMesa({
      sucursalId: sucursalDelPlano,
      zonaId: newMesaForm.zonaId ? Number(newMesaForm.zonaId) : null,
      numero: String(newMesaForm.numero || '').trim().toUpperCase(),
      capacidad: Number(newMesaForm.capacidad) || 4,
      forma: newMesaForm.forma,
      notas: newMesaForm.notas.trim() || null,
      posX: openSpot.x,
      posY: openSpot.y,
      piso: newMesaForm.piso
    });
    setSavingNewMesa(false);

    if (ok) {
      setShowAddModal(false);
      setActiveFloorId(newMesaForm.piso);
      if (soundEnabled) playSound('success');
    }
  };

  const handleConfirmDeleteMesa = async (mesaId) => {
    if (!onDeleteMesa) return;
    const ok = await onDeleteMesa(mesaId);
    if (ok) {
      setSelectedMesa(null);
      setConfirmDeleteId(null);
      setLocalPositions((prev) => {
        const next = { ...prev };
        delete next[mesaId];
        return next;
      });
      if (soundEnabled) playSound('toggle');
    }
  };

  // Actualizar estado en API (si es mesa unida, libera/limpia todos los miembros)
  const handleUpdateStatus = async (mesaObj, nuevoEstado) => {
    if (mesaObj.isMerged && nuevoEstado !== 'ocupada') {
      for (const memberId of mesaObj.memberIds) {
        await onUpdateMesa(memberId, nuevoEstado);
      }
    } else {
      await onUpdateMesa(mesaObj.id, nuevoEstado);
    }

    if (soundEnabled) {
      playSound(nuevoEstado === 'libre' ? 'success' : nuevoEstado === 'ocupada' ? 'coin' : 'toggle');
    }
    setSelectedMesa(null);
  };

  const occupiedCount = mesasDelPlano.filter((t) => t.estado === 'ocupada').length;
  const freeCount = mesasDelPlano.filter((t) => t.estado === 'libre').length;
  const cleaningCount = mesasDelPlano.filter((t) => t.estado === 'limpieza').length;
  const mergedCount = mesasDelPlano.filter((t) => t.isMerged).length;

  // Resumen de selección actual en Modo Agrupar
  const selectedGroupMesas = useMemo(
    () =>
      selectedGroupKeys
        .map((key) => mesasDelPlano.find((m) => m.renderKey === key))
        .filter(Boolean),
    [selectedGroupKeys, mesasDelPlano]
  );
  const selectedGroupCapacity = selectedGroupMesas.reduce(
    (sum, m) => sum + (Number(m.capacidad) || 0),
    0
  );

  const toggleGroupSelection = (renderKey) => {
    setSelectedGroupKeys((prev) =>
      prev.includes(renderKey) ? prev.filter((k) => k !== renderKey) : [...prev, renderKey]
    );
    if (soundEnabled) playSound('toggle');
  };

  // Atajos de teclado: Escape cierra modales o modo agrupar, Ctrl+Z deshace última unión
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false);
        } else if (selectedMesa) {
          setSelectedMesa(null);
          setConfirmDeleteId(null);
        } else if (isGroupingMode) {
          setIsGroupingMode(false);
          setSelectedGroupKeys([]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !selectedMesa && !showAddModal) {
        if (mergeHistory.length > 0) {
          e.preventDefault();
          handleUndoMerge();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMesa, showAddModal, isGroupingMode, mergeHistory.length, handleUndoMerge]);

  const dragOverMesaObj = dragHoverTargetKey
    ? mesasDelPlano.find((m) => m.renderKey === dragHoverTargetKey)
    : null;

  const scaleFactor = manualZoom !== null ? manualZoom / 100 : fitScale;
  const currentZoomPct = Math.round(scaleFactor * 100);
  const isZoomedBeyondFit = manualZoom !== null && scaleFactor > fitScale + 0.02;

  // Arrastrar sobre el fondo del plano con mouse para desplazarse cuando hay zoom (en móvil/tablet el dedo desliza de forma nativa)
  const handleViewportMouseDown = (e) => {
    if (!isZoomedBeyondFit || e.button !== 0) return;
    if (e.target.closest('[data-mesa-node]') || e.target.closest('button')) return;
    const el = viewportRef.current;
    if (!el) return;
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop
    };
    setIsPanningCanvas(true);

    const onMove = (moveEvt) => {
      if (!panStateRef.current) return;
      el.scrollLeft = panStateRef.current.scrollLeft - (moveEvt.clientX - panStateRef.current.startX);
      el.scrollTop = panStateRef.current.scrollTop - (moveEvt.clientY - panStateRef.current.startY);
    };

    const onUp = () => {
      panStateRef.current = null;
      setIsPanningCanvas(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={`admin-surface bg-[#F7F4F0] p-3.5 sm:p-6 relative flex flex-col justify-between select-none ${
        isFullscreen ? 'fixed inset-2 sm:inset-3 z-50 overflow-auto bg-[#F7F4F0]' : 'min-h-[520px] lg:min-h-[760px]'
      }`}
    >
      {/* 1. Barra Superior */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 pb-4 border-b border-[#1F1410]/8">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410]">
                Mesas en Vivo
              </h2>
              {sucursalObj && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FCEAE9] text-[#E12927]">
                  {sucursalObj.nombre}
                </span>
              )}
            </div>
            <p className="text-[11px] font-body text-[#1F1410]/55 mt-0.5">
              {activeFloor?.shortName} · {activeFloor?.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap sm:ml-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E12927]/10 text-[#E12927] font-semibold">
              ● {occupiedCount} ocupadas
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
              ○ {freeCount} libres
            </span>
            {cleaningCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {cleaningCount} limpieza
              </span>
            )}
            {mergedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F1410] text-white font-semibold inline-flex items-center gap-1">
                <Link2 className="w-3 h-3 text-[#FCEAE9]" />
                {mergedCount} {mergedCount === 1 ? 'grupo' : 'grupos'}
              </span>
            )}
          </div>
        </div>

        {/* Controles superiores */}
        <div className="flex items-center gap-2 self-stretch sm:self-end lg:self-auto relative flex-wrap">
          {/* Agregar Mesa (exclusivo Admin) */}
          {puedeAdministrarMesas && onCreateMesa && (
            <button
              type="button"
              onClick={openAddMesaModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1F1410] hover:bg-[#3A2821] text-white shadow-xs transition-all cursor-pointer btn-press"
              title="Agregar una nueva mesa a este plano"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#FCEAE9]" />
              <span>Agregar mesa</span>
            </button>
          )}

          {/* Modo Agrupar Mesas (toque / clic) */}
          <button
            type="button"
            onClick={() => {
              setIsGroupingMode((prev) => {
                if (prev) setSelectedGroupKeys([]);
                return !prev;
              });
              if (soundEnabled) playSound('toggle');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer btn-press border ${
              isGroupingMode
                ? 'bg-[#E12927] text-white border-[#E12927] shadow-sm'
                : 'bg-white text-[#1F1410] border-[#1F1410]/15 hover:bg-[#FCEAE9] hover:border-[#E12927]/30 hover:text-[#E12927]'
            }`}
            title="Seleccionar 2 o más mesas en el plano para agruparlas"
          >
            <Combine className="w-3.5 h-3.5" />
            <span>{isGroupingMode ? 'Salir de agrupar' : 'Agrupar mesas'}</span>
          </button>

          {/* Restablecer acomodo de posiciones */}
          {hasCustomPositionsOnFloor && (
            <button
              type="button"
              onClick={handleResetFloorPositions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#FAF7F5] text-[#1F1410]/80 border border-[#1F1410]/15 shadow-2xs transition-all cursor-pointer btn-press"
              title="Volver a acomodar las mesas en las posiciones base del plano"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer acomodo</span>
            </button>
          )}

          {/* Deshacer última unión */}
          {mergeHistory.length > 0 && (
            <button
              type="button"
              onClick={handleUndoMerge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F1410] hover:bg-[#3A2821] text-white shadow-xs transition-all cursor-pointer btn-press"
              title="Deshacer última unión o separación (Ctrl + Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>
          )}

          {/* Separar todas las mesas unidas */}
          {mergedGroups.length > 0 && (
            <button
              type="button"
              onClick={handleResetAllMerges}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#FCEAE9] text-[#E12927] border border-[#E12927]/25 shadow-2xs transition-all cursor-pointer btn-press"
              title="Separar todas las mesas unidas"
            >
              <Unlink2 className="w-3.5 h-3.5" />
              <span>Separar todas</span>
            </button>
          )}

          {/* Botón Propiedades */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowPropertiesMenu(!showPropertiesMenu);
                if (soundEnabled) playSound('toggle');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                showPropertiesMenu || activePropsCount > 0
                  ? 'bg-white border-[#1F1410]/20 text-[#1F1410]'
                  : 'bg-white border-[#1F1410]/10 text-[#1F1410]/70 hover:bg-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E12927]" />
              <span>Propiedades</span>
              {activePropsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1F1410] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                  {activePropsCount}
                </span>
              )}
            </button>

            {showPropertiesMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#1F1410]/12 shadow-2xl p-4 z-50 animate-menu-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#1F1410]/8 mb-3">
                  <span className="font-bold text-xs text-[#1F1410] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#E12927]" />
                    Propiedades Visibles
                  </span>
                  <button
                    type="button"
                    onClick={clearProperties}
                    className="text-[11px] text-[#E12927] hover:underline font-semibold cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="text-[11px] text-[#1F1410]/60 mb-2.5 font-medium">
                  Elige los datos para mostrar en mesas:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'diningTime', label: 'Tiempo en mesa', icon: Clock },
                    { key: 'customers', label: 'Comensales', icon: Users },
                    { key: 'waiter', label: 'Mesero(a)', icon: UserPlus },
                    { key: 'reservations', label: 'Reservación', icon: Utensils },
                    { key: 'items', label: 'Platillos', icon: Receipt }
                  ].map((prop) => {
                    const isSelected = visibleProperties[prop.key];
                    const Icon = prop.icon;

                    return (
                      <button
                        key={prop.key}
                        type="button"
                        onClick={() => toggleProperty(prop.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#1F1410] text-white border-[#1F1410] shadow-2xs'
                            : 'bg-[#FAF7F5] text-[#1F1410]/70 border-[#1F1410]/10 hover:border-[#1F1410]/30'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{prop.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Asignar Walk-In */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              onOpenWalkInModal();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E12927] hover:bg-[#c9201f] text-white rounded-full text-xs font-semibold shadow-xs transition-transform hover:scale-102 cursor-pointer btn-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Asignar Walk-in</span>
          </button>
        </div>
      </div>

      {/* 1.5 Selector de Pisos + Cinta de Movimiento Libre / Agrupación */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3.5 pb-1">
        {/* Pestañas de Pisos */}
        <div className="flex items-center gap-2 flex-wrap">
          {floors.map((floor) => {
            const isActive = floor.id === activeFloor?.id;
            const floorOccupied = floor.mesas.filter((m) => m.estado === 'ocupada').length;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => {
                  setActiveFloorId(floor.id);
                  setSelectedGroupKeys([]);
                  setActiveDrag(null);
                  setDragHoverTargetKey(null);
                  if (soundEnabled) playSound('toggle');
                }}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border text-left transition-all cursor-pointer btn-press ${
                  isActive
                    ? 'bg-[#1F1410] text-white border-[#1F1410] shadow-sm'
                    : 'bg-white text-[#1F1410] border-[#1F1410]/10 hover:border-[#E12927]/35 hover:bg-[#FCEAE9]/40'
                }`}
              >
                <Layers
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FCEAE9]' : 'text-[#E12927]'}`}
                />
                <div className="leading-tight">
                  <div className="text-xs font-bold">{floor.shortName}</div>
                  <div
                    className={`text-[10px] font-mono ${
                      isActive ? 'text-white/70' : 'text-[#1F1410]/55'
                    }`}
                  >
                    {floor.mesas.length} mesas
                    {floorOccupied > 0 ? ` · ${floorOccupied} ocup.` : ' · todas libres'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Barra contextual: Modo Agrupar o tip de movimiento libre */}
        {isGroupingMode ? (
          <div className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl bg-[#FCEAE9] border border-[#E12927]/30 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-[#1F1410]">
              <Combine className="w-4 h-4 text-[#E12927] shrink-0" />
              {selectedGroupMesas.length === 0 ? (
                <span className="font-medium">
                  Toca <strong>2 o más mesas</strong> en el plano para unirlas
                </span>
              ) : (
                <span className="font-mono text-[11px] font-bold">
                  Seleccionadas:{' '}
                  <span className="text-[#E12927]">
                    {selectedGroupMesas.map((m) => m.numero).join(' + ')}
                  </span>{' '}
                  ({selectedGroupCapacity} sillas)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={selectedGroupKeys.length < 2}
                onClick={() => handleMergeKeys(selectedGroupKeys)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedGroupKeys.length >= 2
                    ? 'bg-[#E12927] hover:bg-[#c9201f] text-white shadow-xs btn-press'
                    : 'bg-[#1F1410]/10 text-[#1F1410]/40 cursor-not-allowed'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>
                  Unir {selectedGroupKeys.length >= 2 ? `${selectedGroupKeys.length} mesas` : ''}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGroupingMode(false);
                  setSelectedGroupKeys([]);
                }}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-[#1F1410]/70 hover:bg-white/70 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-body text-[#1F1410]/65 px-1 flex-wrap">
            <Move className="w-3.5 h-3.5 text-[#E12927] shrink-0" />
            <span>
              <strong className="text-[#1F1410]">Arrastra cualquier mesa</strong> para moverla
              libremente por el plano, o <strong className="text-[#1F1410]">suéltala sobre otra</strong>{' '}
              para agruparlas.
            </span>
            {activeDrag && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                  dragHoverTargetKey ? 'bg-[#E12927] animate-pulse' : 'bg-[#1F1410]'
                }`}
              >
                {dragHoverTargetKey ? 'Suelta para agrupar' : 'Suelta para fijar posición'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Lienzo Arquitectónico del Piso */}
      <div
        ref={viewportRef}
        onMouseDown={handleViewportMouseDown}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y'
        }}
        className={`my-3 w-full min-w-0 rounded-2xl bg-[#EFEAE4]/80 border border-[#1F1410]/10 shadow-inner overflow-x-auto overflow-y-auto overscroll-x-contain p-2.5 sm:p-5 ${
          isZoomedBeyondFit
            ? isPanningCanvas
              ? 'cursor-grabbing max-h-[72vh]'
              : 'cursor-grab max-h-[72vh]'
            : ''
        }`}
      >
        <div
          className={`${isZoomedBeyondFit ? '' : 'mx-auto'} shrink-0 transition-[width,height] duration-200`}
          style={{
            width: `${Math.round(CANVAS_BASE_WIDTH * scaleFactor)}px`,
            height: `${Math.round(CANVAS_BASE_HEIGHT * scaleFactor)}px`
          }}
        >
          <div
            ref={canvasRef}
            style={{
              width: `${CANVAS_BASE_WIDTH}px`,
              height: `${CANVAS_BASE_HEIGHT}px`,
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top left'
            }}
            className="relative rounded-xl overflow-hidden shadow-md bg-[#FFFDFB]"
          >
            {/* Plano arquitectónico SVG (muros, ventanas, puertas, barra, patio, etc.) */}
            <FloorPlanArchitecturalSvg
              variant={activeFloor?.variant || 'planta_baja'}
              floorLabel={activeFloor?.shortName}
            />

            {/* Capa SVG de conexiones de mesas unidas y línea guía de agrupación */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              {mergedGhostLinks.map((link) => (
                <line
                  key={`line-${link.id}`}
                  x1={link.fromX}
                  y1={link.fromY}
                  x2={link.toX}
                  y2={link.toY}
                  stroke="#E12927"
                  strokeOpacity="0.42"
                  strokeWidth="0.32"
                  strokeDasharray="1.1 0.9"
                />
              ))}

              {activeDrag && dragOverMesaObj && (
                <line
                  x1={activeDrag.x}
                  y1={activeDrag.y}
                  x2={dragOverMesaObj.coord.x}
                  y2={dragOverMesaObj.coord.y}
                  stroke="#E12927"
                  strokeOpacity="0.9"
                  strokeWidth="0.55"
                  strokeDasharray="1.4 0.8"
                />
              )}
            </svg>

            {/* Huellas sutiles de origen para mesas absorbidas en una unión */}
            {mergedGhostLinks.map((ghost) => (
              <div
                key={`ghost-${ghost.id}`}
                style={{ left: `${ghost.fromX}%`, top: `${ghost.fromY}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
              >
                <div className="px-2 py-1 rounded-lg border border-dashed border-[#1F1410]/25 bg-white/75 text-[9px] font-mono font-bold text-[#1F1410]/45 shadow-2xs">
                  {ghost.numero} →
                </div>
              </div>
            ))}

            {/* Mesas interactivas posicionadas exactamente sobre el plano */}
            {mesasDelPlano.map((mesa) => renderTableOnPlan(mesa))}

            {mesasDelPlano.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
                <p className="px-4 py-2 rounded-full bg-white/90 border border-[#1F1410]/10 text-xs font-body text-[#1F1410]/60 shadow-xs">
                  No hay mesas registradas en {activeFloor?.shortName}.
                </p>
                {puedeAdministrarMesas && onCreateMesa && (
                  <button
                    type="button"
                    onClick={openAddMesaModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E12927] text-white text-xs font-semibold shadow-sm hover:bg-[#c9201f] cursor-pointer btn-press"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Agregar primera mesa</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Barra Inferior: Zoom, Leyenda y Pantalla Completa */}
      <div className="pt-4 border-t border-[#1F1410]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Controles de Zoom + Ajuste automático */}
        <div className="flex items-center bg-white border border-[#1F1410]/10 rounded-full shadow-2xs p-1 gap-0.5">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(Math.round(fitScale * 100), currentZoomPct - 15);
              setManualZoom(next <= Math.round(fitScale * 100) + 2 ? null : next);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Alejar plano"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setManualZoom(null)}
            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold cursor-pointer transition-colors ${
              manualZoom === null
                ? 'bg-[#FCEAE9] text-[#E12927]'
                : 'text-[#1F1410]/70 hover:text-[#E12927]'
            }`}
            title="Ajustar plano completo a la pantalla"
          >
            {manualZoom === null ? `Ajustar (${currentZoomPct}%)` : `${currentZoomPct}%`}
          </button>
          <button
            type="button"
            onClick={() => setManualZoom(Math.min(130, currentZoomPct + 15))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Acercar plano"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 sm:gap-5 text-xs font-mono text-[#1F1410]/80 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-white border-2 border-[#78716C]/55 shadow-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span className="font-bold text-[#334155]">Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#E12927] border border-[#C9201F] shadow-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span className="font-bold text-[#E12927]">Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#FEF3C7] border-2 border-[#F59E0B] shadow-xs flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            </span>
            <span className="font-bold text-amber-900">Limpieza</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#1F1410] border border-[#1F1410] shadow-xs flex items-center justify-center">
              <Link2 className="w-2.5 h-2.5 text-white" />
            </span>
            <span className="font-bold text-[#1F1410]">Mesas Agrupadas</span>
          </div>
        </div>

        {/* Pantalla Completa */}
        <button
          type="button"
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            if (soundEnabled) playSound('toggle');
          }}
          className="w-8 h-8 rounded-full bg-white border border-[#1F1410]/10 flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer shadow-2xs"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 4. Modal de Gestión de Mesa */}
      {selectedMesa &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
            onClick={() => {
              setSelectedMesa(null);
              setConfirmDeleteId(null);
            }}
          >
            <div
              className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`min-w-12 h-12 px-2.5 rounded-2xl flex items-center justify-center font-display font-bold text-base sm:text-lg shadow-xs shrink-0 ${
                      selectedMesa.estado === 'ocupada'
                        ? 'bg-[#E12927] text-white shadow-md shadow-[#E12927]/30 border border-[#C9201F]'
                        : selectedMesa.estado === 'limpieza'
                        ? 'bg-amber-100 text-amber-950 border-2 border-[#F59E0B]'
                        : 'bg-[#E2E8F0] border-2 border-[#94A3B8] text-[#1F1410]'
                    }`}
                  >
                    {selectedMesa.isMerged ? <Link2 className="w-5 h-5" /> : selectedMesa.numero}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410] truncate">
                      {selectedMesa.isMerged
                        ? `Mesas Unidas (${selectedMesa.numero})`
                        : `Mesa ${selectedMesa.numero}`}
                    </h3>
                    <span className="text-xs font-mono text-[#1F1410]/60 block font-semibold mt-0.5">
                      {selectedMesa.zona || activeFloor?.shortName} · {selectedMesa.capacidad}{' '}
                      sillas
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMesa(null);
                    setConfirmDeleteId(null);
                  }}
                  className="w-8 h-8 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Cerrar modal (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 mb-6 font-body text-xs">
                <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-[#1F1410]/8 space-y-2.5 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-[#1F1410]/60">Estado en sala:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        selectedMesa.estado === 'ocupada'
                          ? 'bg-[#E12927] text-white shadow-xs'
                          : selectedMesa.estado === 'limpieza'
                          ? 'bg-amber-200 text-amber-950 border border-amber-400'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {selectedMesa.estado === 'ocupada'
                        ? 'Ocupada en Servicio'
                        : selectedMesa.estado === 'limpieza'
                        ? 'En Limpieza'
                        : 'Libre y Lista'}
                    </span>
                  </div>
                  {selectedMesa.isMerged && (
                    <div className="flex justify-between items-center pt-1 border-t border-[#1F1410]/5">
                      <span className="text-[#1F1410]/60">Mesas combinadas:</span>
                      <strong className="text-[#1F1410] text-xs">
                        {selectedMesa.memberNumbers.join(' + ')}
                      </strong>
                    </div>
                  )}
                  {selectedMesa.comensal && (
                    <div className="flex justify-between items-center pt-1 border-t border-[#1F1410]/5">
                      <span className="text-[#1F1410]/60">Comensal:</span>
                      <strong className="text-[#1F1410] text-xs">{selectedMesa.comensal}</strong>
                    </div>
                  )}
                  {selectedMesa.tiempoStr && selectedMesa.estado !== 'libre' && (
                    <div className="flex justify-between items-center pt-1 border-t border-[#1F1410]/5">
                      <span className="text-[#1F1410]/60">Tiempo transcurrido:</span>
                      <strong className="text-[#1F1410] text-xs">{selectedMesa.tiempoStr}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-[#1F1410]/5">
                    <span className="text-[#1F1410]/60">Atendido por:</span>
                    <span className="font-semibold text-xs text-[#1F1410]">
                      {selectedMesa.mesero}
                    </span>
                  </div>
                  {selectedMesa.notas && (
                    <div className="pt-1 border-t border-[#1F1410]/5 text-[#1F1410]/70">
                      <span className="block text-[10px] text-[#1F1410]/50 uppercase">Notas:</span>
                      <span>{selectedMesa.notas}</span>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMesa, 'ocupada')}
                    className="w-full py-3 bg-[#E12927] hover:bg-[#b51c1a] text-white font-semibold rounded-full shadow-md shadow-[#E12927]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Marcar Ocupada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMesa, 'limpieza')}
                    className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold rounded-full border-2 border-amber-300 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Marcar en Limpieza &amp; Sanitización</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMesa, 'libre')}
                    className="w-full py-3 bg-[#E2E8F0] hover:bg-[#CBD5E1] border-2 border-[#94A3B8] text-[#1F1410] font-semibold rounded-full shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Liberar Mesa (Disponible)</span>
                  </button>

                  {selectedMesa.isMerged && (
                    <button
                      type="button"
                      onClick={() => handleUnmergeGroup(selectedMesa.mergeGroupId)}
                      className="w-full py-3 bg-[#1F1410] hover:bg-[#3A2821] text-white font-semibold rounded-full shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      <Unlink2 className="w-3.5 h-3.5" />
                      <span>Separar mesas (Deshacer unión)</span>
                    </button>
                  )}

                  {/* Eliminar mesa (solo Admin, mesa individual no ocupada) */}
                  {puedeAdministrarMesas &&
                    onDeleteMesa &&
                    !selectedMesa.isMerged &&
                    selectedMesa.estado !== 'ocupada' && (
                      <div className="pt-2 border-t border-[#1F1410]/8">
                        {confirmDeleteId === selectedMesa.id ? (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#FCEAE9] border border-[#E12927]/30">
                            <span className="text-[11px] font-semibold text-[#1F1410]">
                              ¿Quitar {selectedMesa.numero} del plano?
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteMesa(selectedMesa.id)}
                                className="px-3 py-1 rounded-full bg-[#E12927] text-white text-[11px] font-bold cursor-pointer hover:bg-[#b51c1a]"
                              >
                                Sí, eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 rounded-full bg-white text-[#1F1410]/70 text-[11px] font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(selectedMesa.id)}
                            className="w-full py-2.5 rounded-full text-[11px] font-semibold text-[#E12927] hover:bg-[#FCEAE9] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar mesa del plano</span>
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F1410]/8 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMesa(null);
                    setConfirmDeleteId(null);
                  }}
                  className="px-5 py-2 text-xs text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] rounded-full font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. Modal Agregar Nueva Mesa (Solo Admin) */}
      {showAddModal &&
        puedeAdministrarMesas &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-lg w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                      Agregar Nueva Mesa
                    </h3>
                    <p className="text-xs font-mono text-[#1F1410]/55">
                      {sucursalObj?.nombre || 'Sucursal activa'} · Podrás moverla libremente al
                      crearla
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewMesa} className="space-y-4 text-xs">
                {/* Piso del plano */}
                <div>
                  <label className="block font-bold text-[#1F1410] mb-1.5">Piso en el plano</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'planta-baja', label: 'Piso 1 · Planta Baja', sub: 'Salón, Barra & Patio' },
                      { id: 'planta-alta', label: 'Piso 2 · Planta Alta', sub: 'Ludoteca & Balcón' }
                    ].map((opt) => {
                      const active = newMesaForm.piso === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleFloorChangeInAddModal(opt.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-[#1F1410] text-white border-[#1F1410] shadow-xs'
                              : 'bg-[#FAF7F5] text-[#1F1410] border-[#1F1410]/10 hover:border-[#E12927]/40'
                          }`}
                        >
                          <div className="font-bold text-xs">{opt.label}</div>
                          <div
                            className={`text-[10px] font-mono mt-0.5 ${
                              active ? 'text-white/70' : 'text-[#1F1410]/55'
                            }`}
                          >
                            {opt.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Número + Zona */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1F1410] mb-1.5">
                      Clave / Número de mesa *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={newMesaForm.numero}
                      onChange={(e) =>
                        setNewMesaForm((prev) => ({
                          ...prev,
                          numero: e.target.value.toUpperCase()
                        }))
                      }
                      placeholder="Ej. M09, L05, P01"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/12 font-mono font-bold text-[#1F1410] uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1F1410] mb-1.5">Zona</label>
                    <select
                      value={newMesaForm.zonaId}
                      onChange={(e) =>
                        setNewMesaForm((prev) => ({ ...prev, zonaId: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/12 text-[#1F1410] font-medium"
                    >
                      <option value="">Sin zona específica</option>
                      {zonasDetalle.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Capacidad */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[#1F1410]">Capacidad (sillas) *</label>
                    <span className="font-mono text-[11px] font-bold text-[#E12927]">
                      {newMesaForm.capacidad} personas
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[2, 4, 6, 8, 10, 12].map((cap) => {
                      const active = Number(newMesaForm.capacidad) === cap;
                      return (
                        <button
                          key={cap}
                          type="button"
                          onClick={() =>
                            setNewMesaForm((prev) => ({
                              ...prev,
                              capacidad: cap,
                              forma:
                                cap >= 6 && prev.forma === 'circle'
                                  ? 'rectangle_horizontal'
                                  : prev.forma
                            }))
                          }
                          className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#E12927] text-white border-[#E12927]'
                              : 'bg-[#FAF7F5] text-[#1F1410] border-[#1F1410]/12 hover:border-[#E12927]/40'
                          }`}
                        >
                          {cap}
                        </button>
                      );
                    })}
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={newMesaForm.capacidad}
                      onChange={(e) =>
                        setNewMesaForm((prev) => ({
                          ...prev,
                          capacidad: Math.max(1, Math.min(60, Number(e.target.value) || 1))
                        }))
                      }
                      className="w-20 px-3 py-1.5 rounded-full bg-[#FAF7F5] border border-[#1F1410]/12 font-mono font-bold text-center text-[#1F1410]"
                    />
                  </div>
                </div>

                {/* Forma visual */}
                <div>
                  <label className="block font-bold text-[#1F1410] mb-1.5">
                    Forma de la mesa en el plano
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FORMAS_MESA.map((forma) => {
                      const active = newMesaForm.forma === forma.id;
                      return (
                        <button
                          key={forma.id}
                          type="button"
                          onClick={() => setNewMesaForm((prev) => ({ ...prev, forma: forma.id }))}
                          className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            active
                              ? 'bg-[#FCEAE9] border-[#E12927] text-[#1F1410] shadow-xs'
                              : 'bg-[#FAF7F5] border-[#1F1410]/10 text-[#1F1410]/70 hover:border-[#1F1410]/30'
                          }`}
                        >
                          <span
                            className={`border-2 ${
                              active
                                ? 'border-[#E12927] bg-white'
                                : 'border-[#1F1410]/40 bg-white/80'
                            } ${
                              forma.id === 'circle'
                                ? 'w-7 h-7 rounded-full'
                                : forma.id === 'rectangle_horizontal'
                                ? 'w-10 h-5 rounded-md'
                                : forma.id === 'rectangle_vertical'
                                ? 'w-5 h-9 rounded-md'
                                : 'w-7 h-7 rounded-lg'
                            }`}
                          />
                          <span className="font-bold text-[11px] leading-none">{forma.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notas opcionales */}
                <div>
                  <label className="block font-bold text-[#1F1410] mb-1.5">
                    Notas de ubicación (opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={newMesaForm.notas}
                    onChange={(e) =>
                      setNewMesaForm((prev) => ({ ...prev, notas: e.target.value }))
                    }
                    placeholder="Ej. Cerca de la ventana, pet friendly, con contacto eléctrico..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/12 text-[#1F1410]"
                  />
                </div>

                {/* Botones */}
                <div className="pt-3 border-t border-[#1F1410]/8 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold text-[#1F1410]/65 hover:bg-[#FAF7F5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewMesa || !newMesaForm.numero.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#E12927]/25 transition-all cursor-pointer btn-press flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{savingNewMesa ? 'Agregando...' : 'Agregar al plano'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );

  // =========================================================================
  // Renderizador de cada mesa posicionada en su coordenada del plano
  // =========================================================================
  function renderTableOnPlan(mesa) {
    const isFree = mesa.estado === 'libre';
    const isOccupied = mesa.estado === 'ocupada';
    const isCleaning = mesa.estado === 'limpieza';
    const isBeingDragged = activeDrag?.renderKey === mesa.renderKey;

    const liveX = isBeingDragged ? activeDrag.x : mesa.coord?.x ?? 45;
    const liveY = isBeingDragged ? activeDrag.y : mesa.coord?.y ?? 50;
    const inPatioNow = liveX >= PATIO_SPLIT_PERCENT;
    const isCompact = mesa.coord?.compact ?? inPatioNow;

    const isDropTarget = dragHoverTargetKey === mesa.renderKey;
    const isRecentlyMerged = recentlyMergedKey === mesa.renderKey;
    const groupSelectIdx = selectedGroupKeys.indexOf(mesa.renderKey);
    const isSelectedForGroup = groupSelectIdx !== -1;

    const dragStateClass = `${
      isGroupingMode ? 'cursor-pointer' : isBeingDragged ? 'cursor-grabbing' : 'mesa-draggable'
    } ${isBeingDragged ? 'scale-105 drop-shadow-2xl' : ''} ${
      isDropTarget ? 'mesa-drop-target' : ''
    } ${isRecentlyMerged ? 'mesa-merged-pop' : ''}`;

    const pointerProps = {
      onPointerDown: (e) => startPointerDrag(e, mesa),
      style: { touchAction: isGroupingMode ? 'auto' : 'none' }
    };

    const handleTableClick = () => {
      if (suppressNextClickRef.current) return;
      if (isGroupingMode) {
        toggleGroupSelection(mesa.renderKey);
        return;
      }
      setConfirmDeleteId(null);
      setSelectedMesa(mesa);
      if (soundEnabled) playSound('toggle');
    };

    const groupRingClass = isSelectedForGroup
      ? 'ring-4 ring-[#E12927] ring-offset-2 ring-offset-[#FFFDFB] scale-105'
      : isBeingDragged
      ? 'ring-4 ring-[#1F1410]/25 ring-offset-2 ring-offset-[#FFFDFB]'
      : isGroupingMode
      ? 'hover:ring-2 hover:ring-[#E12927]/60 hover:ring-offset-2'
      : '';

    const tableSurfaceClass = isOccupied
      ? 'bg-[#E12927] text-white border-2 border-[#B81E1C] shadow-md shadow-[#E12927]/30'
      : isCleaning
      ? 'bg-[#FEF3C7] text-amber-950 border-2 border-dashed border-[#F59E0B] shadow-md shadow-amber-200/50'
      : 'bg-[#FFFFFF] text-[#1F1410] border-2 border-[#78716C]/55 shadow-md shadow-[#1F1410]/10 hover:border-[#1F1410]';

    const chairColorClass = isOccupied
      ? 'bg-[#E12927] border border-[#9E1715] shadow-2xs'
      : isCleaning
      ? 'bg-[#FDE68A] border border-[#D97706] shadow-2xs'
      : 'bg-[#E7E2DC] border-[1.5px] border-[#78716C]/65 shadow-2xs';

    const statusBadge = isSelectedForGroup ? (
      <span className="w-5 h-5 rounded-full bg-[#E12927] text-white text-[10px] font-mono font-extrabold flex items-center justify-center absolute -top-2 -left-2 shadow-md border-2 border-white z-30">
        {groupSelectIdx + 1}
      </span>
    ) : null;

    const wrapPositioned = (children) => (
      <div
        key={mesa.renderKey}
        data-mesa-node="true"
        style={{ left: `${liveX}%`, top: `${liveY}%` }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 ${
          isBeingDragged
            ? 'z-40'
            : isDropTarget || isSelectedForGroup
            ? 'z-30'
            : 'z-20'
        }`}
      >
        {children}
      </div>
    );

    // -----------------------------------------------------------------------
    // 0A. MESA UNIDA VERTICAL (Patio / corredores estrechos)
    // -----------------------------------------------------------------------
    if (mesa.isMerged && (mesa.shape === 'merged_banquet_vertical' || inPatioNow)) {
      const sideChairs = Math.min(4, Math.max(2, Math.ceil((mesa.capacidad - 2) / 2)));
      const heightClass = mesa.memberIds.length >= 3 ? 'h-[192px]' : 'h-[158px]';
      return wrapPositioned(
        <div
          {...pointerProps}
          onClick={handleTableClick}
          className={`relative group hover:scale-103 select-none ${dragStateClass}`}
          title={`Mesas unidas ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra para mover`}
        >
          {statusBadge}
          <div className={`relative w-[86px] ${heightClass} flex items-center justify-center`}>
            <div className="absolute -left-3 inset-y-4 flex flex-col items-center justify-around pointer-events-none">
              {Array.from({ length: sideChairs }).map((_, idx) => (
                <span key={`vl-${idx}`} className={`w-2.5 h-7 rounded-full ${chairColorClass}`} />
              ))}
            </div>
            <div className="absolute -right-3 inset-y-4 flex flex-col items-center justify-around pointer-events-none">
              {Array.from({ length: sideChairs }).map((_, idx) => (
                <span key={`vr-${idx}`} className={`w-2.5 h-7 rounded-full ${chairColorClass}`} />
              ))}
            </div>
            <span className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairColorClass}`} />
            <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairColorClass}`} />

            <div
              className={`w-full h-full rounded-2xl px-1.5 py-2.5 flex flex-col justify-between items-center text-center relative transition-all ring-2 ring-offset-2 ring-[#1F1410]/30 ${tableSurfaceClass} ${groupRingClass}`}
            >
              {!isGroupingMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnmergeGroup(mesa.mergeGroupId);
                  }}
                  title="Separar mesas"
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer z-20"
                >
                  <Unlink2 className="w-3 h-3" />
                </button>
              )}

              <div className="flex flex-col items-center gap-0.5 mt-0.5">
                <Link2 className={`w-3 h-3 ${isOccupied ? 'text-white/85' : 'text-[#E12927]'}`} />
                <span
                  className={`font-display font-bold text-xs leading-tight break-words max-w-[72px] ${
                    isOccupied ? 'text-white' : 'text-[#1F1410]'
                  }`}
                >
                  {mesa.numero}
                </span>
              </div>

              {!isFree && !isCleaning && (
                <div className="space-y-0.5 font-mono text-[8.5px] leading-tight">
                  {mesa.comensal && (
                    <div className="font-bold truncate max-w-[70px] text-white">
                      {mesa.comensal.split(' ')[0]}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="flex items-center justify-center gap-0.5 opacity-90">
                      <Clock className="w-2.5 h-2.5" />
                      {mesa.tiempoStr}
                    </div>
                  )}
                </div>
              )}

              {isCleaning && (
                <span className="text-[8.5px] font-mono font-bold text-amber-950">Limpieza</span>
              )}

              <span
                className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold ${
                  isOccupied ? 'bg-white/20 text-white' : 'bg-[#1F1410] text-white'
                }`}
              >
                {mesa.capacidad}p · Unida
              </span>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // 0B. MESA UNIDA HORIZONTAL (Salón Principal / Ludoteca)
    // -----------------------------------------------------------------------
    if (mesa.isMerged) {
      const topChairsCount = Math.min(5, Math.max(3, Math.ceil((mesa.capacidad - 2) / 2)));
      const widthClass = mesa.memberIds.length >= 3 ? 'w-[224px]' : 'w-[192px]';
      return wrapPositioned(
        <div
          {...pointerProps}
          onClick={handleTableClick}
          className={`relative group hover:scale-103 select-none ${dragStateClass}`}
          title={`Mesas unidas ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra para mover`}
        >
          {statusBadge}
          <div className={`relative ${widthClass} h-[92px] flex items-center justify-center`}>
            <div className="absolute -top-3 inset-x-5 flex items-center justify-around pointer-events-none">
              {Array.from({ length: topChairsCount }).map((_, idx) => (
                <span key={`mt-${idx}`} className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              ))}
            </div>
            <div className="absolute -bottom-3 inset-x-5 flex items-center justify-around pointer-events-none">
              {Array.from({ length: topChairsCount }).map((_, idx) => (
                <span key={`mb-${idx}`} className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              ))}
            </div>
            <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-9 rounded-full ${chairColorClass}`} />
            <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-9 rounded-full ${chairColorClass}`} />

            <div
              className={`w-full h-full rounded-2xl px-3.5 py-2 flex flex-col justify-between items-center text-center relative transition-all ring-2 ring-offset-2 ring-[#1F1410]/30 ${tableSurfaceClass} ${groupRingClass}`}
            >
              {!isGroupingMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnmergeGroup(mesa.mergeGroupId);
                  }}
                  title="Separar mesas (Deshacer unión)"
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer z-20"
                >
                  <Unlink2 className="w-3 h-3" />
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 w-full pr-2">
                <Link2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isOccupied ? 'text-white/85' : 'text-[#E12927]'
                  }`}
                />
                <span
                  className={`font-display font-bold text-sm truncate ${
                    isOccupied ? 'text-white' : 'text-[#1F1410]'
                  }`}
                >
                  {mesa.numero}
                </span>
              </div>

              {!isFree && !isCleaning && (
                <div className="flex items-center justify-center gap-2 font-mono text-[9px] leading-tight">
                  {mesa.comensal && (
                    <span className="font-bold truncate max-w-[90px] text-white">
                      {mesa.comensal}
                    </span>
                  )}
                  {visibleProperties.diningTime && (
                    <span className="flex items-center gap-0.5 opacity-90">
                      <Clock className="w-2.5 h-2.5" />
                      {mesa.tiempoStr}
                    </span>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="font-mono text-[9px] font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  <span>Limpieza {mesa.tiempoStr}</span>
                </div>
              )}

              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                  isOccupied ? 'bg-white/20 text-white' : 'bg-[#1F1410] text-white'
                }`}
              >
                {mesa.capacidad} sillas · Agrupada
              </span>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // 1. MESA RECTANGULAR VERTICAL
    // -----------------------------------------------------------------------
    if (mesa.shape === 'rectangle_vertical') {
      return wrapPositioned(
        <div
          {...pointerProps}
          onClick={handleTableClick}
          className={`relative group hover:scale-105 select-none ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra para mover o agrupar`}
        >
          {statusBadge}
          <div className="relative w-[88px] h-[164px] flex items-center justify-center">
            <span className={`absolute -left-3 top-4 w-2.5 h-8 rounded-full ${chairColorClass}`} />
            <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
            <span className={`absolute -left-3 bottom-4 w-2.5 h-8 rounded-full ${chairColorClass}`} />

            <span className={`absolute -right-3 top-4 w-2.5 h-8 rounded-full ${chairColorClass}`} />
            <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
            <span className={`absolute -right-3 bottom-4 w-2.5 h-8 rounded-full ${chairColorClass}`} />

            <div
              className={`w-full h-full rounded-2xl p-2 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass} ${groupRingClass}`}
            >
              {renderCornerIndicator(isOccupied, isCleaning, isFree)}

              <div
                className={`font-display font-bold text-lg mt-2 ${
                  isOccupied ? 'text-white' : 'text-[#1F1410]'
                }`}
              >
                {mesa.numero}
              </div>

              {!isFree && !isCleaning && (
                <div className="space-y-1 font-mono text-[9px] w-full">
                  {mesa.comensal && (
                    <div className="font-bold text-[9.5px] truncate text-white">
                      {mesa.comensal}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="flex items-center justify-center gap-0.5 opacity-90">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{mesa.tiempoStr}</span>
                    </div>
                  )}
                  {visibleProperties.customers && (
                    <div className="opacity-90 text-[8.5px] flex items-center justify-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      <span>{mesa.personas}p</span>
                    </div>
                  )}
                  {visibleProperties.waiter && (
                    <div className="opacity-85 text-[8px] truncate">{mesa.mesero}</div>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="font-mono text-[9px] font-bold text-amber-950 flex flex-col items-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                  <span>Limpieza</span>
                </div>
              )}

              {isFree && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-mono font-bold border border-emerald-300">
                  Libre
                </span>
              )}

              <span
                className={`text-[8.5px] font-mono uppercase font-bold ${
                  isOccupied ? 'text-white/75' : 'text-[#1F1410]/60'
                }`}
              >
                {mesa.capacidad} sillas
              </span>
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // 2. MESA HORIZONTAL ALARGADA
    // -----------------------------------------------------------------------
    if (mesa.shape === 'rectangle_horizontal') {
      const isEight = mesa.capacidad >= 8;
      return wrapPositioned(
        <div
          {...pointerProps}
          onClick={handleTableClick}
          className={`relative group hover:scale-105 select-none ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra para mover o agrupar`}
        >
          {statusBadge}
          <div
            className={`relative ${
              isEight ? 'w-[176px] h-[82px]' : 'w-[148px] h-[78px]'
            } flex items-center justify-center`}
          >
            <div className="absolute -top-3 inset-x-4 flex items-center justify-around pointer-events-none">
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
            </div>
            <div className="absolute -bottom-3 inset-x-4 flex items-center justify-around pointer-events-none">
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
              <span className={`w-7 h-2.5 rounded-full ${chairColorClass}`} />
            </div>
            {isEight && (
              <>
                <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
                <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
              </>
            )}

            <div
              className={`w-full h-full rounded-2xl px-3 py-2 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass} ${groupRingClass}`}
            >
              {renderCornerIndicator(isOccupied, isCleaning, isFree)}

              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`font-display font-bold text-lg leading-none ${
                    isOccupied ? 'text-white' : 'text-[#1F1410]'
                  }`}
                >
                  {mesa.numero}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isOccupied ? 'bg-white/20 text-white' : 'bg-[#F5EFEB] text-[#1F1410]/75'
                  }`}
                >
                  {mesa.capacidad}p
                </span>
              </div>

              {!isFree && !isCleaning && (
                <div className="flex items-center justify-center gap-2 font-mono text-[8.5px] leading-tight">
                  {mesa.comensal && (
                    <span className="font-bold truncate max-w-[78px] text-white">
                      {mesa.comensal}
                    </span>
                  )}
                  {visibleProperties.diningTime && (
                    <span className="flex items-center gap-0.5 opacity-90">
                      <Clock className="w-2.5 h-2.5" />
                      {mesa.tiempoStr}
                    </span>
                  )}
                  {visibleProperties.customers && (
                    <span className="opacity-85">{mesa.personas}p</span>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="font-mono text-[9px] font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  <span>Limpieza {mesa.tiempoStr}</span>
                </div>
              )}

              {isFree && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[8.5px] font-bold">
                  Disponible
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // 3. MESAS DE 2 SILLAS
    // -----------------------------------------------------------------------
    if (mesa.capacidad <= 2) {
      const isCircle = mesa.shape === 'circle' || mesa.coord?.chairsLayout === 'lr';
      const chairsLR = mesa.coord?.chairsLayout ? mesa.coord.chairsLayout === 'lr' : !isCircle;
      const sizeClass = isCompact ? 'w-[66px] h-[66px]' : 'w-[76px] h-[76px]';

      return wrapPositioned(
        <div
          {...pointerProps}
          onClick={handleTableClick}
          className={`relative group hover:scale-105 select-none ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · 2 sillas · Arrastra para mover o agrupar`}
        >
          {statusBadge}
          <div className={`relative ${sizeClass} flex items-center justify-center`}>
            {chairsLR ? (
              <>
                <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
                <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairColorClass}`} />
              </>
            ) : (
              <>
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairColorClass}`} />
                <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairColorClass}`} />
              </>
            )}

            <div
              className={`w-full h-full flex flex-col items-center justify-center p-1.5 relative transition-all ${
                isCircle ? 'rounded-full' : 'rounded-2xl'
              } ${tableSurfaceClass} ${groupRingClass}`}
            >
              {renderCornerIndicator(isOccupied, isCleaning, isFree, true)}

              <span
                className={`font-display font-bold text-sm leading-tight ${
                  isOccupied ? 'text-white' : 'text-[#1F1410]'
                }`}
              >
                {mesa.numero}
              </span>

              {!isFree && !isCleaning && (
                <div className="mt-0.5 text-center font-mono text-[8px] leading-tight">
                  {mesa.comensal && (
                    <div className="font-bold truncate max-w-[52px] text-white">
                      {mesa.comensal.split(' ')[0]}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="opacity-90">{mesa.tiempoStr}</div>
                  )}
                </div>
              )}

              {isCleaning && (
                <span className="text-[7.5px] font-mono text-amber-950 font-bold">Limpieza</span>
              )}

              {isFree && (
                <span className="text-[7.5px] font-mono font-bold text-emerald-700 mt-0.5">
                  2p · Libre
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // 4. MESAS ESTÁNDAR DE 4 SILLAS
    // -----------------------------------------------------------------------
    const isCircle = mesa.shape === 'circle';
    const sizeClass = isCompact ? 'w-[78px] h-[78px]' : 'w-[92px] h-[92px]';
    const chairHoriz = isCompact ? 'w-7 h-2.5' : 'w-9 h-2.5';
    const chairVert = isCompact ? 'w-2.5 h-7' : 'w-2.5 h-9';

    return wrapPositioned(
      <div
        {...pointerProps}
        onClick={handleTableClick}
        className={`relative group hover:scale-105 select-none ${dragStateClass}`}
        title={`Mesa ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra para mover o agrupar`}
      >
        {statusBadge}
        <div className={`relative ${sizeClass} flex items-center justify-center`}>
          <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${chairHoriz} rounded-full ${chairColorClass}`} />
          <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${chairHoriz} rounded-full ${chairColorClass}`} />
          <span className={`absolute -left-3 top-1/2 -translate-y-1/2 ${chairVert} rounded-full ${chairColorClass}`} />
          <span className={`absolute -right-3 top-1/2 -translate-y-1/2 ${chairVert} rounded-full ${chairColorClass}`} />

          <div
            className={`w-full h-full flex flex-col items-center justify-center p-2 relative transition-all ${
              isCircle ? 'rounded-full' : 'rounded-2xl'
            } ${tableSurfaceClass} ${groupRingClass}`}
          >
            {renderCornerIndicator(isOccupied, isCleaning, isFree, isCompact)}

            <span
              className={`font-display font-bold ${
                isCompact ? 'text-base' : 'text-lg'
              } leading-tight ${isOccupied ? 'text-white' : 'text-[#1F1410]'}`}
            >
              {mesa.numero}
            </span>

            {!isFree && !isCleaning && (
              <div className="mt-0.5 space-y-0.5 text-center font-mono text-[8px] leading-tight">
                {mesa.comensal && (
                  <div className="font-bold truncate max-w-[64px] text-white">
                    {mesa.comensal.split(' ')[0]}
                  </div>
                )}
                {visibleProperties.diningTime && (
                  <div className="flex items-center justify-center gap-0.5 opacity-90">
                    <Clock className="w-2 h-2" />
                    <span>{mesa.tiempoStr}</span>
                  </div>
                )}
                {visibleProperties.customers && !isCompact && (
                  <div className="opacity-85">{mesa.personas}p</div>
                )}
                {visibleProperties.waiter && !isCompact && (
                  <div className="opacity-80 truncate max-w-[62px]">{mesa.mesero}</div>
                )}
              </div>
            )}

            {isCleaning && (
              <span className="text-[8px] font-mono text-amber-950 font-bold mt-0.5">
                Limpieza
              </span>
            )}

            {isFree && (
              <div className="text-center font-mono mt-0.5">
                <span className="inline-block px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[7.5px] font-bold border border-emerald-300">
                  Libre
                </span>
                <span className="block text-[7.5px] text-[#1F1410]/60 font-bold">
                  {mesa.capacidad} sillas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

function renderCornerIndicator(isOccupied, isCleaning, isFree, compact = false) {
  const pos = compact ? 'top-1 right-1' : 'top-1.5 right-1.5';
  if (isOccupied) {
    return (
      <span
        className={`w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute ${pos} shadow-xs`}
      >
        <Check className="w-2 h-2 stroke-[3]" />
      </span>
    );
  }
  if (isCleaning) {
    return (
      <span
        className={`w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center absolute ${pos} shadow-xs`}
      >
        <RotateCcw className="w-2 h-2 animate-spin" />
      </span>
    );
  }
  if (isFree) {
    return (
      <span
        className={`w-2.5 h-2.5 rounded-full bg-emerald-500 absolute ${pos} border-[1.5px] border-white shadow-2xs`}
      />
    );
  }
  return null;
}
