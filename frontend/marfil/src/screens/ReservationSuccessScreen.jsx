import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  CalendarPlus,
  Home,
  ListOrdered
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ReservationSuccessScreen({
  reservation,
  onGoHome,
  onViewReservations
}) {
  useEffect(() => {
    sounds.playSuccessChime();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#E12927', '#1F1410', '#FCEAE9', '#FFFFFF']
      });
    } catch {
      // ignore
    }
  }, []);

  if (!reservation) return null;

  const handleAddToCalendar = () => {
    sounds.playClick();
    const title = encodeURIComponent(`Café Marfil: ${reservation.tipo}`);
    const details = encodeURIComponent(
      `Reservación en Café Marfil Durango (${reservation.sucursalNombre}). Folio: ${reservation.id}. A nombre de: ${reservation.nombreCliente} para ${reservation.personas} personas.`
    );
    const location = encodeURIComponent(`${reservation.sucursalNombre}, Durango, Dgo., México`);
    
    const cleanDate = reservation.fechaISO ? reservation.fechaISO.replace(/-/g, '') : '20261002';
    const dates = `${cleanDate}T193000Z/${cleanDate}T213000Z`;

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
    window.open(gcalUrl, '_blank');
  };

  return (
    <div className="flex justify-center items-center py-6 fade-in pb-16">
      <div className="max-w-xl w-full text-center p-8 sm:p-10 rounded-lg bg-white border-2 border-stone-300 shadow-2xl flex flex-col items-center">
        {/* Encabezado Celebratorio */}
        <div className="w-20 h-20 rounded-md bg-[#E12927] text-white flex items-center justify-center shadow-lg shadow-[#E12927]/40 mb-4 animate-bounce [animation-iteration-count:2]">
          <CheckCircle2 size={42} strokeWidth={2.5} />
        </div>

        <span className="font-mono text-xs font-bold text-[#E12927] tracking-widest uppercase mb-1">
          ¡RESERVACIÓN CONFIRMADA CON ÉXITO!
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1410] tracking-tight mb-2">
          Te esperamos en Café Marfil
        </h1>
        <p className="font-body text-xs sm:text-sm text-[#5A4840] max-w-md mb-6 leading-relaxed font-medium">
          Tu mesa ha quedado apartada exitosamente. Hemos enviado la confirmación con tu folio digital.
        </p>

        {/* Tarjeta de Folio y Código QR HeroUI Card 100% Sólida */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-lg bg-[#FCEAE9] border-2 border-dashed border-[#E12927] mb-6 shadow-md">
          <div className="text-left sm:text-left">
            <span className="font-mono text-[11px] font-bold text-[#8E7A74] uppercase tracking-wider block">NÚMERO DE FOLIO</span>
            <div className="font-mono text-2xl font-bold text-[#E12927] my-0.5">{reservation.id}</div>
            <span className="font-body text-xs text-[#1F1410] font-medium">Presenta este folio al llegar a la sucursal.</span>
          </div>

          <div className="bg-white p-3.5 rounded-md border-2 border-stone-300 flex flex-col items-center shadow-sm">
            <QrCode size={80} className="text-[#1F1410]" />
            <span className="font-mono text-[9px] font-bold text-[#8E7A74] tracking-wider mt-1 uppercase">ESCÁNER EN PUERTA</span>
          </div>
        </div>

        {/* Resumen de Detalles */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-md bg-[#FAF7F5] border-2 border-stone-300 text-left mb-6 font-body text-xs sm:text-sm shadow-xs">
          <div>
            <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider mb-0.5">TIPO DE EXPERIENCIA</span>
            <strong className="text-[#1F1410]">{reservation.tipo}</strong>
          </div>
          <div>
            <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider mb-0.5">SUCURSAL</span>
            <strong className="text-[#1F1410]">{reservation.sucursalNombre}</strong>
          </div>
          <div>
            <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider mb-0.5">FECHA Y HORARIO</span>
            <strong className="font-mono text-[#1F1410]">{reservation.fecha} · {reservation.hora}</strong>
          </div>
          <div>
            <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider mb-0.5">COMENSALES</span>
            <strong className="text-[#1F1410]">{reservation.personas} personas</strong>
          </div>
        </div>

        {/* Acciones Finales HeroUI Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={handleAddToCalendar}
          >
            <CalendarPlus size={16} />
            <span>Google Calendar</span>
          </button>

          <button
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#1F1410] bg-white text-[#1F1410] hover:bg-[#1F1410] hover:text-white active:scale-95 transition-all duration-200 cursor-pointer shadow-xs"
            onClick={() => {
              sounds.playClick();
              onViewReservations();
            }}
          >
            <ListOrdered size={16} />
            <span>Mis reservaciones</span>
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider text-[#8E7A74] hover:text-[#1F1410] hover:bg-stone-100 active:scale-95 transition-all cursor-pointer font-semibold"
            onClick={() => {
              sounds.playClick();
              onGoHome();
            }}
          >
            <Home size={16} />
            <span>Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
