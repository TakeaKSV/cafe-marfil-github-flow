import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { X, Check, Copy, Download, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';
import QRCodeImage from './QRCodeImage';

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

  const handleDownload = async () => {
    sounds.playClick();
    try {
      const url = await QRCode.toDataURL(String(codigo || ''), {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#1F1410', light: '#FFFFFF' }
      });
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `cafe-marfil-qr-${String(codigo || 'pase').replace(/[^A-Za-z0-9_-]/g, '')}.png`;
      enlace.click();
    } catch {
      // ignorar si el navegador bloquea descarga
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1F1410]/70 backdrop-blur-md" onClick={onClose}>
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

        {/* Código QR Real Escaneable */}
        <div className="p-3.5 rounded-md bg-white border-2 border-stone-300 shadow-md flex flex-col items-center gap-2">
          <QRCodeImage value={codigo} size={172} alt={`Código QR ${codigo}`} />
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 hover:text-[#E12927] hover:bg-[#FCEAE9]/60 transition-colors cursor-pointer"
          >
            <Download size={12} />
            <span>Descargar QR</span>
          </button>
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
    </div>,
    document.body
  );
}
