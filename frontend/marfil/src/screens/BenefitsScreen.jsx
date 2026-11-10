import React, { useState } from 'react';
import {
  Coffee,
  CheckCircle2,
  Lock,
  Sparkles,
  QrCode,
  Clock,
  Award,
  Gift,
  Check
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRModal from '../components/QRModal';

export default function BenefitsScreen({
  perfil,
  beneficios
}) {
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const handleUseBenefit = (benefit) => {
    sounds.playClick();
    setSelectedBenefit(benefit);
    setShowQR(true);
  };

  const sellosFaltantes = perfil.sellosTotalesParaMeta - perfil.sellosActuales;

  return (
    <div className="flex flex-col gap-9 fade-in pb-16">
      {/* Encabezado */}
      <div className="max-w-2xl text-left">

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-3">
          Mis Beneficios & Sellos
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
        </p>
      </div>

      {/* Tarjeta de Sellos Digital ("Pasaporte Marfil") - 100% SÃ³lida con Alto Contraste */}
      <div className="bg-[#FCEAE9] rounded-lg border-2 border-[#E12927]/40 p-6 sm:p-8 flex flex-col gap-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-xs mb-3">
              <span>NIVEL: {perfil.nivelFidelidad.toUpperCase()}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410] leading-snug">
              Te faltan {sellosFaltantes} {sellosFaltantes === 1 ? 'visita' : 'visitas'} para tu siguiente beneficio
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#1F1410]/85 mt-1 font-medium">
              Presenta tu app al ordenar en cualquiera de nuestras sucursales en Durango para sumar sellos a tu cuenta.
            </p>
          </div>

          <div className="bg-white rounded-md border-2 border-stone-300 p-4 text-center min-w-[140px] shrink-0 shadow-sm">
            <span className="block font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">TUS PUNTOS</span>
            <div className="font-mono text-3xl font-bold text-[#E12927] my-0.5">{perfil.puntosFidelidad}</div>
            <span className="font-mono text-[11px] font-bold text-[#E12927]">Puntos Club</span>
          </div>
        </div>

        {/* VisualizaciÃ³n de Sellos (8 slots) */}
        <div className="bg-white rounded-md border-2 border-stone-300 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {Array.from({ length: perfil.sellosTotalesParaMeta }).map((_, idx) => {
              const isStamped = idx < perfil.sellosActuales;
              const isNext = idx === perfil.sellosActuales;
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 text-center">
                  <div
                    className={`w-12 h-12 rounded-md flex items-center justify-center transition-all duration-200 relative ${
                      isStamped
                        ? 'bg-[#E12927] text-white shadow-md shadow-[#E12927]/40 scale-105'
                        : isNext
                        ? 'border-2 border-dashed border-[#E12927] bg-[#FCEAE9] animate-pulse text-[#E12927]'
                        : 'border-2 border-dashed border-stone-400 bg-stone-50 text-stone-500'
                    }`}
                  >
                    {isStamped ? (
                      <div className="relative flex items-center justify-center">
                        <Coffee size={20} />
                        <span className="absolute -bottom-1.5 -right-2 bg-white text-[#E12927] text-[9px] font-black w-4 h-4 rounded-xs flex items-center justify-center shadow-xs border border-[#E12927]/30">
                          âœ“
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#6B5A52] tracking-wider uppercase">
                    {isStamped ? `Sello ${idx + 1}` : isNext ? 'Â¡Siguiente!' : `Sello ${idx + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner de Siguiente Recompensa */}
        <div className="bg-white rounded-md p-4 border-l-4 border-l-[#E12927] border-2 border-stone-300 flex items-center gap-3 shadow-xs">
          <Sparkles size={20} className="text-[#E12927] shrink-0" />
          <span className="font-body text-xs sm:text-sm text-[#1F1410] font-medium">
            PrÃ³ximo regalo al completar 8 sellos: <strong>Copa de Fresas Estilo DubÃ¡i con Pistache & Kataifi</strong> de cortesÃ­a.
          </span>
        </div>
      </div>

      {/* Beneficios Desbloqueados HeroUI Cards */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#1F1410]">Beneficios Disponibles</h2>
          <p className="font-body text-xs sm:text-sm text-[#5A4840]">Presiona en cualquier beneficio para generar el cÃ³digo QR y mostrarlo en caja.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {beneficios
            .filter((b) => b.estado === 'disponible')
            .map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg border-2 border-stone-300 p-5 flex flex-col gap-3 shadow-md hover:shadow-xl hover:border-[#E12927] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-[#FCEAE9] text-[#E12927] flex items-center justify-center border-2 border-[#E12927]/30">
                    <Sparkles size={18} />
                  </div>
                  <span className="px-3.5 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-xs border border-[#E12927]">
                    Listo para canjear
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-[#1F1410] leading-snug group-hover:text-[#E12927] transition-colors">
                  {b.titulo}
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#5A4840] leading-relaxed font-medium">{b.subtitulo}</p>

                <div className="mt-auto pt-3 flex items-center justify-between border-t-2 border-stone-200">
                  <span className="font-mono text-[11px] text-[#8E7A74] flex items-center gap-1">
                    <Clock size={12} className="text-[#E12927]" />
                    {b.vigencia}
                  </span>
                  <button
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleUseBenefit(b)}
                  >
                    <QrCode size={14} />
                    <span>Canjear beneficio</span>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Beneficios por Desbloquear */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[#1F1410]">PrÃ³ximos Beneficios por Desbloquear</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {beneficios
            .filter((b) => b.estado === 'bloqueado')
            .map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg border-2 border-dashed border-stone-300 p-5 flex flex-col gap-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center border-2 border-stone-300">
                    <Lock size={16} />
                  </div>
                  <span className="px-3.5 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-[#1F1410] text-white">
                    {b.progreso}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-[#1F1410] leading-snug">
                  {b.titulo}
                </h3>
                <p className="font-body text-xs text-[#5A4840] leading-relaxed font-medium">{b.subtitulo}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Historial de Beneficios Canjeados */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[#1F1410]">Historial de Beneficios Canjeados</h3>
        </div>

        <div className="flex flex-col gap-3">
          {beneficios
            .filter((b) => b.estado === 'usado')
            .map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-md border-2 border-stone-300 p-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={22} className="text-[#E12927] shrink-0" />
                  <div>
                    <h4 className="font-body text-sm font-bold text-[#1F1410] m-0">
                      {b.titulo}
                    </h4>
                    <span className="font-mono text-xs text-[#8E7A74]">
                      {b.fechaUso} Â· Folio {b.codigo}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-[#1F1410]/10 text-[#1F1410] font-bold">
                  CANJEADO
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Modal QR para Canjear Beneficio */}
      {selectedBenefit && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          titulo={selectedBenefit.titulo}
          subtitulo={selectedBenefit.subtitulo}
          codigo={selectedBenefit.codigo}
          vigencia={selectedBenefit.vigencia}
          instruccion="Muestra este cÃ³digo al barista o mesero al momento de pagar tu cuenta en mostrador."
        />
      )}
    </div>
  );
}
