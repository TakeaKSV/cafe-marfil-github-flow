import React, { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Check,
  QrCode,
  ChevronDown,
  CalendarDays,
  Ticket,
  Users,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const DashboardView = ({
  metricas,
  selectedSucursal,
  sucursales,
  soundEnabled,
  onNavigateToTab
}) => {
  const [timeRange, setTimeRange] = useState('hoy');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Multiplicador simulado si se cambia el rango de tiempo
  const multiplier = timeRange === 'hoy' ? 1 : timeRange === 'semana' ? 6.5 : 28;

  const totalReservaciones = Math.round(metricas.reservasHoy * multiplier);
  const codigosEscaneados = Math.round((metricas.codigosEscaneadosHoy ?? 0) * multiplier);
  const totalVisitors = Math.round(metricas.comensalesHoy * multiplier);
  const sellosEmitidos = Math.round(metricas.sellosEmitidosHoy * multiplier);

  // Afluencia real del día: la API entrega comensales por hora y aquí se agrupan
  // en franjas de dos horas (8:00, 10:00 ... 22:00) para el gráfico de barras.
  const franjas = [8, 10, 12, 14, 16, 18, 20, 22].map((hora) => {
    const pax = (metricas.distribucionHoraria ?? [])
      .filter((f) => { const h = Number(f.hora.slice(0, 2)); return h === hora || h === hora + 1; })
      .reduce((suma, f) => suma + f.comensales, 0);
    return { label: `${hora}:00`, pax };
  });
  const maxPax = Math.max(...franjas.map((f) => f.pax));
  const topeEje = Math.max(50, Math.ceil(maxPax / 50) * 50);
  const barData = franjas.map((f) => ({
    ...f,
    height: Math.max(3, Math.round((f.pax / topeEje) * 100)),
    isPeak: maxPax > 0 && f.pax >= maxPax * 0.9
  }));

  const etiquetaHoy = metricas.fecha
    ? new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(new Date(`${metricas.fecha}T12:00:00Z`))
    : 'hoy';

  // Mix de consumo en sala (Donut Chart original)
  const categories = [
    { name: 'Chilaquiles & Molletes', pct: 38, color: '#E12927' },
    { name: 'Frappés de Confitería', pct: 26, color: '#F87171' },
    { name: 'Café de Especialidad', pct: 18, color: '#1F1410' },
    { name: 'Fresas Estilo Dubái', pct: 12, color: '#FBBF24' },
    { name: 'Bebidas Sociales & Mezcal', pct: 6, color: '#10B981' }
  ];

  return (
    <div className="h-full flex flex-col justify-between gap-3 text-xs select-none">

      {/* 1. Header con Saludo y Filtros */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="font-display font-bold text-lg sm:text-xl text-[#1F1410] flex items-center gap-1.5 leading-none">
            ¡Hola, Admin! <span className="animate-wave inline-block text-base">👋</span>
          </h1>
          <p className="text-[11px] text-[#1F1410]/50 font-body mt-0.5">
            Monitoreo en tiempo real de reservaciones, aforo y validaciones QR en Café Marfil Durango.
          </p>
        </div>

        {/* Dropdown de período */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                if (soundEnabled) playSound('toggle');
              }}
              className="appearance-none bg-white border border-[#1F1410]/10 rounded-full px-3 py-1 pr-7 text-[11px] font-semibold text-[#1F1410] shadow-2xs hover:border-[#1F1410]/30 transition-colors cursor-pointer"
            >
              <option value="hoy">Hoy ({etiquetaHoy})</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1F1410]/50 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              onNavigateToTab('reservations');
            }}
            className="w-7 h-7 rounded-full bg-white border border-[#1F1410]/10 flex items-center justify-center text-[#1F1410]/70 hover:text-[#1F1410] hover:bg-[#FAF7F5] shadow-2xs transition-colors cursor-pointer"
            title="Ver listado de reservaciones"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Grid Superior: 4 Tarjetas KPI a la izquierda + Gráfica de Barras a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">

        {/* Columna Izquierda: 4 Tarjetas KPI (2x2) */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-2.5">

          {/* Card 1: TOTAL RESERVACIONES */}
          <div
            onClick={() => onNavigateToTab('reservations')}
            className="bg-[#E12927] text-white p-3 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover-lift btn-press cursor-pointer"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-white/85">Reservaciones</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#E12927] transition-all group-hover:rotate-45">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="font-display font-bold text-lg sm:text-xl text-white tracking-tight leading-none">
                  {totalReservaciones} Reservas
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#10B981] text-white shadow-2xs">
                  +14%
                </span>
              </div>
              <p className="text-[10px] text-white/70">
                {timeRange === 'hoy' ? `${metricas.reservasAsistidas ?? 0} asistidas · ${metricas.reservasNoShow ?? 0} no-show` : 'Ciclo comparativo'}
              </p>
            </div>
          </div>

          {/* Card 2: CÓDIGOS ESCANEADOS */}
          <div
            onClick={() => onNavigateToTab('scanner')}
            className="bg-white p-3 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between group hover-lift btn-press cursor-pointer"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-[#1F1410]/60">Códigos QR</span>
              <div className="w-5 h-5 rounded-full bg-[#FAF7F5] border border-[#1F1410]/5 flex items-center justify-center text-[#1F1410]/60 group-hover:bg-[#1F1410] group-hover:text-white transition-all group-hover:rotate-45">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="font-display font-bold text-lg sm:text-xl text-[#1F1410] tracking-tight leading-none">
                  {codigosEscaneados}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#10B981] text-white shadow-2xs">
                  +18%
                </span>
              </div>
              <p className="text-[10px] text-[#1F1410]/40">
                {metricas.cuponesRedimidosHoy ?? 0} cupones canjeados hoy
              </p>
            </div>
          </div>

          {/* Card 3: COMENSALES */}
          <div
            onClick={() => onNavigateToTab('floorplan')}
            className="bg-white p-3 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between group hover-lift btn-press cursor-pointer"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-[#1F1410]/60">Comensales</span>
              <div className="w-5 h-5 rounded-full bg-[#FAF7F5] border border-[#1F1410]/5 flex items-center justify-center text-[#1F1410]/60 group-hover:bg-[#1F1410] group-hover:text-white transition-all group-hover:rotate-45">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="font-display font-bold text-lg sm:text-xl text-[#1F1410] tracking-tight leading-none">
                  {totalVisitors} PAX
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#10B981] text-white shadow-2xs">
                  +8.5%
                </span>
              </div>
              <p className="text-[10px] text-[#1F1410]/40">
                Aforo: {metricas.aforoPorcentaje ?? 0}% ocupado
              </p>
            </div>
          </div>

          {/* Card 4: SELLOS CLUB MARFIL */}
          <div
            onClick={() => onNavigateToTab('scanner')}
            className="bg-white p-3 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between group hover-lift btn-press cursor-pointer"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-[#1F1410]/60">Sellos Club</span>
              <div className="w-5 h-5 rounded-full bg-[#FAF7F5] border border-[#1F1410]/5 flex items-center justify-center text-[#1F1410]/60 group-hover:bg-[#1F1410] group-hover:text-white transition-all group-hover:rotate-45">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="font-display font-bold text-lg sm:text-xl text-[#1F1410] tracking-tight leading-none">
                  {sellosEmitidos} sellos
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#10B981] text-white shadow-2xs">
                  +12%
                </span>
              </div>
              <p className="text-[10px] text-[#1F1410]/40">
                Visitas selladas hoy
              </p>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Gráfica de Barras de Afluencia & Reservaciones por Franja Horaria */}
        <div className="lg:col-span-6 bg-white p-3.5 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-display font-bold text-xs sm:text-sm text-[#1F1410] leading-none">
                Afluencia & Reservaciones por Franja Horaria
              </h2>
              <p className="text-[10px] text-[#1F1410]/40 font-body mt-0.5">
                Distribución horaria en sucursales de Durango
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('floorplan')}
              className="w-6 h-6 rounded-full bg-[#1F1410] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Gráfico de Barras con escala en Y */}
          <div className="flex items-stretch gap-2 h-28 sm:h-32 pt-1">
            <div className="flex flex-col justify-between text-[9px] font-mono text-[#1F1410]/40 pb-5 text-right select-none w-8">
              {[5, 4, 3, 2, 1, 0].map((paso) => (
                <span key={paso}>{(topeEje / 5) * paso}p</span>
              ))}
            </div>

            <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 border-b border-[#1F1410]/8 pb-1.5 h-full">
              {barData.map((bar, i) => {
                const isHovered = hoveredBarIndex === i;

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-7 px-2 py-0.5 bg-[#1F1410] text-white text-[9px] font-mono rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 animate-menu-in">
                        {bar.pax} comensales
                      </div>
                    )}

                    <div
                      style={{ height: `${bar.height}%` }}
                      className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 ${
                        bar.isPeak
                          ? 'bg-[#E12927] group-hover:bg-[#b51c1a] shadow-xs'
                          : 'bg-[#1F1410]/15 group-hover:bg-[#1F1410]/35'
                      }`}
                    />

                    <span className="text-[9px] font-mono text-[#1F1410]/50 mt-1 select-none">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Fila Inferior: 2 Tarjetas de Estatus + Donut Chart de Ventas por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">

        {/* Card 1: 28 Reservaciones Activas */}
        <div
          onClick={() => onNavigateToTab('reservations')}
          className="md:col-span-4 bg-white p-3.5 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between relative group hover-lift btn-press cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FCEAE9] text-[#E12927] flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
            <CalendarDays className="w-4 h-4 stroke-[2.5]" />
          </div>

          <div>
            <div className="font-display font-bold text-xl sm:text-2xl text-[#1F1410] mb-0.5 leading-none">
              {metricas.reservasHoy ?? 0} reservas
            </div>
            <p className="text-[11px] text-[#1F1410]/60 font-body">
              <strong className="text-[#E12927]">{metricas.reservasConfirmadas ?? 0} por llegar</strong> y {metricas.reservasEnCurso ?? 0} en sala ahora.
            </p>
          </div>

          <div className="absolute right-3.5 bottom-3.5 w-6 h-6 rounded-full bg-[#1F1410] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-45">
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: 46 Códigos Escaneados en Turno */}
        <div
          onClick={() => onNavigateToTab('scanner')}
          className="md:col-span-4 bg-white p-3.5 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between relative group hover-lift btn-press cursor-pointer overflow-hidden"
        >
          <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none">
            <svg width="120" height="80" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60C40 20 80 100 120 40C160 -20 200 80 200 80" stroke="#1F1410" strokeWidth="6" />
              <path d="M0 80C40 40 80 120 120 60C160 0 200 100 200 100" stroke="#E12927" strokeWidth="4" />
            </svg>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
            <QrCode className="w-4 h-4 stroke-[2.5]" />
          </div>

          <div>
            <div className="font-display font-bold text-xl sm:text-2xl text-[#1F1410] mb-0.5 leading-none">
              {metricas.codigosEscaneadosHoy ?? 0} códigos
            </div>
            <p className="text-[11px] text-[#1F1410]/60 font-body">
              <strong className="text-emerald-700">{metricas.cuponesRedimidosHoy ?? 0} cupones</strong> redimidos y aplicados hoy.
            </p>
          </div>
        </div>

        {/* Card 3: SALES BY CATEGORY (Donut Chart Original) */}
        <div className="md:col-span-4 bg-white p-3.5 rounded-2xl border border-[#1F1410]/8 shadow-2xs flex flex-col justify-between hover-lift">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <h2 className="font-display font-bold text-xs sm:text-sm text-[#1F1410] leading-none">
                Demanda por Categoría
              </h2>
              <p className="text-[10px] text-[#1F1410]/40 font-body mt-0.5">
                Preferencia de comensales
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('menu')}
              className="w-6 h-6 rounded-full bg-[#1F1410] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3 py-1">
            {/* SVG Donut */}
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#E12927" strokeWidth="6" strokeDasharray="38 62" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#F87171" strokeWidth="6" strokeDasharray="26 74" strokeDashoffset="-38" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#1F1410" strokeWidth="6" strokeDasharray="18 82" strokeDashoffset="-64" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#FBBF24" strokeWidth="6" strokeDasharray="12 88" strokeDashoffset="-82" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10B981" strokeWidth="6" strokeDasharray="6 94" strokeDashoffset="-94" />
              </svg>
            </div>

            {/* Leyenda */}
            <div className="space-y-1 text-[10px] font-body flex-1">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[#1F1410]/70 truncate">{cat.name}</span>
                  </div>
                  <span className="font-mono font-bold text-[#1F1410] text-[9px]">
                    {cat.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardView;
