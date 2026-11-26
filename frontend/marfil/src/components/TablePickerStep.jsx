import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Layers,
  Link2,
  MapPin,
  SkipForward,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { sounds } from '../utils/audio';
import FloorPlanArchitecturalSvg from './FloorPlanArchitecturalSvg';
import {
  CANVAS_BASE_WIDTH,
  CANVAS_BASE_HEIGHT,
  PATIO_SPLIT_PERCENT,
  esPisoAlto,
  resolverCoordenadaMesa,
  evaluarUnionMesas
} from '../utils/mesasPlano';

export default function TablePickerStep({
  mesas = [],
  cargando = false,
  error = '',
  onRetry,
  personas = 2,
  selectedMesaIds = [],
  solicitaUnionMesas = false,
  onToggleMesa,
  onClearMesas,
  onToggleUnion,
  onSkipStep
}) {
  const [activeFloor, setActiveFloor] = useState('planta-baja');
  const [manualScale, setManualScale] = useState(null); // null = ajustar automáticamente al ancho
  const [fitScale, setFitScale] = useState(0.62);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef(null);
  const panStateRef = useRef(null);

  // Medir el ancho real del contenedor para ajustar el plano completo en desktop, tablet y móvil
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;

    const updateFit = () => {
      const available = Math.max(260, el.clientWidth - 20);
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
  }, []);

  const floors = useMemo(() => {
    const baja = mesas.filter((m) => !esPisoAlto(m));
    const alta = mesas.filter(esPisoAlto);
    const list = [
      {
        id: 'planta-baja',
        label: 'Piso 1 · Planta Baja',
        sub: 'Salón, Barra & Patio',
        variant: 'planta_baja',
        mesas: baja
      }
    ];
    if (alta.length > 0) {
      list.push({
        id: 'planta-alta',
        label: 'Piso 2 · Planta Alta',
        sub: 'Ludoteca & Balcón',
        variant: 'planta_alta',
        mesas: alta
      });
    }
    return list;
  }, [mesas]);

  const currentFloor = floors.find((f) => f.id === activeFloor) || floors[0];

  const selectedMesas = useMemo(
    () =>
      selectedMesaIds
        .map((id) => mesas.find((m) => m.id === id))
        .filter(Boolean),
    [selectedMesaIds, mesas]
  );

  const { capacidadTotal, minPersonasUnion, cubreGrupo, elegibleUnion } = useMemo(
    () => evaluarUnionMesas(selectedMesas, personas),
    [selectedMesas, personas]
  );

  const mesasDelPiso = currentFloor?.mesas || [];
  const effectiveScale = manualScale ?? fitScale;
  const scaledWidth = Math.round(CANVAS_BASE_WIDTH * effectiveScale);
  const scaledHeight = Math.round(CANVAS_BASE_HEIGHT * effectiveScale);
  const isZoomed = manualScale !== null && manualScale > fitScale + 0.02;

  const zoomStepIn = () => {
    const next = Math.min(1.15, Number((effectiveScale + 0.15).toFixed(2)));
    setManualScale(next);
  };

  const zoomStepOut = () => {
    const next = Math.max(fitScale, Number((effectiveScale - 0.15).toFixed(2)));
    setManualScale(next <= fitScale + 0.02 ? null : next);
  };

  // Arrastre con mouse para desplazar el plano cuando tiene zoom (en táctil funciona el deslizamiento nativo con el dedo)
  const handleViewportMouseDown = (e) => {
    if (!isZoomed || e.button !== 0 || e.target.closest('button')) return;
    const el = viewportRef.current;
    if (!el) return;
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop
    };
    setIsPanning(true);

    const onMove = (moveEvt) => {
      if (!panStateRef.current) return;
      const dx = moveEvt.clientX - panStateRef.current.startX;
      const dy = moveEvt.clientY - panStateRef.current.startY;
      el.scrollLeft = panStateRef.current.scrollLeft - dx;
      el.scrollTop = panStateRef.current.scrollTop - dy;
    };

    const onUp = () => {
      panStateRef.current = null;
      setIsPanning(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Encabezado + botón Omitir paso */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E12927]">
            <MapPin size={13} />
            Paso opcional · Selección en plano
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#1F1410] dark:text-[#FAF7F5] mt-0.5">
            Elige tu mesa o selecciona varias
          </h3>
          <p className="text-xs text-[#6B5A52] dark:text-[#B4A099] mt-0.5 m-0">
            Toca las mesas disponibles para tu grupo de{' '}
            <strong>
              {personas} {personas === 1 ? 'persona' : 'personas'}
            </strong>
            , o salta este paso para asignación automática.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClearMesas();
            onSkipStep();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-black/12 dark:border-white/15 bg-white dark:bg-[#1F1410] text-xs font-semibold text-[#1F1410] dark:text-[#FAF7F5] hover:border-[#E12927] hover:text-[#E12927] transition-colors cursor-pointer shrink-0"
        >
          <span>Omitir este paso</span>
          <SkipForward size={13} />
        </button>
      </div>

      {/* Pestañas por piso + controles de zoom responsivos */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {floors.map((floor) => {
            const active = floor.id === currentFloor?.id;
            const libres = floor.mesas.filter((m) => m.disponible).length;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveFloor(floor.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1F1410] dark:bg-[#E12927] text-white border-transparent shadow-xs'
                    : 'bg-white dark:bg-[#1F1410] text-[#1F1410] dark:text-[#FAF7F5] border-black/10 dark:border-white/10 hover:border-[#E12927]/50'
                }`}
              >
                <Layers size={14} className={active ? 'text-white' : 'text-[#E12927]'} />
                <div className="leading-tight">
                  <span className="block text-xs font-bold">{floor.label}</span>
                  <span
                    className={`block text-[10px] ${
                      active ? 'text-white/75' : 'text-[#8E7A74]'
                    }`}
                  >
                    {libres} de {floor.mesas.length} disponibles
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Zoom + Ajustar (ideal para móvil y tablet) */}
        <div className="flex items-center bg-white dark:bg-[#1F1410] border border-black/10 dark:border-white/10 rounded-full p-1 gap-0.5 shadow-2xs">
          <button
            type="button"
            onClick={zoomStepOut}
            disabled={!isZoomed}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/70 dark:text-[#FAF7F5]/75 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-35 cursor-pointer"
            title="Alejar plano"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => setManualScale(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
              manualScale === null
                ? 'bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927]'
                : 'text-[#1F1410]/70 dark:text-[#FAF7F5]/75 hover:text-[#E12927]'
            }`}
            title="Ajustar plano completo a la pantalla"
          >
            <Maximize2 size={10} />
            <span>{manualScale === null ? 'Ajustado' : `${Math.round(effectiveScale * 100)}%`}</span>
          </button>
          <button
            type="button"
            onClick={zoomStepIn}
            disabled={effectiveScale >= 1.14}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/70 dark:text-[#FAF7F5]/75 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-35 cursor-pointer"
            title="Acercar plano"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Plano arquitectónico exacto al editor de Admin con escala automática y scroll/deslizamiento */}
      <div className="w-full min-w-0 rounded-2xl bg-[#EFEAE4] dark:bg-[#1A120F] border border-black/10 dark:border-white/10 p-2.5 sm:p-3">
        <div
          ref={viewportRef}
          onMouseDown={handleViewportMouseDown}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y'
          }}
          className={`w-full min-w-0 overflow-x-auto overflow-y-auto overscroll-x-contain rounded-xl ${
            isZoomed
              ? isPanning
                ? 'cursor-grabbing max-h-[65vh]'
                : 'cursor-grab max-h-[65vh]'
              : ''
          }`}
        >
        {cargando ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-[#8E7A74]">
            Cargando plano de mesas disponibles...
          </div>
        ) : error ? (
          <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-center px-4">
            <p className="text-xs text-[#E12927] font-semibold m-0">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-full bg-[#1F1410] text-white text-xs font-bold cursor-pointer hover:bg-[#E12927]"
              >
                Reintentar cargar mesas
              </button>
            )}
          </div>
        ) : (
          <div
            className={`${isZoomed ? '' : 'mx-auto'} shrink-0 transition-[width,height] duration-150`}
            style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
          >
            <div
              style={{
                width: `${CANVAS_BASE_WIDTH}px`,
                height: `${CANVAS_BASE_HEIGHT}px`,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
                position: 'relative',
                backgroundColor: '#FFFDFB'
              }}
              className="rounded-xl overflow-hidden shadow-md"
            >
              {/* Mismo SVG arquitectónico del Admin */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                <FloorPlanArchitecturalSvg
                  variant={currentFloor?.variant || 'planta_baja'}
                  floorLabel={currentFloor?.label}
                />
              </div>

              {/* Mesas con la MISMA geometría, sillas y proporciones del editor Admin */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                {mesasDelPiso.map((mesa, idx) => renderTableExactAdmin(mesa, idx))}
              </div>

              {mesasDelPiso.length === 0 && (
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 20 }}
                  className="flex flex-col items-center justify-center gap-2"
                >
                  <span className="px-4 py-2 rounded-full bg-white/95 border border-black/10 text-xs font-semibold text-[#1F1410] shadow-xs">
                    No se encontraron mesas en este piso para este horario.
                  </span>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="px-3.5 py-1.5 rounded-full bg-[#E12927] text-white text-xs font-bold cursor-pointer"
                    >
                      Actualizar plano
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Leyenda compacta del plano */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 px-1 text-[10px] sm:text-[11px] text-[#6B5A52] dark:text-[#B4A099]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-[#78716C]/70 inline-block" />
              Disponible
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#E12927] inline-block" />
              Seleccionada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#E2DDD8] border border-[#B8AEA7] inline-block" />
              Ocupada en este horario
            </span>
          </div>
          <span>
            {isZoomed
              ? 'Desliza para recorrer el plano o pulsa Ajustar'
              : 'Usa + para acercar o toca los botones rápidos debajo'}
          </span>
        </div>
      </div>

      {/* Selección rápida en chips (ideal en pantallas táctiles pequeñas) */}
      {!cargando && mesasDelPiso.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mesasDelPiso.map((mesa) => {
            const isSelected = selectedMesaIds.includes(mesa.id);
            const isDisabled = !mesa.disponible;
            return (
              <button
                key={`chip-${mesa.id}`}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  sounds.playClick();
                  onToggleMesa(mesa);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  isDisabled
                    ? 'bg-black/5 dark:bg-white/5 border-transparent text-[#8E7A74] opacity-45 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-[#E12927] border-[#E12927] text-white shadow-xs cursor-pointer'
                    : 'bg-white dark:bg-[#1F1410] border-black/10 dark:border-white/10 text-[#1F1410] dark:text-[#FAF7F5] hover:border-[#E12927] cursor-pointer'
                }`}
              >
                <span>{mesa.numero}</span>
                <span className={isSelected ? 'text-white/85' : 'text-[#8E7A74]'}>
                  · {mesa.capacidad} sillas
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Panel de estado de selección y Solicitud de Unión de Mesas */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.07] dark:border-white/10 space-y-3">
        {selectedMesas.length === 0 ? (
          <div className="flex items-center gap-2.5 text-xs text-[#6B5A52] dark:text-[#B4A099]">
            <Users size={16} className="text-[#E12927] shrink-0" />
            <span>
              Aún no has elegido mesa. Puedes seleccionar una o varias arriba, o continuar sin
              elegir para que el equipo te asigne la ideal al llegar.
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                  Elegidas:
                </span>
                {selectedMesas.map((m) => (
                  <span
                    key={`sel-${m.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] text-[11px] font-bold"
                  >
                    {m.numero} ({m.capacidad}p)
                    <button
                      type="button"
                      onClick={() => onToggleMesa(m)}
                      className="hover:text-[#1F1410] cursor-pointer"
                      aria-label={`Quitar mesa ${m.numero}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={onClearMesas}
                className="text-[11px] font-semibold text-[#8E7A74] hover:text-[#E12927] cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                cubreGrupo
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
              }`}
            >
              {cubreGrupo ? (
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
              )}
              <span>
                {cubreGrupo ? (
                  <>
                    Capacidad seleccionada: <strong>{capacidadTotal} sillas</strong> para tu grupo
                    de{' '}
                    <strong>
                      {personas} {personas === 1 ? 'persona' : 'personas'}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Capacidad actual: <strong>{capacidadTotal} sillas</strong>. Te faltan{' '}
                    <strong>
                      {personas - capacidadTotal}{' '}
                      {personas - capacidadTotal === 1 ? 'lugar' : 'lugares'}
                    </strong>{' '}
                    para tu grupo de {personas} personas (elige otra mesa o limpia la selección).
                  </>
                )}
              </span>
            </div>

            {selectedMesas.length >= 2 && (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  elegibleUnion && solicitaUnionMesas
                    ? 'bg-[#FCEAE9]/75 dark:bg-[#321B19] border-[#E12927]'
                    : 'bg-[#FAF7F5] dark:bg-[#261A16] border-black/10 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        elegibleUnion
                          ? 'bg-[#E12927] text-white'
                          : 'bg-black/10 dark:bg-white/10 text-[#8E7A74]'
                      }`}
                    >
                      <Link2 size={15} />
                    </span>
                    <div>
                      <strong className="block text-xs sm:text-sm font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                        Solicitar unión de mesas ({selectedMesas.map((m) => m.numero).join(' + ')})
                      </strong>
                      {elegibleUnion ? (
                        <p className="text-[11px] text-[#5A4840] dark:text-[#C5B4AE] mt-0.5 m-0">
                          Tu grupo de <strong>{personas} personas</strong> cumple / se acerca a la
                          capacidad combinada (<strong>{capacidadTotal} sillas</strong>). Al
                          activarlo, tu reservación incluirá la solicitud para unir estas mesas.
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#8E7A74] mt-0.5 m-0">
                          {!cubreGrupo
                            ? `Agrega más capacidad (te faltan ${personas - capacidadTotal} lugares) para poder solicitar la unión.`
                            : `Para solicitar unir ${selectedMesas.map((m) => m.numero).join(' + ')} (${capacidadTotal} sillas) se requieren al menos ${minPersonasUnion} personas. Con ${personas} personas elige mesas más pequeñas o resérvalas sin unir.`}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={elegibleUnion && solicitaUnionMesas}
                    disabled={!elegibleUnion}
                    onClick={() => {
                      if (!elegibleUnion) return;
                      sounds.playClick();
                      onToggleUnion(!solicitaUnionMesas);
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      !elegibleUnion
                        ? 'bg-black/10 dark:bg-white/10 opacity-50 cursor-not-allowed'
                        : solicitaUnionMesas
                        ? 'bg-[#E12927] cursor-pointer'
                        : 'bg-black/20 dark:bg-white/20 cursor-pointer'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        elegibleUnion && solicitaUnionMesas ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // Renderizador de mesas 100% idéntico al editor de Mesas en Vivo (Admin)
  // =========================================================================
  function renderTableExactAdmin(mesa, idx) {
    const coord = resolverCoordenadaMesa(mesa, idx);
    const isSelected = selectedMesaIds.includes(mesa.id);
    const isDisabled = !mesa.disponible;
    const isCompact = Boolean(coord.compact || coord.x >= PATIO_SPLIT_PERCENT);

    const surfaceClass = isDisabled
      ? 'bg-[#EAE5E0] text-[#8E7A74] border-2 border-[#C2B8B0] opacity-65'
      : isSelected
      ? 'bg-[#E12927] text-white border-2 border-[#B81E1C] shadow-lg shadow-[#E12927]/35 ring-4 ring-[#E12927]/30'
      : 'bg-[#FFFFFF] text-[#1F1410] border-2 border-[#78716C]/55 shadow-md shadow-[#1F1410]/10 hover:border-[#E12927] hover:bg-[#FCEAE9]/40';

    const chairClass = isDisabled
      ? 'bg-[#DED8D3] border border-[#B8AEA7] opacity-65'
      : isSelected
      ? 'bg-[#E12927] border border-[#9E1715]'
      : 'bg-[#E7E2DC] border-[1.5px] border-[#78716C]/65';

    const handleClick = () => {
      if (isDisabled) return;
      sounds.playClick();
      onToggleMesa(mesa);
    };

    const wrap = (inner) => (
      <div
        key={mesa.id}
        style={{
          position: 'absolute',
          left: `${coord.x}%`,
          top: `${coord.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isSelected ? 30 : 20
        }}
      >
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleClick}
          title={
            isDisabled
              ? `Mesa ${mesa.numero} ocupada en este horario`
              : `Mesa ${mesa.numero} · ${mesa.capacidad} sillas (${mesa.zona})`
          }
          style={{ padding: 0, margin: 0, display: 'block', background: 'transparent', border: 'none' }}
          className={`relative select-none transition-transform ${
            isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'
          }`}
        >
          {inner}
        </button>
      </div>
    );

    const cornerBadge = isSelected ? (
      <span className="w-4 h-4 rounded-full bg-[#1F1410] text-white flex items-center justify-center absolute top-1.5 right-1.5 shadow-xs">
        <Check size={10} strokeWidth={3} />
      </span>
    ) : !isDisabled ? (
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 border-[1.5px] border-white shadow-2xs" />
    ) : null;

    // 1. Rectangular vertical (idéntica a Admin: 88x164 + 6 sillas)
    if (mesa.forma === 'rectangle_vertical') {
      return wrap(
        <div className="relative w-[88px] h-[164px] flex items-center justify-center">
          <span className={`absolute -left-3 top-4 w-2.5 h-8 rounded-full ${chairClass}`} />
          <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
          <span className={`absolute -left-3 bottom-4 w-2.5 h-8 rounded-full ${chairClass}`} />
          <span className={`absolute -right-3 top-4 w-2.5 h-8 rounded-full ${chairClass}`} />
          <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
          <span className={`absolute -right-3 bottom-4 w-2.5 h-8 rounded-full ${chairClass}`} />

          <div
            className={`w-full h-full rounded-2xl p-2 flex flex-col justify-between items-center text-center relative transition-all ${surfaceClass}`}
          >
            {cornerBadge}
            <span className="font-display font-bold text-lg mt-2">{mesa.numero}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold ${
                isDisabled
                  ? 'bg-black/10 text-[#6B5A52]'
                  : isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isDisabled ? 'Ocupada' : isSelected ? 'Elegida' : 'Libre'}
            </span>
            <span className={`text-[8.5px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-[#1F1410]/60'}`}>
              {mesa.capacidad} sillas
            </span>
          </div>
        </div>
      );
    }

    // 2. Rectangular horizontal (6p: 148x78 con 3+3 sillas; 8p+: 176x82 con 3+3+2 sillas)
    if (mesa.forma === 'rectangle_horizontal') {
      const isEight = mesa.capacidad >= 8;
      return wrap(
        <div
          className={`relative ${
            isEight ? 'w-[176px] h-[82px]' : 'w-[148px] h-[78px]'
          } flex items-center justify-center`}
        >
          <div className="absolute -top-3 inset-x-4 flex items-center justify-around pointer-events-none">
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
          </div>
          <div className="absolute -bottom-3 inset-x-4 flex items-center justify-around pointer-events-none">
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
            <span className={`w-7 h-2.5 rounded-full ${chairClass}`} />
          </div>
          {isEight && (
            <>
              <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
              <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
            </>
          )}

          <div
            className={`w-full h-full rounded-2xl px-3 py-2 flex flex-col justify-between items-center text-center relative transition-all ${surfaceClass}`}
          >
            {cornerBadge}
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-display font-bold text-lg leading-none">{mesa.numero}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F5EFEB] text-[#1F1410]/75'
                }`}
              >
                {mesa.capacidad}p
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                isDisabled
                  ? 'bg-black/10 text-[#6B5A52]'
                  : isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isDisabled ? 'Ocupada' : isSelected ? 'Seleccionada' : 'Disponible'}
            </span>
          </div>
        </div>
      );
    }

    // 3. Mesas de 2 sillas (66x66 en Patio/Balcón, 76x76 en Salón)
    if (mesa.capacidad <= 2) {
      const isCircle = mesa.forma === 'circle' || coord.chairsLayout === 'lr';
      const chairsLR = coord.chairsLayout ? coord.chairsLayout === 'lr' : !isCircle;
      const sizeClass = isCompact ? 'w-[66px] h-[66px]' : 'w-[76px] h-[76px]';

      return wrap(
        <div className={`relative ${sizeClass} flex items-center justify-center`}>
          {chairsLR ? (
            <>
              <span className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
              <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-8 rounded-full ${chairClass}`} />
            </>
          ) : (
            <>
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairClass}`} />
              <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2.5 rounded-full ${chairClass}`} />
            </>
          )}

          <div
            className={`w-full h-full flex flex-col items-center justify-center p-1.5 relative transition-all ${
              isCircle ? 'rounded-full' : 'rounded-2xl'
            } ${surfaceClass}`}
          >
            {cornerBadge}
            <span className="font-display font-bold text-sm leading-tight">{mesa.numero}</span>
            <span
              className={`text-[7.5px] font-bold mt-0.5 ${
                isDisabled ? 'text-[#8E7A74]' : isSelected ? 'text-white/90' : 'text-emerald-700'
              }`}
            >
              {isDisabled ? 'Ocup.' : isSelected ? 'Elegida' : '2p · Libre'}
            </span>
          </div>
        </div>
      );
    }

    // 4. Mesas estándar de 4 sillas (78x78 en Patio/Balcón, 92x92 en Salón)
    const isCircle = mesa.forma === 'circle';
    const sizeClass = isCompact ? 'w-[78px] h-[78px]' : 'w-[92px] h-[92px]';
    const chairHoriz = isCompact ? 'w-7 h-2.5' : 'w-9 h-2.5';
    const chairVert = isCompact ? 'w-2.5 h-7' : 'w-2.5 h-9';

    return wrap(
      <div className={`relative ${sizeClass} flex items-center justify-center`}>
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${chairHoriz} rounded-full ${chairClass}`} />
        <span className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${chairHoriz} rounded-full ${chairClass}`} />
        <span className={`absolute -left-3 top-1/2 -translate-y-1/2 ${chairVert} rounded-full ${chairClass}`} />
        <span className={`absolute -right-3 top-1/2 -translate-y-1/2 ${chairVert} rounded-full ${chairClass}`} />

        <div
          className={`w-full h-full flex flex-col items-center justify-center p-2 relative transition-all ${
            isCircle ? 'rounded-full' : 'rounded-2xl'
          } ${surfaceClass}`}
        >
          {cornerBadge}
          <span className={`font-display font-bold ${isCompact ? 'text-base' : 'text-lg'} leading-tight`}>
            {mesa.numero}
          </span>
          <div className="text-center mt-0.5">
            <span
              className={`inline-block px-1.5 py-0.2 rounded-full text-[7.5px] font-bold ${
                isDisabled
                  ? 'bg-black/10 text-[#6B5A52]'
                  : isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isDisabled ? 'Ocupada' : isSelected ? 'Elegida' : 'Libre'}
            </span>
            <span className={`block text-[7.5px] font-bold ${isSelected ? 'text-white/80' : 'text-[#1F1410]/60'}`}>
              {mesa.capacidad} sillas
            </span>
          </div>
        </div>
      </div>
    );
  }
}
