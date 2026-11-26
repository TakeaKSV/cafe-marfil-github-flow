import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  X,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  Ticket
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRModal from '../components/QRModal';

export default function PromotionDetailScreen({ promo, onBack }) {
  const [showQR, setShowQR] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!promo) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !showQR) onBack();
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
  }, [promo, showQR, onBack]);

  if (!promo) return null;

  const handleClose = () => {
    sounds.playClick();
    setShowQR(false);
    onBack();
  };

  const handleShowQR = () => {
    sounds.playClick();
    setShowQR(true);
  };

  const sucursalesTexto = (promo.sucursalesValidas || promo.sucursalesAplicables || []).join(', ');
  const condicionesLista = promo.terminos || promo.condiciones || [];
  const descripcionTexto = promo.descripcion || promo.resumen || '';

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9990] bg-[#1F1410]/65 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-5"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-label={promo.nombre}
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92dvh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Botón cerrar flotante */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar detalle de promoción"
            className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1F1410] hover:text-[#E12927] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X size={19} strokeWidth={2.4} />
          </button>

          {/* Columna Izquierda / Superior: Foto Full-Bleed + Cupón Digital */}
          <div className="relative lg:col-span-5 h-56 sm:h-64 lg:h-auto lg:min-h-[460px] bg-[#1F1410] overflow-hidden">
            <img
              src={promo.imagen}
              alt={promo.nombre}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15 pointer-events-none" />

            {/* Badge de descuento arriba */}
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1.5 rounded-full bg-[#FACC15] text-[#1F1410] text-xs font-bold uppercase tracking-wider shadow-md">
                {promo.descuentoBadge}
              </span>
            </div>

            {/* Tarjeta de cupón digital flotante abajo */}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/50 backdrop-blur-md border border-dashed border-white/30 p-4 text-white text-left">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75 uppercase tracking-wider">
                  <Ticket size={13} />
                  Código digital
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-white/15 text-white text-xs font-bold">
                  {promo.codigoCupon}
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                {promo.beneficioDetalle}
              </p>
            </div>
          </div>

          {/* Columna Derecha / Inferior: Información + Botón QR */}
          <div className="lg:col-span-7 flex flex-col max-h-[calc(92dvh-14rem)] sm:max-h-[calc(92dvh-16rem)] lg:max-h-[92dvh]">
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col gap-5 text-left">
              <div className="pr-8">
                <span className="text-xs font-semibold text-[#E12927] uppercase tracking-wider block mb-1">
                  {promo.categoria}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410] leading-tight">
                  {promo.nombre}
                </h2>
              </div>

              {/* Metadatos compactos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#FAF7F5] flex items-center gap-2.5">
                  <Clock size={16} className="text-[#E12927] shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[10px] text-[#8E7A74] uppercase">Vigencia</span>
                    <strong className="text-xs text-[#1F1410] truncate block">{promo.vigencia}</strong>
                  </div>
                </div>

                {sucursalesTexto && (
                  <div className="p-3 rounded-2xl bg-[#FAF7F5] flex items-center gap-2.5">
                    <MapPin size={16} className="text-[#E12927] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] text-[#8E7A74] uppercase">Sucursales</span>
                      <strong className="text-xs text-[#1F1410] truncate block">{sucursalesTexto}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <h3 className="text-sm font-bold text-[#1F1410] mb-1.5">Descripción</h3>
                <p className="text-xs sm:text-sm text-[#5A4840] leading-relaxed">
                  {descripcionTexto}
                </p>
              </div>

              {/* Cómo canjear */}
              <div className="p-4 rounded-2xl bg-[#FAF7F5] flex flex-col gap-2.5">
                <h3 className="text-sm font-bold text-[#1F1410]">¿Cómo canjear en sucursal?</h3>
                <div className="flex flex-col gap-2 text-xs text-[#5A4840]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#1F1410] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span>Acude a cualquiera de las sucursales participantes de Café Marfil en Durango.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#1F1410] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span>Menciona esta promoción al ordenar tus alimentos o bebidas.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#1F1410] text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span>Muestra el código QR desde tu teléfono al pagar en caja.</span>
                  </div>
                </div>
              </div>

              {/* Términos */}
              {condicionesLista.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#8E7A74] uppercase tracking-wider mb-1.5">
                    Términos & Condiciones
                  </h4>
                  <div className="flex flex-col gap-1.5 text-xs text-[#5A4840]">
                    {condicionesLista.map((t, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-[#E12927] shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barra inferior fija con botón QR */}
            <div className="p-4 sm:px-7 sm:py-5 border-t border-black/[0.06] bg-[#FAF9F8] flex items-center justify-between gap-4 shrink-0">
              <div className="text-left min-w-0">
                <span className="block text-[11px] text-[#8E7A74]">Cupón</span>
                <span className="text-sm sm:text-base font-bold text-[#1F1410] truncate block">
                  {promo.codigoCupon}
                </span>
              </div>

              <button
                type="button"
                disabled={promo.agotadaHoy}
                onClick={handleShowQR}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#1F1410] hover:bg-[#E12927] disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md"
              >
                <QrCode size={16} />
                <span>{promo.agotadaHoy ? 'Agotada hoy' : 'Mostrar QR al barista'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QR por encima */}
      {showQR && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          titulo={promo.nombre}
          subtitulo={promo.beneficioDetalle}
          codigo={promo.codigoCupon}
          vigencia={`Válido: ${promo.vigencia}`}
          instruccion="Muestra este código al barista o mesero al pagar tu cuenta."
        />
      )}
    </>,
    document.body
  );
}
