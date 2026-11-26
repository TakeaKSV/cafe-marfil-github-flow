import React from 'react';
import { Home, UtensilsCrossed, CalendarPlus, Compass, User, LogIn } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function BottomNav({ activeScreen, setActiveScreen, isLoggedIn = false }) {
  const handleNav = (screenId) => {
    sounds.playClick();
    setActiveScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md z-40 bg-white border-2 border-stone-400 shadow-[0_12px_36px_rgba(31,20,16,0.25)] rounded-xl px-1.5 py-1.5 lg:hidden transition-all"
      aria-label="Navegación móvil inferior"
    >
      <div className="grid grid-cols-5 items-center h-14 relative gap-0.5">
        {/* Inicio */}
        <button
          className={`min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'inicio'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('inicio')}
        >
          <Home size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-full">Inicio</span>
        </button>

        {/* Menú */}
        <button
          className={`min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'menu'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('menu')}
        >
          <UtensilsCrossed size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-full">Menú</span>
        </button>

        {/* Reservar — Botón Central Sólido Flotante Cuadrado */}
        <button
          className="min-w-0 flex flex-col items-center justify-center cursor-pointer group -mt-5"
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
          <span className="font-mono text-[9px] font-bold text-[#E12927] mt-1 tracking-wider uppercase truncate max-w-full">
            Reservar
          </span>
        </button>

        {/* Actividades */}
        <button
          className={`min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'actividades' || activeScreen === 'detalle_actividad'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('actividades')}
        >
          <Compass size={18} />
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-full">Ludoteca</span>
        </button>

        {/* Perfil / Iniciar sesión */}
        <button
          className={`min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
            activeScreen === 'perfil' || activeScreen === 'mis_reservaciones'
              ? 'bg-[#FCEAE9] text-[#E12927] font-bold border-2 border-[#E12927] shadow-xs'
              : 'text-[#1F1410] hover:text-[#E12927]'
          }`}
          onClick={() => handleNav('perfil')}
        >
          {isLoggedIn ? <User size={18} /> : <LogIn size={18} />}
          <span className="font-body text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-full">
            {isLoggedIn ? 'Perfil' : 'Entrar'}
          </span>
        </button>
      </div>
    </nav>
  );
}
