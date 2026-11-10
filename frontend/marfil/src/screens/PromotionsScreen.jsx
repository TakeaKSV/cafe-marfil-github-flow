import React, { useState } from 'react';
import { Tag, Sparkles, ChevronRight, Flame, Gift, MapPin } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function PromotionsScreen({ promociones, onSelectPromo }) {
  const [selectedCategory, setSelectedCategory] = useState('todas');

  const categorias = [
    { id: 'todas', label: 'Todas las promociones' },
    { id: 'mes', label: 'Combos del mes' },
    { id: 'temporada', label: 'Frappés 2x1 los Jueves' },
    { id: 'sucursal', label: 'Tendencia Dubái' },
    { id: 'frecuentes', label: 'Comunidad & Cowork' }
  ];

  const filteredPromos = promociones.filter((p) => {
    return selectedCategory === 'todas' || p.categoriaSlug === selectedCategory;
  });

  return (
    <div className="flex flex-col gap-8 fade-in pb-16">
      {/* Encabezado Editorial */}
      <div className="max-w-2xl text-left">

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-3">
          Promociones & Descuentos
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
          Combos de molletes Mamut y café de especialidad, 2x1 en toda la línea de frappés de confitería los jueves, lanzamientos con pistache siciliano y beneficios permanentes para nuestra comunidad.
        </p>
      </div>

      {/* Categorías HeroUI Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categorias.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`whitespace-nowrap px-5 py-2.5 rounded-md font-mono text-xs font-bold cursor-pointer transition-all duration-200 border-2 ${
                isActive
                  ? 'bg-[#E12927] text-white border-[#E12927] shadow-md shadow-[#E12927]/30 scale-[1.02]'
                  : 'bg-white hover:bg-[#FCEAE9] text-[#1F1410] border-stone-300 hover:border-[#E12927] shadow-xs'
              }`}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat.id);
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid de Promociones HeroUI Cards 100% Sólidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map((promo) => {
          const sucursalesTexto = (promo.sucursalesValidas || promo.sucursalesAplicables || []).join(', ');
          return (
            <article
              key={promo.id}
              className="bg-white rounded-lg border-2 border-stone-300 overflow-hidden flex flex-col shadow-md hover:shadow-2xl hover:border-[#E12927] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                sounds.playClick();
                onSelectPromo(promo);
              }}
            >
              <div className="relative h-48 bg-stone-100 overflow-hidden border-b-2 border-stone-200">
                <img
                  src={promo.imagen}
                  alt={promo.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-md border border-[#E12927]">
                    {promo.descuentoBadge}
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 gap-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider uppercase">
                  <span className="text-[#E12927]">{promo.categoria}</span>
                  <span className="text-[#8E7A74]">{promo.vigencia}</span>
                </div>

                <h2 className="font-display text-xl font-bold text-[#1F1410] leading-snug group-hover:text-[#E12927] transition-colors">
                  {promo.nombre}
                </h2>
                <p className="font-body text-xs sm:text-sm text-[#5A4840] leading-relaxed line-clamp-3">
                  {promo.resumen || promo.descripcion}
                </p>

                {sucursalesTexto && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/30 text-[11px] font-mono text-[#1F1410]">
                    <MapPin size={12} className="text-[#E12927] shrink-0" />
                    <span className="truncate">Válido en: <strong className="text-[#E12927]">{sucursalesTexto}</strong></span>
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-stone-200">
                  <span className="font-mono text-xs font-bold text-[#1F1410]">Cupón digital</span>
                  <button
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onSelectPromo(promo);
                    }}
                  >
                    <span>Ver cupón</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
