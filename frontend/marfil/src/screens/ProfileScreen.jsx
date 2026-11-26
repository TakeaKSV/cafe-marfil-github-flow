import React, { useState } from 'react';
import {
  MapPin,
  Award,
  Calendar,
  Gift,
  Coffee,
  Moon,
  Sun,
  Edit2,
  Check,
  ChevronRight,
  ShieldCheck,
  Phone,
  Mail,
  LogOut,
  Zap
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { reglas, useFormulario } from '../utils/validacion';

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
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'datos' | 'preferencias'
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
    setActiveTab('datos');
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

  const sellosActuales = perfil.sellosActuales ?? 0;
  const sellosMeta = perfil.sellosTotalesParaMeta ?? 8;
  const iniciales = (perfil.nombre || 'CM')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const bebidaFav = perfil.preferencias?.frappeFavorito || perfil.preferencias?.cafeFavorito || 'Flat White 12oz';
  const platilloFav = perfil.preferencias?.platilloFavorito || 'Chilaquiles verdes con boneless';
  const sucursalFav = perfil.preferencias?.sucursalFrecuente || 'Centro Histórico (Casona)';

  return (
    <div className="w-full min-h-[calc(100dvh-72px)] bg-[#FAF7F5] dark:bg-[#150E0C] overflow-x-clip fade-in pb-24 md:pb-12">
      {/* ====================================================================
          1. CABECERA CURVA ESTILO PERFIL REFERENCIA EN COLORES CAFÉ MARFIL
          ==================================================================== */}
      <div className="w-full bg-gradient-to-b from-[#8F191B] via-[#5E1416] to-[#1F1410] rounded-b-[40px] sm:rounded-b-[52px] text-white shadow-xl relative overflow-hidden">
        {/* Halos suaves */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[420px] h-[260px] rounded-full bg-[#E12927]/30 blur-3xl" />

        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-6 pb-8 sm:pb-10 relative z-10 flex flex-col items-center">
          {/* Botones circulares translúcidos en las esquinas superiores */}
          <div className="w-full flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                toggleTheme();
              }}
              aria-label="Cambiar modo oscuro o claro"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} />}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onLogout();
                }}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="w-11 h-11 rounded-full bg-white/15 hover:bg-[#E12927] backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <LogOut size={17} />
              </button>
            )}
          </div>

          {/* Medallón Avatar centrado */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/15 backdrop-blur-md border-4 border-white/25 shadow-2xl flex items-center justify-center font-display text-4xl sm:text-5xl font-bold text-white select-none mb-6">
            {iniciales}
          </div>

          {/* Fila inferior del banner curvo: Nombre + Nivel a la izquierda / 3 botones circulares blancos a la derecha */}
          <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="text-left">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                {perfil.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs sm:text-sm text-white/80">
                <span>{perfil.nivelFidelidad || 'Club Marfil'}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-[#FCEAE9]" />
                  {perfil.ciudad}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold">
                  <Zap size={11} className="fill-current text-amber-300" />
                  {perfil.puntosFidelidad ?? 0} pts
                </span>
              </div>
            </div>

            {/* 3 botones circulares blancos estilo referencia (Editar · Reservaciones · Beneficios) */}
            <div className="flex items-center gap-3 self-start sm:self-end">
              <button
                type="button"
                onClick={openEditor}
                title="Editar perfil"
                aria-label="Editar perfil"
                className="w-12 h-12 rounded-full bg-white dark:bg-[#2A1B18] text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:text-[#E12927] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Edit2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onViewReservations();
                }}
                title="Mis reservaciones"
                aria-label="Mis reservaciones"
                className="w-12 h-12 rounded-full bg-white dark:bg-[#2A1B18] text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:text-[#E12927] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Calendar size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onViewBenefits();
                }}
                title="Mis beneficios y sellos"
                aria-label="Mis beneficios y sellos"
                className="w-12 h-12 rounded-full bg-white dark:bg-[#2A1B18] text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:text-[#E12927] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Gift size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. FRANJA SUAVE CURVA DE 3 ESTADÍSTICAS (COMO 8 YEARS · 2.7K+ · 4.8)
          ==================================================================== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-4 relative z-0">
        <div className="rounded-b-[32px] bg-[#FCEAE9]/80 dark:bg-[#251815] pt-8 pb-5 px-5 sm:px-8 grid grid-cols-3 gap-3 sm:gap-6 shadow-xs border-x border-b border-[#E12927]/10 dark:border-white/10">
          <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5">
            <span className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1410] text-[#E12927] flex items-center justify-center shadow-2xs shrink-0">
              <Coffee size={18} />
            </span>
            <div className="text-left min-w-0">
              <strong className="block text-sm sm:text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5] leading-tight">
                {perfil.visitasRealizadas ?? 0} visitas
              </strong>
              <span className="block text-[11px] sm:text-xs text-[#6B5A52] dark:text-[#B4A099] truncate">
                Experiencia
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5">
            <span className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1410] text-[#E12927] flex items-center justify-center shadow-2xs shrink-0">
              <Award size={18} />
            </span>
            <div className="text-left min-w-0">
              <strong className="block text-sm sm:text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5] leading-tight">
                {perfil.puntosFidelidad ?? 0}
              </strong>
              <span className="block text-[11px] sm:text-xs text-[#6B5A52] dark:text-[#B4A099] truncate">
                Puntos Club
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5">
            <span className="w-10 h-10 rounded-full bg-white dark:bg-[#1F1410] text-[#E12927] flex items-center justify-center shadow-2xs shrink-0">
              <Gift size={18} />
            </span>
            <div className="text-left min-w-0">
              <strong className="block text-sm sm:text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5] leading-tight">
                {sellosActuales}/{sellosMeta}
              </strong>
              <span className="block text-[11px] sm:text-xs text-[#6B5A52] dark:text-[#B4A099] truncate">
                Sellos Marfil
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          3. SECCIÓN DE PESTAÑAS SUAVES + CONTENIDO COMPLETO DEL PERFIL
          ==================================================================== */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-7 flex flex-col gap-6">
        {/* Pestañas estilo selector de mes de la referencia */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'datos', label: 'Mis datos' },
            { id: 'preferencias', label: 'Preferencias & Ajustes' }
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#FCEAE9] dark:bg-[#3A1E1C] text-[#E12927] font-bold shadow-2xs'
                    : 'text-[#8E7A74] dark:text-[#A9968F] hover:text-[#1F1410] dark:hover:text-[#FAF7F5]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ==================================================================
            4. CONTENIDO POR PESTAÑA
            ================================================================== */}
        {activeTab === 'resumen' && (
          <div className="flex flex-col gap-6">
            {/* Tarjetas de acceso rápido limpias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Card 1: Mis Reservaciones */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onViewReservations();
                }}
                className="group text-left p-5 rounded-[24px] bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-11 h-11 rounded-2xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center">
                    <Calendar size={20} />
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#1F1410] dark:bg-[#E12927] text-white text-xs font-bold">
                    {reservacionesCount} activas
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1410] dark:text-[#FAF7F5] group-hover:text-[#E12927] transition-colors">
                    Mis Reservaciones
                  </h3>
                  <p className="text-xs text-[#6B5A52] dark:text-[#B4A099] mt-0.5">
                    Consulta tus mesas, actividades y pases QR.
                  </p>
                </div>
              </button>

              {/* Card 2: Pasaporte de Sellos */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onViewBenefits();
                }}
                className="group text-left p-5 rounded-[24px] bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-11 h-11 rounded-2xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center">
                    <Gift size={20} />
                  </span>
                  <span className="text-xs font-bold text-[#E12927]">
                    {beneficiosCount} premios
                  </span>
                </div>
                <div className="w-full">
                  <h3 className="text-base font-bold text-[#1F1410] dark:text-[#FAF7F5] group-hover:text-[#E12927] transition-colors">
                    Beneficios & Sellos
                  </h3>
                  <div className="grid grid-cols-8 gap-1 mt-2.5">
                    {Array.from({ length: sellosMeta }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-full ${
                          i < sellosActuales ? 'bg-[#E12927]' : 'bg-[#1F1410]/15 dark:bg-white/15'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </button>

              {/* Card 3: Preferencias */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('preferencias');
                }}
                className="group text-left p-5 rounded-[24px] bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="w-11 h-11 rounded-2xl bg-[#FCEAE9] dark:bg-[#321B19] text-[#E12927] flex items-center justify-center">
                    <Coffee size={20} />
                  </span>
                  <ChevronRight size={18} className="text-[#8E7A74] group-hover:text-[#E12927] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F1410] dark:text-[#FAF7F5] group-hover:text-[#E12927] transition-colors">
                    Tus Favoritos
                  </h3>
                  <p className="text-xs text-[#6B5A52] dark:text-[#B4A099] mt-0.5 truncate">
                    {bebidaFav} · {sucursalFav}
                  </p>
                </div>
              </button>
            </div>

            {/* Contacto rápido */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-4 rounded-2xl bg-white dark:bg-[#1F1410] border border-black/[0.06] dark:border-white/10 text-xs sm:text-sm text-[#5A4840] dark:text-[#C5B4AE]">
              {perfil.correo && (
                <span className="inline-flex items-center gap-2">
                  <Mail size={15} className="text-[#E12927]" />
                  {perfil.correo}
                </span>
              )}
              {perfil.telefono && (
                <span className="inline-flex items-center gap-2">
                  <Phone size={15} className="text-[#E12927]" />
                  {perfil.telefono}
                </span>
              )}
              <span className="inline-flex items-center gap-2 ml-auto text-xs text-[#8E7A74]">
                <ShieldCheck size={15} className="text-[#E12927]" />
                Datos protegidos en Café Marfil Durango
              </span>
            </div>

            {/* Botón CTA ancho completo estilo referencia (Book Appointment) */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onViewBenefits();
              }}
              className="w-full py-4 px-6 rounded-full bg-[#E12927] hover:bg-[#C81E1C] active:scale-[0.99] text-white text-sm sm:text-base font-bold shadow-lg shadow-[#E12927]/25 transition-all cursor-pointer"
            >
              Ver mi Pasaporte de Sellos · {sellosActuales} de {sellosMeta}
            </button>
          </div>
        )}

        {activeTab === 'datos' && (
          <div className="mt-6 max-w-2xl text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                  Información personal
                </h2>
                <p className="text-xs text-[#8E7A74] dark:text-[#A9968F]">
                  Mantén tus datos al día para agilizar tus reservaciones y acumular sellos.
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={openEditor}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F1410] dark:bg-[#FAF7F5] text-white dark:text-[#1F1410] text-xs font-semibold cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="perfil-nombres" className="text-xs font-semibold text-[#6B5A52] dark:text-[#C5B4AE]">
                    Nombre(s) *
                  </label>
                  <input
                    id="perfil-nombres"
                    type="text"
                    value={form.valores.nombres}
                    onChange={(e) => form.setCampo('nombres', e.target.value)}
                    className={`px-4 py-2.5 rounded-xl border bg-[#FAF7F5] dark:bg-[#261A16] text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none ${
                      form.errores.nombres ? 'border-[#E12927]' : 'border-black/15 dark:border-white/15 focus:border-[#E12927]'
                    }`}
                    {...form.propsCampo('nombres')}
                  />
                  {form.errores.nombres && (
                    <p id="error-nombres" role="alert" className="text-xs font-semibold text-[#E12927]">
                      {form.errores.nombres}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="perfil-ap-paterno" className="text-xs font-semibold text-[#6B5A52] dark:text-[#C5B4AE]">
                      Apellido paterno *
                    </label>
                    <input
                      id="perfil-ap-paterno"
                      type="text"
                      value={form.valores.apellidoPaterno}
                      onChange={(e) => form.setCampo('apellidoPaterno', e.target.value)}
                      className={`px-4 py-2.5 rounded-xl border bg-[#FAF7F5] dark:bg-[#261A16] text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none ${
                        form.errores.apellidoPaterno ? 'border-[#E12927]' : 'border-black/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                      {...form.propsCampo('apellidoPaterno')}
                    />
                    {form.errores.apellidoPaterno && (
                      <p id="error-apellidoPaterno" role="alert" className="text-xs font-semibold text-[#E12927]">
                        {form.errores.apellidoPaterno}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="perfil-ap-materno" className="text-xs font-semibold text-[#6B5A52] dark:text-[#C5B4AE]">
                      Apellido materno
                    </label>
                    <input
                      id="perfil-ap-materno"
                      type="text"
                      value={form.valores.apellidoMaterno}
                      onChange={(e) => form.setCampo('apellidoMaterno', e.target.value)}
                      placeholder="Opcional"
                      className={`px-4 py-2.5 rounded-xl border bg-[#FAF7F5] dark:bg-[#261A16] text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none ${
                        form.errores.apellidoMaterno ? 'border-[#E12927]' : 'border-black/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                      {...form.propsCampo('apellidoMaterno')}
                    />
                    {form.errores.apellidoMaterno && (
                      <p id="error-apellidoMaterno" role="alert" className="text-xs font-semibold text-[#E12927]">
                        {form.errores.apellidoMaterno}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="perfil-telefono" className="text-xs font-semibold text-[#6B5A52] dark:text-[#C5B4AE]">
                      Teléfono de contacto
                    </label>
                    <input
                      id="perfil-telefono"
                      type="tel"
                      value={form.valores.telefono}
                      onChange={(e) => form.setCampo('telefono', e.target.value)}
                      placeholder="(618) 123-4567"
                      className={`px-4 py-2.5 rounded-xl border bg-[#FAF7F5] dark:bg-[#261A16] text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none ${
                        form.errores.telefono ? 'border-[#E12927]' : 'border-black/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                      {...form.propsCampo('telefono')}
                    />
                    {form.errores.telefono && (
                      <p id="error-telefono" role="alert" className="text-xs font-semibold text-[#E12927]">
                        {form.errores.telefono}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="perfil-correo" className="text-xs font-semibold text-[#6B5A52] dark:text-[#C5B4AE]">
                      Correo electrónico *
                    </label>
                    <input
                      id="perfil-correo"
                      type="email"
                      value={form.valores.correo}
                      onChange={(e) => form.setCampo('correo', e.target.value)}
                      className={`px-4 py-2.5 rounded-xl border bg-[#FAF7F5] dark:bg-[#261A16] text-sm text-[#1F1410] dark:text-[#FAF7F5] focus:outline-none ${
                        form.errores.correo ? 'border-[#E12927]' : 'border-black/15 dark:border-white/15 focus:border-[#E12927]'
                      }`}
                      {...form.propsCampo('correo')}
                    />
                    {form.errores.correo && (
                      <p id="error-correo" role="alert" className="text-xs font-semibold text-[#E12927]">
                        {form.errores.correo}
                      </p>
                    )}
                  </div>
                </div>

                {errorGeneral && (
                  <p role="alert" className="text-xs font-semibold text-[#E12927] bg-[#FCEAE9] dark:bg-[#3A1C1A] px-3 py-2 rounded-xl">
                    {errorGeneral}
                  </p>
                )}

                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-semibold text-[#1F1410] dark:text-[#FAF7F5] cursor-pointer"
                    onClick={() => {
                      const p = separarNombreFallback(perfil);
                      form.resetear({
                        nombres: p.nombres,
                        apellidoPaterno: p.apellidoPaterno,
                        apellidoMaterno: p.apellidoMaterno,
                        telefono: perfil.telefono || '',
                        correo: perfil.correo || ''
                      });
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#E12927] hover:bg-[#C81E1C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shadow-sm"
                  >
                    <Check size={15} />
                    <span>{guardando ? 'Guardando...' : 'Guardar cambios'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Nombre completo</span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{perfil.nombre}</strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Nivel Club Marfil</span>
                  <strong className="inline-flex items-center gap-1.5 text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    <Award size={14} className="text-[#E12927]" />
                    {perfil.nivelFidelidad}
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Correo electrónico</span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{perfil.correo || 'Sin registrar'}</strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Teléfono</span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{perfil.telefono || 'Sin registrar'}</strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Ciudad</span>
                  <strong className="inline-flex items-center gap-1 text-sm text-[#1F1410] dark:text-[#FAF7F5]">
                    <MapPin size={13} className="text-[#E12927]" /> {perfil.ciudad}
                  </strong>
                </div>
                {perfil.codigoCliente && (
                  <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                    <span className="block text-[11px] text-[#8E7A74] dark:text-[#A9968F]">Código Club Marfil</span>
                    <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{perfil.codigoCliente}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preferencias' && (
          <div className="mt-6 flex flex-col gap-6 text-left">
            <div>
              <h2 className="text-lg font-bold text-[#1F1410] dark:text-[#FAF7F5] mb-1">
                Mis Preferencias Gastronómicas
              </h2>
              <p className="text-xs text-[#8E7A74] dark:text-[#A9968F]">
                Personalizamos tus bebidas y recomendaciones de cocina al ordenar en Durango.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[10px] font-bold text-[#E12927] uppercase tracking-wider mb-1">
                    Bebida favorita
                  </span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{bebidaFav}</strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[10px] font-bold text-[#E12927] uppercase tracking-wider mb-1">
                    Platillo estrella
                  </span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{platilloFav}</strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[10px] font-bold text-[#E12927] uppercase tracking-wider mb-1">
                    Experiencia preferida
                  </span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">Noche de Juegos de Mesa (+60 títulos)</strong>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16]">
                  <span className="block text-[10px] font-bold text-[#E12927] uppercase tracking-wider mb-1">
                    Sucursal frecuente
                  </span>
                  <strong className="text-sm text-[#1F1410] dark:text-[#FAF7F5]">{sucursalFav}</strong>
                </div>
              </div>
            </div>

            {/* Ajuste de Modo Oscuro / Claro */}
            <div className="p-5 rounded-2xl bg-[#FAF7F5] dark:bg-[#261A16] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1F1410] dark:text-[#FAF7F5]">
                  Apariencia del sistema ({theme === 'dark' ? 'Modo oscuro' : 'Modo claro'})
                </h3>
                <p className="text-xs text-[#8E7A74] dark:text-[#A9968F] mt-0.5">
                  Adapta la paleta visual de toda la app para lectura diurna o nocturna.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  toggleTheme();
                }}
                aria-label="Cambiar modo de apariencia"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1310] border border-black/15 dark:border-white/15 text-xs font-semibold text-[#1F1410] dark:text-[#FAF7F5] hover:border-[#E12927] transition-all cursor-pointer shrink-0"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span>Cambiar a claro</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} />
                    <span>Cambiar a oscuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
