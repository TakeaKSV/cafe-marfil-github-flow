import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Dice5,
  Lock,
  UserCheck,
  UserPen,
  Coffee,
  Sparkles,
  PartyPopper,
  Check
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { api } from '../api/cliente';
import { fechaEnDias, fechasSugeridas as calcularFechasSugeridas } from '../api/adaptadores';
import { reglas, sanitizar } from '../utils/validacion';

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

const TIPOS_RESERVA = [
  {
    id: 'mesa',
    titulo: 'Cafetería & Brunch',
    descripcion: 'Desayunos, espresso y cocina todo el día.',
    icono: Coffee
  },
  {
    id: 'juegos',
    titulo: 'Mesa con Juegos',
    descripcion: 'Ludoteca con +60 títulos y anfitrión.',
    icono: Dice5
  },
  {
    id: 'actividad',
    titulo: 'Actividad o Taller',
    descripcion: 'Cine, pintura neón, música o catas.',
    icono: Sparkles
  },
  {
    id: 'evento',
    titulo: 'Reunión o Cowork',
    descripcion: 'Espacio grupal o celebración especial.',
    icono: PartyPopper
  }
];

const HORARIOS_DISPONIBLES = [
  { hora: '08:30 AM', turno: 'Desayuno' },
  { hora: '09:30 AM', turno: 'Desayuno' },
  { hora: '10:30 AM', turno: 'Desayuno' },
  { hora: '11:00 AM', turno: 'Brunch' },
  { hora: '12:00 PM', turno: 'Brunch' },
  { hora: '01:30 PM', turno: 'Comida' },
  { hora: '03:00 PM', turno: 'Tarde' },
  { hora: '04:30 PM', turno: 'Frappés' },
  { hora: '06:00 PM', turno: 'Juegos' },
  { hora: '07:30 PM', turno: 'Cena' },
  { hora: '08:30 PM', turno: 'Noche' }
];

const PASOS = [
  { num: 1, label: 'Experiencia' },
  { num: 2, label: 'Fecha y hora' },
  { num: 3, label: 'Confirmar' }
];

