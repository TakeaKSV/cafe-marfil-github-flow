import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  Compass,
  CalendarDays,
  Check,
  ExternalLink
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function BranchesScreen({
  sucursales = [],
  onReserveBranch,
  onFilterBranchActivities
}) {
  const [selectedMapId, setSelectedMapId] = useState(sucursales[0]?.id || 'porras-matriz');
  const containerRef = useRef(null);
  const currentBranch = sucursales.find((s) => s.id === selectedMapId) || sucursales[0];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.branch-card-reveal', {
        y: 18,
        opacity: 0,
        duration: 0.48,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto">
      {/* Encabezado compacto */}
      <div className="max-w-2xl text-left">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1410] dark:text-white tracking-tight mb-2">
          Sucursales Café Marfil
        </h1>
        <p className="font-body text-sm sm:text-base text-[#5A4840] dark:text-[#C5B7AF] leading-relaxed">
          Dos atmósferas con identidad propia en Durango: Casona Matriz en Calle Porras y espacio colonial con ludoteca en Barrio del Calvario.
        </p>
      </div>

      {/* Grid de 2 columnas proporcionadas (sin tarjetas gigantes ni recortes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {sucursales.map((suc) => {
          const isSelected = currentBranch?.id === suc.id;
          return (
            <article
              key={suc.id}
              onClick={() => {
                sounds.playClick();
                setSelectedMapId(suc.id);
              }}
              className={`branch-card-reveal group rounded-[26px] bg-white dark:bg-[#1E1714] border overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-[#E12927] ring-2 ring-[#E12927]/15 shadow-xl shadow-[#E12927]/8'
                  : 'border-[#E6DCD0] dark:border-white/10 shadow-md hover:shadow-xl hover:border-[#1F1410]/25 dark:hover:border-white/25'
              }`}
            >
              <div>
                {/* Foto con proporción 16:10 ideal para fachadas horizontales */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1F1410]">
                  <img
                    src={suc.imagen}
                    alt={suc.nombre}
                    className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1F1410]/70 via-transparent to-black/15 pointer-events-none" />

                  {suc.destacada && (
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-md">
                      Sucursal Matriz
                    </span>
                  )}

                  <span
                    className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-bold backdrop-blur-sm border transition-colors ${
                      isSelected
                        ? 'bg-[#E12927] text-white border-[#E12927]'
                        : 'bg-black/55 text-white/95 border-white/20'
                    }`}
                  >
                    <MapPin size={11} />
                    <span>{isSelected ? 'Visible en mapa' : 'Ver en mapa'}</span>
                  </span>
                </div>

                {/* Contenido bien proporcionado */}
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#E12927] tracking-[0.16em] uppercase">
                      Durango, Dgo. · México
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1F1410] dark:text-white mt-0.5 leading-snug group-hover:text-[#E12927] transition-colors">
                      {suc.nombre}
                    </h2>
                    <p className="font-body text-xs sm:text-sm text-[#5A4840] dark:text-[#C5B7AF] mt-1 leading-relaxed">
                      {suc.subtitulo}
                    </p>
                  </div>

                  {/* Bloque compacto de dirección, horario y teléfono */}
                  <div className="rounded-2xl bg-[#FAF7F5] dark:bg-[#261E1A] border border-[#EBE3DA] dark:border-white/8 p-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={15} className="text-[#E12927] shrink-0 mt-0.5" />
                      <span className="font-body text-[#1F1410] dark:text-[#F0E6E0] leading-snug">
                        {suc.direccion}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock size={15} className="text-[#E12927] shrink-0 mt-0.5" />
                      <span className="font-mono text-[11px] text-[#5A4840] dark:text-[#C5B7AF]">
                        {suc.horario}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Phone size={15} className="text-[#1F1410] dark:text-[#E5DAD4] shrink-0" />
                      <span className="font-mono text-xs font-semibold text-[#1F1410] dark:text-white">
                        {suc.telefono}
                      </span>
                    </div>
                  </div>

                  {/* Experiencias y servicios en chips limpios */}
                  <div className="flex flex-wrap gap-1.5">
                    {suc.caracteristicas.map((car, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full font-body text-[11px] font-medium bg-[#FAF7F5] dark:bg-white/5 text-[#3A2B25] dark:text-[#DED3CC] border border-[#E6DCD0] dark:border-white/10 inline-flex items-center gap-1"
                      >
                        <Check size={11} className="text-[#E12927] shrink-0" />
                        <span>{car}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer de acciones compacto */}
              <div
                className="px-5 sm:px-6 pb-5 pt-3 border-t border-[#F0E8E0] dark:border-white/8 flex flex-wrap items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onReserveBranch(suc.id);
                  }}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white shadow-sm transition-all cursor-pointer"
                >
                  <CalendarDays size={14} />
                  <span>Reservar mesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onFilterBranchActivities(suc.id);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider border border-[#1F1410]/15 dark:border-white/15 bg-white dark:bg-white/5 text-[#1F1410] dark:text-white hover:bg-[#1F1410] hover:text-white dark:hover:bg-white/15 transition-all cursor-pointer"
                >
                  <Compass size={13} />
                  <span>Actividades</span>
                </button>

                <a
                  href={suc.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sounds.playClick()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider border border-[#1F1410]/15 dark:border-white/15 bg-white dark:bg-white/5 text-[#1F1410] dark:text-white hover:bg-[#1F1410] hover:text-white dark:hover:bg-white/15 transition-all cursor-pointer"
                  title="Abrir en Google Maps"
                >
                  <Navigation size={13} />
                  <span>Mapa</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* Mapa interactivo compacto */}
      {currentBranch && (
        <section className="rounded-[26px] bg-white dark:bg-[#1E1714] border border-[#E6DCD0] dark:border-white/10 shadow-lg overflow-hidden text-left">
          <div className="bg-[#1F1410] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#E12927] text-white flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                  {currentBranch.nombre}
                </h3>
                <p className="font-mono text-[11px] text-white/70 truncate">
                  {currentBranch.direccion} · {currentBranch.telefono}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {sucursales.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMapId(s.id);
                  }}
                  className={`font-mono text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    selectedMapId === s.id
                      ? 'bg-[#E12927] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  {s.nombre.replace('Sucursal ', '')}
                </button>
              ))}
              <a
                href={currentBranch.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-white text-[#1F1410] hover:bg-[#FCEAE9] px-3 py-1.5 rounded-full transition-colors"
              >
                <span>Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="w-full h-[300px] sm:h-[360px] bg-stone-100">
            <iframe
              title={`Mapa de ${currentBranch.nombre}`}
              src={currentBranch.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </section>
      )}
    </div>
  );
}
