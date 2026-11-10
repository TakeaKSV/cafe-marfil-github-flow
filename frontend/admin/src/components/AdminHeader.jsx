import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const AdminHeader = ({
  selectedSucursal,
  onSelectSucursal,
  sucursales,
  soundEnabled,
  onToggleSound,
  onOpenWalkInModal,
  alertCount,
  activeComensales,
  aforoMaximo
}) => {
  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      tipo: 'reserva',
      titulo: 'Reserva próxima en 15 min',
      detalle: 'Familia Rivas (5 comensales) — Mesa M04 reservada para 11:30 AM',
      tiempo: 'Hace 3 min',
      leida: false
    },
    {
      id: 2,
      tipo: 'ludoteca',
      titulo: 'Solicitud de anfitrión',
      detalle: 'Mesa L01 solicita explicación de reglas para Catan',
      tiempo: 'Hace 8 min',
      leida: false
    },
    {
      id: 3,
      tipo: 'stock',
      titulo: 'Alerta de cocina: Fresas Dubái',
      detalle: 'Quedan 16 copas de pistache siciliano para el turno matutino',
      tiempo: 'Hace 20 min',
      leida: false
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) => {
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const markAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, leida: true })));
    if (soundEnabled) playSound('success');
  };

  const unreadAlerts = alerts.filter(a => !a.leida).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#1F1410]/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Logo y Branding Oficial */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 bg-[#FAF7F5] border border-[#1F1410]/15 rounded-md p-1 overflow-hidden shadow-xs">
              <img
                src="/images/logo_rojo_marfil.png"
                alt="Café Marfil"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/favicon.svg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl sm:text-2xl text-[#1F1410] tracking-tight">
                  CAFÉ MARFIL
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E12927] text-white rounded-xs">
                  ADMIN 2026
                </span>
              </div>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Urban Brunch & All-Day Dining · Durango
              </p>
            </div>
          </div>

          {/* Selector de Sucursal y Reloj en Vivo */}
          <div className="hidden md:flex items-center gap-4">

            {/* Selector de Sucursal */}
            <div className="flex items-center gap-2 bg-[#FAF7F5] border border-[#1F1410]/15 px-3 py-1.5 rounded-md">
              <MapPin className="w-4 h-4 text-[#E12927]" />
              <select
                value={selectedSucursal}
                onChange={(e) => {
                  onSelectSucursal(e.target.value);
                  if (soundEnabled) playSound('toggle');
                }}
                className="bg-transparent text-xs sm:text-sm font-body font-semibold text-[#1F1410] focus:outline-hidden cursor-pointer"
              >
                <option value="todas">Todas las Sucursales (Red Durango)</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Aforo en vivo */}
            <div className="hidden lg:flex items-center gap-2 bg-[#FCEAE9] text-[#1F1410] px-3 py-1.5 rounded-md border border-[#E12927]/20 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#E12927] animate-ping" />
              <span>AFORO: <strong className="text-[#E12927]">{activeComensales}</strong> / {aforoMaximo} pax</span>
            </div>

            {/* Reloj y Estado */}
            <div className="flex items-center gap-2.5 text-right font-mono text-xs text-[#1F1410]/70 pl-2 border-l border-[#1F1410]/10">
              <Clock className="w-4 h-4 text-[#1F1410]/40" />
              <div>
                <div className="font-bold text-[#1F1410] text-sm uppercase">{formatTime(time)}</div>
                <div className="text-[11px] capitalize text-[#1F1410]/60">{formatDate(time)}</div>
              </div>
            </div>

          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Botón Walk-in */}
            <button
              onClick={() => {
                if (soundEnabled) playSound('toggle');
                onOpenWalkInModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Registrar comensales que acaban de llegar sin reserva previa"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva Mesa Walk-in</span>
              <span className="sm:hidden">Mesa</span>
            </button>


            {/* Campanita de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (soundEnabled) playSound('toggle');
                }}
                className="relative p-2 rounded-md border border-[#1F1410]/20 text-[#1F1410] hover:bg-[#FAF7F5] transition-colors cursor-pointer"
                title="Notificaciones operativas en tiempo real"
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E12927] text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadAlerts}
                  </span>
                )}
              </button>

              {/* Menú de Notificaciones */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#1F1410]/20 rounded-md shadow-xl z-50 p-4 font-body animate-menu-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-[#1F1410]">Alertas en Piso</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-[#FCEAE9] text-[#E12927] font-bold rounded-xs">
                        {unreadAlerts} nuevas
                      </span>
                    </div>
                    {unreadAlerts > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#E12927] hover:underline font-semibold cursor-pointer"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {alerts.map(a => (
                      <div
                        key={a.id}
                        className={`p-2.5 rounded-sm border text-xs transition-colors ${a.leida
                          ? 'bg-[#FAF7F5] border-[#1F1410]/10 text-[#1F1410]/70'
                          : 'bg-[#FCEAE9]/60 border-[#E12927]/30 text-[#1F1410]'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <strong className="font-semibold text-[#1F1410] flex items-center gap-1.5">
                            {a.tipo === 'stock' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#E12927]" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#E12927]" />
                            )}
                            {a.titulo}
                          </strong>
                          <span className="text-[10px] font-mono text-[#1F1410]/50">{a.tiempo}</span>
                        </div>
                        <p className="text-[#1F1410]/80 leading-relaxed">{a.detalle}</p>
                      </div>
                    ))}
                  </div>


                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
