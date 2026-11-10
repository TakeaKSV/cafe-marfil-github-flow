import React from 'react';
import { Home, UtensilsCrossed, CalendarPlus, Compass, User } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function BottomNav({ activeScreen, setActiveScreen }) {
  const handleNav = (screenId) => {
    sounds.playClick();
    setActiveScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed bottom-3 inset-x-3 max-w-lg mx-auto z-40 bg-white border-2 border-stone-400 shadow-[0_12px_36px_rgba(31,20,16,0.25)] rounded-xl px-2 py-1.5 md:hidden transition-all"
      aria-label="Navegación móvil inferior"
    >
      <div className="flex items-center justify-around h-14 relative">
        {/* Inicio */}
        <button
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'inicio'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('inicio')}
        >
          <Home size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold">Inicio</span>
        </button>

        {/* Menú */}
        <button
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'menu'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('menu')}
        >
          <UtensilsCrossed size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold">Menú</span>
        </button>

        {/* Reservar — Botón Central Sólido Flotante Cuadrado */}
        <button
          className="flex-1 flex flex-col items-center justify-center cursor-pointer group -mt-5"
          onClick={() => handleNav('reservar')}
          aria-label="Reservar mesa o actividad"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ring-4 ring-white shadow-xl transition-all duration-200 group-hover:scale-105 active:scale-95 ${
              activeScreen === 'reservar'
                ? 'bg-[#1F1410] text-white shadow-black/40'
                : 'bg-[#E12927] text-white shadow-[#E12927]/50'
            }`}
          >
            <CalendarPlus size={20} />
          </div>
          <span className="font-mono text-[9px] font-bold text-[#E12927] mt-1 tracking-wider uppercase">
            Reservar
          </span>
        </button>

        {/* Actividades */}
        <button
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'actividades' || activeScreen === 'detalle_actividad'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('actividades')}
        >
          <Compass size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold">Ludoteca</span>
        </button>

        {/* Perfil */}
        <button
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'perfil' || activeScreen === 'mis_reservaciones'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('perfil')}
        >
          <User size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold">Perfil</span>
        </button>
      </div>
    </nav>
  );
}
