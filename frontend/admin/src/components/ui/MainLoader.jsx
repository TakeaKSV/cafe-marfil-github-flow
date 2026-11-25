import React from 'react';
import { Coffee } from 'lucide-react';

export function MainLoader({ texto = 'Cargando Café Marfil...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-screen w-screen bg-[#1F1410] flex flex-col items-center justify-center gap-6 px-6 select-none"
    >
      <div className="relative flex items-center justify-center">
        <span className="w-20 h-20 rounded-full border-4 border-white/10 border-t-[#E12927] animate-spin" />
        <div className="absolute w-12 h-12 rounded-2xl bg-[#E12927] text-white flex items-center justify-center shadow-lg shadow-[#E12927]/40">
          <Coffee className="w-6 h-6" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <div className="font-display font-bold text-2xl text-white tracking-tight">
          Café Marfil
        </div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#FCEAE9]/80">
          {texto}
        </div>
      </div>

      <div className="w-44 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-2/3 bg-[#E12927] rounded-full animate-pulse" />
      </div>
    </div>
  );
}
