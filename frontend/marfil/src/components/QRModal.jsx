import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import QRCode from 'qrcode';
import { X, Check, Copy, Download } from 'lucide-react';
import { sounds } from '../utils/audio';
import QRCodeImage from './QRCodeImage';
import ElephantLogo from './ElephantLogo';

export default function QRModal({ isOpen, onClose, titulo, subtitulo, codigo, vigencia, instruccion }) {
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    let tween;
    if (ticketRef.current) {
      tween = gsap.fromTo(
        ticketRef.current,
        { y: 28, scale: 0.92, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (tween) tween.kill();
    };
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[#120A08]/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={titulo || 'Pase Digital Café Marfil'}
    >
      <div
        ref={ticketRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[310px] sm:max-w-[330px] my-auto flex flex-col items-center gap-2.5 text-center"
      >
        {/* Cabecera estilo Mobile Ticket (Cerrar · Título · Descargar) */}
        <div className="w-full flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Cerrar pase digital"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <X size={16} />
          </button>

          <span className="text-white text-sm sm:text-base font-bold tracking-wide">
            Pase Digital
          </span>

          <button
            type="button"
            onClick={handleDownload}
            aria-label="Descargar QR"
            title="Descargar QR"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <Download size={15} />
          </button>
        </div>

        {/* Instrucción superior */}
        <p className="text-[11px] sm:text-xs text-white/75 max-w-[270px] leading-snug m-0">
          {instruccion || 'Muestra y escanea este código QR en caja o barra para validar tu pase.'}
        </p>

        {/* Contenedor 3D con tarjetas laterales asomadas detrás (estilo ticket) */}
        <div className="relative w-full flex items-center justify-center py-0.5">
          {/* Tarjeta decorativa izquierda */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1 top-5 bottom-5 w-20 rounded-[22px] bg-gradient-to-b from-[#E12927]/75 to-[#2D1214] -rotate-6 opacity-70 shadow-xl"
          />
          {/* Tarjeta decorativa derecha */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-5 bottom-5 w-20 rounded-[22px] bg-gradient-to-b from-[#9E1C1E]/80 to-[#1F1410] rotate-6 opacity-70 shadow-xl"
          />

          {/* TICKET PRINCIPAL */}
          <div className="relative z-10 w-[88%] rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.55)] border border-white/15">
            {/* Parte superior tipo póster Café Marfil */}
            <div className="relative px-4 pt-4 pb-4 bg-gradient-to-br from-[#E12927] via-[#7A1518] to-[#1F1410] text-white flex flex-col items-center gap-1.5 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/15 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#E12927]/40 blur-2xl pointer-events-none" />

              <div className="relative z-10 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-sm">
                <ElephantLogo size={24} color="blanco" />
              </div>

              <h3 className="relative z-10 font-display text-base sm:text-lg font-bold text-white leading-tight mt-0.5 line-clamp-2">
                {titulo || 'Pase Digital Café Marfil'}
              </h3>
              {subtitulo && (
                <p className="relative z-10 text-[11px] text-white/80 leading-snug max-w-[220px] m-0 line-clamp-2">
                  {subtitulo}
                </p>
              )}
            </div>

            {/* Línea perforada con muescas laterales de boleto */}
            <div className="relative bg-[#FAF7F5] dark:bg-[#FAF7F5] h-4 flex items-center justify-center">
              <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#160C0A]" />
              <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#160C0A]" />
              <div className="w-[78%] border-t-2 border-dashed border-[#1F1410]/20" />
            </div>

            {/* Talón inferior blanco con metadatos + QR escaneable */}
            <div className="bg-[#FAF7F5] dark:bg-[#FAF7F5] px-4 pt-0.5 pb-4 flex flex-col items-center gap-2.5">
              {/* Metadatos tipo boleto (2 columnas) */}
              <div className="w-full grid grid-cols-2 gap-2 text-left text-[10px] text-[#5A4840] dark:text-[#5A4840] px-0.5">
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-[#8E7A74] dark:text-[#8E7A74]">
                    Código
                  </span>
                  <strong className="text-[11px] font-bold text-[#1F1410] dark:text-[#1F1410] truncate block">
                    {codigo}
                  </strong>
                </div>
                <div className="text-right min-w-0">
                  <span className="block text-[9px] uppercase tracking-wider text-[#8E7A74] dark:text-[#8E7A74]">
                    Vigencia
                  </span>
                  <strong className="text-[11px] font-bold text-[#1F1410] dark:text-[#1F1410] truncate block">
                    {vigencia || 'Válido en sucursal'}
                  </strong>
                </div>
              </div>

              {/* QR Real sobre fondo blanco puro (máximo contraste para escáner) */}
              <div className="p-2 rounded-xl bg-white dark:bg-white shadow-sm border border-black/[0.06]">
                <QRCodeImage value={codigo} size={132} alt={`Código QR ${codigo}`} />
              </div>

              {/* Botones copiar / descargar */}
              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1F1410] hover:bg-[#E12927] text-white text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado' : 'Copiar código'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-white border border-black/15 text-[#1F1410] dark:text-[#1F1410] hover:border-[#E12927] hover:text-[#E12927] text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
