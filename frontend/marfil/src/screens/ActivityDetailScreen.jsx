import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  CalendarPlus,
  Compass,
  Sparkles,
  CheckCircle2,
  Users
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ActivityDetailScreen({ activity, onBack, onBookActivity }) {
  if (!activity) return null;

  const isFull = activity.lugaresDisponibles <= 0;
  const percentOccupied = Math.round((activity.lugaresOcupados / activity.cupoTotal) * 100);

  const handleBook = () => {
    sounds.playClick();
    onBookActivity(activity);
  };

  return (
    <div className="flex flex-col gap-6 fade-in pb-16">
      {/* Botón Volver */}
      <button
        className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#8E7A74] hover:text-[#E12927] transition-colors cursor-pointer self-start"
        onClick={() => {
          sounds.playClick();
          onBack();
        }}
      >
        <ArrowLeft size={16} />
        <span>VOLVER A ACTIVIDADES</span>
      </button>

      {/* Grid Principal HeroUI Layout 100% Sólido */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-8 items-start">
        {/* Columna Izquierda: Imagen y Datos Rápidos */}
        <div className="flex flex-col gap-5">
          <div className="relative rounded-lg overflow-hidden bg-stone-100 shadow-md border-2 border-stone-300 aspect-4/3">
            <img src={activity.imagen} alt={activity.nombre} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="px-4 py-1.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider bg-[#1F1410] text-white shadow-md">
                {activity.categoria}
              </span>
              <span className="px-4 py-1.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] text-white shadow-md border border-[#E12927]">
                {activity.precio}
              </span>
            </div>
          </div>

          {/* Tarjeta de Disponibilidad de Cupo */}
          <div className="bg-white rounded-lg border-2 border-stone-300 p-6 shadow-md flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="block font-mono text-[11px] font-bold text-[#8E7A74] uppercase tracking-wider">DISPONIBILIDAD EN SALA</span>
                <h4 className="font-display text-lg font-bold text-[#1F1410] mt-0.5">
                  {isFull ? 'Cupo agotado' : `Quedan ${activity.lugaresDisponibles} de ${activity.cupoTotal} lugares`}
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-[#E12927]">{percentOccupied}% ocupado</span>
            </div>

            <div className="w-full h-3 rounded-sm bg-stone-200 overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-500 ${percentOccupied > 85 ? 'bg-[#E12927]' : 'bg-emerald-500'
                  }`}
                style={{ width: `${percentOccupied}%` }}
              />
            </div>
            <p className="font-body text-xs text-[#8E7A74] m-0 font-medium">
              * El cupo se garantiza al instante al confirmar tu reservación con nuestros anfitriones.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Información Editorial */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#E12927] tracking-wider uppercase mb-1">
              <MapPin size={14} />
              <span>{activity.sucursalNombre}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight leading-tight">
              {activity.nombre}
            </h1>
          </div>

          {/* Meta Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-md bg-white border-2 border-stone-300 flex items-center gap-3 shadow-xs">
              <Calendar size={18} className="text-[#E12927] shrink-0" />
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">FECHA</span>
                <strong className="font-mono text-xs text-[#1F1410]">{activity.fecha}</strong>
              </div>
            </div>

            <div className="p-4 rounded-md bg-white border-2 border-stone-300 flex items-center gap-3 shadow-xs">
              <Clock size={18} className="text-[#E12927] shrink-0" />
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">HORARIO</span>
                <strong className="font-mono text-xs text-[#1F1410]">{activity.hora}</strong>
              </div>
            </div>

            <div className="p-4 rounded-md bg-white border-2 border-stone-300 flex items-center gap-3 shadow-xs">
              <Users size={18} className="text-[#E12927] shrink-0" />
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">DURACIÓN</span>
                <strong className="font-body text-xs text-[#1F1410] font-semibold">{activity.duracion}</strong>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-bold text-[#1F1410]">Sobre esta experiencia</h3>
            <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
              {activity.descripcionCompleta}
            </p>
          </div>

          {/* CTA Box HeroUI Banner 100% Sólido */}
          <div className="p-6 sm:p-7 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="block font-mono text-[11px] font-bold text-[#8E7A74] uppercase tracking-wider">CUPO LIMITADO</span>
              <div className="font-mono text-2xl font-bold text-[#E12927]">{activity.precio}</div>
            </div>

            <button
              disabled={isFull}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider shadow-lg transition-all duration-200 cursor-pointer ${isFull
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-[#E12927]/30 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              onClick={handleBook}
            >
              <CalendarPlus size={16} />
              <span>{isFull ? 'Cupo lleno' : 'Apartar mis lugares'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
