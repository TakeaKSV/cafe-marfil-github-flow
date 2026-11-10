import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/audio';
import QRModal from '../components/QRModal';

export default function MyReservationsScreen({
  reservaciones,
  onCancelReservation,
  onNewReservation
}) {
  const [activeTab, setActiveTab] = useState('proximas'); // proximas | historial
  const [selectedQRReservation, setSelectedQRReservation] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState(null);

  const proximas = reservaciones.filter((r) => !r.esHistorica && r.estado !== 'Cancelada');
  const historial = reservaciones.filter((r) => r.esHistorica || r.estado === 'Cancelada');

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
    <div className="flex flex-col gap-8 fade-in pb-16">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-xl text-left">

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-2">
            Mis Reservaciones
          </h1>
          <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
            Consulta tus mesas activas para desayunos, tardes de juegos con anfitrión y el historial de tus visitas a Café Marfil Durango.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer shrink-0 self-start sm:self-center"
          onClick={() => {
            sounds.playClick();
            onNewReservation();
          }}
        >
          <Plus size={16} />
          <span>Nueva Reservación</span>
        </button>
      </div>

      {/* Tabs HeroUI Style */}
      <div className="inline-flex p-1.5 rounded-md bg-[#F5EFEB] border-2 border-stone-300 shadow-inner self-start font-mono text-xs font-bold">
        <button
          className={`px-5 py-2.5 rounded-sm cursor-pointer transition-all duration-200 ${
            activeTab === 'proximas'
              ? 'bg-[#E12927] text-white border-2 border-[#E12927] shadow-md'
              : 'text-[#1F1410] border-2 border-transparent hover:text-[#E12927] hover:bg-white'
          }`}
          onClick={() => {
            sounds.playClick();
            setActiveTab('proximas');
          }}
        >
          Próximas Visitas ({proximas.length})
        </button>
        <button
          className={`px-5 py-2.5 rounded-sm cursor-pointer transition-all duration-200 ${
            activeTab === 'historial'
              ? 'bg-[#E12927] text-white border-2 border-[#E12927] shadow-md'
              : 'text-[#1F1410] border-2 border-transparent hover:text-[#E12927] hover:bg-white'
          }`}
          onClick={() => {
            sounds.playClick();
            setActiveTab('historial');
          }}
        >
          Historial Pasado ({historial.length})
        </button>
      </div>

      {/* Lista de Reservaciones HeroUI Cards 100% Sólidas */}
      {activeTab === 'proximas' && (
        <div className="flex flex-col gap-6">
          {proximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 rounded-lg bg-white border-2 border-stone-300 gap-3 shadow-md">
              <CalendarPlus size={36} className="text-[#E12927]" />
              <h3 className="font-display text-xl font-bold text-[#1F1410]">No tienes reservaciones próximas</h3>
              <p className="font-body text-sm text-[#5A4840] max-w-md">Aparta una mesa para desayunar chilaquiles con boneless o disfrutar una tarde de juegos de mesa en Durango.</p>
              <button
                className="mt-2 px-7 py-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:bg-[#C81E1C] active:scale-95 transition-all duration-200 cursor-pointer"
                onClick={onNewReservation}
              >
                Reservar mesa ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proximas.map((res) => (
                <article
                  key={res.id}
                  className="bg-white rounded-lg border-2 border-stone-300 p-6 flex flex-col gap-4 shadow-md hover:shadow-2xl hover:border-[#E12927] transition-all duration-300"
                >
                  <div className="flex items-center justify-between pb-3 border-b-2 border-stone-200">
                    <span className="font-mono text-xs font-bold text-[#E12927] tracking-wider uppercase">
                      FOLIO: {res.id}
                    </span>
                    <span className="px-3.5 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border-2 border-emerald-300 shadow-xs">
                      ● {res.estado}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#1F1410] leading-snug">
                    {res.tipo}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 p-4 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 text-xs font-body shadow-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-[#E12927]" />
                      <span className="font-mono font-bold text-[#1F1410]">{res.fecha}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[#E12927]" />
                      <span className="font-mono font-bold text-[#1F1410]">{res.hora}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-[#E12927]" />
                      <span className="text-[#1F1410] font-semibold truncate">{res.sucursalNombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-[#E12927]" />
                      <span className="text-[#1F1410] font-semibold">{res.personas} comensales</span>
                    </div>
                  </div>

                  {res.notas && (
                    <div className="p-3.5 rounded-md bg-[#FCEAE9] text-xs font-body text-[#1F1410] border-l-4 border-l-[#E12927] border-2 border-[#E12927]/30 font-medium">
                      <strong>Nota especial:</strong> {res.notas}
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-stone-200">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        sounds.playClick();
                        setSelectedQRReservation(res);
                      }}
                    >
                      <QrCode size={15} />
                      <span>Ver pase QR</span>
                    </button>

                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border-2 border-stone-300 hover:border-red-400 font-mono text-xs font-bold text-stone-600 hover:text-[#E12927] shadow-xs transition-all cursor-pointer"
                      onClick={() => handleOpenCancelModal(res)}
                    >
                      <XCircle size={15} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historial HeroUI Cards */}
      {activeTab === 'historial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90">
          {historial.map((res) => (
            <article
              key={res.id}
              className="bg-white rounded-lg border-2 border-stone-300 p-6 flex flex-col gap-3 shadow-md"
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-stone-200">
                <span className="font-mono text-xs text-[#8E7A74] font-semibold">FOLIO: {res.id}</span>
                <span className="px-3 py-1 rounded-sm font-mono text-[10px] font-bold uppercase bg-stone-100 text-stone-600 border-2 border-stone-300">
                  {res.estado}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#1F1410]">{res.tipo}</h3>
              <div className="text-xs font-body text-[#1F1410] font-medium flex flex-wrap gap-x-4 gap-y-1">
                <span>📅 {res.fecha}</span>
                <span>⏰ {res.hora}</span>
                <span>📍 {res.sucursalNombre}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal QR */}
      {selectedQRReservation && (
        <QRModal
          isOpen={!!selectedQRReservation}
          onClose={() => setSelectedQRReservation(null)}
          titulo={`Pase de Reservación: ${selectedQRReservation.tipo}`}
          subtitulo={`${selectedQRReservation.sucursalNombre} · ${selectedQRReservation.fecha} a las ${selectedQRReservation.hora}`}
          codigo={selectedQRReservation.qrCode || `MF-RES-${selectedQRReservation.id}`}
          vigencia={`Válido para ${selectedQRReservation.personas} personas`}
          instruccion="Muestra este código al host en la entrada para asignarte tu mesa directamente."
        />
      )}

      {/* Modal de Cancelación */}
      {reservationToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full p-6 sm:p-8 flex flex-col items-center text-center gap-4 shadow-2xl border-2 border-stone-400 animate-mh-rise">
            <div className="w-14 h-14 rounded-md bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shadow-xs border-2 border-[#E12927]/40">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#1F1410]">¿Cancelar esta reservación?</h3>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] font-medium">
              ¿Estás seguro de cancelar tu visita para <strong>{reservationToCancel.tipo}</strong> el {reservationToCancel.fecha}? Liberaremos tu mesa para otros comensales de Durango.
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                className="flex-1 py-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#1F1410] bg-white text-[#1F1410] hover:bg-stone-100 active:scale-95 transition-all cursor-pointer shadow-xs"
                onClick={() => setReservationToCancel(null)}
              >
                Mantener mesa
              </button>
              <button
                className="flex-1 py-3 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 transition-all cursor-pointer"
                onClick={handleConfirmCancel}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
