import React from 'react';

/**
 * Tarjeta interactiva con imagen completa y panel inferior con curva cóncava
 * que se desliza suavemente hacia arriba al pasar el cursor (hover) o enfocar.
 */
export const CurvedRevealCard = ({
  image,
  imageAlt,
  title,
  subtitle,
  headerRight = null,
  topLeft = null,
  topRight = null,
  isOpen = false,
  onToggle,
  borderClassName = 'border-[#1F1410]/10 hover:border-[#E12927]/40',
  children
}) => {
  return (
    <article
      tabIndex={0}
      onClick={onToggle}
      className={`group relative rounded-[24px] overflow-hidden bg-[#FAF7F5] border shadow-[0_10px_28px_-16px_rgba(31,20,16,0.28)] transition-all duration-300 select-none h-full min-h-[215px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E12927] ${borderClassName}`}
    >
      {/* Imagen de fondo completa */}
      <img
        src={image}
        alt={imageAlt || title}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-hover:brightness-[0.82] ${
          isOpen ? 'scale-105 brightness-[0.82]' : ''
        }`}
      />

      {/* Viñeta superior sutil para legibilidad de badges */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#1F1410]/45 via-[#1F1410]/15 to-transparent z-10" />

      {/* Badges flotantes superiores */}
      {(topLeft || topRight) && (
        <div className="absolute top-2.5 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">{topLeft}</div>
          <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">{topRight}</div>
        </div>
      )}

      {/* Panel inferior blanco con curva cóncava en esquina superior derecha */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-white rounded-tl-[32px] shadow-[0_-10px_24px_-12px_rgba(31,20,16,0.2)] transition-colors">
        {/* Arco cóncavo invertido exacto en la esquina superior derecha */}
        <svg
          viewBox="0 0 40 40"
          className="absolute bottom-full right-0 w-9 h-9 pointer-events-none block"
          aria-hidden="true"
        >
          <path d="M40 0 C40 22 22 40 0 40 L40 40 Z" fill="#FFFFFF" />
        </svg>

        {/* Cabecera siempre visible */}
        <div className="px-4 pt-3 pb-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-[15px] text-[#1F1410] leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] font-mono text-[#1F1410]/60 truncate mt-0.5">{subtitle}</p>
            )}
          </div>

          {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
        </div>

        {/* Contenido desplegable suave al pasar el cursor */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div
              className="px-4 pb-3 pt-2 border-t border-[#1F1410]/8 space-y-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
