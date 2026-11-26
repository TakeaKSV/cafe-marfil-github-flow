import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

const EMOJIS_CATEGORIA = {
  cine: '🎬',
  talleres: '🎨',
  musica: '🎵',
  juegos: '🎲',
  privados: '🎉',
  temporada: '🎄'
};

function emojiParaActividad(act) {
  return EMOJIS_CATEGORIA[act?.categoriaSlug] || '';
}

export default function ActivitiesScreen({
  actividades = [],
  onSelectActivity
}) {
  const gridRef = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return undefined;
    const cards = gridRef.current.querySelectorAll('[data-activity-card]');
    if (!cards.length) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 28, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'transform'
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [actividades.length]);

  return (
    <div className="flex flex-col gap-7 sm:gap-8 fade-in pb-16 pt-2">
      {/* Encabezado Editorial */}
      <div className="max-w-2xl text-left">
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-2.5">
          Actividades & Eventos
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/75 leading-relaxed">
          Noches de cine, talleres creativos, música en vivo, juegos de mesa y eventos privados. Elige tu experiencia y aparta tu lugar.
        </p>
      </div>

      {/* Grid de Tarjetas Verticales Full-Bleed */}
      {actividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 sm:p-12 rounded-3xl bg-white/85 border border-[#1F1410]/10 gap-3 shadow-sm">
          <h3 className="font-display text-xl font-bold text-[#1F1410]">
            Aún no hay actividades publicadas
          </h3>
          <p className="font-body text-sm text-[#5A4840] max-w-md">
            Vuelve pronto para descubrir nuestros próximos eventos y talleres.
          </p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 pt-3"
        >
          {actividades.map((act) => {
            const emoji = emojiParaActividad(act);
            const fechaLabel = act.fechaCorta || act.fecha || '';
            const horaInicio = (act.hora || '').split('–')[0].trim();
            const metaLine = [fechaLabel, horaInicio, act.sucursalNombre].filter(Boolean).join(' · ');

            return (
              <article
                key={act.id}
                data-activity-card
                onClick={() => {
                  sounds.playClick();
                  onSelectActivity(act);
                }}
                className="relative h-[370px] sm:h-[400px] lg:h-[420px] rounded-[24px] overflow-hidden cursor-pointer group transition-all duration-300 ease-out hover:-translate-y-4 active:scale-[0.99] select-none bg-[#1F1410] shadow-lg shadow-black/15 hover:shadow-2xl hover:shadow-black/25"
              >
                {/* Imagen Full-Bleed */}
                <img
                  src={act.imagen}
                  alt={act.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Degradado oscuro neutro para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                {/* Contenido inferior estilo referencia */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col gap-3.5 text-left">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight drop-shadow-xs line-clamp-2">
                      <span>{act.nombre}</span>
                      {emoji && (
                        <span className="ml-1.5 inline-block align-middle text-lg sm:text-xl" aria-hidden="true">
                          {emoji}
                        </span>
                      )}
                    </h2>

                    <p className="text-xs text-white/80 mt-1 truncate">
                      {metaLine || act.precio}
                      {metaLine && act.precio ? ` · ${act.precio}` : ''}
                    </p>
                  </div>

                  {/* Botón translúcido oscuro con flecha > */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onSelectActivity(act);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/25 hover:bg-black/45 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer group/btn"
                  >
                    <span>Explorar ahora</span>
                    <ChevronRight
                      size={16}
                      className="opacity-85 group-hover/btn:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
