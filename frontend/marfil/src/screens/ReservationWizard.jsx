import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ReservationWizard({
  sucursales,
  actividades,
  initialData,
  onCancel,
  onCompleteReservation
}) {
  // Paso actual (1 a 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Estado del formulario
  const [reservaTipo, setReservaTipo] = useState(initialData?.tipo || 'mesa');
  const [selectedActividadId, setSelectedActividadId] = useState(initialData?.actividadId || '');
  const [selectedSucursalId, setSelectedSucursalId] = useState(initialData?.sucursalId || 'centro-historico');
  const [selectedDate, setSelectedDate] = useState('2026-10-02');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [personas, setPersonas] = useState(initialData?.personas || 2);
  const [nombre, setNombre] = useState('Sofía Navarro Morales');
  const [telefono, setTelefono] = useState('(618) 154-8920');
  const [correo, setCorreo] = useState('sofia.navarro@gmail.com');
  const [notas, setNotas] = useState('');
  const [validationError, setValidationError] = useState('');

  // Preselección si viene de actividad o sucursal
  useEffect(() => {
    if (initialData?.actividad) {
      setReservaTipo('actividad');
      setSelectedActividadId(initialData.actividad.id);
      setSelectedSucursalId(initialData.actividad.sucursalId);
      if (initialData.actividad.fechaISO) setSelectedDate(initialData.actividad.fechaISO);
      setCurrentStep(3);
    } else if (initialData?.sucursalId) {
      setSelectedSucursalId(initialData.sucursalId);
    }
  }, [initialData]);

  const tiposReserva = [
    {
      id: 'mesa',
      titulo: 'Mesa Cafetería & Desayunos',
      descripcion: 'Para disfrutar de chilaquiles con boneless, mollete Mamut y barra de espresso.'
    },
    {
      id: 'juegos',
      titulo: 'Mesa con Juegos de Mesa (+60 Títulos)',
      descripcion: 'Incluye ludoteca completa, dados y anfitrión que explica las reglas paso a paso.'
    },
    {
      id: 'actividad',
      titulo: 'Lugar en Actividad Programada',
      descripcion: 'Reserva para torneos de ajedrez o Catan, noches de jazz con mezcal o talleres de cata.'
    },
    {
      id: 'evento',
      titulo: 'Reunión Privada / Cowork Grupal',
      descripcion: 'Espacio acondicionado para grupos, cumpleaños o sesiones de trabajo con café ilimitado.'
    }
  ];

  const horariosDisponibles = [
    { hora: '08:30 AM', turno: 'Desayunos' },
    { hora: '09:30 AM', turno: 'Desayunos' },
    { hora: '10:30 AM', turno: 'Desayunos' },
    { hora: '11:00 AM', turno: 'Brunch' },
    { hora: '12:00 PM', turno: 'Brunch' },
    { hora: '01:30 PM', turno: 'Comida' },
    { hora: '03:00 PM', turno: 'Tarde' },
    { hora: '04:30 PM', turno: 'Café & Frappés' },
    { hora: '06:00 PM', turno: 'Tarde de Juegos' },
    { hora: '07:30 PM', turno: 'Cena & Mezcal' },
    { hora: '08:30 PM', turno: 'Noche de Sala' }
  ];

  const fechasSugeridas = [
    { label: 'Hoy', dia: 'Jueves 1 Oct', iso: '2026-10-01' },
    { label: 'Mañana', dia: 'Viernes 2 Oct', iso: '2026-10-02' },
    { label: 'Fin de Semana', dia: 'Sábado 3 Oct', iso: '2026-10-03' },
    { label: 'Domingo Brunch', dia: 'Domingo 4 Oct', iso: '2026-10-04' }
  ];

  const sucursalObj = sucursales.find((s) => s.id === selectedSucursalId) || sucursales[0];
  const actividadObj = actividades.find((a) => a.id === selectedActividadId);

  const handleNext = () => {
    sounds.playClick();
    setValidationError('');

    if (currentStep === 1) {
      if (reservaTipo === 'actividad' && !selectedActividadId) {
        setValidationError('Por favor selecciona la actividad a la que deseas asistir.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedSucursalId) {
        setValidationError('Por favor selecciona una sucursal.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedDate) {
        setValidationError('Por favor selecciona una fecha.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!selectedTime) {
        setValidationError('Por favor selecciona un horario disponible.');
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (!nombre.trim() || !telefono.trim()) {
        setValidationError('Por favor completa tu nombre y teléfono de contacto.');
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      const nuevaReserva = {
        id: `MF-${Math.floor(1000 + Math.random() * 9000)}`,
        tipo:
          reservaTipo === 'actividad' && actividadObj
            ? `Actividad: ${actividadObj.nombre}`
            : tiposReserva.find((t) => t.id === reservaTipo)?.titulo || 'Mesa Cafetería & Desayunos',
        sucursalId: selectedSucursalId,
        sucursalNombre: sucursalObj.nombre,
        fecha: selectedDate,
        fechaISO: selectedDate,
        hora: selectedTime,
        personas: personas,
        nombreCliente: nombre,
        telefonoCliente: telefono,
        correoCliente: correo,
        notas: notas,
        estado: 'Confirmada',
        qrCode: `MF-${Date.now()}-CONFIRMED`,
        esHistorica: false
      };
      onCompleteReservation(nuevaReserva);
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    setValidationError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full fade-in pb-16">
      {/* Botón salir / volver */}
      <button
        className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#8E7A74] hover:text-[#E12927] transition-colors cursor-pointer self-start"
        onClick={handlePrev}
      >
        <ArrowLeft size={16} />
        <span>{currentStep === 1 ? 'CANCELAR Y SALIR' : 'PASO ANTERIOR'}</span>
      </button>

      {/* Indicador de Progreso HeroUI Step Bar 100% Sólido */}
      <div className="bg-[#FCEAE9] rounded-lg border-2 border-[#E12927]/30 p-5 sm:p-6 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between font-mono text-xs font-bold">
          <span className="text-[#E12927]">PASO {currentStep} DE 6</span>
          <span className="text-[#1F1410]">
            {currentStep === 1 && '¿Qué experiencia deseas reservar?'}
            {currentStep === 2 && 'Seleccionar sucursal'}
            {currentStep === 3 && 'Fecha y comensales'}
            {currentStep === 4 && 'Horario preferido'}
            {currentStep === 5 && 'Información de contacto'}
            {currentStep === 6 && 'Confirmar reservación'}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2.5 rounded-sm transition-all duration-300 ${
                stepNum <= currentStep ? 'bg-[#E12927]' : 'bg-stone-300'
              }`}
            />
          ))}
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2.5 p-4 rounded-md bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs sm:text-sm font-body shadow-xs">
          <AlertCircle size={18} className="text-[#E12927] shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* ====================================================================
          PASO 1: ¿QUÉ QUIERES RESERVAR?
          ==================================================================== */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">¿Qué te gustaría reservar?</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Selecciona tu experiencia de cafetería, ludoteca guiada o reunión especial en Café Marfil Durango.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiposReserva.map((tipo) => {
              const isSelected = reservaTipo === tipo.id;
              return (
                <div
                  key={tipo.id}
                  className={`p-5 rounded-lg border-2 transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-white border-[#E12927] ring-2 ring-[#E12927]/20 shadow-xl -translate-y-1'
                      : 'bg-white border-stone-300 hover:border-[#E12927] shadow-sm'
                  }`}
                  onClick={() => {
                    sounds.playClick();
                    setReservaTipo(tipo.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#1F1410]">{tipo.titulo}</h3>
                    <div
                      className={`w-5 h-5 rounded-xs border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#E12927] bg-[#E12927]' : 'border-stone-400'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-xs bg-white" />}
                    </div>
                  </div>
                  <p className="font-body text-xs text-[#5A4840] leading-relaxed font-medium">{tipo.descripcion}</p>
                </div>
              );
            })}
          </div>

          {reservaTipo === 'actividad' && (
            <div className="p-5 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-3 shadow-md">
              <label className="font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider">
                SELECCIONA LA EXPERIENCIA PROGRAMADA:
              </label>
              <select
                className="w-full p-3.5 rounded-md border-2 border-stone-300 bg-white text-xs sm:text-sm font-body text-[#1F1410] font-medium focus:outline-none focus:border-[#E12927]"
                value={selectedActividadId}
                onChange={(e) => {
                  setSelectedActividadId(e.target.value);
                  const act = actividades.find((a) => a.id === e.target.value);
                  if (act) {
                    setSelectedSucursalId(act.sucursalId);
                    if (act.fechaISO) setSelectedDate(act.fechaISO);
                  }
                }}
              >
                <option value="">-- Elige una actividad disponible --</option>
                {actividades.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} — {a.fechaCorta} ({a.precio})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PASO 2: SELECCIONAR SUCURSAL
          ==================================================================== */}
      {currentStep === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">Elige tu sucursal en Durango</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Contamos con tres ubicaciones únicas para compartir momentos memorables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sucursales.map((suc) => {
              const isSelected = selectedSucursalId === suc.id;
              return (
                <div
                  key={suc.id}
                  className={`rounded-lg border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${
                    isSelected
                      ? 'bg-white border-[#E12927] ring-2 ring-[#E12927]/20 shadow-xl -translate-y-1'
                      : 'bg-white border-stone-300 hover:border-[#E12927] shadow-sm'
                  }`}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedSucursalId(suc.id);
                  }}
                >
                  <div className="h-32 bg-stone-100 overflow-hidden border-b-2 border-stone-200">
                    <img src={suc.imagen} alt={suc.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#1F1410]">{suc.nombre}</h3>
                      <p className="font-body text-[11px] text-[#5A4840] leading-relaxed line-clamp-2 mt-0.5 font-medium">
                        {suc.direccion}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-stone-200">
                      <span className="font-mono text-[10px] text-[#8E7A74] font-semibold">{suc.horario.split('(')[0]}</span>
                      <div
                        className={`w-4 h-4 rounded-xs border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#E12927] bg-[#E12927]' : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-xs bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          PASO 3: SELECCIONAR FECHA Y PERSONAS
          ==================================================================== */}
      {currentStep === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">Fecha y número de comensales</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Selecciona el día de tu visita y cuántas personas te acompañarán.
            </p>
          </div>

          {/* Stepper de Personas HeroUI Style 100% Sólido */}
          <div className="p-5 rounded-lg bg-white border-2 border-stone-300 flex items-center justify-between shadow-md">
            <div>
              <span className="block font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider">COMENSALES</span>
              <strong className="font-display text-lg text-[#1F1410]">Número de personas</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={personas <= 1}
                className="w-11 h-11 rounded-md border-2 border-stone-300 text-[#1F1410] font-bold text-lg flex items-center justify-center bg-white hover:bg-stone-100 disabled:opacity-30 cursor-pointer active:scale-90 transition-transform shadow-xs"
                onClick={() => setPersonas(Math.max(1, personas - 1))}
              >
                -
              </button>
              <span className="font-mono text-xl font-bold text-[#1F1410] min-w-[32px] text-center">{personas}</span>
              <button
                disabled={personas >= 12}
                className="w-11 h-11 rounded-md bg-[#E12927] text-white font-bold text-lg flex items-center justify-center hover:bg-[#C81E1C] disabled:opacity-30 cursor-pointer shadow-md shadow-[#E12927]/30 active:scale-90 transition-transform border-2 border-[#E12927]"
                onClick={() => setPersonas(Math.min(12, personas + 1))}
              >
                +
              </button>
            </div>
          </div>

          {/* Fechas Sugeridas */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">FECHAS SUGERIDAS:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fechasSugeridas.map((f, idx) => {
                const isSelected = selectedDate === f.iso;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`p-3.5 rounded-md border-2 text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#E12927] text-white border-[#E12927] shadow-md -translate-y-0.5'
                        : 'bg-white border-stone-300 hover:border-[#E12927] text-[#1F1410] shadow-xs'
                    }`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedDate(f.iso);
                    }}
                  >
                    <span className="block font-mono text-[10px] font-bold uppercase tracking-wider opacity-85">{f.label}</span>
                    <strong className="block font-mono text-xs mt-0.5">{f.dia}</strong>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-2 shadow-md">
            <label className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
              O SELECCIONA OTRA FECHA EN EL CALENDARIO:
            </label>
            <input
              type="date"
              value={selectedDate}
              min="2026-10-01"
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-mono text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          PASO 4: SELECCIONAR HORARIO
          ==================================================================== */}
      {currentStep === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">Selecciona el horario</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Turnos disponibles para {personas} personas el día {selectedDate}.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {horariosDisponibles.map((h, idx) => {
              const isSelected = selectedTime === h.hora;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`p-3.5 rounded-md border-2 text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#E12927] text-white border-[#E12927] shadow-md -translate-y-0.5'
                      : 'bg-white border-stone-300 hover:border-[#E12927] text-[#1F1410] shadow-xs'
                  }`}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedTime(h.hora);
                  }}
                >
                  <strong className="block font-mono text-sm">{h.hora}</strong>
                  <span className="block font-body text-[10px] opacity-85 mt-0.5 font-medium">{h.turno}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          PASO 5: INFORMACIÓN DE CONTACTO
          ==================================================================== */}
      {currentStep === 5 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">Tus datos de contacto</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Para reconocerte al llegar y enviarte tu confirmación con folio digital.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-4 shadow-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                NOMBRE COMPLETO *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa tu nombre..."
                className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                TELÉFONO / WHATSAPP *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="(618) 123-4567"
                className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                CORREO ELECTRÓNICO (OPCIONAL)
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                NOTAS U OCASIÓN ESPECIAL (OPCIONAL)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Cumpleaños, queremos jugar Catan, pediremos combo Mamut..."
                className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PASO 6: CONFIRMACIÓN Y RESUMEN
          ==================================================================== */}
      {currentStep === 6 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">Revisa y confirma tu reservación</h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              Verifica los detalles de tu mesa antes de confirmar tu visita a Café Marfil.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/40 flex flex-col gap-4 shadow-lg">
            <div>
              <span className="font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider">RESUMEN DE RESERVACIÓN</span>
              <h3 className="font-display text-2xl font-bold text-[#1F1410] mt-0.5">
                {reservaTipo === 'actividad' && actividadObj
                  ? actividadObj.nombre
                  : tiposReserva.find((t) => t.id === reservaTipo)?.titulo}
              </h3>
            </div>

            <div className="flex flex-col gap-3.5 py-3 border-t-2 border-[#E12927]/30 font-body text-xs sm:text-sm">
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">SUCURSAL</span>
                <strong className="font-display text-base text-[#1F1410]">{sucursalObj.nombre}</strong>
                <span className="block text-[#5A4840] text-xs font-medium">{sucursalObj.direccion}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-md bg-white border-2 border-stone-300 shadow-xs">
                <div>
                  <span className="block font-mono text-[9px] font-bold text-[#8E7A74] uppercase tracking-wider">FECHA</span>
                  <strong className="font-mono text-xs text-[#1F1410]">{selectedDate}</strong>
                </div>
                <div>
                  <span className="block font-mono text-[9px] font-bold text-[#8E7A74] uppercase tracking-wider">HORARIO</span>
                  <strong className="font-mono text-xs text-[#1F1410]">{selectedTime}</strong>
                </div>
                <div>
                  <span className="block font-mono text-[9px] font-bold text-[#8E7A74] uppercase tracking-wider">PERSONAS</span>
                  <strong className="font-mono text-xs text-[#1F1410]">{personas} personas</strong>
                </div>
              </div>

              <div>
                <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">A NOMBRE DE</span>
                <strong className="text-[#1F1410]">{nombre}</strong>
                <span className="block font-mono text-xs text-[#5A4840]">{telefono} {correo && `· ${correo}`}</span>
              </div>

              {notas && (
                <div>
                  <span className="block font-mono text-[10px] font-bold text-[#8E7A74] uppercase tracking-wider">NOTAS ESPECIALES</span>
                  <p className="text-xs text-[#5A4840] m-0 font-medium">{notas}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-white border-2 border-stone-300 text-xs font-body text-[#1F1410] font-medium shadow-xs">
              <CheckCircle2 size={18} className="text-[#E12927] shrink-0" />
              <span>Sin costo de apartado anticipado. Tu mesa tendrá 15 minutos de cortesía y tolerancia al llegar.</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de Navegación Inferiores HeroUI 100% Sólidos */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {currentStep > 1 && (
          <button
            className="px-7 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#1F1410] bg-white text-[#1F1410] hover:bg-[#1F1410] hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
            onClick={handlePrev}
          >
            Atrás
          </button>
        )}

        <button
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={handleNext}
        >
          <span>{currentStep === 6 ? 'Confirmar y Apartar Mesa' : 'Continuar'}</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
