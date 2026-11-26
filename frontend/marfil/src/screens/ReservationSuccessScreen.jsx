import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CalendarPlus,
  Home,
  ListOrdered,
  Copy,
  Check,
  Download,
  Dice5,
  Link2
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRCodeImage from '../components/QRCodeImage';
import ElephantLogo from '../components/ElephantLogo';

export default function ReservationSuccessScreen({
  reservation,
  onGoHome,
  onViewReservations
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    sounds.playSuccessChime();
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#E12927', '#1F1410', '#FCEAE9', '#FFFFFF']
      });
    } catch {
      // ignore
    }
  }, []);

  if (!reservation) return null;

  const folio = reservation.id;

  const handleCopy = () => {
    sounds.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(folio);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = async () => {
    sounds.playClick();
    try {
      const url = await QRCode.toDataURL(String(folio || ''), {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#1F1410', light: '#FFFFFF' }
      });
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `cafe-marfil-reserva-${String(folio || 'pase').replace(/[^A-Za-z0-9_-]/g, '')}.png`;
      enlace.click();
    } catch {
      // ignore
    }
  };

  const handleAddToCalendar = () => {
    sounds.playClick();
    const title = encodeURIComponent(`Café Marfil: ${reservation.tipo}`);
    const details = encodeURIComponent(
      `Reservación en Café Marfil Durango (${reservation.sucursalNombre}). Folio: ${folio}. A nombre de: ${reservation.nombreCliente} para ${reservation.personas} personas.`
    );
    const location = encodeURIComponent(`${reservation.sucursalNombre}, Durango, Dgo., México`);
    const cleanDate = reservation.fechaISO ? reservation.fechaISO.replace(/-/g, '') : '20261002';
    const dates = `${cleanDate}T193000Z/${cleanDate}T213000Z`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    window.open(gcalUrl, '_blank');
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center py-1 fade-in">
      {/* ====================================================================
          COLUMNA IZQUIERDA: BOLETO DIGITAL QR ESTILO MOBILE TICKET
          ==================================================================== */}
      <div className="md:col-span-5 flex items-center justify-center">
        <div className="relative w-full max-w-[270px] flex items-center justify-center py-1">
          {/* Tarjetas laterales decorativas 3D */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-5 bottom-5 w-16 rounded-[20px] bg-gradient-to-b from-[#E12927]/75 to-[#2D1214] -rotate-6 opacity-65 shadow-lg"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-5 bottom-5 w-16 rounded-[20px] bg-gradient-to-b from-[#9E1C1E]/80 to-[#1F1410] rotate-6 opacity-65 shadow-lg"
          />

          {/* Boleto principal */}
          <div className="relative z-10 w-[88%] rounded-[22px] overflow-hidden shadow-[0_18px_40px_rgba(31,20,16,0.28)] border border-black/10">
            {/* Cabecera póster rojo-espresso */}
            <div className="relative px-4 pt-3.5 pb-4 bg-gradient-to-br from-[#E12927] via-[#7A1518] to-[#1F1410] text-white flex flex-col items-center gap-1 text-center overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                <ElephantLogo size={22} color="blanco" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/75 mt-0.5">
                Pase de Entrada
              </span>
              <strong className="text-sm font-bold text-white tracking-wide">
                {folio}
              </strong>
            </div>

            {/* Muescas laterales + línea punteada */}
            <div className="relative bg-[#FAF7F5] dark:bg-[#FAF7F5] h-4 flex items-center justify-center">
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#FAF7F5] dark:bg-[#17100D] shadow-inner" />
              <span className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#FAF7F5] dark:bg-[#17100D] shadow-inner" />
              <div className="w-[78%] border-t-2 border-dashed border-[#1F1410]/20" />
            </div>

            {/* Talón blanco con QR escaneable */}
            <div className="bg-[#FAF7F5] dark:bg-[#FAF7F5] px-3.5 pt-0.5 pb-3.5 flex flex-col items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white dark:bg-white shadow-xs border border-black/[0.06]">
                <QRCodeImage value={folio} size={126} alt={`QR Reservación ${folio}`} />
              </div>

              <div className="w-full flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-[#1F1410] hover:bg-[#E12927] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-white border border-black/15 text-[#1F1410] dark:text-[#1F1410] hover:border-[#E12927] hover:text-[#E12927] text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Download size={12} />
                  <span>PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          COLUMNA DERECHA: CONFIRMACIÓN, DETALLES Y BOTONES
          ==================================================================== */}
      <div className="md:col-span-7 flex flex-col gap-4 text-left">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} strokeWidth={2.3} />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E12927]">
              ¡Reservación confirmada!
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410] dark:text-[#FAF7F5] leading-tight">
              Te esperamos en Café Marfil
            </h3>
            <p className="text-xs sm:text-sm text-[#5A4840] dark:text-[#C5B4AE] mt-0.5 m-0">
              Presenta tu pase QR al llegar a la sucursal. Tienes 15 minutos de cortesía.
            </p>
          </div>
        </div>

        {/* Grid compacto de detalles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10">
            <span className="block text-[10px] uppercase text-[#8E7A74]">Experiencia</span>
            <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] line-clamp-1">
              {reservation.tipo}
            </strong>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10">
            <span className="flex items-center gap-1 text-[10px] uppercase text-[#8E7A74]">
              <MapPin size={11} className="text-[#E12927]" /> Sucursal
            </span>
            <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] line-clamp-1">
              {reservation.sucursalNombre}
            </strong>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10">
            <span className="flex items-center gap-1 text-[10px] uppercase text-[#8E7A74]">
              <Calendar size={11} className="text-[#E12927]" /> Fecha y hora
            </span>
            <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] inline-flex items-center gap-1">
              <span>{reservation.fecha}</span>
              <span>·</span>
              <Clock size={11} className="text-[#8E7A74]" />
              <span>{reservation.hora}</span>
            </strong>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10">
            <span className="flex items-center gap-1 text-[10px] uppercase text-[#8E7A74]">
              <Users size={11} className="text-[#E12927]" /> Comensales
            </span>
            <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
              {reservation.personas} {reservation.personas === 1 ? 'persona' : 'personas'}
            </strong>
          </div>

          {reservation.mesaAsignada && (
            <div className="col-span-2 p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E12927] shrink-0" />
                <span className="text-xs text-[#1F1410] dark:text-[#FAF7F5]">
                  {reservation.mesasSolicitadas?.length > 1 ? 'Mesas reservadas: ' : 'Mesa asignada: '}
                  <strong>{reservation.mesaAsignada}</strong>
                </span>
              </div>
              {reservation.solicitaUnionMesas && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] text-[11px] font-bold">
                  <Link2 size={12} />
                  Solicitud de unión de mesas
                </span>
              )}
            </div>
          )}

          {reservation.juegoNombre && (
            <div className="col-span-2 p-3 rounded-2xl bg-[#FCEAE9]/70 dark:bg-[#321B19] border border-[#E12927]/25 flex items-center gap-2">
              <Dice5 size={15} className="text-[#E12927] shrink-0" />
              <span className="text-xs text-[#1F1410] dark:text-[#FAF7F5]">
                Juego apartado: <strong>{reservation.juegoNombre}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Acciones finales */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAddToCalendar}
            className="flex-1 min-w-[145px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <CalendarPlus size={15} />
            <span>Google Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onViewReservations();
            }}
            className="flex-1 min-w-[145px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1F1410] dark:bg-white/15 hover:bg-[#33221C] text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ListOrdered size={15} />
            <span>Mis reservaciones</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onGoHome();
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-black/10 dark:border-white/15 text-[#6B5A52] dark:text-[#C5B4AE] hover:text-[#1F1410] dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Home size={14} />
            <span>Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
