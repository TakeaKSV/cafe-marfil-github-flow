import React, { useState } from 'react';
import { 
  CalendarDays, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  QrCode, 
  Plus, 
  Eye, 
  Filter,
  X,
  FileCheck,
  Check
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const ReservationsModule = ({ 
  reservaciones, 
  onUpdateReservacion, 
  onAddReservacion,
  mesas,
  sucursales,
  selectedSucursal,
  soundEnabled 
}) => {
  const [filterEstado, setFilterEstado] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingQRModal, setViewingQRModal] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulario de nueva reserva
  const [newRes, setNewRes] = useState({
    comensal: '',
    telefono: '',
    email: '',
    sucursalId: selectedSucursal === 'todas' ? 'porras-matriz' : selectedSucursal,
    hora: '11:00 AM',
    fecha: 'Hoy (02 Oct 2026)',
    personas: 2,
    mesaAsignada: 'M03',
    tipo: 'brunch',
    notas: ''
  });

  // Filtrado por sucursal y estado
  const filtered = reservaciones.filter(r => {
    const matchesBranch = selectedSucursal === 'todas' || r.sucursalId === selectedSucursal;
    const matchesStatus = filterEstado === 'todas' || r.estado === filterEstado;
    const matchesSearch = searchTerm === '' ||
      r.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comensal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono.includes(searchTerm);
    return matchesBranch && matchesStatus && matchesSearch;
  });

  const handleStatusChange = (folio, nuevoEstado) => {
    const res = reservaciones.find(r => r.folio === folio);
    if (!res) return;

    const updated = { ...res, estado: nuevoEstado };
    onUpdateReservacion(updated);

    if (nuevoEstado === 'en_curso') {
      if (soundEnabled) playSound('checkin');
    } else if (nuevoEstado === 'no_show' || nuevoEstado === 'cancelada') {
      if (soundEnabled) playSound('alert');
    } else {
      if (soundEnabled) playSound('success');
    }
  };

  const handleCreateReservation = (e) => {
    e.preventDefault();
    if (!newRes.comensal.trim()) return;

    const randomFolio = `MF-RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const sucursalObj = sucursales.find(s => s.id === newRes.sucursalId) || sucursales[0];

    const creada = {
      folio: randomFolio,
      comensal: newRes.comensal,
      telefono: newRes.telefono || '618-000-0000',
      email: newRes.email || 'cliente@marfil.mx',
      sucursalId: newRes.sucursalId,
      sucursalNombre: sucursalObj.nombre,
      fecha: newRes.fecha,
      hora: newRes.hora,
      personas: Number(newRes.personas),
      mesaAsignada: newRes.mesaAsignada || 'M03',
      tipo: newRes.tipo,
      tipoNombre: newRes.tipo === 'juegos' ? 'Tarde de Juegos con Anfitrión' : 'Desayuno & Brunch',
      estado: 'confirmada',
      notas: newRes.notas || 'Reserva tomada vía Host Desk.',
      tokenQR: `QR-${randomFolio}-AUTH`,
      totalEstimado: `$${Number(newRes.personas) * 180} MXN`
    };

    onAddReservacion(creada);
    if (soundEnabled) playSound('success');
    setShowNewModal(false);
    setNewRes({
      comensal: '',
      telefono: '',
      email: '',
      sucursalId: 'porras-matriz',
      hora: '11:00 AM',
      fecha: 'Hoy (02 Oct 2026)',
      personas: 2,
      mesaAsignada: 'M03',
      tipo: 'brunch',
      notas: ''
    });
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'confirmada':
        return { label: 'Confirmada', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'en_curso':
        return { label: 'En Sala (Check-in)', bg: 'bg-[#FCEAE9] text-[#E12927] border-[#E12927]/40' };
      case 'asistida':
        return { label: 'Concluida', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'no_show':
        return { label: 'No-Show (Sin Asistencia)', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'cancelada':
        return { label: 'Cancelada', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
      default:
        return { label: estado, bg: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* Header del Módulo */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Gestión de Reservas & Check-in
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Recepción de comensales, control de tolerancia (15 min) y folios con código QR
          </p>
        </div>

        <button
          onClick={() => {
            if (soundEnabled) playSound('toggle');
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nueva Reservación Telefónica / Manual
        </button>
      </div>

      {/* Filtros de Estado y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todas', label: 'Todas las Reservas' },
            { id: 'confirmada', label: 'Confirmadas' },
            { id: 'en_curso', label: 'En Sala' },
            { id: 'asistida', label: 'Concluidas' },
            { id: 'no_show', label: 'No-Show' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterEstado(tab.id);
                if (soundEnabled) playSound('toggle');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                filterEstado === tab.id
                  ? 'bg-[#1F1410] border-[#1F1410] text-white'
                  : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#1F1410]/40" />
          <input
            type="text"
            placeholder="Buscar por folio (MF-RES-...), comensal o cel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#1F1410]/15 rounded-md focus:outline-hidden focus:border-[#E12927] font-body"
          />
        </div>

      </div>

      {/* Tabla de Reservaciones */}
      <div className="bg-white border border-[#1F1410]/10 rounded-md overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F5] border-b border-[#1F1410]/10 text-[#1F1410]/70 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Folio / Código</th>
                <th className="py-3 px-4">Comensal & Contacto</th>
                <th className="py-3 px-4">Horario & Sucursal</th>
                <th className="py-3 px-4 text-center">Personas / Mesa</th>
                <th className="py-3 px-4">Experiencia</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones Host</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1410]/10 font-body">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#1F1410]/50 font-mono">
                    No se encontraron reservaciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(r => {
                  const badge = getStatusBadge(r.estado);

                  return (
                    <tr key={r.folio} className="hover:bg-[#FAF7F5] transition-colors">
                      
                      {/* Folio */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-[#1F1410] block">{r.folio}</span>
                        <button
                          onClick={() => setViewingQRModal(r)}
                          className="text-[11px] text-[#E12927] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" /> Ver Pase QR
                        </button>
                      </td>

                      {/* Comensal */}
                      <td className="py-3.5 px-4">
                        <strong className="text-sm text-[#1F1410] block">{r.comensal}</strong>
                        <div className="flex items-center gap-2 text-[11px] text-[#1F1410]/60 font-mono mt-0.5">
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {r.telefono}</span>
                        </div>
                      </td>

                      {/* Horario */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-xs text-[#1F1410]">{r.hora}</div>
                        <div className="text-[11px] text-[#1F1410]/60">{r.fecha}</div>
                        <div className="text-[10px] text-[#E12927] font-semibold">{r.sucursalNombre.split(' ')[1] || r.sucursalNombre}</div>
                      </td>

                      {/* Personas / Mesa */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-xs bg-[#FAF7F5] border border-[#1F1410]/15 px-2 py-0.5 rounded-xs inline-block">
                          {r.personas} pax
                        </span>
                        <div className="text-[11px] text-[#1F1410]/60 mt-0.5">
                          Mesa: <strong>{r.mesaAsignada || 'Sin asignar'}</strong>
                        </div>
                      </td>

                      {/* Tipo & Notas */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-xs text-[#1F1410] block">{r.tipoNombre}</span>
                        {r.notas && (
                          <span className="text-[11px] text-[#1F1410]/60 line-clamp-1 italic">
                            "{r.notas}"
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-mono font-bold rounded-xs border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 font-mono">
                          {r.estado === 'confirmada' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(r.folio, 'en_curso')}
                                className="px-2.5 py-1 bg-[#E12927] hover:bg-[#b51c1a] text-white rounded-xs font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Check-in Comensal en Sala"
                              >
                                <Check className="w-3 h-3" /> Check-in
                              </button>
                              <button
                                onClick={() => handleStatusChange(r.folio, 'no_show')}
                                className="px-2 py-1 bg-gray-100 hover:bg-rose-100 text-rose-800 rounded-xs font-bold text-[11px] border border-gray-300 cursor-pointer"
                                title="Marcar No-Show (Excedió 15 min de tolerancia)"
                              >
                                No-Show
                              </button>
                            </>
                          )}

                          {r.estado === 'en_curso' && (
                            <button
                              onClick={() => handleStatusChange(r.folio, 'asistida')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs font-bold text-[11px] cursor-pointer"
                            >
                              Finalizar Servicio
                            </button>
                          )}

                          {r.estado === 'asistida' && (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completada
                            </span>
                          )}

                          {r.estado === 'no_show' && (
                            <button
                              onClick={() => handleStatusChange(r.folio, 'confirmada')}
                              className="text-[10px] text-[#1F1410]/60 hover:underline cursor-pointer"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Pase QR de Reservación */}
      {viewingQRModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#1F1410]/20 max-w-sm w-full p-6 shadow-2xl animate-menu-in text-center">
            
            <div className="flex justify-end">
              <button onClick={() => setViewingQRModal(null)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-16 h-16 bg-[#FCEAE9] text-[#E12927] rounded-full mx-auto flex items-center justify-center mb-3">
              <QrCode className="w-8 h-8" />
            </div>

            <h3 className="font-display font-bold text-xl text-[#1F1410]">
              Pase Digital de Acceso
            </h3>
            <p className="text-xs text-[#1F1410]/60 font-body mb-4">
              Presentar en recepción de Café Marfil Durango
            </p>

            {/* Código QR Simulado de Alta Fidelidad */}
            <div className="p-4 bg-white border-2 border-dashed border-[#1F1410]/20 rounded-md inline-block mb-4">
              <div className="w-40 h-40 bg-[#1F1410] p-2 flex flex-col justify-between rounded-xs mx-auto">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-white bg-[#1F1410] flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                  <div className="w-10 h-10 border-4 border-white bg-[#1F1410] flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                </div>
                <div className="text-center text-white font-mono text-[10px] tracking-widest font-bold">
                  MARFIL QR
                </div>
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-white bg-[#1F1410] flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                  <div className="w-6 h-6 bg-[#E12927] rounded-xs self-end" />
                </div>
              </div>
              <div className="font-mono font-bold text-xs text-[#1F1410] mt-2">
                {viewingQRModal.folio}
              </div>
            </div>

            <div className="text-xs text-left bg-[#FAF7F5] p-3 rounded-sm border border-[#1F1410]/10 space-y-1 mb-4 font-mono">
              <div><strong>Comensal:</strong> {viewingQRModal.comensal} ({viewingQRModal.personas} pax)</div>
              <div><strong>Horario:</strong> {viewingQRModal.hora} · {viewingQRModal.fecha}</div>
              <div><strong>Mesa sugerida:</strong> {viewingQRModal.mesaAsignada}</div>
              <div><strong>Sucursal:</strong> {viewingQRModal.sucursalNombre}</div>
            </div>

            <button
              onClick={() => {
                handleStatusChange(viewingQRModal.folio, 'en_curso');
                setViewingQRModal(null);
              }}
              className="w-full py-2.5 bg-[#E12927] hover:bg-[#b51c1a] text-white font-mono font-bold text-xs rounded-xs shadow-xs cursor-pointer"
            >
              Hacer Check-In Inmediato
            </button>
          </div>
        </div>
      )}

      {/* Modal: Nueva Reservación Manual */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#1F1410]/20 max-w-lg w-full p-6 shadow-2xl animate-menu-in">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10 mb-4">
              <h3 className="font-display font-bold text-lg text-[#1F1410]">
                Registrar Reservación (Host Desk)
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Nombre Completo del Comensal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Laura Zambrano"
                    value={newRes.comensal}
                    onChange={(e) => setNewRes({ ...newRes, comensal: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Teléfono WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 618-123-4567"
                    value={newRes.telefono}
                    onChange={(e) => setNewRes({ ...newRes, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Sucursal
                  </label>
                  <select
                    value={newRes.sucursalId}
                    onChange={(e) => setNewRes({ ...newRes, sucursalId: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden bg-white"
                  >
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Hora
                  </label>
                  <select
                    value={newRes.hora}
                    onChange={(e) => setNewRes({ ...newRes, hora: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden bg-white font-mono"
                  >
                    <option value="09:00 AM">09:00 AM (Desayuno)</option>
                    <option value="10:30 AM">10:30 AM (Brunch)</option>
                    <option value="11:30 AM">11:30 AM (Brunch)</option>
                    <option value="01:30 PM">01:30 PM (Comida)</option>
                    <option value="05:00 PM">05:00 PM (Tarde)</option>
                    <option value="07:00 PM">07:00 PM (Noche / Juegos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Comensales (Pax)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newRes.personas}
                    onChange={(e) => setNewRes({ ...newRes, personas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                  Notas Especiales / Solicitudes
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej. Cumpleaños, requieren sillita periquera, mesa cerca de juegos..."
                  value={newRes.notas}
                  onChange={(e) => setNewRes({ ...newRes, notas: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xs focus:border-[#E12927] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-[#1F1410]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#1F1410]/70 hover:text-[#1F1410] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-xs shadow-xs cursor-pointer font-mono"
                >
                  Generar Folio & Confirmar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
