import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CalendarCheck, 
  Sparkles, 
  Gift, 
  ArrowUpRight, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Award,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const DashboardModule = ({ 
  metricas, 
  sucursales, 
  selectedSucursal, 
  menuItems, 
  reservaciones, 
  mesas,
  soundEnabled,
  onNavigateToTab 
}) => {
  const [periodo, setPeriodo] = useState('hoy'); // hoy | 7dias | mes
  const [hoveredHour, setHoveredHour] = useState(null);

  // Multiplicador simulado si cambia el periodo
  const factor = periodo === 'hoy' ? 1 : periodo === '7dias' ? 6.8 : 28.5;

  const ventasTotal = Math.round(metricas.ventasHoy * factor);
  const comensalesTotal = Math.round(metricas.comensalesHoy * factor);
  const ticketPromedio = metricas.ticketPromedio;
  const reservasTotal = Math.round(metricas.reservasHoy * factor);
  const sellosTotal = Math.round(metricas.sellosEmitidosHoy * factor);
  const cuponesTotal = Math.round(metricas.cuponesRedimidosHoy * factor);

  // Top productos
  const topProducts = [...menuItems]
    .sort((a, b) => b.vendidosHoy - a.vendidosHoy)
    .slice(0, 5);

  // Filtrar mesas según sucursal
  const filteredMesas = selectedSucursal === 'todas' 
    ? mesas 
    : mesas.filter(m => m.sucursalId === selectedSucursal);
  
  const mesasOcupadas = filteredMesas.filter(m => m.estado === 'ocupada').length;
  const porcentajeOcupacion = filteredMesas.length > 0 
    ? Math.round((mesasOcupadas / filteredMesas.length) * 100) 
    : 74;

  const maxComensalesHora = Math.max(...metricas.distribucionHoraria.map(h => h.comensales));

  return (
    <div className="space-y-8 animate-menu-in">
      
      {/* Barra Superior con Selector de Período y Estado de Operación */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Métricas Operativas & Analítica
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Monitoreo en tiempo real de ventas, afluencia por turnos y desempeño en Durango
          </p>
        </div>

        {/* Selector de Rango */}
        <div className="flex items-center bg-[#FAF7F5] p-1 border border-[#1F1410]/15 rounded-md">
          {[
            { id: 'hoy', label: 'Hoy (2 Oct)' },
            { id: '7dias', label: 'Últimos 7 Días' },
            { id: 'mes', label: 'Mes de Octubre' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                setPeriodo(p.id);
                if (soundEnabled) playSound('toggle');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                periodo === p.id 
                  ? 'bg-[#1F1410] text-white shadow-xs' 
                  : 'text-[#1F1410]/70 hover:text-[#1F1410]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de 6 KPIs Ejecutivos Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Ingresos Netos</span>
            <div className="p-1.5 bg-[#FCEAE9] text-[#E12927] rounded-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#1F1410] mb-1">
            ${ventasTotal.toLocaleString('es-MX')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs ciclo anterior</span>
          </div>
        </div>

        {/* KPI 2: Comensales */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Comensales</span>
            <div className="p-1.5 bg-[#FAF7F5] text-[#1F1410] rounded-xs border border-[#1F1410]/10">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#1F1410] mb-1">
            {comensalesTotal} <span className="text-xs font-normal text-[#1F1410]/50 font-body">pax</span>
          </div>
          <div className="text-[11px] text-[#1F1410]/60 font-mono">
            Ticket promedio: <strong>${ticketPromedio} MXN</strong>
          </div>
        </div>

        {/* KPI 3: Ocupación / Aforo */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Ocupación Piso</span>
            <div className="p-1.5 bg-[#FCEAE9] text-[#E12927] rounded-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#E12927] mb-1">
            {porcentajeOcupacion}%
          </div>
          <div className="text-[11px] text-[#1F1410]/60 font-mono">
            {mesasOcupadas} de {filteredMesas.length} mesas en sala
          </div>
        </div>

        {/* KPI 4: Reservaciones */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Reservas</span>
            <div className="p-1.5 bg-[#FAF7F5] text-[#1F1410] rounded-xs border border-[#1F1410]/10">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#1F1410] mb-1">
            {reservasTotal}
          </div>
          <div className="text-[11px] text-[#1F1410]/60 font-mono">
            Tasa No-Show: <span className="text-emerald-700 font-bold">3.6%</span> (Baja)
          </div>
        </div>

        {/* KPI 5: Sellos Club Marfil */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Club Marfil</span>
            <div className="p-1.5 bg-[#FCEAE9] text-[#E12927] rounded-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#1F1410] mb-1">
            {sellosTotal} <span className="text-xs font-normal text-[#1F1410]/50 font-body">sellos</span>
          </div>
          <div className="text-[11px] text-[#1F1410]/60 font-mono">
            14 Pasaportes completados
          </div>
        </div>

        {/* KPI 6: Cupones Canjeados */}
        <div className="bg-white p-4 rounded-md border border-[#1F1410]/10 shadow-xs hover:border-[#E12927]/40 transition-colors">
          <div className="flex items-center justify-between text-[#1F1410]/60 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Cupones Caja</span>
            <div className="p-1.5 bg-[#FAF7F5] text-[#1F1410] rounded-xs border border-[#1F1410]/10">
              <Gift className="w-4 h-4 text-[#E12927]" />
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-[#1F1410] mb-1">
            {cuponesTotal} <span className="text-xs font-normal text-[#1F1410]/50 font-body">canjes</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold font-mono">
            Top: Jueves 2x1 Frappés
          </div>
        </div>

      </div>

      {/* Sección Gráfica: Distribución Horaria de Tráfico & Desglose por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Barras: Afluencia de Comensales por Hora */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-lg text-[#1F1410]">
                Curva de Afluencia & Ventas por Franja Horaria
              </h2>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Comportamiento en piso: Picos detectados en Desayunos (10:00 AM) y Tarde de Juegos (7:00 PM)
              </p>
            </div>
            {hoveredHour && (
              <div className="bg-[#1F1410] text-white px-3 py-1.5 rounded-sm text-xs font-mono animate-menu-in">
                <span>{hoveredHour.hora} hrs: </span>
                <strong className="text-[#E12927]">{hoveredHour.comensales} pax</strong> | ${hoveredHour.ventas} MXN
              </div>
            )}
          </div>

          {/* Gráfico SVG / CSS Bar Chart Interactivo */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-[#1F1410]/10">
            {metricas.distribucionHoraria.map((h, i) => {
              const heightPercent = Math.round((h.comensales / maxComensalesHora) * 100);
              const isPeak = h.comensales >= 38;

              return (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredHour(h)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {/* Tooltip on top */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#1F1410] text-white text-[10px] font-mono px-1.5 py-0.5 rounded-xs pointer-events-none whitespace-nowrap z-20">
                    {h.comensales} pax
                  </div>

                  {/* Barra */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      isPeak 
                        ? 'bg-[#E12927] group-hover:bg-[#b51c1a]' 
                        : 'bg-[#1F1410]/20 group-hover:bg-[#1F1410]/40'
                    }`}
                  />

                  {/* Hora label */}
                  <span className="text-[10px] font-mono text-[#1F1410]/60 mt-2 rotate-45 sm:rotate-0 origin-left sm:origin-center">
                    {h.hora.slice(0, 2)}h
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#1F1410]/60 mt-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#E12927] rounded-xs" /> Horas Pico (&gt;38 pax)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#1F1410]/20 rounded-xs" /> Flujo Regular
              </span>
            </div>
            <span>Turno continuo 08:00 a 23:00 hrs</span>
          </div>
        </div>

        {/* Desglose por Categoría Gastronómica */}
        <div className="bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#1F1410] mb-1">
              Mix Gastronómico
            </h2>
            <p className="text-xs text-[#1F1410]/60 font-body mb-6">
              Participación de cada línea de productos en la facturación total
            </p>

            <div className="space-y-4">
              {metricas.ventasPorCategoria.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1F1410]">{cat.categoria}</span>
                    <span className="font-mono text-[#1F1410]/80">
                      <strong>{cat.porcentaje}%</strong> · ${cat.monto.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="w-full h-2.5 bg-[#FAF7F5] rounded-xs overflow-hidden border border-[#1F1410]/10">
                    <div 
                      className="h-full rounded-xs transition-all duration-500"
                      style={{ 
                        width: `${cat.porcentaje}%`,
                        backgroundColor: cat.color === '#FCEAE9' ? '#E12927' : cat.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1F1410]/10 bg-[#FAF7F5] p-3 rounded-md">
            <div className="flex items-center gap-2 text-xs text-[#1F1410]">
              <Coffee className="w-4 h-4 text-[#E12927]" />
              <span className="font-semibold">Insight Gastronómico:</span>
            </div>
            <p className="text-xs text-[#1F1410]/70 mt-1 leading-relaxed">
              El 64% del ingreso directo se concentra en <strong>Chilaquiles con Boneless</strong> y la línea de <strong>Frappés de Confitería</strong> (Kinder y Mazapán).
            </p>
          </div>
        </div>

      </div>

      {/* Sección Inferior: Top Platillos Más Vendidos & Desempeño de Sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 5 Platillos Estrella con Fotografía Real */}
        <div className="lg:col-span-2 bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[#1F1410]">
                Leaderboard: Platillos & Bebidas Más Vendidos
              </h2>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Los 5 productos más demandados en sala durante el turno actual
              </p>
            </div>
            <button 
              onClick={() => onNavigateToTab('menu')}
              className="text-xs font-semibold text-[#E12927] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver menú completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#1F1410]/10">
            {topProducts.map((p, index) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4 hover:bg-[#FAF7F5] px-2 rounded-xs transition-colors">
                
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    index === 0 ? 'bg-[#E12927] text-white' :
                    index === 1 ? 'bg-[#1F1410] text-white' :
                    'bg-[#FAF7F5] text-[#1F1410] border border-[#1F1410]/20'
                  }`}>
                    #{index + 1}
                  </span>

                  {/* Thumbnail de Platillo */}
                  <img 
                    src={p.imagen} 
                    alt={p.nombre} 
                    className="w-12 h-12 rounded-sm object-cover border border-[#1F1410]/15"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/desayunos_marfil.jpg';
                    }}
                  />

                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1410] flex items-center gap-2">
                      {p.nombre}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#FCEAE9] text-[#E12927] rounded-xs">
                        {p.badge}
                      </span>
                    </h3>
                    <p className="text-xs text-[#1F1410]/60 font-body">
                      {p.categoria} · {p.porcion}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-sm text-[#1F1410]">
                    {p.vendidosHoy} unidades
                  </div>
                  <div className="text-xs text-[#1F1410]/60">
                    ${(p.vendidosHoy * p.precio).toLocaleString('es-MX')} MXN
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Desempeño Comparativo de Sucursales */}
        <div className="bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs">
          <h2 className="font-display font-bold text-lg text-[#1F1410] mb-1">
            Red de Sucursales Durango
          </h2>
          <p className="text-xs text-[#1F1410]/60 font-body mb-4">
            Aforo y estado operativo por sucursal
          </p>

          <div className="space-y-4">
            {sucursales.map(s => {
              const pct = Math.round((s.aforoActual / s.aforoMax) * 100);

              return (
                <div key={s.id} className="p-3.5 border border-[#1F1410]/10 rounded-sm bg-[#FAF7F5] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1F1410] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E12927]" />
                        {s.nombre}
                      </h3>
                      <p className="text-[11px] text-[#1F1410]/60 truncate max-w-[200px]">
                        {s.direccion}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs bg-emerald-100 text-emerald-800">
                      ABIERTO
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-[#1F1410]/80 mb-1">
                      <span>Ocupación: {pct}%</span>
                      <span><strong>{s.aforoActual}</strong> / {s.aforoMax} comensales</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-xs overflow-hidden border border-[#1F1410]/10">
                      <div 
                        className={`h-full rounded-xs transition-all ${
                          pct >= 80 ? 'bg-[#E12927]' : 'bg-[#1F1410]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-[#1F1410]/60 flex items-center justify-between pt-1 border-t border-[#1F1410]/5">
                    <span>Resp: {s.encargado.split(' ')[0]}</span>
                    <button 
                      onClick={() => onNavigateToTab('floorplan')}
                      className="text-[#E12927] hover:underline font-semibold cursor-pointer"
                    >
                      Ver mesas &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
