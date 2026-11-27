import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  CalendarPlus,
  CheckCircle2,
  Users
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ActivityDetailScreen({ activity, onBack, onBookActivity }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!activity) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let tween;
    if (modalRef.current) {
      tween = gsap.fromTo(
        modalRef.current,
        { y: 24, scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }
      );
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (tween) tween.kill();
    };
  }, [activity, onBack]);

  if (!activity) return null;

  const isFull = activity.lugaresDisponibles <= 0;
  const percentOccupied = activity.cupoTotal
    ? Math.min(100, Math.round((activity.lugaresOcupados / activity.cupoTotal) * 100))
    : 0;

  const handleClose = () => {
    sounds.playClick();
    onBack();
  };

  const handleBook = () => {
    sounds.playClick();
    onBookActivity(activity);
  };

  const incluyeLista = Array.isArray(activity.incluye) ? activity.incluye : [];

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-[#1F1410]/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={activity.nombre}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* Botón cerrar flotante */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar detalle de actividad"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1F1410] hover:text-[#E12927] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X size={19} strokeWidth={2.4} />
        </button>

        {/* Columna Izquierda / Superior: Foto Full-Bleed + Cupo en vivo */}
        <div className="relative lg:col-span-5 h-56 sm:h-64 lg:h-auto lg:min-h-[460px] bg-[#1F1410] overflow-hidden">
          <img
            src={activity.imagen}
            alt={activity.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15 pointer-events-none" />

          {/* Categoría arriba */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold">
              {activity.categoria}
            </span>
          </div>

          {/* Tarjeta translúcida de disponibilidad sobre la foto */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/45 backdrop-blur-md border border-white/15 p-3.5 text-white text-left">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold">
                {isFull
                  ? 'Cupo agotado'
                  : `Quedan ${activity.lugaresDisponibles} de ${activity.cupoTotal} lugares`}
              </span>
              <span className="text-white/80 text-[11px]">{percentOccupied}% ocupado</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentOccupied > 85 ? 'bg-[#E12927]' : 'bg-emerald-400'
                }`}
                style={{ width: `${percentOccupied}%` }}
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha / Inferior: Detalles + CTA */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1 p-5 sm:p-6 flex flex-col gap-4 text-left">
            {/* Sucursal y Título */}
            <div className="pr-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E12927] mb-1">
                <MapPin size={14} />
                <span>{activity.sucursalNombre}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410] leading-tight">
                {activity.nombre}
              </h2>
            </div>

            {/* Metadatos compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FAF7F5] flex items-center gap-2.5">
                <Calendar size={16} className="text-[#E12927] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] text-[#8E7A74] uppercase">Fecha</span>
                  <strong className="text-xs text-[#1F1410] truncate block">{activity.fecha}</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F5] flex items-center gap-2.5">
                <Clock size={16} className="text-[#E12927] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] text-[#8E7A74] uppercase">Horario</span>
                  <strong className="text-xs text-[#1F1410] truncate block">{activity.hora}</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F5] flex items-center gap-2.5">
                <Users size={16} className="text-[#E12927] shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[10px] text-[#8E7A74] uppercase">Duración</span>
                  <strong className="text-xs text-[#1F1410] truncate block">{activity.duracion}</strong>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-sm font-bold text-[#1F1410] mb-1.5">Sobre esta experiencia</h3>
              <p className="text-xs sm:text-sm text-[#5A4840] leading-relaxed">
                {activity.descripcionCompleta || activity.resumen}
              </p>
            </div>

            {/* Qué incluye */}
            {incluyeLista.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#1F1410] mb-2">Incluye</h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#5A4840]">
                  {incluyeLista.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activity.requisitos && (
              <p className="text-xs text-[#8E7A74] leading-relaxed">
                {activity.requisitos}
              </p>
            )}
          </div>

          {/* Barra inferior fija con precio y botón de reserva */}
          <div className="p-4 sm:px-7 sm:py-5 border-t border-black/[0.06] bg-[#FAF9F8] flex items-center justify-between gap-4 shrink-0">
            <div className="text-left">
              <span className="block text-[11px] text-[#8E7A74]">Acceso / Precio</span>
              <span className="text-xl sm:text-2xl font-bold text-[#1F1410]">{activity.precio}</span>
            </div>

            <button
              type="button"
              disabled={isFull}
              onClick={handleBook}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isFull
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#1F1410] hover:bg-[#E12927] active:scale-95 text-white shadow-md'
              }`}
            >
              <CalendarPlus size={16} />
              <span>{isFull ? 'Cupo lleno' : 'Apartar lugares'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
