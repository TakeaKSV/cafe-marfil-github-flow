import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  XCircle,
  AlertTriangle,
  CalendarPlus,
  Plus,
  Dice5,
  FileText,
  History
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRModal from '../components/QRModal';

export default function MyReservationsScreen({
  reservaciones = [],
  onCancelReservation,
  onNewReservation
}) {
  const [activeTab, setActiveTab] = useState('proximas'); // proximas | historial
  const [selectedQRReservation, setSelectedQRReservation] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const listRef = useRef(null);

  const proximas = reservaciones.filter((r) => !r.esHistorica && r.estado !== 'Cancelada');
  const historial = reservaciones.filter((r) => r.esHistorica || r.estado === 'Cancelada');

  useEffect(() => {
    if (!listRef.current) return undefined;
    const cards = listRef.current.querySelectorAll('[data-res-card]');
    if (!cards.length) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' }
      );
    }, listRef);
    return () => ctx.revert();
  }, [activeTab, proximas.length, historial.length]);

  const handleOpenCancelModal = (res) => {
    sounds.playClick();
    setReservationToCancel(res);
  };

  const handleConfirmCancel = () => {
    if (reservationToCancel) {
      sounds.playClick();
      onCancelReservation(reservationToCancel.id);
      setReservationToCancel(null);
    }
  };

  return (
    <div className="flex flex-col gap-7 sm:gap-8 fade-in pb-16 pt-2">
      {/* ====================================================================
          ENCABEZADO EDITORIAL + CTA NUEVA RESERVACIÓN
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-xl text-left">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] dark:text-[#FAF7F5] tracking-tight mb-2">
            Mis Reservaciones
          </h1>
          <p className="font-body text-sm sm:text-base text-[#5A4840] dark:text-[#C5B4AE] leading-relaxed m-0">
            Administra tus mesas activas, pases QR para eventos y el historial de tus visitas a Café Marfil Durango.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white shadow-md shadow-[#E12927]/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          onClick={() => {
            sounds.playClick();
            onNewReservation();
          }}
        >
          <Plus size={16} />
          <span>Nueva Reservación</span>
        </button>
      </div>

      {/* ====================================================================
          PESTAÑAS LIMPIAS (PRÓXIMAS / HISTORIAL)
          ==================================================================== */}
      <div className="flex items-center gap-2.5 self-start">
        <button
          type="button"
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
            activeTab === 'proximas'
              ? 'bg-[#1F1410] dark:bg-[#E12927] text-white shadow-sm'
              : 'bg-white dark:bg-[#1F1410] text-[#6B5A52] dark:text-[#C5B4AE] border border-black/10 dark:border-white/10 hover:text-[#1F1410] dark:hover:text-white'
          }`}
          onClick={() => {
            sounds.playClick();
            setActiveTab('proximas');
          }}
        >
          Próximas visitas ({proximas.length})
        </button>
        <button
          type="button"
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
            activeTab === 'historial'
              ? 'bg-[#1F1410] dark:bg-[#E12927] text-white shadow-sm'
              : 'bg-white dark:bg-[#1F1410] text-[#6B5A52] dark:text-[#C5B4AE] border border-black/10 dark:border-white/10 hover:text-[#1F1410] dark:hover:text-white'
          }`}
          onClick={() => {
            sounds.playClick();
            setActiveTab('historial');
          }}
        >
          Historial ({historial.length})
        </button>
      </div>

      {/* ====================================================================
          PRÓXIMAS VISITAS — TARJETAS ESTILO PASE / BOLETO
          ==================================================================== */}
      <div ref={listRef}>
        {activeTab === 'proximas' && (
          proximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14 rounded-[28px] bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 gap-3 shadow-xs">
              <span className="w-14 h-14 rounded-2xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center">
                <CalendarPlus size={28} />
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                No tienes reservaciones próximas
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5A52] dark:text-[#B4A099] max-w-md m-0">
                Aparta una mesa para desayunar, disfrutar una tarde de juegos de mesa o unirte a nuestros próximos eventos en Durango.
              </p>
              <button
                type="button"
                className="mt-2 px-7 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#E12927] hover:bg-[#C81E1C] text-white shadow-md shadow-[#E12927]/25 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  sounds.playClick();
                  onNewReservation();
                }}
              >
                Reservar mesa ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proximas.map((res) => (
                <article
                  key={res.id}
                  data-res-card
                  className="rounded-[26px] overflow-hidden bg-white dark:bg-[#1F1410] border border-black/[0.07] dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Cabecera oscura estilo pase */}
                  <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#1F1410] via-[#4D1618] to-[#8F191B] text-white flex items-start justify-between gap-3">
                    <div className="text-left min-w-0">
                      <span className="block text-[10px] uppercase tracking-widest text-white/70">
                        Folio · {res.id}
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white leading-snug mt-0.5 truncate">
                        {res.tipo}
                      </h3>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {res.estado}
                    </span>
                  </div>

                  {/* Línea perforada de boleto */}
                  <div className="relative h-4 bg-white dark:bg-[#1F1410] flex items-center justify-center">
                    <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#FAF7F5] dark:bg-[#150E0C] border-r border-black/10 dark:border-white/10" />
                    <span className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#FAF7F5] dark:bg-[#150E0C] border-l border-black/10 dark:border-white/10" />
                    <div className="w-[84%] border-t border-dashed border-black/15 dark:border-white/15" />
                  </div>

                  {/* Cuerpo del pase */}
                  <div className="px-5 sm:px-6 pt-1 pb-5 flex flex-col flex-1 gap-3.5 text-left">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-center gap-2.5">
                        <Calendar size={15} className="text-[#E12927] shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-[#8E7A74]">Fecha</span>
                          <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] block truncate">
                            {res.fecha}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-center gap-2.5">
                        <Clock size={15} className="text-[#E12927] shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-[#8E7A74]">Horario</span>
                          <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] block truncate">
                            {res.hora}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-center gap-2.5">
                        <MapPin size={15} className="text-[#E12927] shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-[#8E7A74]">Sucursal</span>
                          <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] block truncate">
                            {res.sucursalNombre}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-center gap-2.5">
                        <Users size={15} className="text-[#E12927] shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-[#8E7A74]">Comensales</span>
                          <strong className="text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] block truncate">
                            {res.personas} {res.personas === 1 ? 'persona' : 'personas'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {res.juegoNombre && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-[#FCEAE9]/65 dark:bg-[#321B19] flex items-center gap-2 text-xs text-[#1F1410] dark:text-[#FAF7F5]">
                        <Dice5 size={15} className="text-[#E12927] shrink-0" />
                        <span>
                          Juego apartado: <strong className="text-[#E12927]">{res.juegoNombre}</strong>
                        </span>
                      </div>
                    )}

                    {res.notas && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-start gap-2 text-xs text-[#5A4840] dark:text-[#C5B4AE]">
                        <FileText size={14} className="text-[#8E7A74] shrink-0 mt-0.5" />
                        <span>{res.notas}</span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="mt-auto pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F1410] dark:bg-[#E12927] hover:bg-[#E12927] dark:hover:bg-[#C81E1C] active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedQRReservation(res);
                        }}
                      >
                        <QrCode size={15} />
                        <span>Ver pase QR</span>
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#8E7A74] hover:text-[#E12927] hover:bg-[#FCEAE9]/60 dark:hover:bg-[#321B19] transition-colors cursor-pointer"
                        onClick={() => handleOpenCancelModal(res)}
                      >
                        <XCircle size={15} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {/* ==================================================================
            HISTORIAL PASADO
            ================================================================== */}
        {activeTab === 'historial' && (
          historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 rounded-[28px] bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 gap-2.5 shadow-xs">
              <span className="w-12 h-12 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] text-[#8E7A74] flex items-center justify-center">
                <History size={24} />
              </span>
              <h3 className="font-display text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                Sin historial todavía
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5A52] dark:text-[#B4A099] max-w-sm m-0">
                Aquí aparecerán tus visitas completadas y reservaciones anteriores.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historial.map((res) => {
                const esCancelada = res.estado === 'Cancelada';
                return (
                  <article
                    key={res.id}
                    data-res-card
                    className="rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 p-5 flex flex-col gap-3 text-left shadow-xs opacity-90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#8E7A74]">Folio · {res.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          esCancelada
                            ? 'bg-rose-500/10 text-[#E12927]'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {res.estado}
                      </span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5] leading-snug">
                      {res.tipo}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5A52] dark:text-[#B4A099] pt-2 border-t border-black/[0.06] dark:border-white/10">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} /> {res.fecha}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {res.hora}
                      </span>
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin size={12} /> {res.sucursalNombre}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Modal QR estilo Mobile Ticket */}
      {selectedQRReservation && (
        <QRModal
          isOpen={!!selectedQRReservation}
          onClose={() => setSelectedQRReservation(null)}
          titulo={selectedQRReservation.tipo}
          subtitulo={`${selectedQRReservation.sucursalNombre} · ${selectedQRReservation.fecha} · ${selectedQRReservation.hora}`}
          codigo={selectedQRReservation.qrCode || `MF-RES-${selectedQRReservation.id}`}
          vigencia={`${selectedQRReservation.personas} ${selectedQRReservation.personas === 1 ? 'persona' : 'personas'}`}
          instruccion="Muestra este código al host en la entrada para asignarte tu mesa directamente."
        />
      )}

      {/* Modal de Cancelación moderno */}
      {reservationToCancel && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#120A08]/75 backdrop-blur-md"
          onClick={() => setReservationToCancel(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1F1410] rounded-[26px] max-w-sm w-full p-6 sm:p-7 flex flex-col items-center text-center gap-4 shadow-2xl border border-black/10 dark:border-white/10"
          >
            <div className="w-13 h-13 rounded-2xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center">
              <AlertTriangle size={26} />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                ¿Cancelar reservación?
              </h3>
              <p className="text-xs sm:text-sm text-[#5A4840] dark:text-[#C5B4AE] mt-1.5 leading-relaxed m-0">
                Se liberará tu lugar para <strong>{reservationToCancel.tipo}</strong> el {reservationToCancel.fecha}.
              </p>
            </div>
            <div className="flex gap-2.5 w-full mt-1">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-full border border-black/15 dark:border-white/15 text-xs font-bold text-[#1F1410] dark:text-[#FAF7F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setReservationToCancel(null)}
              >
                Mantener
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-full bg-[#E12927] hover:bg-[#C81E1C] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                onClick={handleConfirmCancel}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
