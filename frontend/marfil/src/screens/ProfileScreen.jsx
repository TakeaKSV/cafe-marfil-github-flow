import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Gift,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  Sun,
  X
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { reglas, useFormulario, sanitizar } from '../utils/validacion';

function separarNombreFallback(perfil) {
  if (perfil.nombres || perfil.apellidoPaterno) {
    return {
      nombres: perfil.nombres || '',
      apellidoPaterno: perfil.apellidoPaterno || '',
      apellidoMaterno: perfil.apellidoMaterno || ''
    };
  }
  const partes = String(perfil.nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return { nombres: partes[0] || '', apellidoPaterno: '', apellidoMaterno: '' };
  if (partes.length === 2) return { nombres: partes[0], apellidoPaterno: partes[1], apellidoMaterno: '' };
  return {
    nombres: partes.slice(0, -2).join(' '),
    apellidoPaterno: partes[partes.length - 2],
    apellidoMaterno: partes[partes.length - 1]
  };
}

export default function ProfileScreen({
  perfil,
  onUpdatePerfil,
  onLogout,
  onViewReservations,
  onViewBenefits,
  theme,
  toggleTheme,
  reservacionesCount = 0,
  beneficiosCount = 0
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [leche] = useState(perfil.preferencias?.lechePreferida || 'Leche de avena');
  const [bebida] = useState(perfil.preferencias?.bebidaFavorita || 'Flat White 12oz');
  const [experiencia] = useState(perfil.preferencias?.experienciaFavorita || 'Noche de Juegos');

  const inicialesNombre = separarNombreFallback(perfil);
  const form = useFormulario(
    {
      nombres: inicialesNombre.nombres,
      apellidoPaterno: inicialesNombre.apellidoPaterno,
      apellidoMaterno: inicialesNombre.apellidoMaterno,
      telefono: perfil.telefono || '',
      correo: perfil.correo || ''
    },
    {
      nombres: (v) => reglas.nombre(v, { min: 2, max: 80, etiqueta: 'Tu(s) nombre(s)' }),
      apellidoPaterno: (v) => reglas.nombre(v, { min: 2, max: 60, etiqueta: 'Tu apellido paterno' }),
      apellidoMaterno: (v) => reglas.nombre(v, { min: 2, max: 60, opcional: true, etiqueta: 'Tu apellido materno' }),
      telefono: (v) => reglas.telefonoMX(v, { opcional: true }),
      correo: (v) => reglas.email(v)
    }
  );

  const openEditor = () => {
    sounds.playClick();
    const p = separarNombreFallback(perfil);
    form.resetear({
      nombres: p.nombres,
      apellidoPaterno: p.apellidoPaterno,
      apellidoMaterno: p.apellidoMaterno,
      telefono: perfil.telefono || '',
      correo: perfil.correo || ''
    });
    setErrorGeneral('');
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setErrorGeneral('');
    const { valido } = form.validarTodo();
    if (!valido) return;
    setGuardando(true);
    try {
      const nombres = form.valores.nombres.trim();
      const apellidoPaterno = form.valores.apellidoPaterno.trim();
      const apellidoMaterno = form.valores.apellidoMaterno.trim();
      await onUpdatePerfil({
        ...perfil,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        nombre: [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' '),
        telefono: form.valores.telefono.trim(),
        correo: form.valores.correo.trim(),
        preferencias: {
          ...perfil.preferencias,
          lechePreferida: leche,
          bebidaFavorita: bebida,
          experienciaFavorita: experiencia
        }
      });
      setIsEditing(false);
    } catch (err) {
      const mapeado = form.aplicarErroresApi(err, { email: 'correo' });
      if (!mapeado) setErrorGeneral(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const sellosActuales = Math.max(0, perfil.sellosActuales ?? 0);
  const sellosMeta = Math.max(1, perfil.sellosTotalesParaMeta ?? 8);
  const sellosFaltantes = Math.max(0, sellosMeta - sellosActuales);
  const progresoSellosPct = Math.min(100, Math.round((sellosActuales / sellosMeta) * 100));

  const camposCompletos = [
    Boolean(perfil.nombre),
    Boolean(perfil.correo),
    Boolean(perfil.telefono),
    Boolean(perfil.emailVerificado)
  ].filter(Boolean).length;
  const perfilCompletadoPct = Math.round((camposCompletos / 4) * 100);

  const iniciales = (perfil.nombre || 'CM')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const bebidaFav = perfil.preferencias?.frappeFavorito || perfil.preferencias?.cafeFavorito || bebida;
  const sucursalFav = perfil.preferencias?.sucursalFrecuente || perfil.ciudad || 'Durango, Dgo.';

  // Anillo abierto inferior (270° totales) reflejando los sellos
  const radio = 64;
  const circunferencia = 2 * Math.PI * radio;
  const arcoTotal = circunferencia * 0.75;
  const arcoActivo = arcoTotal * Math.max(0.06, progresoSellosPct / 100);

  return (
    <div className="w-full min-h-[calc(100dvh-72px)] lg:h-[calc(100dvh-72px)] lg:overflow-hidden bg-[#FAF7F5] dark:bg-[#150E0C] px-4 sm:px-8 lg:px-10 py-4 sm:py-5 pb-20 lg:pb-5 flex flex-col justify-center fade-in">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-4 sm:gap-5">
        {/* ==================================================================
            1. TARJETA PRINCIPAL DE SELLOS + AVATAR CON ANILLO
            ================================================================== */}
        <section className="bg-white dark:bg-[#1F1410] rounded-3xl border border-[#1F1410]/10 dark:border-white/10 shadow-[0_8px_30px_-18px_rgba(31,20,16,0.18)] p-5 sm:p-7 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Izquierda: Sellos grandes + subtítulo editorial + links */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-5xl sm:text-6xl text-[#1F1410] dark:text-[#FAF7F5] tracking-tight leading-none">
                {sellosActuales}
              </span>
              <span className="font-mono text-sm font-semibold text-[#1F1410]/50 dark:text-[#FAF7F5]/55">
                / {sellosMeta} sellos
              </span>
            </div>

            <h1 className="font-body text-lg sm:text-xl text-[#1F1410]/85 dark:text-[#FAF7F5]/90 mt-2 leading-snug">
              Hola,{' '}
              <span className="font-semibold text-[#1F1410] dark:text-white underline decoration-[#1F1410]/70 dark:decoration-white/70 underline-offset-4">
                {perfil.nombre}
              </span>{' '}
              · Nivel{' '}
              <span className="font-semibold text-[#E12927] underline decoration-[#E12927]/70 underline-offset-4">
                {perfil.nivelFidelidad || 'Club Marfil'}
              </span>
            </h1>

            <p className="font-body text-xs sm:text-sm text-[#1F1410]/65 dark:text-[#C5B3AA] mt-1.5 max-w-xl leading-relaxed">
              {sellosFaltantes === 0
                ? '¡Completaste tu hoja de sellos! Ya tienes una cortesía lista para canjear en barra.'
                : `¡Excelente! Te ${sellosFaltantes === 1 ? 'falta 1 visita' : `faltan ${sellosFaltantes} visitas`
                } para completar tu hoja (${progresoSellosPct}%) y desbloquear tu próxima cortesía.`}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
              <button
                type="button"
                onClick={openEditor}
                className="font-body text-xs font-medium text-[#1F1410]/70 dark:text-[#C5B3AA] hover:text-[#E12927] underline underline-offset-4 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                Editar mis datos
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onViewBenefits();
                }}
                className="font-body text-xs font-medium text-[#1F1410]/70 dark:text-[#C5B3AA] hover:text-[#E12927] underline underline-offset-4 cursor-pointer bg-transparent border-none p-0 transition-colors"
              >
                Ver mi pasaporte de sellos
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1 font-body text-xs font-medium text-[#E12927]/85 hover:text-[#E12927] underline underline-offset-4 cursor-pointer bg-transparent border-none p-0 transition-colors"
                >
                  <LogOut size={13} />
                  Cerrar sesión
                </button>
              )}
            </div>
          </div>

          {/* Derecha: Anillo circular de sellos + Avatar centrado */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 self-center sm:self-auto flex items-center justify-center">
            <svg viewBox="0 0 152 152" className="w-full h-full" aria-hidden="true">
              <defs>
                <linearGradient id="marfilRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F48B89" />
                  <stop offset="100%" stopColor="#E12927" />
                </linearGradient>
              </defs>
              <circle
                cx="76"
                cy="76"
                r={radio}
                fill="none"
                stroke="currentColor"
                className="text-[#1F1410]/10 dark:text-white/12"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${arcoTotal} ${circunferencia}`}
                transform="rotate(135 76 76)"
              />
              <circle
                cx="76"
                cy="76"
                r={radio}
                fill="none"
                stroke="url(#marfilRingGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${arcoActivo} ${circunferencia}`}
                transform="rotate(135 76 76)"
              />
            </svg>

            <div className="absolute inset-[17px] rounded-full bg-[#FCEAE9] dark:bg-[#2C1C18] border border-[#E12927]/15 flex flex-col items-center justify-center shadow-inner select-none">
              <span className="font-display font-bold text-2xl sm:text-3xl text-[#1F1410] dark:text-[#FAF7F5] leading-none">
                {iniciales}
              </span>
              {perfil.codigoCliente && (
                <span className="font-mono text-[9px] font-bold text-[#E12927] mt-1 tracking-wider">
                  {perfil.codigoCliente}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================================
            2. CUADRÍCULA COMPACTA DE DATOS (3x2 SIN SCROLL EN ESCRITORIO)
            ================================================================== */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-[#1F1410] dark:text-[#FAF7F5] tracking-tight">
              Tu cuenta Club Marfil
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#1F1410]/60 dark:text-[#C5B3AA]">
              Consulta y administra tus datos, reservaciones, cupones y favoritos en barra.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Perfil completado */}
            <button
              type="button"
              onClick={openEditor}
              className="group text-left bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 hover:border-[#E12927]/45 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Perfil completado
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FCEAE9] dark:bg-[#E12927]/20 text-[#E12927] font-mono text-[9px] font-bold uppercase tracking-wider">
                    EDITABLE
                  </span>
                </div>
                <ChevronRight size={15} className="text-[#1F1410]/35 dark:text-white/35 group-hover:text-[#E12927] transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span className="font-display font-bold text-2xl text-[#1F1410] dark:text-[#FAF7F5]">
                  {perfilCompletadoPct}%
                </span>
              </div>
            </button>

            {/* 2. Correo electrónico */}
            <button
              type="button"
              onClick={openEditor}
              className="group text-left bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 hover:border-[#E12927]/45 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Correo electrónico
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold uppercase tracking-wider ${perfil.emailVerificado
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-[#FCEAE9] dark:bg-[#E12927]/20 text-[#E12927]'
                      }`}
                  >
                    {perfil.emailVerificado ? 'VERIFICADO' : 'PENDIENTE'}
                  </span>
                </div>
                <ChevronRight size={15} className="text-[#1F1410]/35 dark:text-white/35 group-hover:text-[#E12927] transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={15} className="text-[#E12927] shrink-0" />
                <span className="font-body font-semibold text-sm text-[#1F1410] dark:text-[#FAF7F5] truncate">
                  {perfil.correo || 'Sin correo'}
                </span>
              </div>
            </button>

            {/* 3. Teléfono registrado */}
            <button
              type="button"
              onClick={openEditor}
              className="group text-left bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 hover:border-[#E12927]/45 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Teléfono
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FCEAE9] dark:bg-[#E12927]/20 text-[#E12927] font-mono text-[9px] font-bold uppercase tracking-wider">
                    RESERVAS
                  </span>
                </div>
                <ChevronRight size={15} className="text-[#1F1410]/35 dark:text-white/35 group-hover:text-[#E12927] transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-[#E12927] shrink-0" />
                <span className="font-mono font-bold text-base text-[#1F1410] dark:text-[#FAF7F5]">
                  {perfil.telefono || 'Sin registrar'}
                </span>
              </div>
            </button>

            {/* 4. Mis reservaciones */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onViewReservations();
              }}
              className="group text-left bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 hover:border-[#E12927]/45 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Mis reservaciones
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F5] dark:bg-white/10 text-[#1F1410]/70 dark:text-[#C5B3AA] font-mono text-[9px] font-bold uppercase tracking-wider">
                    HISTORIAL
                  </span>
                </div>
                <ChevronRight size={15} className="text-[#1F1410]/35 dark:text-white/35 group-hover:text-[#E12927] transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#E12927] shrink-0" />
                <span className="font-display font-bold text-2xl text-[#1F1410] dark:text-[#FAF7F5]">
                  {reservacionesCount}
                </span>
                <span className="font-body text-xs text-[#1F1410]/55 dark:text-[#C5B3AA]">
                  {reservacionesCount === 1 ? 'activa' : 'activas'}
                </span>
              </div>
            </button>

            {/* 5. Beneficios canjeables */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onViewBenefits();
              }}
              className="group text-left bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 hover:border-[#E12927]/45 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Beneficios
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FCEAE9] dark:bg-[#E12927]/20 text-[#E12927] font-mono text-[9px] font-bold uppercase tracking-wider">
                    CUPONES
                  </span>
                </div>
                <ChevronRight size={15} className="text-[#1F1410]/35 dark:text-white/35 group-hover:text-[#E12927] transition-colors shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-[#E12927] shrink-0" />
                <span className="font-display font-bold text-2xl text-[#1F1410] dark:text-[#FAF7F5]">
                  {beneficiosCount}
                </span>
                <span className="font-body text-xs text-[#1F1410]/55 dark:text-[#C5B3AA]">
                  {beneficiosCount === 1 ? 'disponible' : 'disponibles'}
                </span>
              </div>
            </button>

            {/* 6. Favoritos en barra & Sucursal */}
            <div className="bg-white dark:bg-[#1F1410] rounded-2xl border border-[#1F1410]/10 dark:border-white/10 p-4 shadow-2xs flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-body font-semibold text-xs sm:text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    Favoritos en barra
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF7F5] dark:bg-white/10 text-[#1F1410]/70 dark:text-[#C5B3AA] font-mono text-[9px] font-bold uppercase tracking-wider">
                    GUSTOS
                  </span>
                </div>
                <Coffee size={15} className="text-[#1F1410]/35 dark:text-white/35 shrink-0" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-body font-semibold text-sm text-[#1F1410] dark:text-[#FAF7F5] truncate">
                  {bebidaFav}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#1F1410]/60 dark:text-[#C5B3AA] truncate">
                  <MapPin size={11} className="text-[#E12927] shrink-0" />
                  {sucursalFav}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal compacto de edición de datos (sin scroll en la página) */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 bg-[#1F1410]/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1410] rounded-3xl border border-[#1F1410]/15 dark:border-white/15 shadow-2xl max-w-xl w-full p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#1F1410]/10 dark:border-white/10">
              <div>
                <h2 className="font-display font-bold text-lg text-[#1F1410] dark:text-[#FAF7F5]">
                  Editar datos personales
                </h2>
                <p className="text-xs text-[#1F1410]/60 dark:text-[#C5B3AA] mt-0.5">
                  Actualiza tu correo y teléfono para vincular tus reservaciones y cupones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Cerrar edición"
                className="w-8 h-8 rounded-full bg-[#FAF7F5] dark:bg-white/10 hover:bg-[#FCEAE9] text-[#1F1410]/60 dark:text-white/70 hover:text-[#E12927] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 dark:text-[#C5B3AA] mb-1">
                    Nombre(s) *
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={form.valores.nombres}
                    onChange={(e) => form.setCampo('nombres', sanitizar.nombrePersona(e.target.value, 80))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#261A16] text-[#1F1410] dark:text-[#FAF7F5] focus:outline-hidden ${form.errores.nombres ? 'border-[#E12927]' : 'border-[#1F1410]/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                    {...form.propsCampo('nombres')}
                  />
                  {form.errores.nombres && (
                    <p role="alert" className="text-[11px] text-[#E12927] font-semibold mt-0.5">{form.errores.nombres}</p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 dark:text-[#C5B3AA] mb-1">
                    Apellido paterno *
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={form.valores.apellidoPaterno}
                    onChange={(e) => form.setCampo('apellidoPaterno', sanitizar.nombrePersona(e.target.value, 60))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#261A16] text-[#1F1410] dark:text-[#FAF7F5] focus:outline-hidden ${form.errores.apellidoPaterno ? 'border-[#E12927]' : 'border-[#1F1410]/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                    {...form.propsCampo('apellidoPaterno')}
                  />
                  {form.errores.apellidoPaterno && (
                    <p role="alert" className="text-[11px] text-[#E12927] font-semibold mt-0.5">{form.errores.apellidoPaterno}</p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 dark:text-[#C5B3AA] mb-1">
                    Apellido materno
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={form.valores.apellidoMaterno}
                    onChange={(e) => form.setCampo('apellidoMaterno', sanitizar.nombrePersona(e.target.value, 60))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#1F1410]/15 dark:border-white/15 bg-white dark:bg-[#261A16] text-[#1F1410] dark:text-[#FAF7F5] focus:outline-hidden focus:border-[#E12927]"
                    {...form.propsCampo('apellidoMaterno')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 dark:text-[#C5B3AA] mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    maxLength={120}
                    value={form.valores.correo}
                    onChange={(e) => form.setCampo('correo', sanitizar.email(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-[#261A16] text-[#1F1410] dark:text-[#FAF7F5] focus:outline-hidden ${form.errores.correo ? 'border-[#E12927]' : 'border-[#1F1410]/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                    {...form.propsCampo('correo')}
                  />
                  {form.errores.correo && (
                    <p role="alert" className="text-[11px] text-[#E12927] font-semibold mt-0.5">{form.errores.correo}</p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold uppercase text-[#1F1410]/70 dark:text-[#C5B3AA] mb-1">
                    Teléfono (10 dígitos)
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.valores.telefono}
                    onChange={(e) => form.setCampo('telefono', sanitizar.telefono(e.target.value))}
                    placeholder="6181234567"
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border bg-white dark:bg-[#261A16] text-[#1F1410] dark:text-[#FAF7F5] focus:outline-hidden ${form.errores.telefono ? 'border-[#E12927]' : 'border-[#1F1410]/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                    {...form.propsCampo('telefono')}
                  />
                  {form.errores.telefono && (
                    <p role="alert" className="text-[11px] text-[#E12927] font-semibold mt-0.5">{form.errores.telefono}</p>
                  )}
                </div>
              </div>

              {errorGeneral && (
                <p role="alert" className="text-xs font-semibold text-[#E12927] bg-[#FCEAE9] dark:bg-[#E12927]/15 px-3 py-2 rounded-xl">
                  {errorGeneral}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#1F1410]/70 dark:text-[#C5B3AA] hover:bg-[#FAF7F5] dark:hover:bg-white/10 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-60 text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm transition-colors"
                >
                  <Check size={14} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
