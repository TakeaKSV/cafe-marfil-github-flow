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
  Sparkles,
  Dice5,
  Lock,
  UserCheck,
  UserPen
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { api } from '../api/cliente';
import { fechaEnDias, fechasSugeridas as calcularFechasSugeridas } from '../api/adaptadores';
import { reglas } from '../utils/validacion';

function separarNombre(contacto) {
  if (!contacto) return { nombres: '', apellidoPaterno: '', apellidoMaterno: '' };
  if (contacto.nombres || contacto.apellidoPaterno) {
    return {
      nombres: contacto.nombres || '',
      apellidoPaterno: contacto.apellidoPaterno || '',
      apellidoMaterno: contacto.apellidoMaterno || ''
    };
  }
  const partes = String(contacto.nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return { nombres: partes[0] || '', apellidoPaterno: '', apellidoMaterno: '' };
  if (partes.length === 2) return { nombres: partes[0], apellidoPaterno: partes[1], apellidoMaterno: '' };
  return {
    nombres: partes.slice(0, -2).join(' '),
    apellidoPaterno: partes[partes.length - 2],
    apellidoMaterno: partes[partes.length - 1]
  };
}

export default function ReservationWizard({
  sucursales,
  actividades,
  juegos = [],
  initialData,
  contacto,
  onCancel,
  onCompleteReservation
}) {
  // Paso actual (1 a 6)
  const [currentStep, setCurrentStep] = useState(1);

  // Estado del formulario
  const [reservaTipo, setReservaTipo] = useState(initialData?.tipo || 'mesa');
  const [selectedActividadId, setSelectedActividadId] = useState(initialData?.actividadId || '');
  const [selectedSucursalId, setSelectedSucursalId] = useState(initialData?.sucursalId || sucursales[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(() => fechaEnDias(1)); // por defecto, mañana
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [personas, setPersonas] = useState(initialData?.personas || 2);
  const [selectedJuegoId, setSelectedJuegoId] = useState('');
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [cargandoDisp, setCargandoDisp] = useState(false);
  const [usarDatosCuenta, setUsarDatosCuenta] = useState(Boolean(contacto));
  const iniciales = separarNombre(contacto);
  const [nombres, setNombres] = useState(iniciales.nombres);
  const [apellidoPaterno, setApellidoPaterno] = useState(iniciales.apellidoPaterno);
  const [apellidoMaterno, setApellidoMaterno] = useState(iniciales.apellidoMaterno);
  const nombreCompleto = usarDatosCuenta && contacto
    ? contacto.nombre
    : [nombres, apellidoPaterno, apellidoMaterno].map((s) => s.trim()).filter(Boolean).join(' ');
  const [telefono, setTelefono] = useState(contacto?.telefono ?? '');
  const [correo, setCorreo] = useState(contacto?.correo ?? '');
  const [notas, setNotas] = useState(initialData?.notas ?? initialData?.nota ?? '');
  const [enviando, setEnviando] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const limpiarErrorCampo = (campo) => {
    setFieldErrors((prev) => (prev[campo] ? { ...prev, [campo]: null } : prev));
  };

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

  const fechasSugeridas = calcularFechasSugeridas();

  const sucursalObj = sucursales.find((s) => s.id === selectedSucursalId) || sucursales[0];
  const actividadObj = actividades.find((a) => String(a.id) === String(selectedActividadId));
  const juegoObj = juegos.find((j) => String(j.id) === String(selectedJuegoId));
  const esActividad = reservaTipo === 'actividad' && Boolean(actividadObj);
  const actividadTieneFechaFija = esActividad && Boolean(actividadObj?.fechaISO);
  const actividadTieneHorarioFijo = esActividad && Boolean(actividadObj?.horario);

  // Sincroniza sucursal y fecha fija si se elige una actividad.
  useEffect(() => {
    if (reservaTipo === 'actividad' && actividadObj) {
      if (actividadObj.sucursalId) setSelectedSucursalId(actividadObj.sucursalId);
      if (actividadObj.fechaISO) setSelectedDate(actividadObj.fechaISO);
    }
  }, [reservaTipo, actividadObj]);

  // Consulta disponibilidad real de mesas para evitar colisiones de día/hora/mesa.
  useEffect(() => {
    if (esActividad || !selectedSucursalId || !selectedDate) {
      setDisponibilidad([]);
      return undefined;
    }
    let activo = true;
    setCargandoDisp(true);
    const params = new URLSearchParams({
      sucursalId: selectedSucursalId,
      fecha: selectedDate,
      personas: String(personas)
    });
    api(`/reservaciones/disponibilidad?${params}`)
      .then((lista) => {
        if (!activo || !Array.isArray(lista)) return;
        setDisponibilidad(lista);
        const actual = lista.find((d) => d.horaTexto === selectedTime);
        if (actual && !actual.disponible) {
          const primeroLibre = lista.find((d) => d.disponible);
          if (primeroLibre) setSelectedTime(primeroLibre.horaTexto);
        }
      })
      .catch(() => {
        if (activo) setDisponibilidad([]);
      })
      .finally(() => {
        if (activo) setCargandoDisp(false);
      });
    return () => {
      activo = false;
    };
  }, [esActividad, selectedSucursalId, selectedDate, personas, selectedTime]);

  const handleNext = () => {
    sounds.playClick();
    setValidationError('');
    setFieldErrors({});

    if (currentStep === 1) {
      if (!reservaTipo) {
        setValidationError('Selecciona el tipo de experiencia que deseas reservar.');
        return;
      }
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
      const errFecha = reglas.fechaNoPasada(selectedDate);
      const maxPersonas =
        reservaTipo === 'actividad' && actividadObj && typeof actividadObj.lugaresDisponibles === 'number'
          ? Math.min(12, actividadObj.lugaresDisponibles)
          : 12;
      const errPersonas =
        maxPersonas <= 0
          ? 'Esta actividad ya no tiene lugares disponibles.'
          : reglas.entero(personas, { min: 1, max: maxPersonas, etiqueta: 'El número de personas' });
      if (errFecha || errPersonas) {
        setFieldErrors({ fecha: errFecha, personas: errPersonas });
        setValidationError(errFecha || errPersonas);
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!actividadTieneHorarioFijo && !selectedTime) {
        setValidationError('Por favor selecciona un horario disponible.');
        return;
      }
      if (!esActividad && disponibilidad.length > 0) {
        const turnoActual = disponibilidad.find((d) => d.horaTexto === selectedTime);
        if (turnoActual && !turnoActual.disponible) {
          setValidationError('Ese horario ya no tiene mesas disponibles. Elige otro turno.');
          return;
        }
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      const telEfectivo = usarDatosCuenta && contacto?.telefono ? contacto.telefono : telefono;
      const correoEfectivo = usarDatosCuenta && contacto?.correo ? contacto.correo : correo;
      const errs = usarDatosCuenta && contacto
        ? {
            telefono: reglas.telefonoMX(telEfectivo),
            notas: reglas.texto(notas, { max: 300, opcional: true, etiqueta: 'Las notas' })
          }
        : {
            nombres: reglas.nombre(nombres, { min: 2, max: 80, etiqueta: 'Tu(s) nombre(s)' }),
            apellidoPaterno: reglas.nombre(apellidoPaterno, { min: 2, max: 60, etiqueta: 'Tu apellido paterno' }),
            apellidoMaterno: reglas.nombre(apellidoMaterno, { min: 2, max: 60, opcional: true, etiqueta: 'Tu apellido materno' }),
            telefono: reglas.telefonoMX(telEfectivo),
            correo: reglas.email(correoEfectivo, { opcional: true }),
            notas: reglas.texto(notas, { max: 300, opcional: true, etiqueta: 'Las notas' })
          };
      const primero = Object.entries(errs).find(([, v]) => Boolean(v));
      if (primero) {
        setFieldErrors(errs);
        setValidationError(primero[1]);
        const el = document.querySelector(`[data-campo="wizard-${primero[0]}"]`);
        if (el) el.focus();
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      const telFinal = (usarDatosCuenta && contacto?.telefono ? contacto.telefono : telefono).trim();
      const correoFinal = (usarDatosCuenta && contacto?.correo ? contacto.correo : correo).trim();
      const nuevaReserva = {
        tipoId: reservaTipo,
        actividadId: reservaTipo === 'actividad' ? selectedActividadId : null,
        tipo:
          reservaTipo === 'actividad' && actividadObj
            ? `Actividad: ${actividadObj.nombre}`
            : tiposReserva.find((t) => t.id === reservaTipo)?.titulo || 'Mesa Cafetería & Desayunos',
        sucursalId: selectedSucursalId,
        sucursalNombre: sucursalObj.nombre,
        fecha: selectedDate,
        fechaISO: selectedDate,
        hora: selectedTime,
        personas: Number(personas),
        juegoId: !esActividad && selectedJuegoId ? Number(selectedJuegoId) : null,
        juegoNombre: !esActividad && juegoObj ? juegoObj.nombre : null,
        nombreCliente: nombreCompleto,
        telefonoCliente: telFinal,
        correoCliente: correoFinal,
        notas: notas.trim()
      };
      if (enviando) return;
      setEnviando(true);
      Promise.resolve(onCompleteReservation(nuevaReserva)).then((error) => {
        if (typeof error === 'string') {
          setValidationError(error);
          setEnviando(false);
        }
      });
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
              Contamos con dos ubicaciones únicas para compartir momentos memorables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
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

          {/* Fechas Sugeridas o Fecha Fija de Actividad */}
          {actividadTieneFechaFija ? (
            <div className="p-5 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/35 flex items-start gap-3 shadow-sm">
              <Lock size={20} className="text-[#E12927] shrink-0 mt-0.5" />
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#E12927] uppercase tracking-wider">
                  FECHA FIJA DE LA ACTIVIDAD (NO MODIFICABLE)
                </span>
                <strong className="font-display text-lg text-[#1F1410] block mt-0.5">
                  {actividadObj.fecha || actividadObj.fechaISO}
                </strong>
                {actividadObj.horario && (
                  <span className="font-mono text-xs text-[#5A4840]">Horario asignado: {actividadObj.horario}</span>
                )}
              </div>
            </div>
          ) : (
            <>
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
                  min={fechaEnDias(0)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-mono text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
                />
              </div>
            </>
          )}

          {/* Selector opcional de Juego de Mesa existente */}
          {!esActividad && juegos.length > 0 && (
            <div className="p-5 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-2.5 shadow-md">
              <label htmlFor="wizard-juego" className="font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider flex items-center gap-1.5">
                <Dice5 size={15} />
                ¿QUIERES APARTAR UN JUEGO DE MESA? (OPCIONAL)
              </label>
              <select
                id="wizard-juego"
                value={selectedJuegoId}
                onChange={(e) => setSelectedJuegoId(e.target.value)}
                className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]"
              >
                <option value="">Sin juego apartado / Elegir al llegar</option>
                {juegos.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} · {j.categoria} ({j.jugadores})
                  </option>
                ))}
              </select>
              <span className="font-body text-[11px] text-[#5A4840]">
                Elige uno de los juegos disponibles en nuestra ludoteca para tenerlo listo en tu mesa.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PASO 4: SELECCIONAR HORARIO
          ==================================================================== */}
      {currentStep === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">
              {actividadTieneHorarioFijo ? 'Horario fijo de la actividad' : 'Selecciona el horario'}
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#5A4840] mt-1 font-medium">
              {actividadTieneHorarioFijo
                ? 'Esta actividad tiene un horario establecido por Café Marfil y no se puede modificar.'
                : `Turnos disponibles para ${personas} personas el día ${selectedDate}.`}
            </p>
          </div>

          {actividadTieneHorarioFijo ? (
            <div className="p-6 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/40 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-md bg-[#E12927] text-white flex items-center justify-center shrink-0">
                <Lock size={22} />
              </div>
              <div>
                <span className="block font-mono text-[10px] font-bold text-[#E12927] uppercase tracking-wider">
                  HORARIO CONFIRMADO DE {actividadObj.nombre}
                </span>
                <strong className="font-display text-2xl text-[#1F1410] block mt-0.5">
                  {actividadObj.horario}
                </strong>
                <span className="font-body text-xs text-[#5A4840]">
                  Sucursal: {sucursalObj?.nombre} · {actividadObj.fecha || selectedDate}
                </span>
              </div>
            </div>
          ) : (
            <>
              {cargandoDisp && (
                <p className="font-mono text-xs text-[#8E7A74]">Verificando mesas disponibles...</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {horariosDisponibles.map((h, idx) => {
                  const slotDisp = disponibilidad.find((d) => d.horaTexto === h.hora);
                  const ocupado = slotDisp ? !slotDisp.disponible : false;
                  const isSelected = selectedTime === h.hora && !ocupado;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={ocupado}
                      className={`p-3.5 rounded-md border-2 text-center transition-all duration-200 ${
                        ocupado
                          ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-70'
                          : isSelected
                            ? 'bg-[#E12927] text-white border-[#E12927] shadow-md -translate-y-0.5 cursor-pointer'
                            : 'bg-white border-stone-300 hover:border-[#E12927] text-[#1F1410] shadow-xs cursor-pointer'
                      }`}
                      onClick={() => {
                        if (ocupado) return;
                        sounds.playClick();
                        setSelectedTime(h.hora);
                      }}
                    >
                      <strong className="block font-mono text-sm">{h.hora}</strong>
                      <span className="block font-body text-[10px] opacity-85 mt-0.5 font-medium">
                        {ocupado ? 'Sin mesas' : h.turno}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
            {contacto && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2 border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setUsarDatosCuenta(true);
                    setFieldErrors({});
                  }}
                  className={`p-3.5 rounded-md border-2 text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    usarDatosCuenta
                      ? 'bg-[#FCEAE9] border-[#E12927] text-[#1F1410]'
                      : 'bg-white border-stone-300 text-[#5A4840] hover:border-[#E12927]/50'
                  }`}
                >
                  <UserCheck size={18} className={usarDatosCuenta ? 'text-[#E12927] shrink-0' : 'text-stone-400 shrink-0'} />
                  <div>
                    <strong className="block font-mono text-xs uppercase">Usar datos de mi cuenta</strong>
                    <span className="block text-[11px] opacity-80 truncate">{contacto.nombre}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setUsarDatosCuenta(false);
                    setFieldErrors({});
                  }}
                  className={`p-3.5 rounded-md border-2 text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    !usarDatosCuenta
                      ? 'bg-[#FCEAE9] border-[#E12927] text-[#1F1410]'
                      : 'bg-white border-stone-300 text-[#5A4840] hover:border-[#E12927]/50'
                  }`}
                >
                  <UserPen size={18} className={!usarDatosCuenta ? 'text-[#E12927] shrink-0' : 'text-stone-400 shrink-0'} />
                  <div>
                    <strong className="block font-mono text-xs uppercase">Cambiar datos</strong>
                    <span className="block text-[11px] opacity-80">Reservar para alguien más</span>
                  </div>
                </button>
              </div>
            )}

            {usarDatosCuenta && contacto ? (
              <div className="p-4 rounded-md bg-[#FAF7F5] border-2 border-stone-200 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#8E7A74] uppercase">Titular</span>
                  <strong className="text-[#1F1410]">{contacto.nombre}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#8E7A74] uppercase">Correo</span>
                  <span className="font-mono text-xs text-[#1F1410]">{contacto.correo || '—'}</span>
                </div>
                {contacto.telefono ? (
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#8E7A74] uppercase">Teléfono</span>
                    <span className="font-mono text-xs text-[#1F1410]">{contacto.telefono}</span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-stone-200 flex flex-col gap-1">
                    <label htmlFor="wizard-telefono-cuenta" className="font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider">
                      AGREGA TU TELÉFONO / WHATSAPP (10 DÍGITOS) *
                    </label>
                    <input
                      id="wizard-telefono-cuenta"
                      data-campo="wizard-telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => {
                        setTelefono(e.target.value);
                        limpiarErrorCampo('telefono');
                      }}
                      placeholder="(618) 123-4567"
                      className={`p-3 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                        fieldErrors.telefono ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                      }`}
                    />
                    {fieldErrors.telefono && <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.telefono}</p>}
                  </div>
                )}
              </div>
            ) : (
              <>
            <div className="flex flex-col gap-1">
              <label htmlFor="wizard-nombres" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                NOMBRE(S) *
              </label>
              <input
                id="wizard-nombres"
                data-campo="wizard-nombres"
                type="text"
                value={nombres}
                onChange={(e) => {
                  setNombres(e.target.value);
                  limpiarErrorCampo('nombres');
                }}
                onBlur={() => setFieldErrors((p) => ({ ...p, nombres: reglas.nombre(nombres, { min: 2, max: 80, etiqueta: 'Tu(s) nombre(s)' }) }))}
                aria-invalid={Boolean(fieldErrors.nombres)}
                placeholder="Ej. Sofía"
                className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                  fieldErrors.nombres ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                }`}
              />
              {fieldErrors.nombres && <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.nombres}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-ap-paterno" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                  APELLIDO PATERNO *
                </label>
                <input
                  id="wizard-ap-paterno"
                  data-campo="wizard-apellidoPaterno"
                  type="text"
                  value={apellidoPaterno}
                  onChange={(e) => {
                    setApellidoPaterno(e.target.value);
                    limpiarErrorCampo('apellidoPaterno');
                  }}
                  onBlur={() =>
                    setFieldErrors((p) => ({
                      ...p,
                      apellidoPaterno: reglas.nombre(apellidoPaterno, { min: 2, max: 60, etiqueta: 'Tu apellido paterno' })
                    }))
                  }
                  aria-invalid={Boolean(fieldErrors.apellidoPaterno)}
                  placeholder="Ej. Navarro"
                  className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                    fieldErrors.apellidoPaterno ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                  }`}
                />
                {fieldErrors.apellidoPaterno && (
                  <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.apellidoPaterno}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-ap-materno" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                  APELLIDO MATERNO
                </label>
                <input
                  id="wizard-ap-materno"
                  data-campo="wizard-apellidoMaterno"
                  type="text"
                  value={apellidoMaterno}
                  onChange={(e) => {
                    setApellidoMaterno(e.target.value);
                    limpiarErrorCampo('apellidoMaterno');
                  }}
                  onBlur={() =>
                    setFieldErrors((p) => ({
                      ...p,
                      apellidoMaterno: reglas.nombre(apellidoMaterno, {
                        min: 2,
                        max: 60,
                        opcional: true,
                        etiqueta: 'Tu apellido materno'
                      })
                    }))
                  }
                  aria-invalid={Boolean(fieldErrors.apellidoMaterno)}
                  placeholder="Opcional"
                  className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                    fieldErrors.apellidoMaterno ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                  }`}
                />
                {fieldErrors.apellidoMaterno && (
                  <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.apellidoMaterno}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="wizard-telefono" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                TELÉFONO / WHATSAPP (10 DÍGITOS) *
              </label>
              <input
                id="wizard-telefono"
                data-campo="wizard-telefono"
                type="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  limpiarErrorCampo('telefono');
                }}
                onBlur={() => setFieldErrors((p) => ({ ...p, telefono: reglas.telefonoMX(telefono) }))}
                aria-invalid={Boolean(fieldErrors.telefono)}
                placeholder="(618) 123-4567"
                className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                  fieldErrors.telefono ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                }`}
              />
              {fieldErrors.telefono && <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.telefono}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="wizard-correo" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                CORREO ELECTRÓNICO (OPCIONAL — PARA CONFIRMACIÓN)
              </label>
              <input
                id="wizard-correo"
                data-campo="wizard-correo"
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  limpiarErrorCampo('correo');
                }}
                onBlur={() => setFieldErrors((p) => ({ ...p, correo: reglas.email(correo, { opcional: true }) }))}
                aria-invalid={Boolean(fieldErrors.correo)}
                placeholder="tu.correo@ejemplo.com"
                className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                  fieldErrors.correo ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                }`}
              />
              {fieldErrors.correo && <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.correo}</p>}
            </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="wizard-notas" className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider">
                NOTAS U OCASIÓN ESPECIAL (OPCIONAL, MÁX. 300 CARACTERES)
              </label>
              <input
                id="wizard-notas"
                data-campo="wizard-notas"
                type="text"
                maxLength={300}
                value={notas}
                onChange={(e) => {
                  setNotas(e.target.value);
                  limpiarErrorCampo('notas');
                }}
                onBlur={() => setFieldErrors((p) => ({ ...p, notas: reglas.texto(notas, { max: 300, opcional: true, etiqueta: 'Las notas' }) }))}
                aria-invalid={Boolean(fieldErrors.notas)}
                placeholder="Ej: Cumpleaños, queremos jugar Catan, pediremos combo Mamut..."
                className={`p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none ${
                  fieldErrors.notas ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                }`}
              />
              {fieldErrors.notas && <p role="alert" className="text-xs font-semibold text-[#E12927]">{fieldErrors.notas}</p>}
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
                <strong className="text-[#1F1410]">{nombreCompleto}</strong>
                <span className="block font-mono text-xs text-[#5A4840]">
                  {(usarDatosCuenta && contacto?.telefono ? contacto.telefono : telefono)}{' '}
                  {(usarDatosCuenta && contacto?.correo ? contacto.correo : correo) &&
                    `· ${usarDatosCuenta && contacto?.correo ? contacto.correo : correo}`}
                </span>
              </div>

              {!esActividad && juegoObj && (
                <div>
                  <span className="block font-mono text-[10px] font-bold text-[#E12927] uppercase tracking-wider">JUEGO DE MESA APARTADO</span>
                  <strong className="text-[#1F1410]">{juegoObj.nombre}</strong>
                  <span className="block text-xs text-[#5A4840]">{juegoObj.categoria} · {juegoObj.jugadores}</span>
                </div>
              )}

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
