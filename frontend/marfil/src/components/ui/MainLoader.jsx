import React from 'react';
import ElephantLogo from '../ElephantLogo';

export function MainLoader({ texto = 'Preparando tu experiencia Marfil...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[75vh] w-full flex flex-col items-center justify-center gap-6 px-6 py-20 bg-[#FFFFFF]"
    >
      <div className="relative flex items-center justify-center">
        <span className="w-24 h-24 rounded-full border-4 border-[#FCEAE9] border-t-[#E12927] animate-spin" />
        <div className="absolute flex items-center justify-center">
          <ElephantLogo size={46} color="rojo" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1410] tracking-tight m-0">
          Café Marfil
        </h2>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#E12927] m-0">
          URBAN BRUNCH · DURANGO
        </p>
        <p className="font-body text-xs sm:text-sm text-[#8E7A74] pt-1 m-0">
          {texto}
        </p>
      </div>
    </div>
  );
}
