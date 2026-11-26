import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
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
  GripHorizontal
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { tiempoEnMesa } from '../api/adaptadores';

const STORAGE_PREFIX = 'marfil_admin_merged_tables_v1_';

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

export const FloorPlanModule = ({
  mesas,
  onUpdateMesa,
  selectedSucursal,
  sucursales,
  soundEnabled,
  onOpenWalkInModal
}) => {
  const [activeZone, setActiveZone] = useState('todas');
  const [showPropertiesMenu, setShowPropertiesMenu] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Propiedades visibles en las mesas (sin precios / consumos)
  const [visibleProperties, setVisibleProperties] = useState({
    diningTime: true,
    customers: true,
    waiter: false,
    reservations: false,
    items: false
  });

  // Sucursal y zonas activas
  const sucursalDelPlano = selectedSucursal === 'todas' ? sucursales[0]?.id : selectedSucursal;
  const mesasSucursal = useMemo(
    () => mesas.filter((m) => m.sucursalId === sucursalDelPlano),
    [mesas, sucursalDelPlano]
  );
  const zonasDelPlano = useMemo(
    () => [...new Set(mesasSucursal.map((m) => m.zona).filter(Boolean))],
    [mesasSucursal]
  );
  const zonaActiva = zonasDelPlano.includes(activeZone) ? activeZone : 'todas';

  // Estado de mesas unidas (Drag & Drop) + historial para deshacer
  const [mergedGroups, setMergedGroups] = useState(() => loadMergedGroups(sucursalDelPlano));
  const [mergeHistory, setMergeHistory] = useState([]);
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [recentlyMergedKey, setRecentlyMergedKey] = useState(null);

  // Recargar grupos unidos al cambiar de sucursal
  useEffect(() => {
    setMergedGroups(loadMergedGroups(sucursalDelPlano));
    setMergeHistory([]);
    setDraggedKey(null);
    setDragOverKey(null);
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

  // Mesas base filtradas por zona
  const mesasBase = useMemo(
    () =>
      mesasSucursal
        .filter((m) => zonaActiva === 'todas' || m.zona === zonaActiva)
        .map((m) => ({
          id: m.id,
          numero: m.numero,
          shape: m.forma,
          capacidad: m.capacidad,
          estado: m.estado === 'reservada' ? 'libre' : m.estado,
          comensal: m.estado === 'ocupada' ? m.comensal : null,
          personas: m.estado === 'ocupada' ? m.personas : m.capacidad,
          tiempoStr: tiempoEnMesa(m.tiempoMinutos),
          mesero: m.mesero || 'Sin asignar',
          verified: Boolean(m.reservaFolio)
        })),
    [mesasSucursal, zonaActiva]
  );

  // Construir mesas del plano combinando los grupos unidos en una sola mesa
  const mesasDelPlano = useMemo(() => {
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
    for (const mesa of mesasBase) {
      if (absorbedIds.has(mesa.id)) continue;
      const group = groupByPrimary.get(mesa.id);
      if (!group) {
        result.push({
          ...mesa,
          renderKey: String(mesa.id),
          isMerged: false,
          memberIds: [mesa.id],
          memberNumbers: [mesa.numero]
        });
        continue;
      }

      const members = group.memberIds.map((id) => byId.get(id)).filter(Boolean);
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
        shape: 'merged_banquet',
        numero: members.map((m) => m.numero).join(' + '),
        memberIds: members.map((m) => m.id),
        memberNumbers: members.map((m) => m.numero),
        capacidad: capacidadTotal,
        estado: estadoCombinado,
        comensal: occupiedMember?.comensal || null,
        personas: personasTotal || capacidadTotal,
        tiempoStr: occupiedMember?.tiempoStr || cleaningMember?.tiempoStr || mesa.tiempoStr,
        mesero: occupiedMember?.mesero || mesa.mesero,
        verified: members.some((m) => m.verified)
      });
    }

    return result;
  }, [mesasBase, mergedGroups]);

  // Fusionar dos mesas (o grupos ya fusionados) al soltar una sobre otra
  const handleMergeTables = useCallback(
    (sourceRenderKey, targetRenderKey) => {
      if (!sourceRenderKey || !targetRenderKey || sourceRenderKey === targetRenderKey) return;

      const sourceMesa = mesasDelPlano.find((m) => m.renderKey === sourceRenderKey);
      const targetMesa = mesasDelPlano.find((m) => m.renderKey === targetRenderKey);
      if (!sourceMesa || !targetMesa) return;

      const combinedMemberIds = Array.from(
        new Set([...targetMesa.memberIds, ...sourceMesa.memberIds])
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
      if (soundEnabled) playSound('success');
    },
    [mesasDelPlano, mergedGroups, soundEnabled]
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

  // El lienzo tiene tres filas y un lugar lateral para una mesa rectangular vertical.
  const mesaLateral = mesasDelPlano.find((m) => m.shape === 'rectangle_vertical');
  const mesasEnFilas = mesasDelPlano.filter((m) => m !== mesaLateral);

  // Actualizar estado en API (si es mesa unida, libera/limpia todos los miembros o abre walk-in en la principal)
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

  // Atajos de teclado: Escape cierra modal, Ctrl+Z deshace última unión
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedMesa) {
        setSelectedMesa(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !selectedMesa) {
        if (mergeHistory.length > 0) {
          e.preventDefault();
          handleUndoMerge();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMesa, mergeHistory.length, handleUndoMerge]);

  // Handlers de Drag & Drop compartidos para cualquier mesa
  const getDragHandlers = (mesa) => ({
    draggable: true,
    onDragStart: (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', mesa.renderKey);
      setDraggedKey(mesa.renderKey);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedKey && draggedKey !== mesa.renderKey && dragOverKey !== mesa.renderKey) {
        setDragOverKey(mesa.renderKey);
      }
    },
    onDragLeave: () => {
      if (dragOverKey === mesa.renderKey) {
        setDragOverKey(null);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      const sourceKey = draggedKey || e.dataTransfer.getData('text/plain');
      setDraggedKey(null);
      setDragOverKey(null);
      if (sourceKey && sourceKey !== mesa.renderKey) {
        handleMergeTables(sourceKey, mesa.renderKey);
      }
    },
    onDragEnd: () => {
      setDraggedKey(null);
      setDragOverKey(null);
    }
  });

  return (
    <div
      className={`admin-surface bg-[#F7F4F0] p-5 sm:p-7 relative flex flex-col justify-between select-none ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-[#F7F4F0]' : 'min-h-[780px]'
      }`}
    >
      {/* 1. Barra Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#1F1410]/8">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display font-bold text-2xl text-[#1F1410]">
            Servicio en Sala
          </h2>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FCEAE9] text-[#E12927]">
            {zonaActiva === 'todas' ? 'Todas las zonas' : zonaActiva}
          </span>
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E12927]/10 text-[#E12927] font-semibold">
              ● {occupiedCount} ocupadas
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
              ○ {freeCount} libres
            </span>
            {cleaningCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {cleaningCount} en limpieza
              </span>
            )}
            {mergedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F1410] text-white font-semibold inline-flex items-center gap-1">
                <Link2 className="w-3 h-3 text-[#FCEAE9]" />
                {mergedCount} {mergedCount === 1 ? 'unión activa' : 'uniones activas'}
              </span>
            )}
          </div>
        </div>

        {/* Controles superiores */}
        <div className="flex items-center gap-2 self-end sm:self-auto relative flex-wrap">
          {/* Deshacer última unión */}
          {mergeHistory.length > 0 && (
            <button
              type="button"
              onClick={handleUndoMerge}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1F1410] hover:bg-[#3A2821] text-white shadow-xs transition-all cursor-pointer btn-press"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#FCEAE9] text-[#E12927] border border-[#E12927]/25 shadow-2xs transition-all cursor-pointer btn-press"
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

          {/* Selector de Plano */}
          <div className="relative">
            <select
              value={zonaActiva}
              onChange={(e) => {
                setActiveZone(e.target.value);
                if (soundEnabled) playSound('toggle');
              }}
              className="appearance-none bg-white border border-[#1F1410]/10 rounded-full px-4 py-1.5 pr-8 text-xs font-semibold text-[#1F1410] shadow-2xs hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            >
              <option value="todas">Plano · Todas las zonas</option>
              {zonasDelPlano.map((zona) => (
                <option key={zona} value={zona}>
                  Plano · {zona}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F1410]/40 pointer-events-none" />
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

      {/* Cinta sutil de instrucción para Drag & Drop */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 px-1">
        <div className="inline-flex items-center gap-2 text-[11px] font-body text-[#1F1410]/65">
          <GripHorizontal className="w-3.5 h-3.5 text-[#E12927]" />
          <span>
            <strong className="text-[#1F1410]">Arrastra una mesa sobre otra</strong> para juntarlas en una sola mesa grupal. Haz clic en el botón de separar o en <strong>Deshacer</strong> para revertir.
          </span>
        </div>
        {draggedKey && (
          <span className="px-3 py-1 rounded-full bg-[#E12927] text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
            Suelta sobre otra mesa para unirlas
          </span>
        )}
      </div>

      {/* 2. Lienzo Arquitectónico de Mesas */}
      <div
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          backgroundImage: 'radial-gradient(rgba(31, 20, 16, 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        className="transition-transform duration-200 py-11 px-4 sm:px-8 flex flex-col items-center justify-center space-y-14 sm:space-y-16 rounded-2xl bg-white/80 border border-[#1F1410]/8 shadow-inner my-3"
      >
        {/* FILA 1 */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {mesasEnFilas.slice(0, 5).map((mesa) => renderTable(mesa))}
        </div>

        {/* FILA 2 */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <div className="flex items-center gap-8 sm:gap-12 flex-wrap justify-center">
            {mesasEnFilas.slice(5, 9).map((mesa) => renderTable(mesa))}
          </div>

          {mesaLateral && <div className="pl-0 sm:pl-4">{renderTable(mesaLateral)}</div>}
        </div>

        {/* FILA 3 */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {mesasEnFilas.slice(9).map((mesa) => renderTable(mesa))}
        </div>

        {mesasDelPlano.length === 0 && (
          <p className="text-xs font-body text-[#1F1410]/50">
            No hay mesas registradas en esta zona.
          </p>
        )}
      </div>

      {/* 3. Barra Inferior: Zoom, Leyenda y Pantalla Completa */}
      <div className="pt-5 border-t border-[#1F1410]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Controles de Zoom */}
        <div className="flex items-center bg-white border border-[#1F1410]/10 rounded-full shadow-2xs p-1">
          <button
            type="button"
            onClick={() => setZoomLevel(Math.min(zoomLevel + 10, 130))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Acercar mapa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-[#1F1410]/70 font-semibold">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(Math.max(zoomLevel - 10, 70))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Alejar mapa"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-5 text-xs font-mono text-[#1F1410]/80 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#E2E8F0] border-2 border-[#94A3B8] shadow-xs flex items-center justify-center">
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
            <span className="font-bold text-[#1F1410]">Mesas Unidas</span>
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
            onClick={() => setSelectedMesa(null)}
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
                      Capacidad total: {selectedMesa.capacidad} sillas ({selectedMesa.capacidad}{' '}
                      comensales)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMesa(null)}
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
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F1410]/8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMesa(null)}
                  className="px-5 py-2 text-xs text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] rounded-full font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );

  // Renderizador principal de mesas (incluye mesas unidas por Drag & Drop)
  function renderTable(mesa) {
    const isFree = mesa.estado === 'libre';
    const isOccupied = mesa.estado === 'ocupada';
    const isCleaning = mesa.estado === 'limpieza';

    const isDragging = draggedKey === mesa.renderKey;
    const isDropTarget = dragOverKey === mesa.renderKey;
    const isRecentlyMerged = recentlyMergedKey === mesa.renderKey;

    const dragStateClass = `mesa-draggable ${isDragging ? 'mesa-dragging' : ''} ${
      isDropTarget ? 'mesa-drop-target' : ''
    } ${isRecentlyMerged ? 'mesa-merged-pop' : ''}`;

    const dragProps = getDragHandlers(mesa);

    const tableSurfaceClass = isOccupied
      ? 'bg-[#E12927] text-white border-2 border-[#C9201F] shadow-lg shadow-[#E12927]/30'
      : isCleaning
      ? 'bg-[#FEF3C7] text-amber-950 border-2 border-dashed border-[#F59E0B] shadow-md shadow-amber-200/50'
      : 'bg-[#E2E8F0] text-[#1F1410] border-2 border-[#94A3B8] shadow-md shadow-slate-300/80 hover:border-slate-500';

    const chairColorClass = isOccupied
      ? 'bg-[#E12927] border border-[#B81E1C] shadow-2xs'
      : isCleaning
      ? 'bg-[#FEF3C7] border border-[#F59E0B] shadow-2xs'
      : 'bg-[#CBD5E1] border-2 border-[#94A3B8] shadow-xs';

    // 0. MESA UNIDA / GRUPAL (fusión por arrastrar y soltar)
    if (mesa.isMerged) {
      const topChairsCount = Math.min(5, Math.max(2, Math.ceil((mesa.capacidad - 2) / 2)));
      return (
        <div
          key={mesa.renderKey}
          {...dragProps}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className={`relative group hover:scale-103 select-none py-2 px-3 ${dragStateClass}`}
          title={`Mesas unidas ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra otra mesa aquí para sumar más o haz clic en separar`}
        >
          <div className="relative w-52 h-28 sm:w-64 sm:h-32 flex items-center justify-center">
            {/* Sillas superiores dinámicas */}
            <div className="absolute -top-4 inset-x-6 flex items-center justify-around pointer-events-none">
              {Array.from({ length: topChairsCount }).map((_, idx) => (
                <span
                  key={`top-${idx}`}
                  className={`w-9 sm:w-10 h-3 rounded-full transition-colors ${chairColorClass}`}
                />
              ))}
            </div>

            {/* Sillas inferiores dinámicas */}
            <div className="absolute -bottom-4 inset-x-6 flex items-center justify-around pointer-events-none">
              {Array.from({ length: topChairsCount }).map((_, idx) => (
                <span
                  key={`bot-${idx}`}
                  className={`w-9 sm:w-10 h-3 rounded-full transition-colors ${chairColorClass}`}
                />
              ))}
            </div>

            {/* Sillas cabeceras */}
            <span
              className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`}
            />
            <span
              className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`}
            />

            {/* Tablero combinado */}
            <div
              className={`w-full h-full rounded-3xl px-4 py-2.5 flex flex-col justify-between items-center text-center relative transition-all ring-2 ring-offset-2 ring-[#1F1410]/25 ${tableSurfaceClass}`}
            >
              {/* Botón rápido de separar (deshacer unión) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnmergeGroup(mesa.mergeGroupId);
                }}
                title="Separar mesas (Deshacer unión)"
                className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer z-20"
              >
                <Unlink2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 w-full pr-3">
                <Link2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isOccupied ? 'text-white/85' : 'text-[#E12927]'
                  }`}
                />
                <span
                  className={`font-display font-bold text-base sm:text-lg truncate ${
                    isOccupied ? 'text-white' : 'text-[#1F1410]'
                  }`}
                >
                  {mesa.numero}
                </span>
              </div>

              {!isFree && !isCleaning && (
                <div className="flex items-center justify-center gap-2.5 font-mono text-[9.5px] leading-tight">
                  {mesa.comensal && (
                    <span className="font-bold truncate max-w-[95px] text-white">
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
                <div className="font-mono text-[9.5px] font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Limpieza {mesa.tiempoStr}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    isOccupied
                      ? 'bg-white/20 text-white'
                      : 'bg-[#1F1410] text-white'
                  }`}
                >
                  {mesa.capacidad} sillas · Unida
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1. MESA RECTANGULAR VERTICAL
    if (mesa.shape === 'rectangle_vertical') {
      return (
        <div
          key={mesa.renderKey}
          {...dragProps}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className={`relative group hover:scale-105 select-none py-2 px-3 ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · Capacidad: ${mesa.capacidad} sillas · Arrastra sobre otra mesa para juntarlas`}
        >
          <div className="relative w-28 h-56 sm:w-32 sm:h-64 flex items-center justify-center">
            <span className={`absolute -left-4 top-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -left-4 bottom-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />

            <span className={`absolute -right-4 top-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -right-4 bottom-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />

            <div
              className={`w-full h-full rounded-3xl p-3 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass}`}
            >
              {isOccupied && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute top-2.5 right-2.5 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              {isCleaning && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center absolute top-2.5 right-2.5 shadow-xs">
                  <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                </span>
              )}
              {isFree && (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute top-2.5 right-2.5 border-2 border-white shadow-2xs" />
              )}

              <div
                className={`font-display font-bold text-2xl mt-3 tracking-wide ${
                  isOccupied ? 'text-white' : 'text-[#1F1410]'
                }`}
              >
                {mesa.numero}
              </div>

              {!isFree && !isCleaning && (
                <div className="space-y-1.5 font-mono text-[10px] w-full px-1">
                  {mesa.comensal && (
                    <div className="font-bold text-[11px] truncate text-center text-white">
                      {mesa.comensal}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="flex items-center justify-center gap-1 opacity-90 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{mesa.tiempoStr}</span>
                    </div>
                  )}
                  {visibleProperties.customers && (
                    <div className="opacity-90 text-[9px] flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{mesa.personas} comensales</span>
                    </div>
                  )}
                  {visibleProperties.waiter && (
                    <div className="opacity-90 text-[9px] truncate">{mesa.mesero}</div>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="font-mono text-[10px] font-bold text-amber-950 flex flex-col items-center">
                  <Sparkles className="w-4 h-4 text-amber-600 mb-1" />
                  <span>Limpieza</span>
                  <span className="text-[9px] font-normal">{mesa.tiempoStr}</span>
                </div>
              )}

              {isFree && (
                <div className="font-mono text-center space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                    Disponible
                  </span>
                  <span className="block text-[9px] text-slate-600 font-bold">
                    {mesa.capacidad} comensales
                  </span>
                </div>
              )}

              <span
                className={`text-[9px] font-mono uppercase font-bold tracking-wider mb-1 ${
                  isOccupied ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                {mesa.capacidad} Sillas
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 2. MESA HORIZONTAL ALARGADA
    if (mesa.shape === 'rectangle_horizontal') {
      return (
        <div
          key={mesa.renderKey}
          {...dragProps}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className={`relative group hover:scale-105 select-none py-2 px-3 ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · Capacidad: ${mesa.capacidad} sillas · Arrastra sobre otra mesa para juntarlas`}
        >
          <div className="relative w-40 h-26 sm:w-48 sm:h-30 flex items-center justify-center">
            <span className={`absolute -top-4 left-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -top-4 right-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -bottom-4 left-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -bottom-4 right-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />

            <div
              className={`w-full h-full rounded-3xl p-3 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass}`}
            >
              {isOccupied && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute top-2 right-2 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              {isCleaning && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center absolute top-2 right-2 shadow-xs">
                  <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                </span>
              )}
              {isFree && (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white shadow-2xs" />
              )}

              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span
                  className={`font-display font-bold text-xl sm:text-2xl ${
                    isOccupied ? 'text-white' : 'text-[#1F1410]'
                  }`}
                >
                  {mesa.numero}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isOccupied ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  {mesa.capacidad} sillas
                </span>
              </div>

              {!isFree && !isCleaning && (
                <div className="flex items-center justify-center gap-3 font-mono text-[9px] leading-tight">
                  {mesa.comensal && (
                    <div className="font-bold text-[10px] truncate max-w-[85px] text-white">
                      {mesa.comensal}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="flex items-center gap-0.5 opacity-90">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{mesa.tiempoStr}</span>
                    </div>
                  )}
                  {visibleProperties.customers && (
                    <div className="opacity-90">{mesa.personas} comensales</div>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="font-mono text-[9px] font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Limpieza {mesa.tiempoStr}</span>
                </div>
              )}

              {isFree && (
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Disponible
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 3. MESAS DE 2 SILLAS
    if (mesa.capacidad === 2) {
      const isCircle = mesa.shape === 'circle';

      return (
        <div
          key={mesa.renderKey}
          {...dragProps}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className={`relative group hover:scale-105 select-none py-2 px-2 ${dragStateClass}`}
          title={`Mesa ${mesa.numero} · 2 sillas · Arrastra sobre otra mesa para juntarlas`}
        >
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {!isCircle && (
              <>
                <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />
                <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />
              </>
            )}

            {isCircle && (
              <>
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
                <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
              </>
            )}

            <div
              className={`w-full h-full flex flex-col items-center justify-center p-2.5 relative transition-all ${
                isCircle ? 'rounded-full' : 'rounded-3xl'
              } ${tableSurfaceClass}`}
            >
              {isOccupied && (
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute top-1.5 right-1.5 shadow-xs">
                  <Check className="w-2 h-2 stroke-[3]" />
                </span>
              )}
              {isCleaning && (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center absolute top-1.5 right-1.5 shadow-xs">
                  <RotateCcw className="w-2 h-2 animate-spin" />
                </span>
              )}
              {isFree && (
                <span className="w-3 h-3 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 border-2 border-white shadow-2xs" />
              )}

              <span
                className={`font-display font-bold text-lg sm:text-xl leading-tight ${
                  isOccupied ? 'text-white' : 'text-[#1F1410]'
                }`}
              >
                {mesa.numero}
              </span>

              {!isFree && !isCleaning && (
                <div className="mt-0.5 space-y-0.5 text-center font-mono text-[9px] leading-tight">
                  {mesa.comensal && (
                    <div className="font-bold text-[9px] truncate max-w-[70px] text-white">
                      {mesa.comensal.split(' ')[0]}
                    </div>
                  )}
                  {visibleProperties.diningTime && (
                    <div className="flex items-center justify-center gap-0.5 opacity-90 text-[8.5px]">
                      <Clock className="w-2 h-2" />
                      <span>{mesa.tiempoStr}</span>
                    </div>
                  )}
                  {visibleProperties.customers && (
                    <div className="opacity-80 text-[8px]">{mesa.personas} comensales</div>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="text-[8.5px] font-mono text-amber-950 font-bold mt-0.5 text-center">
                  Limpieza
                </div>
              )}

              {isFree && (
                <div className="text-center font-mono mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-extrabold border border-emerald-300">
                    Libre
                  </span>
                  <span className="block text-[8px] text-slate-700 font-bold">2 sillas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 4. MESAS ESTÁNDAR DE 4 SILLAS
    const isCircle = mesa.shape === 'circle';

    return (
      <div
        key={mesa.renderKey}
        {...dragProps}
        onClick={() => {
          setSelectedMesa(mesa);
          if (soundEnabled) playSound('toggle');
        }}
        className={`relative group hover:scale-105 select-none py-2 px-2 ${dragStateClass}`}
        title={`Mesa ${mesa.numero} · ${mesa.capacidad} sillas · Arrastra sobre otra mesa para juntarlas`}
      >
        <div className="relative w-26 h-26 sm:w-30 sm:h-30 flex items-center justify-center">
          <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-11 sm:w-13 h-3 rounded-full transition-colors ${chairColorClass}`} />
          <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-11 sm:w-13 h-3 rounded-full transition-colors ${chairColorClass}`} />
          <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-11 sm:h-13 rounded-full transition-colors ${chairColorClass}`} />
          <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-11 sm:h-13 rounded-full transition-colors ${chairColorClass}`} />

          <div
            className={`w-full h-full flex flex-col items-center justify-center p-2.5 relative transition-all ${
              isCircle ? 'rounded-full' : 'rounded-3xl'
            } ${tableSurfaceClass}`}
          >
            {isOccupied && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center absolute top-2 right-2 shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            {isCleaning && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center absolute top-2 right-2 shadow-xs">
                <RotateCcw className="w-2.5 h-2.5 animate-spin" />
              </span>
            )}
            {isFree && (
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white shadow-2xs" />
            )}

            <span
              className={`font-display font-bold text-lg sm:text-2xl leading-tight ${
                isOccupied ? 'text-white' : 'text-[#1F1410]'
              }`}
            >
              {mesa.numero}
            </span>

            {!isFree && !isCleaning && (
              <div className="mt-0.5 space-y-0.5 text-center font-mono text-[9px] leading-tight">
                {mesa.comensal && (
                  <div className="font-bold text-[10px] truncate max-w-[80px] text-white">
                    {mesa.comensal}
                  </div>
                )}
                {visibleProperties.diningTime && (
                  <div className="flex items-center justify-center gap-0.5 opacity-90 text-[9px]">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{mesa.tiempoStr}</span>
                  </div>
                )}
                {visibleProperties.customers && (
                  <div className="opacity-90 text-[8px]">{mesa.personas} comensales</div>
                )}
                {visibleProperties.waiter && (
                  <div className="opacity-90 text-[8px] truncate max-w-[65px]">{mesa.mesero}</div>
                )}
              </div>
            )}

            {isCleaning && (
              <div className="text-[9px] font-mono text-amber-950 font-bold mt-1 text-center">
                Limpieza {mesa.tiempoStr}
              </div>
            )}

            {isFree && (
              <div className="text-center font-mono mt-1 space-y-0.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold border border-emerald-300">
                  Disponible
                </span>
                <span className="block text-[8px] text-slate-700 font-bold">
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
