import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { CalendarDays, X } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ReservationModal({
  isOpen,
  onClose,
  titulo = 'Reservar en Café Marfil',
  subtitulo = 'Elige tu sucursal, horario y mesa en segundos.',
  children
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let tween;
    if (cardRef.current) {
      tween = gsap.fromTo(
        cardRef.current,
        { y: 28, scale: 0.96, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.36, ease: 'power3.out' }
      );
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (tween) tween.kill();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] bg-[#1F1410]/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[94dvh] bg-[#FAF7F5] dark:bg-[#17100D] rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col"
      >
        {/* Cabecera elegante del modal */}
        <div className="relative px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#1F1410] via-[#4A1517] to-[#8F191B] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 text-left">
            <span className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-white leading-tight truncate">
                {titulo}
              </h2>
              <p className="text-xs text-white/75 truncate m-0 mt-0.5">
                {subtitulo}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar reservación"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo compacto sin recortes */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
