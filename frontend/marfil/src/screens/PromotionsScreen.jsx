import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, Clock, MapPin, Ticket } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function PromotionsScreen({ promociones = [], onSelectPromo }) {
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [activeIdx, setActiveIdx] = useState(0);
  const centerCardRef = useRef(null);
  const detailBarRef = useRef(null);

  const categorias = [
    { id: 'todas', label: 'Más populares' },
    { id: 'mes', label: 'Combos del mes' },
    { id: 'temporada', label: 'Frappés 2x1' },
    { id: 'sucursal', label: 'Tendencia Dubái' },
    { id: 'frecuentes', label: 'Comunidad & Cowork' }
  ];

  const filteredPromos = useMemo(
    () =>
      promociones.filter(
        (p) => selectedCategory === 'todas' || p.categoriaSlug === selectedCategory
      ),
    [promociones, selectedCategory]
  );

  const safeIdx = filteredPromos.length > 0 ? activeIdx % filteredPromos.length : 0;
  const activePromo = filteredPromos[safeIdx] || null;

  useEffect(() => {
    if (!activePromo) return undefined;
    const ctx = gsap.context(() => {
      if (centerCardRef.current) {
        gsap.fromTo(
          centerCardRef.current,
          { scale: 0.92, y: 12, opacity: 0.75 },
          { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
        );
      }
      if (detailBarRef.current) {
        gsap.fromTo(
          detailBarRef.current,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
    return () => ctx.revert();
  }, [activePromo?.id]);

  const handleStep = (delta) => {
    if (filteredPromos.length <= 1) return;
    sounds.playClick();
    setActiveIdx((prev) => (prev + delta + filteredPromos.length) % filteredPromos.length);
  };

  // Calcula hasta 5 tarjetas visibles centradas alrededor de safeIdx
  const visibleSlots = useMemo(() => {
    const total = filteredPromos.length;
    if (total === 0) return [];
    if (total === 1) return [{ promo: filteredPromos[0], idx: 0, offset: 0 }];
    if (total === 2) {
      return [
        { promo: filteredPromos[safeIdx], idx: safeIdx, offset: 0 },
        { promo: filteredPromos[(safeIdx + 1) % 2], idx: (safeIdx + 1) % 2, offset: 1 }
      ];
    }
    const maxOffset = total >= 5 ? 2 : 1;
    const slots = [];
    for (let offset = -maxOffset; offset <= maxOffset; offset += 1) {
      const idx = (safeIdx + offset + total) % total;
      slots.push({ promo: filteredPromos[idx], idx, offset });
    }
    return slots;
  }, [filteredPromos, safeIdx]);

  const activeSucursales = activePromo
    ? (activePromo.sucursalesValidas || activePromo.sucursalesAplicables || []).join(', ')
    : '';

  return (
    <div className="w-full min-h-[calc(100dvh-72px)] bg-[#FAF9F8] px-4 sm:px-8 lg:px-14 pt-6 sm:pt-8 pb-24 md:pb-8 flex flex-col fade-in">
      <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col justify-between gap-6 sm:gap-8">
      {/* ====================================================================
          ENCABEZADO + PESTAÑAS DE CATEGORÍAS ESTILO SHOWCASE
          ==================================================================== */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1410] tracking-tight">
              Promociones & Descuentos
            </h1>
            <p className="text-xs sm:text-sm text-[#1F1410]/65 mt-1">
              Elige una promoción para ver tu cupón digital y canjearlo en sucursal.
            </p>
          </div>
          {filteredPromos.length > 1 && (
            <span className="text-xs text-[#8E7A74] self-start sm:self-auto">
              {safeIdx + 1} / {filteredPromos.length} promociones
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categorias.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat.id);
                  setActiveIdx(0);
                }}
                className={`whitespace-nowrap text-sm sm:text-base transition-colors cursor-pointer pb-1 ${
                  isActive
                    ? 'text-[#1F1410] font-bold border-b-2 border-[#1F1410]'
                    : 'text-[#9A9592] hover:text-[#1F1410]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          ESCENARIO CENTRAL: CARRUSEL SPOTLIGHT CON TARJETA PROTAGONISTA
          ==================================================================== */}
      {!activePromo ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-black/5">
          <p className="text-sm text-[#5A4840]">No hay promociones activas en esta categoría.</p>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setSelectedCategory('todas');
              setActiveIdx(0);
            }}
            className="mt-4 px-5 py-2 rounded-full bg-[#1F1410] text-white text-xs cursor-pointer"
          >
            Ver todas
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center py-4 sm:py-6">
            {filteredPromos.length > 1 && (
              <button
                type="button"
                onClick={() => handleStep(-1)}
                aria-label="Promoción anterior"
                className="z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#1F1410] shadow-md flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer mr-1 sm:mr-3"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div className="flex items-center justify-center gap-3 sm:gap-5 lg:gap-6 flex-1 overflow-visible">
              {visibleSlots.map(({ promo, idx, offset }) => {
                const isCenter = offset === 0;
                const isOuter = Math.abs(offset) === 2;
                const isSide = Math.abs(offset) === 1;

                const visibilityClass = isOuter
                  ? 'hidden xl:flex'
                  : isSide
                  ? 'hidden md:flex'
                  : 'flex';

                return (
                  <article
                    key={`${promo.id}-${offset}`}
                    ref={isCenter ? centerCardRef : null}
                    onClick={() => {
                      sounds.playClick();
                      if (isCenter) {
                        onSelectPromo(promo);
                      } else {
                        setActiveIdx(idx);
                      }
                    }}
                    className={`${visibilityClass} relative flex-col justify-between overflow-hidden cursor-pointer select-none transition-all duration-300 text-white bg-[#1C1614] ${
                      isCenter
                        ? 'w-full max-w-[310px] sm:w-[320px] h-[350px] sm:h-[375px] rounded-[34px] p-5 sm:p-6 z-20 shadow-2xl shadow-black/25'
                        : isSide
                        ? 'w-[195px] lg:w-[215px] h-[235px] lg:h-[255px] rounded-[28px] p-4 opacity-90 hover:opacity-100 hover:-translate-y-1.5 z-10 shadow-xl shadow-black/20'
                        : 'w-[165px] h-[205px] rounded-[24px] p-3.5 opacity-80 hover:opacity-95 hover:-translate-y-1 z-0 shadow-lg shadow-black/15'
                    }`}
                  >
                    {/* Foto full-bleed neutra sin tinte de color */}
                    <img
                      src={promo.imagen}
                      alt={promo.nombre}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15 pointer-events-none" />

                    {/* Etiqueta superior sutil */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span
                        className={`rounded-lg font-bold uppercase tracking-wider bg-black/30 backdrop-blur-md text-white ${
                          isCenter ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[9px]'
                        }`}
                      >
                        {promo.descuentoBadge}
                      </span>
                    </div>

                    {/* Contenido inferior de la tarjeta */}
                    <div className="relative z-10 mt-auto flex flex-col gap-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`font-bold text-white leading-tight drop-shadow-xs line-clamp-2 ${
                            isCenter ? 'text-2xl sm:text-[26px]' : 'text-sm sm:text-base'
                          }`}
                        >
                          {promo.nombre}
                        </h2>
                      </div>

                      {isCenter ? (
                        <div className="flex items-end justify-between gap-2 pt-1">
                          <div className="flex flex-col gap-1 text-white/85 text-xs min-w-0">
                            <span className="truncate">{promo.categoria}</span>
                            <span className="inline-flex items-center gap-1 text-white/75 text-[11px] truncate">
                              <Clock size={12} className="shrink-0" />
                              {promo.vigencia}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              onSelectPromo(promo);
                            }}
                            className="shrink-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                          >
                            Ver cupón
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 text-[10px] text-white/80">
                          <span className="truncate">{promo.vigencia}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-white/20 text-white font-semibold shrink-0">
                            Ver
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredPromos.length > 1 && (
              <button
                type="button"
                onClick={() => handleStep(1)}
                aria-label="Promoción siguiente"
                className="z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#1F1410] shadow-md flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer ml-1 sm:ml-3"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Indicadores de puntos en móvil */}
          {filteredPromos.length > 1 && (
            <div className="flex md:hidden items-center justify-center gap-1.5 -mt-3">
              {filteredPromos.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveIdx(idx);
                  }}
                  aria-label={p.nombre}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIdx ? 'w-6 bg-[#1F1410]' : 'w-1.5 bg-[#1F1410]/25'
                  }`}
                />
              ))}
            </div>
          )}

          {/* ================================================================
              FRANJA INFERIOR DE DETALLE DE LA PROMOCIÓN ACTIVA (COMO ADR1FT)
              ================================================================ */}
          <div
            ref={detailBarRef}
            className="pt-5 border-t border-black/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-left"
          >
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-[#1F1410] dark:bg-white/15 text-white text-xs font-bold uppercase tracking-wider">
                  {activePromo.descuentoBadge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1F1410] leading-tight">
                  {activePromo.nombre}
                </h3>
                {activeSucursales && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#6B5A52]">
                    <MapPin size={13} className="text-[#E12927]" />
                    {activeSucursales}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#5A4840] leading-relaxed">
                {activePromo.resumen || activePromo.descripcion}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activePromo.codigoCupon && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-xs text-[#1F1410]">
                  <Ticket size={14} className="text-[#E12927]" />
                  <span>{activePromo.codigoCupon}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSelectPromo(activePromo);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1410] hover:bg-[#E12927] text-white text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
              >
                <span>Ver cupón completo</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
