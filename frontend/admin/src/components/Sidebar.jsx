import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  LayoutGrid,
  Dice5,
  UtensilsCrossed,
  Tag,
  Users,
  Building2,
  LogOut,
  Coffee,
  CheckCircle2,
  ChevronDown,
  Check
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  selectedSucursal,
  onSelectSucursal,
  sucursales,
  soundEnabled,
  badges = {},
  onLogout
}) => {
  const currentSucursalObj = sucursales.find(s => s.id === selectedSucursal);
  const currentSucursalLabel = selectedSucursal === 'todas'
    ? 'Todas las Sucursales'
    : (currentSucursalObj?.nombre || 'Seleccionar');

  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setIsBranchOpen(false);
      }
    };
    if (isBranchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBranchOpen]);

  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'reservations', label: 'Reservaciones', icon: CalendarDays },
    { id: 'floorplan', label: 'Mesas en Vivo', icon: LayoutGrid },
    { id: 'scanner', label: 'Escáner QR', icon: QrCode },
    { id: 'menu', label: 'Menú & Cocina', icon: UtensilsCrossed },
    { id: 'promotions', label: 'Promociones', icon: Tag },
    { id: 'ludoteca', label: 'Ludoteca', icon: Dice5 },
    { id: 'staff', label: 'Personal & Turnos', icon: Users }
  ];

  const activeIndex = Math.max(0, menuItems.findIndex(item => item.id === activeTab));

  return (
    <aside className="w-60 sm:w-64 md:w-68 bg-[#E12927] flex flex-col justify-between shrink-0 z-30 select-none h-full overflow-y-auto overflow-x-hidden pt-6 pb-5 font-body relative">

      {/* 1. SECCIÓN SUPERIOR: Marca & Sucursal Activa */}
      <div className="space-y-4">

        {/* Título de Marca (Estilo eProduct de la referencia) */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight leading-none truncate">
              Café Marfil
            </h1>
            <span className="text-[10px] font-mono text-white/80 font-medium tracking-wider uppercase block mt-1">
              Urban Brunch & Bar
            </span>
          </div>
        </div>

        {/* Selector de Sucursal Premium en cápsula moderna con menú desplegable flotante */}
        <div className="px-5 relative z-40" ref={branchDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsBranchOpen(!isBranchOpen);
              if (soundEnabled) playSound('toggle');
            }}
            className="w-full bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/25 rounded-full px-3.5 py-2 flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer text-left group shadow-xs backdrop-blur-xs focus:outline-hidden focus:ring-2 focus:ring-white/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-white text-xs font-semibold tracking-wide truncate">
                {currentSucursalLabel}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/80 shrink-0 transition-transform duration-200 ${
                isBranchOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Menú flotante de opciones de sucursal */}
          {isBranchOpen && (
            <div className="absolute left-5 right-5 top-full mt-2 bg-[#1F1410] border border-white/15 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                Filtrar por sucursal
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectSucursal('todas');
                  setIsBranchOpen(false);
                  if (soundEnabled) playSound('toggle');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  selectedSucursal === 'todas'
                    ? 'bg-[#E12927] text-white font-semibold shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Todas las Sucursales</span>
                {selectedSucursal === 'todas' && <Check className="w-3.5 h-3.5 text-white" />}
              </button>

              <div className="my-1 border-t border-white/10" />

              {sucursales.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSucursal(s.id);
                    setIsBranchOpen(false);
                    if (soundEnabled) playSound('toggle');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedSucursal === s.id
                      ? 'bg-[#E12927] text-white font-semibold shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="truncate">{s.nombre}</span>
                  {selectedSucursal === s.id && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. NAVEGACIÓN PRINCIPAL CON INDICADOR DESLIZANTE SUAVE (SIN BRINCO) */}
        <nav className="pt-2 relative">

          {/* Pastilla cóncava deslizante que se desplaza continuamente entre pestañas */}
          <div
            className="absolute right-0 w-[calc(100%-14px)] sm:w-[calc(100%-16px)] pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
            style={{
              height: '44px',
              transform: `translateY(${activeIndex * 48}px)`,
              top: '8px'
            }}
          >
            {/* Curva cóncava superior */}
            <div
              className="absolute -top-4 right-0 w-4 h-4 overflow-hidden"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <div
                className="w-full h-full rounded-br-2xl"
                style={{ backgroundColor: '#E12927' }}
              />
            </div>

            {/* Fondo de la pestaña activa (cápsula blanca que se fusiona con el canvas) */}
            <div className="w-full h-full bg-[#F8FAFC] rounded-l-full shadow-2xs" />

            {/* Curva cóncava inferior */}
            <div
              className="absolute -bottom-4 right-0 w-4 h-4 overflow-hidden"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <div
                className="w-full h-full rounded-tr-2xl"
                style={{ backgroundColor: '#E12927' }}
              />
            </div>
          </div>

          {/* Botones de menú reales montados encima del indicador deslizante */}
          <div className="flex flex-col gap-1 relative z-10">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (soundEnabled && !isActive) playSound('toggle');
                    onSelectTab(item.id);
                  }}
                  className={`h-[44px] w-[calc(100%-14px)] sm:w-[calc(100%-16px)] ml-3.5 sm:ml-4 flex items-center justify-between pl-4 pr-3.5 rounded-l-full cursor-pointer transition-colors duration-200 select-none ${isActive
                      ? 'text-[#E12927] font-bold'
                      : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-[#E12927] scale-110' : 'text-white'
                      }`} />
                    <span className="text-xs tracking-tight">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

      </div>

      {/* 3. SECCIÓN INFERIOR: Enlaces Sociales & Estado de Terminal (Estilo exacto de la foto) */}
      <div className="px-5 pt-3 space-y-3">


        {/* Estado en Línea de Terminal Durango */}
        <div className="bg-white/10 rounded-2xl px-3 py-2 flex items-center justify-between text-[11px] text-white/80 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-white">Terminal Durango · En Línea</span>
          </div>
          <button
            onClick={() => {
              if (soundEnabled) playSound('alert');
              if (onLogout) onLogout();
            }}
            title="Cerrar sesión"
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </aside>
  );
};
