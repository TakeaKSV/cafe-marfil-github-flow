import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const Topbar = ({
  activeTabTitle,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <header className="h-14 sm:h-16 px-5 sm:px-7 flex items-center justify-between gap-4 border-b border-[#1F1410]/8 bg-white select-none shrink-0">

      {/* Left: Título de Sección Actual */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410] truncate">
          {activeTabTitle || 'Panel Principal'}
        </h1>
      </div>

      {/* Right: Acciones Funcionales & Perfil de Administradora */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">


        {/* Perfil de Usuario con efecto hover */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-[#1F1410]/8 group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-[#1F1410] text-white flex items-center justify-center font-mono font-bold text-xs ring-2 ring-[#E12927]/20 overflow-hidden shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105 group-hover:ring-[#E12927]">
            <img
              src="/images/logo_badge_rosa.png"
              alt="Sofía Valenzuela"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="text-left">
            <div className="text-xs font-bold text-[#1F1410] leading-tight group-hover:text-[#E12927] transition-colors">
              Sofía Valenzuela
            </div>
            <div className="text-[10px] text-[#1F1410]/50 font-mono">Administradora General</div>
          </div>
        </div>

      </div>

    </header>
  );
};
