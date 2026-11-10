import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Tag
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRModal from '../components/QRModal';

export default function PromotionDetailScreen({ promo, onBack }) {
  const [showQR, setShowQR] = useState(false);

  if (!promo) return null;

  const handleShowQR = () => {
    sounds.playClick();
    setShowQR(true);
  };

  const sucursalesTexto = (promo.sucursalesValidas || promo.sucursalesAplicables || []).join(', ');
  const condicionesLista = promo.terminos || promo.condiciones || [];
  const descripcionTexto = promo.descripcion || promo.resumen || '';

  return (
    <div className="flex flex-col gap-6 fade-in pb-16">
      {/* Botón Volver */}
      <button
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border-2 border-stone-300 hover:border-[#E12927] font-mono text-xs font-bold text-[#1F1410] hover:text-[#E12927] shadow-xs transition-all duration-200 cursor-pointer self-start active:scale-95"
        onClick={() => {
          sounds.playClick();
          onBack();
        }}
      >
        <ArrowLeft size={16} />
        <span>VOLVER A PROMOCIONES</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-8 items-start">
        {/* Columna Izquierda: Imagen y Tarjeta de Beneficio */}
        <div className="flex flex-col gap-5">
          <div className="relative rounded-lg overflow-hidden bg-[#F8F3EE] shadow-md border-2 border-stone-300 aspect-4/3">
            <img src={promo.imagen} alt={promo.nombre} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4">
              <span className="px-4 py-1.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-md border-2 border-[#E12927]">
                {promo.descuentoBadge}
              </span>
            </div>
          </div>

          {/* Tarjeta de Acción / Canje 100% Sólida */}
          <div className="bg-[#FCEAE9] rounded-lg border-2 border-[#E12927]/50 p-6 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">CÓDIGO DIGITAL</span>
              <span className="px-3.5 py-1 rounded-sm font-mono text-xs font-bold bg-white text-[#E12927] border-2 border-dashed border-[#E12927] shadow-xs">
                {promo.codigoCupon}
              </span>
            </div>

            <div className="font-display text-xl font-bold text-[#1F1410] leading-snug">
              {promo.beneficioDetalle}
            </div>

            <button
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={handleShowQR}
            >
              <QrCode size={16} />
              <span>Mostrar cupón al barista</span>
            </button>

            <p className="font-body text-xs text-[#5A4840] text-center m-0 font-medium">
              Presenta la pantalla de tu dispositivo al momento de solicitar tu cuenta en caja.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Información Editorial */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="font-mono text-xs font-bold text-[#E12927] tracking-wider uppercase mb-1 block">
              {promo.categoria}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight leading-tight">
              {promo.nombre}
            </h1>
          </div>

          {/* Meta Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-md bg-white border-2 border-stone-300 flex items-center gap-3 shadow-sm">
              <Clock size={18} className="text-[#E12927] shrink-0" />
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">VIGENCIA</span>
                <strong className="font-mono text-xs text-[#1F1410]">{promo.vigencia}</strong>
              </div>
            </div>

            {sucursalesTexto && (
              <div className="p-4 rounded-md bg-white border-2 border-stone-300 flex items-center gap-3 shadow-sm">
                <MapPin size={18} className="text-[#E12927] shrink-0" />
                <div>
                  <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">SUCURSALES</span>
                  <strong className="font-body text-xs text-[#1F1410] truncate block font-semibold">{sucursalesTexto}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-bold text-[#1F1410]">Descripción de la promoción</h3>
            <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
              {descripcionTexto}
            </p>
          </div>

          {/* Pasos para canjear */}
          <div className="p-6 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-3 shadow-md">
            <h3 className="font-display text-lg font-bold text-[#1F1410]">¿Cómo canjear en sucursal?</h3>
            <div className="flex flex-col gap-3 font-body text-xs sm:text-sm text-[#1F1410] font-medium">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-xs bg-[#E12927] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">1</span>
                <span>Acude a cualquiera de las sucursales participantes de Café Marfil en Durango.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-xs bg-[#E12927] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">2</span>
                <span>Al ordenar tus alimentos o bebidas, menciona la promoción correspondiente.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-xs bg-[#E12927] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">3</span>
                <span>Muestra el código QR o código digital desde tu teléfono al momento del cobro.</span>
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          {condicionesLista.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">TÉRMINOS & CONDICIONES</h4>
              <div className="flex flex-col gap-1.5 font-body text-xs text-[#5A4840]">
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
      </div>

      {/* Modal QR */}
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
    </div>
  );
}
