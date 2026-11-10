import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Sliders, 
  BellRing, 
  CheckCircle2, 
  Phone, 
  UserPlus, 
  X,
  AlertCircle
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const StaffSettingsModule = ({ 
  staff, 
  sucursales, 
  onUpdateSucursal, 
  soundEnabled 
}) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcastSent(true);
    if (soundEnabled) playSound('alert');
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Personal en Turno & Parámetros Operativos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Roles operativos (Hostess, Baristas, Cocineros, Anfitriones de Ludoteca) y límites de aforo por sucursal
          </p>
        </div>

        <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-mono font-bold rounded-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          Turno Matutino / Desayunos Activo
        </div>
      </div>

      {/* Grid: Personal en Piso y Configuración de Aforos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Plantilla Activa en Turno */}
        <div className="lg:col-span-7 bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10">
            <h2 className="font-display font-bold text-base text-[#1F1410]">
              Equipo en Servicio Hoy
            </h2>
            <span className="text-xs font-mono text-[#1F1410]/60">
              6 Colaboradores en Planta
            </span>
          </div>

          <div className="divide-y divide-[#1F1410]/10">
            {staff.map((person, idx) => (
              <div 
                key={person.id} 
                style={{ animationDelay: `${idx * 45}ms` }}
                className="py-3 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-[#FAF7F5] transition-all hover-lift-sm animate-fade-up"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F5] border border-[#1F1410]/15 flex items-center justify-center font-mono font-bold text-xs text-[#E12927] shadow-2xs">
                    {person.nombre.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#1F1410]">
                      {person.nombre}
                    </h3>
                    <p className="text-xs text-[#1F1410]/60 font-mono">
                      {person.rol} · {person.sucursal}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                    EN TURNO
                  </span>
                  <div className="text-[11px] text-[#1F1410]/60 mt-0.5">
                    {person.turno}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Parámetros de Aforo y Emisión de Alertas a Comandera */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sucursales y Aforos Máximos */}
          <div className="bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-[#1F1410] pb-2 border-b border-[#1F1410]/10">
              Aforos & Tolerancia de Reserva
            </h2>

            <div className="space-y-3 font-mono text-xs">
              {sucursales.map(s => (
                <div key={s.id} className="p-3 bg-[#FAF7F5] border border-[#1F1410]/10 rounded-xs flex items-center justify-between">
                  <div>
                    <strong className="text-[#1F1410] block font-body text-xs font-semibold">{s.nombre}</strong>
                    <span className="text-[#1F1410]/60 text-[11px]">Tolerancia no-show: 15 min</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#E12927] font-bold">{s.aforoMax} comensales</span>
                    <span className="text-[10px] text-[#1F1410]/50 block">Capacidad máxima</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difusión Rápida a Comandera / Host Tablets */}
          <div className="bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#E12927]" />
              <h2 className="font-display font-bold text-base text-[#1F1410]">
                Aviso a Terminales en Sucursales
              </h2>
            </div>
            <p className="text-xs text-[#1F1410]/60 font-body">
              Envía un anuncio inmediato a las pantallas de comandera, recepción y cocina en piso.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-2">
              <input
                type="text"
                placeholder="Ej. Cambio de turno de barra a las 15:30. Preparar insumos..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden"
              />

              <button
                type="submit"
                className="w-full py-2 bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold rounded-xs cursor-pointer transition-colors"
              >
                Transmitir Alerta a Sala
              </button>
            </form>

            {broadcastSent && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xs text-xs text-emerald-800 font-mono flex items-center gap-1.5 animate-menu-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Mensaje transmitido a las 2 sucursales de Durango.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
