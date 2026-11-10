import React, { useState } from 'react';
import { X, Check, Copy, Sparkles, QrCode } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function QRModal({ isOpen, onClose, titulo, subtitulo, codigo, vigencia, instruccion }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-lg max-w-sm w-full p-6 sm:p-7 flex flex-col items-center text-center gap-4 shadow-2xl border-2 border-stone-400 animate-mh-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs border-2 border-stone-300"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="w-12 h-12 rounded-md bg-[#FCEAE9] text-[#E12927] flex items-center justify-center mb-1 shadow-xs border-2 border-[#E12927]/40">
            <Sparkles size={22} />
          </div>
          <h3 className="font-display text-xl font-bold text-[#1F1410] leading-snug">
            {titulo || 'Tu Pase Digital Café Marfil'}
          </h3>
          <p className="font-body text-xs text-[#5A4840] font-medium">
            {subtitulo || 'Muestra este código al barista o mesero al pagar'}
          </p>
        </div>

        {/* Visualización de Código QR Simulado */}
        <div className="p-4 rounded-md bg-white border-2 border-stone-300 shadow-md">
          <svg viewBox="0 0 140 140" className="w-36 h-36">
            <rect width="140" height="140" fill="#FFFFFF" rx="4" />
            {/* Esquinas QR en Negro Café y Rojo Marfil */}
            <rect x="14" y="14" width="34" height="34" rx="2" fill="#1F1410" />
            <rect x="20" y="20" width="22" height="22" rx="1" fill="#FFFFFF" />
            <rect x="25" y="25" width="12" height="12" rx="1" fill="#E12927" />

            <rect x="92" y="14" width="34" height="34" rx="2" fill="#1F1410" />
            <rect x="98" y="20" width="22" height="22" rx="1" fill="#FFFFFF" />
            <rect x="103" y="25" width="12" height="12" rx="1" fill="#E12927" />

            <rect x="14" y="92" width="34" height="34" rx="2" fill="#1F1410" />
            <rect x="20" y="98" width="22" height="22" rx="1" fill="#FFFFFF" />
            <rect x="25" y="103" width="12" height="12" rx="1" fill="#E12927" />

            {/* Patrones centrales simulados */}
            <rect x="58" y="18" width="8" height="16" rx="1" fill="#1F1410" />
            <rect x="74" y="18" width="10" height="8" rx="1" fill="#1F1410" />
            <rect x="56" y="42" width="28" height="8" rx="1" fill="#E12927" />
            <rect x="18" y="58" width="20" height="8" rx="1" fill="#1F1410" />
            <rect x="46" y="58" width="16" height="16" rx="1" fill="#1F1410" />
            <rect x="70" y="58" width="20" height="8" rx="1" fill="#E12927" />
            <rect x="100" y="58" width="22" height="14" rx="1" fill="#1F1410" />
            <rect x="58" y="80" width="12" height="20" rx="1" fill="#1F1410" />
            <rect x="78" y="74" width="18" height="10" rx="1" fill="#1F1410" />
            <rect x="74" y="92" width="24" height="16" rx="1" fill="#E12927" />
            <rect x="106" y="80" width="18" height="24" rx="1" fill="#1F1410" />
            <rect x="58" y="108" width="12" height="16" rx="1" fill="#E12927" />
            <rect x="78" y="116" width="30" height="8" rx="1" fill="#1F1410" />
          </svg>
        </div>

        {/* Código copiable 100% Sólido */}
        <div className="w-full flex items-center justify-between p-3.5 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/50 shadow-sm">
          <div className="text-left">
            <span className="block font-mono text-[9px] font-bold text-[#8E7A74] tracking-wider uppercase">CÓDIGO DIGITAL</span>
            <span className="font-mono text-sm font-bold text-[#E12927]">{codigo}</span>
          </div>
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm font-mono text-xs font-bold uppercase bg-white border-2 border-stone-300 text-[#1F1410] hover:bg-[#1F1410] hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {vigencia && (
          <span className="font-mono text-[11px] text-[#8E7A74] font-semibold">{vigencia}</span>
        )}

        <p className="font-body text-xs text-[#5A4840] leading-relaxed m-0 font-medium">
          {instruccion || 'Muestra este código al barista en caja al momento de pagar tu orden.'}
        </p>
      </div>
    </div>
  );
}
