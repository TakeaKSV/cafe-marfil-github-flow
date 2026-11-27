import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X, Store, Users, Coffee, Dice5 } from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { reglas, sanitizar } from '../utils/validacion';

export const WalkInModal = ({ 
  isOpen, 
  onClose, 
  mesas, 
  onAssignWalkIn, 
  selectedSucursal,
  soundEnabled,
  mesaInicial = null
}) => {
  // Filtrar mesas libres de la sucursal activa
  const branchMesas = selectedSucursal === 'todas' 
    ? mesas 
    : mesas.filter(m => m.sucursalId === selectedSucursal);

  const availableMesas = branchMesas.filter(m => m.estado === 'libre');

  const [mesaId, setMesaId] = useState(availableMesas[0]?.id || '');
  const [comensal, setComensal] = useState('');
  const [personas, setPersonas] = useState(2);
  const [tipo, setTipo] = useState('brunch');
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});

  const mesaSeleccionada = availableMesas.find((m) => String(m.id) === String(mesaId)) || availableMesas[0] || null;
  const maxCapacidad = mesaSeleccionada?.capacidad || 12;

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Si el modal se abre desde una mesa del plano, esa mesa queda preseleccionada.
  useEffect(() => {
    if (isOpen && mesaInicial) setMesaId(mesaInicial);
  }, [isOpen, mesaInicial]);

  // Actualizar mesa seleccionada si cambian disponibles
  useEffect(() => {
    if (availableMesas.length > 0 && !mesaId) {
      setMesaId(availableMesas[0].id);
    }
  }, [availableMesas, mesaId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {
      mesaId: reglas.requerido(mesaId, 'Selecciona una mesa libre.'),
      comensal: reglas.nombrePersona(comensal, { opcional: true }),
      personas: reglas.entero(personas, {
        min: 1,
        max: maxCapacidad,
        etiqueta: 'El número de personas'
      }),
      notas: reglas.texto(notas, { max: 300, opcional: true, etiqueta: 'Las notas' })
    };
    const hayError = Object.values(errs).some(Boolean);
    setErrores(errs);
    if (hayError) {
      if (soundEnabled) playSound('alert');
      return;
    }

    onAssignWalkIn({
      mesaId,
      comensal: comensal.trim() || 'Comensal Walk-in',
      personas: Number(personas),
      tipo,
      notas: notas.trim() || 'Comensal presencial sin reserva previa.'
    });

    if (soundEnabled) playSound('coin');
    setErrores({});
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[28px] border border-[#1F1410]/10 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] max-w-lg w-full p-5 sm:p-6 animate-modal-card relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shadow-xs shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-[#1F1410] leading-snug">
                Asignar Mesa Walk-in Inmediata
              </h3>
              <p className="text-xs text-[#1F1410]/50 font-body">
                Registro rápido para comensales en puerta sin reservación
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {availableMesas.length === 0 ? (
          <div className="py-8 text-center space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <p className="font-bold mb-1">¡Salón lleno!</p>
              <p>No hay mesas libres disponibles en esta sucursal en este momento. Revisa el plano para liberar mesas en limpieza.</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1F1410] text-white text-xs font-bold rounded-full cursor-pointer hover:bg-black transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 font-body">
            
            {/* Selección de Mesa */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Seleccionar Mesa Disponible *
              </label>
              <select
                value={mesaId}
                onChange={(e) => {
                  setMesaId(e.target.value);
                  setErrores((p) => ({ ...p, mesaId: null, personas: null }));
                }}
                aria-invalid={Boolean(errores.mesaId)}
                className="w-full px-4 py-3 text-xs sm:text-sm border border-[#1F1410]/15 rounded-2xl focus:border-[#E12927] focus:ring-2 focus:ring-[#E12927]/20 focus:outline-hidden bg-[#FAF7F5] font-mono cursor-pointer transition-all"
              >
                {availableMesas.map(m => (
                  <option key={m.id} value={m.id}>
                    Mesa {m.numero} · {m.zona} (Capacidad: {m.capacidad} personas)
                  </option>
                ))}
              </select>
              {errores.mesaId && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{errores.mesaId}</p>}
            </div>

            {/* Comensal y Personas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Nombre del Comensal
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Ej. Roberto Sánchez"
                  value={comensal}
                  onChange={(e) => {
                    setComensal(sanitizar.nombrePersona(e.target.value, 80));
                    setErrores((p) => ({ ...p, comensal: null }));
                  }}
                  aria-invalid={Boolean(errores.comensal)}
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm border rounded-2xl focus:ring-2 focus:outline-hidden bg-[#FAF7F5] transition-all ${
                    errores.comensal ? 'border-[#E12927] focus:border-[#E12927] focus:ring-[#E12927]/20' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]/20'
                  }`}
                />
                {errores.comensal && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{errores.comensal}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Número de Personas (máx. {maxCapacidad}) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={personas}
                  onChange={(e) => {
                    setPersonas(sanitizar.entero(e.target.value, maxCapacidad));
                    setErrores((p) => ({ ...p, personas: null }));
                  }}
                  aria-invalid={Boolean(errores.personas)}
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm border rounded-2xl focus:ring-2 focus:outline-hidden bg-[#FAF7F5] font-mono transition-all ${
                    errores.personas ? 'border-[#E12927] focus:border-[#E12927] focus:ring-[#E12927]/20' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]/20'
                  }`}
                />
                {errores.personas && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{errores.personas}</p>}
              </div>
            </div>

            {/* Experiencia / Destino */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Experiencia / Destino
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm border border-[#1F1410]/15 rounded-2xl focus:border-[#E12927] focus:ring-2 focus:ring-[#E12927]/20 focus:outline-hidden bg-[#FAF7F5] cursor-pointer transition-all"
              >
                <option value="brunch">Brunch & Desayuno All-Day</option>
                <option value="juegos">Ludoteca & Juegos de Mesa (+60 Títulos)</option>
                <option value="cafe">Barra de Especialidad / Café de Origen</option>
                <option value="tragos">Tardes, Tragos & Mezcal de Nombre de Dios</option>
              </select>
            </div>

            {/* Notas del Servicio */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Notas del Servicio (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Piden carta física, van a pedir chilaquiles con boneless..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-2xl focus:border-[#E12927] focus:ring-2 focus:ring-[#E12927]/20 focus:outline-hidden bg-[#FAF7F5] transition-all"
              />
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-[#1F1410]/8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] rounded-full transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-semibold rounded-full cursor-pointer shadow-md shadow-[#E12927]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Asignar & Ocupar Mesa
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WalkInModal;
