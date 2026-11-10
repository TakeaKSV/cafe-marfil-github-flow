import React from 'react';
import { X, CheckCheck, Calendar, Gift, Sparkles, Tag, ChevronRight, Bell } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notificaciones,
  onMarkAllRead,
  onNotificationClick
}) {
  if (!isOpen) return null;

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'reservacion':
        return <Calendar size={18} className="text-[#E12927]" />;
      case 'beneficio':
        return <Gift size={18} className="text-[#E12927]" />;
      case 'actividad':
        return <Sparkles size={18} className="text-[#1F1410]" />;
      default:
        return <Tag size={18} className="text-[#E12927]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="w-full max-w-md h-full bg-white flex flex-col shadow-2xl border-l-2 border-stone-300 animate-mh-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado HeroUI Drawer Header 100% Sólido */}
        <div className="p-5 border-b-2 border-stone-300 flex items-center justify-between bg-[#FCEAE9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-md bg-[#E12927] text-white flex items-center justify-center shadow-md border-2 border-[#E12927]">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#1F1410] leading-none">Notificaciones</h3>
              <span className="font-mono text-[10px] text-[#8E7A74] tracking-wider uppercase font-semibold">CAFÉ MARFIL DURANGO</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-mono text-xs font-bold text-[#1F1410] bg-white border-2 border-stone-300 hover:border-[#E12927] hover:text-[#E12927] active:scale-95 transition-all cursor-pointer shadow-xs"
              onClick={() => {
                sounds.playClick();
                onMarkAllRead();
              }}
              title="Marcar todas como leídas"
            >
              <CheckCheck size={14} />
              <span>Marcar leídas</span>
            </button>

            <button
              className="w-8 h-8 rounded-md border-2 border-stone-300 bg-white flex items-center justify-center text-[#1F1410] hover:bg-stone-100 active:scale-90 transition-all cursor-pointer shadow-xs"
              onClick={onClose}
              aria-label="Cerrar notificaciones"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-[#8E7A74] gap-2">
              <Bell size={32} className="opacity-40" />
              <p className="font-body text-sm font-medium">No tienes notificaciones pendientes.</p>
            </div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-md border-2 transition-all cursor-pointer flex items-start gap-3.5 group ${
                  !n.leida
                    ? 'bg-[#FCEAE9] border-l-4 border-l-[#E12927] border-2 border-[#E12927]/40 shadow-sm'
                    : 'bg-white border-stone-300 hover:border-[#E12927] shadow-xs'
                }`}
                onClick={() => {
                  sounds.playClick();
                  onNotificationClick(n);
                }}
              >
                <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center shrink-0 border-2 border-stone-300 shadow-xs">
                  {getIcon(n.tipo)}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body text-sm font-bold text-[#1F1410] group-hover:text-[#E12927] transition-colors">
                      {n.titulo}
                    </span>
                    {!n.leida && <span className="w-2.5 h-2.5 rounded-full bg-[#E12927] shrink-0" />}
                  </div>
                  <p className="font-body text-xs text-[#5A4840] leading-relaxed m-0 font-medium">{n.mensaje}</p>
                  <span className="font-mono text-[10px] text-[#8E7A74] mt-0.5 font-semibold">{n.tiempo}</span>
                </div>

                <ChevronRight size={16} className="text-[#8E7A74] self-center group-hover:translate-x-1 transition-transform" />
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
