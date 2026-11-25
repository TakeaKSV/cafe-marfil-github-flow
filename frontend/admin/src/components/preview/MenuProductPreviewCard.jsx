import React from 'react';
import { ArrowRight, Sparkles, EyeOff } from 'lucide-react';
import { resolverUrlImagen } from '../../api/cliente';

/**
 * Replica exacta de la tarjeta de producto de la PWA (MenuScreen.jsx)
 * para mostrar vista previa en vivo (Escritorio y Móvil) dentro del panel admin.
 */
export function MenuProductPreviewCard({ producto, modo = 'desktop', onClick }) {
  const nombreCorto = (producto.nombreCorto || producto.nombre || 'NUEVO PRODUCTO').toUpperCase();
  const nombreCompleto = producto.nombre || 'Nombre del producto';
  const precioNum = Number(producto.precio) || 0;
  const precioStr = `$${precioNum % 1 === 0 ? precioNum.toFixed(0) : precioNum.toFixed(2)} MXN`;
  const tamano = producto.porcion || 'Porción individual';
  const imagen = resolverUrlImagen(producto.imagen);
  const colorCard = producto.colorCard || '#F5ECE8';
  const esBorrador = producto.estado === 'borrador';
  const agotado = producto.disponibleEnCocina === false;
  const badge = agotado ? 'AGOTADO HOY' : producto.badge || 'MARFIL';

  if (modo === 'mobile') {
    return (
      <div
        onClick={onClick}
        style={{ backgroundColor: colorCard }}
        className={`relative w-full rounded-[24px] h-[92px] pl-16 pr-3.5 flex items-center justify-between shadow-xs border transition-all ${
          esBorrador ? 'border-amber-500 border-dashed' : 'border-black/5 hover:border-[#E12927]/40'
        } ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center pointer-events-none z-10">
          <img
            src={imagen}
            alt={nombreCompleto}
            className="w-full h-full object-contain filter drop-shadow-[0_8px_14px_rgba(31,20,16,0.22)]"
            onError={(e) => {
              e.currentTarget.src = '/images/Menu/vaso-principal.png';
            }}
          />
        </div>

        <div className="flex-1 flex flex-col justify-center pl-2 pr-2 overflow-hidden text-left">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {esBorrador && (
              <span className="font-mono text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-xs uppercase inline-flex items-center gap-0.5">
                <EyeOff className="w-2.5 h-2.5" /> BORRADOR
              </span>
            )}
            {badge && (
              <span className="font-mono text-[9px] font-black text-[#E12927] tracking-wider uppercase leading-none">
                {badge}
              </span>
            )}
          </div>
          <h4 className="font-display font-bold text-sm text-[#1F1410] uppercase tracking-tight leading-tight truncate">
            {nombreCorto}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#E12927] font-mono font-black">{precioStr}</span>
            <span className="font-mono text-[10px] text-[#1F1410]/60 font-medium truncate">· {tamano}</span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-[#E12927] text-white flex items-center justify-center shrink-0 shadow-sm">
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: colorCard }}
      className={`relative shrink-0 w-52 rounded-[28px] pt-12 pb-4 px-3.5 flex flex-col items-center justify-between transition-transform duration-200 border ${
        esBorrador ? 'border-amber-500 border-2 border-dashed' : 'border-black/5 hover:border-[#E12927]/40'
      } ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''} select-none shadow-sm`}
    >
      {/* Badges superiores */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-20 pointer-events-none">
        {esBorrador ? (
          <span className="font-mono text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs uppercase inline-flex items-center gap-0.5">
            <EyeOff className="w-2.5 h-2.5" /> BORRADOR
          </span>
        ) : (
          <span />
        )}
        {producto.destacado && (
          <span className="font-mono text-[9px] font-black bg-[#1F1410] text-white px-2 py-0.5 rounded-full shadow-xs uppercase inline-flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" /> TOP
          </span>
        )}
      </div>

      {/* Imagen sobresaliendo arriba */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-32 h-36 flex items-center justify-center pointer-events-none z-10">
        <img
          src={imagen}
          alt={nombreCompleto}
          className="w-full h-full object-contain filter drop-shadow-[0_10px_16px_rgba(31,20,16,0.2)]"
          onError={(e) => {
            e.currentTarget.src = '/images/Menu/vaso-principal.png';
          }}
        />
      </div>

      <div className="h-14 w-full pointer-events-none" />

      <div className="w-full text-center mt-1 flex flex-col items-center">
        {badge && (
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#E12927] bg-white/80 px-2 py-0.5 rounded-full mb-1">
            {badge}
          </span>
        )}
        <h3
          className="font-display font-bold text-base text-[#1F1410] tracking-tight leading-snug uppercase line-clamp-1"
          title={nombreCompleto}
        >
          {nombreCorto}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-[#1F1410] font-mono font-black tracking-tight">{precioStr}</span>
          <span className="font-mono text-[10px] text-[#1F1410]/65 font-bold truncate max-w-[90px]">· {tamano}</span>
        </div>
      </div>

      <div className="w-full mt-3.5 mb-0.5">
        <div className="w-full py-2 px-3 bg-[#E12927] text-white font-body font-bold text-xs rounded-full flex items-center justify-center gap-1.5 tracking-wide">
          <span>Ver detalles</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}
