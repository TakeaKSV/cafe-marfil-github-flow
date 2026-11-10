import React, { useState, useEffect } from 'react';
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
  MoreVertical,
  Maximize2,
  Minimize2,
  RotateCcw,
  Utensils,
  Receipt,
  UserCheck
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const FloorPlanModule = ({ 
  mesas, 
  onUpdateMesa, 
  selectedSucursal, 
  sucursales, 
  soundEnabled,
  onOpenWalkInModal 
}) => {
  const [activeZone, setActiveZone] = useState('salon');
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

  const toggleProperty = (key) => {
    setVisibleProperties(prev => ({ ...prev, [key]: !prev[key] }));
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

  // Lista de mesas con capacidad explícita (2, 4, 6 sillas) y estados (libre en gris, ocupada en rojo, limpieza en ámbar)
  const defaultLayout = [
    // FILA 1:
    // T1: 4 sillas - Libre (Gris claro nítido)
    { id: 'T1', numero: 'T1', shape: 'squircle', capacidad: 4, estado: 'libre', comensal: null, personas: 4, tiempoStr: '0:00h', mesero: 'Valeria S.' },
    // T2: 2 sillas - Libre (Gris claro nítido) -> NOTA: Solo 2 sillas laterales enfrentadas
    { id: 'T2', numero: 'T2', shape: 'squircle', capacidad: 2, estado: 'libre', comensal: null, personas: 2, tiempoStr: '0:00h', mesero: 'Valeria S.' },
    // T3: 4 sillas - Libre (Gris claro nítido)
    { id: 'T3', numero: 'T3', shape: 'squircle', capacidad: 4, estado: 'libre', comensal: null, personas: 4, tiempoStr: '0:00h', mesero: 'Mateo N.' },
    // T4: 4 sillas - Ocupada (Rojo Marfil) con badge verde y check
    { id: 'T4', numero: 'T4', shape: 'squircle', capacidad: 4, estado: 'ocupada', comensal: 'Carlos Mendoza', personas: 4, tiempoStr: '0:45h', mesero: 'Sofía V.', verified: true },
    // T5: 2 sillas - Libre (Gris claro nítido) -> NOTA: Solo 2 sillas laterales enfrentadas
    { id: 'T5', numero: 'T5', shape: 'squircle', capacidad: 2, estado: 'libre', comensal: null, personas: 2, tiempoStr: '0:00h', mesero: 'Mateo N.' },

    // FILA 2:
    // T8: 4 sillas - Ocupada (Rojo Marfil)
    { id: 'T8', numero: 'T8', shape: 'squircle', capacidad: 4, estado: 'ocupada', comensal: 'Andrea Garza', personas: 3, tiempoStr: '0:35h', mesero: 'Valeria S.', verified: false },
    // T9: 4 sillas - Libre (Gris claro nítido)
    { id: 'T9', numero: 'T9', shape: 'squircle', capacidad: 4, estado: 'libre', comensal: null, personas: 4, tiempoStr: '0:00h', mesero: 'Valeria S.' },
    // T10: 4 sillas - En Limpieza & Desinfección (Ámbar)
    { id: 'T10', numero: 'T10', shape: 'squircle', capacidad: 4, estado: 'limpieza', comensal: null, personas: 4, tiempoStr: '0:06h', mesero: 'Erick R.', verified: false },
    // T11: 4 sillas - Ocupada (Rojo Marfil)
    { id: 'T11', numero: 'T11', shape: 'squircle', capacidad: 4, estado: 'ocupada', comensal: 'Diana Luna', personas: 4, tiempoStr: '0:40h', mesero: 'Mateo N.', verified: false },
    // T6 Lateral Derecho: Mesa rectangular vertical para 6 comensales (3 sillas izq + 3 sillas der)
    { id: 'T6_RECT', numero: 'T6', shape: 'rectangle_vertical', capacidad: 6, estado: 'ocupada', comensal: 'Grupo Arquitectura', personas: 6, tiempoStr: '1:15h', mesero: 'Sofía V.', verified: true },

    // FILA 3:
    // T12: Redonda 2 sillas - Ocupada (Rojo Marfil) -> NOTA: Solo 2 sillas arriba y abajo
    { id: 'T12', numero: 'T12', shape: 'circle', capacidad: 2, estado: 'ocupada', comensal: 'Lucía Benítez', personas: 2, tiempoStr: '0:25h', mesero: 'Valeria S.', verified: false },
    // T13: Redonda 2 sillas - Libre (Gris claro nítido) -> NOTA: Solo 2 sillas arriba y abajo
    { id: 'T13', numero: 'T13', shape: 'circle', capacidad: 2, estado: 'libre', comensal: null, personas: 2, tiempoStr: '0:00h', mesero: 'Valeria S.' },
    // T14: Redonda 4 sillas - Libre (Gris claro nítido)
    { id: 'T14', numero: 'T14', shape: 'circle', capacidad: 4, estado: 'libre', comensal: null, personas: 4, tiempoStr: '0:00h', mesero: 'Mateo N.' },
    // T15: Redonda 4 sillas - Ocupada (Rojo Marfil)
    { id: 'T15', numero: 'T15', shape: 'circle', capacidad: 4, estado: 'ocupada', comensal: 'Rodrigo Peña', personas: 4, tiempoStr: '0:50h', mesero: 'Mateo N.', verified: false },
    // T16: Mesa Alargada Horizontal para 6 sillas (2 arriba, 2 abajo, 1 izq, 1 der) - Ocupada (Rojo Marfil)
    { id: 'T16', numero: 'T16', shape: 'rectangle_horizontal', capacidad: 6, estado: 'ocupada', comensal: 'Mariana Soto', personas: 5, tiempoStr: '1:05h', mesero: 'Sofía V.', verified: true }
  ];

  const [tableLayout, setTableLayout] = useState(defaultLayout);

  const handleUpdateStatus = (tableId, nuevoEstado) => {
    setTableLayout(prev => prev.map(t => {
      if (t.id === tableId) {
        const isFree = nuevoEstado === 'libre';
        const isClean = nuevoEstado === 'limpieza';
        return {
          ...t,
          estado: nuevoEstado,
          tiempoStr: isFree ? '0:00h' : isClean ? '0:05h' : t.tiempoStr || '0:15h',
          comensal: isFree ? null : isClean ? null : t.comensal || 'Comensal en Sala'
        };
      }
      return t;
    }));

    if (soundEnabled) {
      playSound(nuevoEstado === 'libre' ? 'success' : nuevoEstado === 'ocupada' ? 'coin' : 'toggle');
    }
    setSelectedMesa(null);
  };

  const occupiedCount = tableLayout.filter(t => t.estado === 'ocupada').length;
  const freeCount = tableLayout.filter(t => t.estado === 'libre').length;
  const cleaningCount = tableLayout.filter(t => t.estado === 'limpieza').length;

  // Escape key para cerrar modal de mesa
  useEffect(() => {
    if (!selectedMesa) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedMesa(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMesa]);

  return (
    <div className={`bg-[#F4F6F9] rounded-3xl p-6 sm:p-8 border border-[#1F1410]/8 shadow-xs animate-menu-in relative flex flex-col justify-between select-none ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-[#F4F6F9]' : 'min-h-[780px]'
    }`}>
      
      {/* 1. Barra Superior en Español con selector de Propiedades */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#1F1410]/8">
        
        {/* Título de la zona y conteo en tiempo real */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display font-bold text-2xl text-[#1F1410]">
            Servicio en Sala
          </h2>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FCEAE9] text-[#E12927]">
            {activeZone === 'salon' ? 'Salón Principal' : activeZone === 'terraza' ? 'Terraza Colonial' : 'Ludoteca'}
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E12927]/10 text-[#E12927] font-semibold">
              ● {occupiedCount} ocupadas
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              ○ {freeCount} libres
            </span>
            {cleaningCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                🧹 {cleaningCount} en limpieza
              </span>
            )}
          </div>
        </div>

        {/* Controles de la barra superior: Propiedades, Más Opciones, Selector de Plano, Asignar Walk-in */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto relative flex-wrap">
          
          {/* Botón Propiedades con popover en Español (Sin precios) */}
          <div className="relative">
            <button
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

            {/* Popover Propiedades traducido al Español */}
            {showPropertiesMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#1F1410]/12 shadow-2xl p-4 z-50 animate-menu-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#1F1410]/8 mb-3">
                  <span className="font-bold text-xs text-[#1F1410] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#E12927]" />
                    Propiedades Visibles
                  </span>
                  <button 
                    onClick={clearProperties}
                    className="text-[11px] text-[#E12927] hover:underline font-semibold cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="text-[11px] text-[#1F1410]/60 mb-2.5 font-medium">
                  Elige los datos para mostrar en mesas:
                </div>

                {/* Chips de propiedades (sin precios) */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'diningTime', label: 'Tiempo en mesa', icon: Clock },
                    { key: 'customers', label: 'Comensales', icon: Users },
                    { key: 'waiter', label: 'Mesero(a)', icon: UserPlus },
                    { key: 'reservations', label: 'Reservación', icon: Utensils },
                    { key: 'items', label: 'Platillos', icon: Receipt }
                  ].map(prop => {
                    const isSelected = visibleProperties[prop.key];
                    const Icon = prop.icon;

                    return (
                      <button
                        key={prop.key}
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

          {/* Menú de más opciones */}
          <button 
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              alert('Opciones de sala: Reorganizar plano, reiniciar ocupación o imprimir comanda general.');
            }}
            className="w-8 h-8 rounded-full bg-white border border-[#1F1410]/10 flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer shadow-2xs"
            title="Más opciones"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Selector de Plano en Español */}
          <div className="relative">
            <select
              value={activeZone}
              onChange={(e) => {
                setActiveZone(e.target.value);
                if (soundEnabled) playSound('toggle');
              }}
              className="appearance-none bg-white border border-[#1F1410]/10 rounded-full px-4 py-1.5 pr-8 text-xs font-semibold text-[#1F1410] shadow-2xs hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            >
              <option value="salon">Plano · Salón Principal</option>
              <option value="terraza">Plano · Terraza Colonial</option>
              <option value="ludoteca">Plano · Ludoteca & Juegos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F1410]/40 pointer-events-none" />
          </div>

          {/* Asignar Walk-In */}
          <button
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              onOpenWalkInModal();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E12927] hover:bg-[#c9201f] text-white rounded-full text-xs font-semibold shadow-xs transition-transform hover:scale-102 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Asignar Walk-in</span>
          </button>

        </div>

      </div>

      {/* 2. Lienzo Arquitectónico de Mesas (Con fondo nítido y rejilla sutil para máximo contraste) */}
      <div 
        style={{ 
          transform: `scale(${zoomLevel / 100})`, 
          transformOrigin: 'top center',
          backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        className="transition-transform duration-200 py-12 px-4 sm:px-8 flex flex-col items-center justify-center space-y-14 sm:space-y-16 rounded-2xl bg-white/70 border border-slate-200/80 shadow-inner my-3"
      >
        
        {/* FILA 1: Squircles: T1 (4 sillas gris libre), T2 (2 sillas gris libre), T3 (4 sillas gris libre), T4 (4 sillas rojo ocupada), T5 (2 sillas gris libre) */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {tableLayout.slice(0, 5).map(mesa => renderTable(mesa))}
        </div>

        {/* FILA 2: Squircles T8, T9, T10 (Limpieza), T11 + Mesa Lateral Derecha T6 (6 sillas) */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          <div className="flex items-center gap-8 sm:gap-12 flex-wrap justify-center">
            {tableLayout.slice(5, 9).map(mesa => renderTable(mesa))}
          </div>

          {/* Mesa Rectangular Vertical T6 (con 6 sillas claramente visibles: 3 izq + 3 der) */}
          <div className="pl-0 sm:pl-4">
            {renderTable(tableLayout[9])}
          </div>
        </div>

        {/* FILA 3: Redondas & Cápsula: T12 (2 sillas rojo), T13 (2 sillas gris), T14 (4 sillas gris), T15 (4 sillas rojo), T16 (6 sillas horizontal rojo) */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {tableLayout.slice(10, 15).map(mesa => renderTable(mesa))}
        </div>

      </div>

      {/* 3. Barra Inferior: Zoom, Leyenda Oficial en Español y Pantalla Completa */}
      <div className="pt-6 border-t border-[#1F1410]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Controles de Zoom (+ / -) */}
        <div className="flex items-center bg-white border border-[#1F1410]/10 rounded-full shadow-2xs p-1">
          <button
            onClick={() => setZoomLevel(Math.min(zoomLevel + 10, 130))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Acercar mapa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-[#1F1410]/70 font-semibold">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.max(zoomLevel - 10, 70))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
            title="Alejar mapa"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leyenda Oficial en Español con alta claridad visual */}
        <div className="flex items-center gap-6 text-xs font-mono text-[#1F1410]/80 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#E2E8F0] border-2 border-[#94A3B8] shadow-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span className="font-bold text-[#334155]">Libre / Disponible (Gris)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#E12927] border border-[#C9201F] shadow-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span className="font-bold text-[#E12927]">Ocupada en Servicio (Rojo Marfil)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#FEF3C7] border-2 border-[#F59E0B] shadow-xs flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            </span>
            <span className="font-bold text-amber-900">En Limpieza & Desinfección</span>
          </div>
        </div>

        {/* Botón de Pantalla Completa */}
        <button
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

      {/* 4. Modal de Gestión de Mesa al hacer clic (Portal a document.body para tapar toda la pantalla) */}
      {selectedMesa && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setSelectedMesa(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div className="flex items-center gap-3">
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-xl shadow-xs shrink-0 ${
                  selectedMesa.estado === 'ocupada'
                    ? 'bg-[#E12927] text-white shadow-md shadow-[#E12927]/30 border border-[#C9201F]'
                    : selectedMesa.estado === 'limpieza'
                    ? 'bg-amber-100 text-amber-950 border-2 border-[#F59E0B]'
                    : 'bg-[#E2E8F0] border-2 border-[#94A3B8] text-[#1F1410]'
                }`}>
                  {selectedMesa.numero}
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                    Mesa {selectedMesa.numero}
                  </h3>
                  <span className="text-xs font-mono text-[#1F1410]/60 block font-semibold mt-0.5">
                    Capacidad: {selectedMesa.capacidad} sillas ({selectedMesa.capacidad} comensales)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMesa(null)} 
                className="w-8 h-8 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6 font-body text-xs">
              <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-[#1F1410]/8 space-y-2.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[#1F1410]/60">Estado en sala:</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedMesa.estado === 'ocupada'
                      ? 'bg-[#E12927] text-white shadow-xs'
                      : selectedMesa.estado === 'limpieza'
                      ? 'bg-amber-200 text-amber-950 border border-amber-400'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {selectedMesa.estado === 'ocupada' ? '● Ocupada en Servicio' : selectedMesa.estado === 'limpieza' ? '🧹 En Limpieza' : '✓ Libre y Lista'}
                  </span>
                </div>
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
                  <span className="font-semibold text-xs text-[#1F1410]">{selectedMesa.mesero}</span>
                </div>
              </div>

              {/* Botones de acción directa en Español */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => handleUpdateStatus(selectedMesa.id, 'ocupada')}
                  className="w-full py-3 bg-[#E12927] hover:bg-[#b51c1a] text-white font-semibold rounded-full shadow-md shadow-[#E12927]/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Marcar Ocupada (Rojo Marfil)</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMesa.id, 'limpieza')}
                  className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold rounded-full border-2 border-amber-300 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Marcar en Limpieza & Sanitización</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedMesa.id, 'libre')}
                  className="w-full py-3 bg-[#E2E8F0] hover:bg-[#CBD5E1] border-2 border-[#94A3B8] text-[#1F1410] font-semibold rounded-full shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Liberar Mesa (Disponible en Gris)</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1F1410]/8 flex justify-end">
              <button
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

  // Renderizador principal de mesas y sillas sin precios (enfocado en estatus, tiempo y comensales)
  function renderTable(mesa) {
    const isFree = mesa.estado === 'libre';
    const isOccupied = mesa.estado === 'ocupada';
    const isCleaning = mesa.estado === 'limpieza';

    // Clases cromáticas de la superficie de la mesa
    const tableSurfaceClass = isOccupied
      ? 'bg-[#E12927] text-white border-2 border-[#C9201F] shadow-lg shadow-[#E12927]/30'
      : isCleaning
      ? 'bg-[#FEF3C7] text-amber-950 border-2 border-dashed border-[#F59E0B] shadow-md shadow-amber-200/50'
      : 'bg-[#E2E8F0] text-[#1F1410] border-2 border-[#94A3B8] shadow-md shadow-slate-300/80 hover:border-slate-500';

    // Clases cromáticas de las sillas
    const chairColorClass = isOccupied
      ? 'bg-[#E12927] border border-[#B81E1C] shadow-2xs'
      : isCleaning
      ? 'bg-[#FEF3C7] border border-[#F59E0B] shadow-2xs'
      : 'bg-[#CBD5E1] border-2 border-[#94A3B8] shadow-xs';

    // 1. MESA RECTANGULAR VERTICAL (T6 a la derecha con 6 sillas: 3 a la izquierda, 3 a la derecha)
    if (mesa.shape === 'rectangle_vertical') {
      return (
        <div
          key={mesa.id}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className="relative group cursor-pointer hover:scale-105 transition-transform select-none py-2 px-3"
          title={`Mesa ${mesa.numero} · Capacidad: ${mesa.capacidad} sillas (${isFree ? 'Libre' : isOccupied ? 'Ocupada' : 'Limpieza'})`}
        >
          {/* Contenedor mesa rectangular de 6 sillas */}
          <div className="relative w-28 h-56 sm:w-32 sm:h-64 flex items-center justify-center">
            
            {/* 3 SILLAS IZQUIERDAS */}
            <span className={`absolute -left-4 top-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -left-4 bottom-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />

            {/* 3 SILLAS DERECHAS */}
            <span className={`absolute -right-4 top-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -right-4 bottom-6 w-3 h-10 rounded-full transition-colors ${chairColorClass}`} />

            {/* Tablero de la mesa */}
            <div className={`w-full h-full rounded-3xl p-3 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass}`}>
              
              {/* Badge superior derecho */}
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
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute top-2.5 right-2.5 border-2 border-white shadow-2xs" title="Disponible" />
              )}

              {/* Número de mesa */}
              <div className={`font-display font-bold text-2xl mt-3 tracking-wide ${isOccupied ? 'text-white' : 'text-[#1F1410]'}`}>
                {mesa.numero}
              </div>

              {/* Contenido según propiedades (Sin precios) */}
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
                    <div className="opacity-90 text-[9px] truncate">
                      {mesa.mesero}
                    </div>
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
                    6 comensales
                  </span>
                </div>
              )}

              {/* Indicador de capacidad de sillas */}
              <span className={`text-[9px] font-mono uppercase font-bold tracking-wider mb-1 ${isOccupied ? 'text-white/70' : 'text-slate-600'}`}>
                6 Sillas
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 2. MESA HORIZONTAL ALARGADA (T16 con 6 sillas: 2 arriba, 2 abajo, 1 izq, 1 der)
    if (mesa.shape === 'rectangle_horizontal') {
      return (
        <div
          key={mesa.id}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className="relative group cursor-pointer hover:scale-105 transition-transform select-none py-2 px-3"
          title={`Mesa ${mesa.numero} · Capacidad: ${mesa.capacidad} sillas (${isFree ? 'Libre' : isOccupied ? 'Ocupada' : 'Limpieza'})`}
        >
          {/* Contenedor mesa horizontal de 6 sillas */}
          <div className="relative w-40 h-26 sm:w-48 sm:h-30 flex items-center justify-center">
            
            {/* 2 SILLAS ARRIBA */}
            <span className={`absolute -top-4 left-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -top-4 right-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />

            {/* 2 SILLAS ABAJO */}
            <span className={`absolute -bottom-4 left-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
            <span className={`absolute -bottom-4 right-7 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />

            {/* 1 SILLA CABECERA IZQUIERDA */}
            <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />

            {/* 1 SILLA CABECERA DERECHA */}
            <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />

            {/* Tablero de la mesa */}
            <div className={`w-full h-full rounded-3xl p-3 flex flex-col justify-between items-center text-center relative transition-all ${tableSurfaceClass}`}>
              
              {/* Badge superior derecho */}
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
                <span className={`font-display font-bold text-xl sm:text-2xl ${isOccupied ? 'text-white' : 'text-[#1F1410]'}`}>
                  {mesa.numero}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isOccupied ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                }`}>
                  6 sillas
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
                    <div className="opacity-90">
                      {mesa.personas} comensales
                    </div>
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

    // 3. MESAS DE 2 SILLAS (Squircle o Redondas) -> ¡SOLO 2 SILLAS ENFRENTADAS!
    if (mesa.capacidad === 2) {
      const isCircle = mesa.shape === 'circle';

      return (
        <div
          key={mesa.id}
          onClick={() => {
            setSelectedMesa(mesa);
            if (soundEnabled) playSound('toggle');
          }}
          className="relative group cursor-pointer hover:scale-105 transition-transform select-none py-2 px-2"
          title={`Mesa ${mesa.numero} · Mesa para 2 comensales (${isFree ? 'Libre' : isOccupied ? 'Ocupada' : 'Limpieza'})`}
        >
          {/* Contenedor mesa de 2 sillas */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            
            {/* Si es Squircle: Sillas laterales (Izquierda y Derecha). Arriba y abajo quedan TOTALMENTE LIBRES */}
            {!isCircle && (
              <>
                <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />
                <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-10 sm:h-12 rounded-full transition-colors ${chairColorClass}`} />
              </>
            )}

            {/* Si es Circular: Sillas superior e inferior (Arriba y Abajo). Lados quedan TOTALMENTE LIBRES */}
            {isCircle && (
              <>
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
                <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-3 rounded-full transition-colors ${chairColorClass}`} />
              </>
            )}

            {/* Tablero de la mesa (Squircle o Círculo) */}
            <div className={`w-full h-full flex flex-col items-center justify-center p-2.5 relative transition-all ${
              isCircle ? 'rounded-full' : 'rounded-3xl'
            } ${tableSurfaceClass}`}>

              {/* Indicador de estado superior derecho */}
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

              {/* Número de mesa */}
              <span className={`font-display font-bold text-lg sm:text-xl leading-tight ${isOccupied ? 'text-white' : 'text-[#1F1410]'}`}>
                {mesa.numero}
              </span>

              {/* Propiedades (Sin precios) */}
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
                    <div className="opacity-80 text-[8px]">
                      {mesa.personas} comensales
                    </div>
                  )}
                </div>
              )}

              {isCleaning && (
                <div className="text-[8.5px] font-mono text-amber-950 font-bold mt-0.5 text-center">
                  Limpieza
                </div>
              )}

              {/* MESA LIBRE: Etiqueta bien visible de 2 sillas y disponible */}
              {isFree && (
                <div className="text-center font-mono mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-extrabold border border-emerald-300">
                    Libre
                  </span>
                  <span className="block text-[8px] text-slate-700 font-bold">
                    2 sillas
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    // 4. MESAS ESTÁNDAR DE 4 SILLAS (Squircle o Redondas) -> 1 silla en cada uno de los 4 costados
    const isCircle = mesa.shape === 'circle';

    return (
      <div
        key={mesa.id}
        onClick={() => {
          setSelectedMesa(mesa);
          if (soundEnabled) playSound('toggle');
        }}
        className="relative group cursor-pointer hover:scale-105 transition-transform select-none py-2 px-2"
        title={`Mesa ${mesa.numero} · 4 sillas (${isFree ? 'Libre' : isOccupied ? 'Ocupada' : 'Limpieza'})`}
      >
        <div className="relative w-26 h-26 sm:w-30 sm:h-30 flex items-center justify-center">
          
          {/* Silla Superior */}
          <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-11 sm:w-13 h-3 rounded-full transition-colors ${chairColorClass}`} />

          {/* Silla Inferior */}
          <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-11 sm:w-13 h-3 rounded-full transition-colors ${chairColorClass}`} />

          {/* Silla Izquierda */}
          <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-3 h-11 sm:h-13 rounded-full transition-colors ${chairColorClass}`} />

          {/* Silla Derecha */}
          <span className={`absolute -right-4 top-1/2 -translate-y-1/2 w-3 h-11 sm:h-13 rounded-full transition-colors ${chairColorClass}`} />

          {/* Tablero de la mesa (Squircle o Círculo) */}
          <div className={`w-full h-full flex flex-col items-center justify-center p-2.5 relative transition-all ${
            isCircle ? 'rounded-full' : 'rounded-3xl'
          } ${tableSurfaceClass}`}>

            {/* Indicador de estado superior derecho */}
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

            {/* Número de Mesa */}
            <span className={`font-display font-bold text-lg sm:text-2xl leading-tight ${isOccupied ? 'text-white' : 'text-[#1F1410]'}`}>
              {mesa.numero}
            </span>

            {/* Propiedades activas en la mesa ocupada (Sin precios) */}
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
                  <div className="opacity-90 text-[8px]">
                    {mesa.personas} comensales
                  </div>
                )}
                {visibleProperties.waiter && (
                  <div className="opacity-90 text-[8px] truncate max-w-[65px]">
                    {mesa.mesero}
                  </div>
                )}
              </div>
            )}

            {isCleaning && (
              <div className="text-[9px] font-mono text-amber-950 font-bold mt-1 text-center">
                Limpieza {mesa.tiempoStr}
              </div>
            )}

            {/* MESA LIBRE: Etiqueta de Disponible con fondo verde claro y texto 4 sillas */}
            {isFree && (
              <div className="text-center font-mono mt-1 space-y-0.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8.5px] font-bold border border-emerald-300">
                  Disponible
                </span>
                <span className="block text-[8px] text-slate-700 font-bold">
                  4 sillas
                </span>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }
};
