import React from 'react';
import { Menu } from 'lucide-react';

export const Topbar = ({
  activeTabTitle,
  usuario,
  onOpenMobileMenu
}) => {
  const nombre = usuario?.nombre ?? 'Café Marfil';
  const puesto = usuario?.puesto ?? 'Panel Administrativo';

  return (
    <header className="h-14 sm:h-16 px-3.5 sm:px-6 lg:px-7 flex items-center justify-between gap-3 border-b border-[#1F1410]/8 bg-white select-none shrink-0">

      {/* Left: Botón Menú Móvil/Tablet + Título de Sección Actual */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menú de navegación"
            className="lg:hidden w-9 h-9 rounded-xl bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] border border-[#1F1410]/10 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-[#1F1410] truncate">
          {activeTabTitle || 'Panel Principal'}
        </h1>
      </div>

      {/* Right: Perfil de Usuario */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 pl-2.5 sm:pl-4 border-l border-[#1F1410]/8 group cursor-pointer">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1F1410] text-white flex items-center justify-center font-mono font-bold text-xs ring-2 ring-[#E12927]/20 overflow-hidden shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:ring-[#E12927]">
            <img
              src="/images/logo_badge_rosa.png"
              alt={nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="text-left hidden sm:block max-w-[160px]">
            <div className="text-xs font-bold text-[#1F1410] leading-tight group-hover:text-[#E12927] transition-colors truncate">
              {nombre}
            </div>
            <div className="text-[10px] text-[#1F1410]/50 font-mono truncate">{puesto}</div>
          </div>
        </div>
      </div>

    </header>
  );
};