export default function ReservationWizard({
  sucursales = [],
  actividades = [],
  juegos = [],
  initialData,
  contacto,
  onCancel,
  onCompleteReservation
}) {
  const [currentStep, setCurrentStep] = useState(initialData?.actividad ? 2 : 1);
  const stepBodyRef = useRef(null);

  const [reservaTipo, setReservaTipo] = useState(initialData?.actividad ? 'actividad' : initialData?.tipo || 'mesa');
  const [selectedActividadId, setSelectedActividadId] = useState(initialData?.actividad?.id || initialData?.actividadId || '');
  const [selectedSucursalId, setSelectedSucursalId] = useState(
    initialData?.actividad?.sucursalId || initialData?.sucursalId || sucursales[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState(() => initialData?.actividad?.fechaISO || fechaEnDias(1));
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
  const nombreCompleto =
    usarDatosCuenta && contacto
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

  useEffect(() => {
    if (!stepBodyRef.current) return undefined;
    const tween = gsap.fromTo(
      stepBodyRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    return () => tween.kill();
  }, [currentStep]);

  const fechasSugeridas = calcularFechasSugeridas();
  const sucursalEfectivaId = selectedSucursalId || sucursales[0]?.id || '';
  const sucursalObj = sucursales.find((s) => s.id === sucursalEfectivaId) || sucursales[0];
  const actividadObj = actividades.find((a) => String(a.id) === String(selectedActividadId));
  const juegoObj = juegos.find((j) => String(j.id) === String(selectedJuegoId));
  const esActividad = reservaTipo === 'actividad' && Boolean(actividadObj);
  const actividadTieneFechaFija = esActividad && Boolean(actividadObj?.fechaISO);
  const actividadTieneHorarioFijo = esActividad && Boolean(actividadObj?.horario);

  const maxPersonas =
    esActividad && typeof actividadObj?.lugaresDisponibles === 'number'
      ? Math.min(12, Math.max(0, actividadObj.lugaresDisponibles))
      : 12;

  useEffect(() => {
    if (reservaTipo === 'actividad' && actividadObj) {
      if (actividadObj.sucursalId) setSelectedSucursalId(actividadObj.sucursalId);
      if (actividadObj.fechaISO) setSelectedDate(actividadObj.fechaISO);
    }
  }, [reservaTipo, actividadObj]);

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
        setValidationError('Selecciona el tipo de experiencia.');
        return;
      }
      if (reservaTipo === 'actividad' && !selectedActividadId) {
        setValidationError('Elige la actividad o taller al que deseas asistir.');
        return;
      }
      if (!selectedSucursalId) {
        setValidationError('Selecciona una sucursal.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const errFecha = reglas.fechaNoPasada(selectedDate);
      const errPersonas =
        maxPersonas <= 0
          ? 'Esta actividad ya no tiene lugares disponibles.'
          : reglas.entero(personas, { min: 1, max: maxPersonas, etiqueta: 'El número de personas' });
      if (errFecha || errPersonas) {
        setFieldErrors({ fecha: errFecha, personas: errPersonas });
        setValidationError(errFecha || errPersonas);
        return;
      }
      if (!actividadTieneHorarioFijo && !selectedTime) {
        setValidationError('Selecciona un horario disponible.');
        return;
      }
      if (!esActividad && disponibilidad.length > 0) {
        const turnoActual = disponibilidad.find((d) => d.horaTexto === selectedTime);
        if (turnoActual && !turnoActual.disponible) {
          setValidationError('Ese horario ya no tiene mesas disponibles. Elige otro turno.');
          return;
        }
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const telEfectivo = usarDatosCuenta && contacto?.telefono ? contacto.telefono : telefono;
      const correoEfectivo = usarDatosCuenta && contacto?.correo ? contacto.correo : correo;
      const errs =
        usarDatosCuenta && contacto
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

      const telFinal = telEfectivo.trim();
      const correoFinal = correoEfectivo.trim();
      const nuevaReserva = {
        tipoId: reservaTipo,
        actividadId: reservaTipo === 'actividad' ? selectedActividadId : null,
        tipo:
          reservaTipo === 'actividad' && actividadObj
            ? `Actividad: ${actividadObj.nombre}`
            : TIPOS_RESERVA.find((t) => t.id === reservaTipo)?.titulo || 'Cafetería & Brunch',
        sucursalId: selectedSucursalId,
        sucursalNombre: sucursalObj?.nombre || '',
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
    } else if (onCancel) {
      onCancel();
    }
  };

  const inputClass = (hasErr) =>
    `w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#261A16] text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none transition-colors ${
      hasErr ? 'border-[#E12927]' : 'border-black/10 dark:border-white/15 focus:border-[#E12927]'
    }`;

  return (
    <div className="flex flex-col gap-3.5 w-full min-w-0 text-left">
      {/* Barra limpia de 3 pasos */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-white dark:bg-[#1F1410] p-1.5 sm:p-2 rounded-2xl border border-black/[0.06] dark:border-white/10">
        {PASOS.map((paso) => {
          const isCurrent = currentStep === paso.num;
          const isDone = currentStep > paso.num;
          return (
            <button
              key={paso.num}
              type="button"
              disabled={paso.num > currentStep}
              onClick={() => {
                if (paso.num < currentStep) {
                  sounds.playClick();
                  setCurrentStep(paso.num);
                }
              }}
              className={`min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-sm transition-all ${
                isCurrent
                  ? 'bg-[#1F1410] dark:bg-[#E12927] text-white font-semibold shadow-xs'
                  : isDone
                  ? 'text-[#1F1410] dark:text-[#FAF7F5] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                  : 'text-[#8E7A74] opacity-65 cursor-default'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : paso.num}
              </span>
              <span className="truncate">{paso.label}</span>
            </button>
          );
        })}
      </div>

      {validationError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#FCEAE9] dark:bg-[#3A1C1A] border border-[#E12927]/30 text-[#E12927] text-xs sm:text-sm">
          <AlertCircle size={17} className="shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* Layout 2 columnas en desktop: Formulario a la izquierda + Resumen en vivo a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div ref={stepBodyRef} className="lg:col-span-8 flex flex-col gap-3">
          {/* ================================================================
              PASO 1: EXPERIENCIA & SUCURSAL
              ================================================================ */}
          {currentStep === 1 && (
            <>
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E7A74]">
                  1. ¿Qué experiencia buscas?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TIPOS_RESERVA.map((tipo) => {
                    const Icono = tipo.icono;
                    const isSelected = reservaTipo === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setReservaTipo(tipo.id);
                        }}
                        className={`p-4 rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#FCEAE9]/70 dark:bg-[#321B19] border-[#E12927] shadow-sm'
                            : 'bg-white dark:bg-[#1F1410] border-black/[0.07] dark:border-white/10 hover:border-[#E12927]/50'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#E12927] text-white'
                              : 'bg-[#FAF7F5] dark:bg-[#2A1D19] text-[#1F1410] dark:text-[#FAF7F5]'
                          }`}
                        >
                          <Icono size={18} />
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-sm font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                            {tipo.titulo}
                          </strong>
                          <span className="block text-xs text-[#6B5A52] dark:text-[#B4A099] leading-snug mt-0.5">
                            {tipo.descripcion}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {reservaTipo === 'actividad' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#E12927]">
                    Elige la actividad o taller
                  </label>
                  <select
                    className={inputClass(false)}
                    value={selectedActividadId}
                    onChange={(e) => {
                      setSelectedActividadId(e.target.value);
                      const act = actividades.find((a) => String(a.id) === String(e.target.value));
                      if (act) {
                        setSelectedSucursalId(act.sucursalId);
                        if (act.fechaISO) setSelectedDate(act.fechaISO);
                      }
                    }}
                  >
                    <option value="">-- Selecciona una actividad --</option>
                    {actividades.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} · {a.fechaCorta || a.fecha} ({a.precio})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E7A74]">
                  2. Elige tu sucursal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sucursales.map((suc) => {
                    const isSelected = selectedSucursalId === suc.id;
                    return (
                      <button
                        key={suc.id}
                        type="button"
                        disabled={esActividad && actividadObj?.sucursalId && actividadObj.sucursalId !== suc.id}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedSucursalId(suc.id);
                        }}
                        className={`relative h-28 rounded-2xl overflow-hidden text-left transition-all cursor-pointer border-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-[#E12927] shadow-md scale-[1.01]'
                            : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={suc.imagen}
                          alt={suc.nombre}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                        <div className="absolute inset-x-3.5 bottom-3 text-white">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-bold leading-tight truncate">{suc.nombre}</strong>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-[#E12927] text-white flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-white/75 truncate mt-0.5">
                            {suc.direccion}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ================================================================
              PASO 2: FECHA, HORARIO, PERSONAS Y JUEGO OPCIONAL
              ================================================================ */}
          {currentStep === 2 && (
            <>
              {/* Fila compacta: Personas + Juego de mesa opcional */}
              <div className={`grid grid-cols-1 ${!esActividad && juegos.length > 0 ? 'sm:grid-cols-2' : ''} gap-3`}>
                <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block text-xs sm:text-sm font-bold text-[#1F1410] dark:text-[#FAF7F5] truncate">
                        {esActividad ? 'Lugares a apartar' : 'Personas'}
                      </strong>
                      <span className="text-[11px] text-[#8E7A74]">
                        Máx. {maxPersonas}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={personas <= 1}
                      onClick={() => {
                        sounds.playClick();
                        setPersonas(Math.max(1, personas - 1));
                      }}
                      className="w-8 h-8 rounded-full bg-[#FAF7F5] dark:bg-[#2A1D19] border border-black/10 dark:border-white/10 text-[#1F1410] dark:text-white font-bold flex items-center justify-center disabled:opacity-35 cursor-pointer active:scale-90"
                    >
                      −
                    </button>
                    <span className="text-base font-bold text-[#1F1410] dark:text-[#FAF7F5] min-w-[22px] text-center">
                      {personas}
                    </span>
                    <button
                      type="button"
                      disabled={personas >= maxPersonas}
                      onClick={() => {
                        sounds.playClick();
                        setPersonas(Math.min(maxPersonas, personas + 1));
                      }}
                      className="w-8 h-8 rounded-full bg-[#E12927] text-white font-bold flex items-center justify-center disabled:opacity-35 cursor-pointer active:scale-90 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {!esActividad && juegos.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 flex flex-col justify-center gap-1">
                    <label htmlFor="wizard-juego" className="text-[10px] font-bold uppercase tracking-wider text-[#8E7A74] flex items-center gap-1.5">
                      <Dice5 size={13} className="text-[#E12927]" />
                      Juego de mesa (opcional)
                    </label>
                    <select
                      id="wizard-juego"
                      value={selectedJuegoId}
                      onChange={(e) => setSelectedJuegoId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 bg-[#FAF7F5] dark:bg-[#261A16] text-xs text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none focus:border-[#E12927]"
                    >
                      <option value="">Elegir al llegar</option>
                      {juegos.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nombre} ({j.jugadores})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Fecha */}
              {actividadTieneFechaFija ? (
                <div className="p-3.5 rounded-2xl bg-[#FCEAE9]/70 dark:bg-[#321B19] border border-[#E12927]/30 flex items-center gap-3">
                  <Lock size={17} className="text-[#E12927] shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E12927]">
                      Fecha fija del evento
                    </span>
                    <strong className="text-sm font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                      {actividadObj.fecha || actividadObj.fechaISO}
                      {actividadObj.horario ? ` · ${actividadObj.horario}` : ''}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8E7A74]">
                      Selecciona la fecha
                    </span>
                    <input
                      type="date"
                      value={selectedDate}
                      min={fechaEnDias(0)}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2.5 py-1 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#261A16] text-xs text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none focus:border-[#E12927]"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {fechasSugeridas.map((f, idx) => {
                      const isSelected = selectedDate === f.iso;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedDate(f.iso);
                          }}
                          className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#E12927] text-white border-[#E12927] shadow-sm'
                              : 'bg-white dark:bg-[#1F1410] border-black/[0.07] dark:border-white/10 text-[#1F1410] dark:text-[#FAF7F5] hover:border-[#E12927]'
                          }`}
                        >
                          <span className="block text-[10px] uppercase opacity-80">{f.label}</span>
                          <strong className="block text-xs font-bold mt-0.5">{f.dia}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Horario */}
              {!actividadTieneHorarioFijo && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8E7A74]">
                      Selecciona el horario
                    </span>
                    {cargandoDisp && (
                      <span className="text-[11px] text-[#8E7A74]">Verificando mesas...</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {HORARIOS_DISPONIBLES.map((h) => {
                      const slotDisp = disponibilidad.find((d) => d.horaTexto === h.hora);
                      const ocupado = slotDisp ? !slotDisp.disponible : false;
                      const isSelected = selectedTime === h.hora && !ocupado;
                      return (
                        <button
                          key={h.hora}
                          type="button"
                          disabled={ocupado}
                          onClick={() => {
                            if (ocupado) return;
                            sounds.playClick();
                            setSelectedTime(h.hora);
                          }}
                          className={`inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] transition-all border ${
                            ocupado
                              ? 'bg-black/5 dark:bg-white/5 border-transparent text-[#8E7A74] opacity-45 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-[#1F1410] dark:bg-[#E12927] text-white border-[#1F1410] dark:border-[#E12927] font-bold shadow-xs cursor-pointer'
                              : 'bg-white dark:bg-[#1F1410] border-black/10 dark:border-white/10 text-[#1F1410] dark:text-[#FAF7F5] hover:border-[#E12927] cursor-pointer'
                          }`}
                        >
                          <Clock size={11} className="shrink-0" />
                          <span className="truncate">{h.hora}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================================================================
              PASO 3: DATOS DE CONTACTO & NOTAS
              ================================================================ */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              {contacto && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setUsarDatosCuenta(true);
                      setFieldErrors({});
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      usarDatosCuenta
                        ? 'bg-[#FCEAE9]/70 dark:bg-[#321B19] border-[#E12927]'
                        : 'bg-white dark:bg-[#1F1410] border-black/10 dark:border-white/10'
                    }`}
                  >
                    <UserCheck size={17} className={usarDatosCuenta ? 'text-[#E12927] shrink-0' : 'text-[#8E7A74] shrink-0'} />
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-[#1F1410] dark:text-[#FAF7F5]">Usar mi cuenta</strong>
                      <span className="block text-[11px] text-[#6B5A52] dark:text-[#B4A099] truncate">{contacto.nombre}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setUsarDatosCuenta(false);
                      setFieldErrors({});
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      !usarDatosCuenta
                        ? 'bg-[#FCEAE9]/70 dark:bg-[#321B19] border-[#E12927]'
                        : 'bg-white dark:bg-[#1F1410] border-black/10 dark:border-white/10'
                    }`}
                  >
                    <UserPen size={17} className={!usarDatosCuenta ? 'text-[#E12927] shrink-0' : 'text-[#8E7A74] shrink-0'} />
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-[#1F1410] dark:text-[#FAF7F5]">Para alguien más</strong>
                      <span className="block text-[11px] text-[#6B5A52] dark:text-[#B4A099] truncate">Cambiar titular</span>
                    </div>
                  </button>
                </div>
              )}

              {usarDatosCuenta && contacto ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 space-y-2.5 text-xs sm:text-sm min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 min-w-0">
                    <span className="text-[#8E7A74] shrink-0">Titular</span>
                    <strong className="text-[#1F1410] dark:text-[#FAF7F5] text-right break-words min-w-0">{contacto.nombre}</strong>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 min-w-0">
                    <span className="text-[#8E7A74] shrink-0">Correo</span>
                    <span className="text-[#1F1410] dark:text-[#FAF7F5] text-right break-all min-w-0">{contacto.correo || '—'}</span>
                  </div>
                  {contacto.telefono ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 min-w-0">
                      <span className="text-[#8E7A74] shrink-0">Teléfono</span>
                      <span className="text-[#1F1410] dark:text-[#FAF7F5] text-right">{contacto.telefono}</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-1">
                      <label htmlFor="wizard-telefono-cuenta" className="text-xs font-semibold text-[#E12927]">
                        Agrega tu teléfono / WhatsApp (10 dígitos) *
                      </label>
                      <input
                        id="wizard-telefono-cuenta"
                        data-campo="wizard-telefono"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={telefono}
                        onChange={(e) => {
                          setTelefono(sanitizar.telefono(e.target.value));
                          limpiarErrorCampo('telefono');
                        }}
                        placeholder="6181234567"
                        className={inputClass(fieldErrors.telefono)}
                      />
                      {fieldErrors.telefono && <p role="alert" className="text-xs text-[#E12927]">{fieldErrors.telefono}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label htmlFor="wizard-nombres" className="text-xs font-semibold text-[#6B5A52]">Nombre(s) *</label>
                    <input
                      id="wizard-nombres"
                      data-campo="wizard-nombres"
                      type="text"
                      maxLength={80}
                      value={nombres}
                      onChange={(e) => {
                        setNombres(sanitizar.nombrePersona(e.target.value, 80));
                        limpiarErrorCampo('nombres');
                      }}
                      placeholder="Ej. Sofía"
                      className={inputClass(fieldErrors.nombres)}
                    />
                    {fieldErrors.nombres && <p role="alert" className="text-xs text-[#E12927]">{fieldErrors.nombres}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="wizard-ap-paterno" className="text-xs font-semibold text-[#6B5A52]">Apellido paterno *</label>
                    <input
                      id="wizard-ap-paterno"
                      data-campo="wizard-apellidoPaterno"
                      type="text"
                      maxLength={60}
                      value={apellidoPaterno}
                      onChange={(e) => {
                        setApellidoPaterno(sanitizar.nombrePersona(e.target.value, 60));
                        limpiarErrorCampo('apellidoPaterno');
                      }}
                      placeholder="Ej. Navarro"
                      className={inputClass(fieldErrors.apellidoPaterno)}
                    />
                    {fieldErrors.apellidoPaterno && <p role="alert" className="text-xs text-[#E12927]">{fieldErrors.apellidoPaterno}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="wizard-ap-materno" className="text-xs font-semibold text-[#6B5A52]">Apellido materno</label>
                    <input
                      id="wizard-ap-materno"
                      data-campo="wizard-apellidoMaterno"
                      type="text"
                      maxLength={60}
                      value={apellidoMaterno}
                      onChange={(e) => {
                        setApellidoMaterno(sanitizar.nombrePersona(e.target.value, 60));
                        limpiarErrorCampo('apellidoMaterno');
                      }}
                      placeholder="Opcional"
                      className={inputClass(fieldErrors.apellidoMaterno)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="wizard-telefono" className="text-xs font-semibold text-[#6B5A52]">Teléfono / WhatsApp (10 dígitos) *</label>
                    <input
                      id="wizard-telefono"
                      data-campo="wizard-telefono"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={telefono}
                      onChange={(e) => {
                        setTelefono(sanitizar.telefono(e.target.value));
                        limpiarErrorCampo('telefono');
                      }}
                      placeholder="6181234567"
                      className={inputClass(fieldErrors.telefono)}
                    />
                    {fieldErrors.telefono && <p role="alert" className="text-xs text-[#E12927]">{fieldErrors.telefono}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="wizard-correo" className="text-xs font-semibold text-[#6B5A52]">Correo (opcional)</label>
                    <input
                      id="wizard-correo"
                      data-campo="wizard-correo"
                      type="email"
                      maxLength={190}
                      value={correo}
                      onChange={(e) => {
                        setCorreo(sanitizar.email(e.target.value));
                        limpiarErrorCampo('correo');
                      }}
                      placeholder="tu.correo@ejemplo.com"
                      className={inputClass(fieldErrors.correo)}
                    />
                    {fieldErrors.correo && <p role="alert" className="text-xs text-[#E12927]">{fieldErrors.correo}</p>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="wizard-notas" className="text-xs font-semibold text-[#6B5A52]">
                  Notas u ocasión especial (opcional)
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
                  placeholder="Ej: Cumpleaños, mesa en terraza, alergias..."
                  className={inputClass(fieldErrors.notas)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Tarjeta de Resumen en Vivo */}
        <aside className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E12927]">
            Resumen en vivo
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-[#E12927] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[#8E7A74]">Experiencia</span>
                <strong className="text-[#1F1410] dark:text-[#FAF7F5] block leading-snug">
                  {esActividad && actividadObj
                    ? actividadObj.nombre
                    : TIPOS_RESERVA.find((t) => t.id === reservaTipo)?.titulo}
                </strong>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={14} className="text-[#E12927] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="block text-[10px] text-[#8E7A74]">Sucursal</span>
                <strong className="text-[#1F1410] dark:text-[#FAF7F5] block truncate">
                  {sucursalObj?.nombre || '—'}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-[#E12927] shrink-0" />
                <span className="text-[#1F1410] dark:text-[#FAF7F5] font-semibold truncate">{selectedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#E12927] shrink-0" />
                <span className="text-[#1F1410] dark:text-[#FAF7F5] font-semibold truncate">
                  {actividadTieneHorarioFijo ? actividadObj.horario : selectedTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Users size={13} className="text-[#E12927] shrink-0" />
                <span className="text-[#1F1410] dark:text-[#FAF7F5] font-semibold">
                  {personas} {personas === 1 ? 'persona' : 'personas'}
                </span>
              </div>
            </div>

            {!esActividad && juegoObj && (
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 flex items-center gap-1.5 text-[#E12927]">
                <Dice5 size={14} className="shrink-0" />
                <strong className="truncate">{juegoObj.nombre}</strong>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-start gap-2 text-[11px] text-[#6B5A52] dark:text-[#B4A099]">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Sin costo de apartado. 15 min de cortesía al llegar.</span>
          </div>
        </aside>
      </div>

      {/* Barra inferior de acciones */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/[0.07] dark:border-white/10">
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm text-[#6B5A52] dark:text-[#C5B4AE] hover:text-[#1F1410] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>{currentStep === 1 ? 'Cancelar' : 'Atrás'}</span>
        </button>

        <button
          type="button"
          disabled={enviando}
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#E12927]/25 transition-all cursor-pointer"
        >
          <span>
            {currentStep === 3
              ? enviando
                ? 'Confirmando...'
                : esActividad
                ? 'Confirmar lugares'
                : 'Confirmar reservación'
              : 'Continuar'}
          </span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
