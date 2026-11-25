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
  UserCheck
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
  reservacionesCount
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

  return (
    <div className="flex flex-col gap-8 fade-in pb-16">
      {/* Encabezado */}
      <div className="max-w-2xl text-left">

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-3">
          Mi Perfil & Fidelidad
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
          Administra tus datos, preferencias gastronómicas y consulta tus puntos del programa de lealtad <em>Café Marfil Durango</em>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-8 items-start">
        {/* Tarjeta de Usuario Principal HeroUI Card 100% Sólida */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-lg border-2 border-stone-300 p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md bg-[#1F1410] text-white flex items-center justify-center font-display text-2xl font-bold relative shadow-md">
                  <span>{perfil.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xs bg-[#E12927] text-white flex items-center justify-center text-xs shadow-xs border-2 border-white">
                    ★
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider bg-[#E12927] text-white mb-1 shadow-xs border border-[#E12927]">
                    <Award size={12} /> {perfil.nivelFidelidad}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#1F1410] leading-snug">
                    {perfil.nombre}
                  </h2>
                  <div className="flex items-center gap-1 font-mono text-xs text-[#8E7A74]">
                    <MapPin size={13} className="text-[#E12927]" /> {perfil.ciudad}
                  </div>
                </div>
              </div>

              <button
                className="w-10 h-10 rounded-md border-2 border-stone-300 bg-white flex items-center justify-center text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927] active:scale-95 transition-all cursor-pointer shadow-xs"
                onClick={() => {
                  sounds.playClick();
                  if (!isEditing) {
                    const p = separarNombreFallback(perfil);
                    form.resetear({
                      nombres: p.nombres,
                      apellidoPaterno: p.apellidoPaterno,
                      apellidoMaterno: p.apellidoMaterno,
                      telefono: perfil.telefono || '',
                      correo: perfil.correo || ''
                    });
                    setErrorGeneral('');
                  }
                  setIsEditing(!isEditing);
                }}
                title={isEditing ? 'Cancelar edición' : 'Editar información'}
              >
                <Edit2 size={16} />
              </button>
            </div>

            {/* Formulario de Edición o Vista */}
            {isEditing ? (
              <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 pt-2 border-t-2 border-stone-200">
                <div className="flex flex-col gap-1">
                  <label htmlFor="perfil-nombres" className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">
                    NOMBRE(S) *
                  </label>
                  <input
                    id="perfil-nombres"
                    type="text"
                    value={form.valores.nombres}
                    onChange={(e) => form.setCampo('nombres', e.target.value)}
                    className={`px-4 py-3 rounded-md border-2 bg-white text-sm font-body text-[#1F1410] focus:outline-none ${
                      form.errores.nombres ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
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
                    <label htmlFor="perfil-ap-paterno" className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">
                      APELLIDO PATERNO *
                    </label>
                    <input
                      id="perfil-ap-paterno"
                      type="text"
                      value={form.valores.apellidoPaterno}
                      onChange={(e) => form.setCampo('apellidoPaterno', e.target.value)}
                      className={`px-4 py-3 rounded-md border-2 bg-white text-sm font-body text-[#1F1410] focus:outline-none ${
                        form.errores.apellidoPaterno ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
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
                    <label htmlFor="perfil-ap-materno" className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">
                      APELLIDO MATERNO
                    </label>
                    <input
                      id="perfil-ap-materno"
                      type="text"
                      value={form.valores.apellidoMaterno}
                      onChange={(e) => form.setCampo('apellidoMaterno', e.target.value)}
                      placeholder="Opcional"
                      className={`px-4 py-3 rounded-md border-2 bg-white text-sm font-body text-[#1F1410] focus:outline-none ${
                        form.errores.apellidoMaterno ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
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

                <div className="flex flex-col gap-1">
                  <label htmlFor="perfil-telefono" className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">
                    TELÉFONO DE CONTACTO
                  </label>
                  <input
                    id="perfil-telefono"
                    type="tel"
                    value={form.valores.telefono}
                    onChange={(e) => form.setCampo('telefono', e.target.value)}
                    placeholder="(618) 123-4567"
                    className={`px-4 py-3 rounded-md border-2 bg-[#FAF7F5] text-sm font-body text-[#1F1410] focus:outline-none ${
                      form.errores.telefono ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
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
                  <label htmlFor="perfil-correo" className="font-mono text-[11px] font-bold text-[#8E7A74] tracking-wider uppercase">
                    CORREO ELECTRÓNICO *
                  </label>
                  <input
                    id="perfil-correo"
                    type="email"
                    value={form.valores.correo}
                    onChange={(e) => form.setCampo('correo', e.target.value)}
                    className={`px-4 py-3 rounded-md border-2 bg-[#FAF7F5] text-sm font-body text-[#1F1410] focus:outline-none ${
                      form.errores.correo ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
                    }`}
                    {...form.propsCampo('correo')}
                  />
                  {form.errores.correo && (
                    <p id="error-correo" role="alert" className="text-xs font-semibold text-[#E12927]">
                      {form.errores.correo}
                    </p>
                  )}
                </div>

                {errorGeneral && (
                  <p role="alert" className="text-xs font-semibold text-[#E12927] bg-[#FCEAE9] px-3 py-2 rounded-md border border-[#E12927]/30">
                    {errorGeneral}
                  </p>
                )}

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#1F1410] bg-white text-[#1F1410] hover:bg-[#1F1410] hover:text-white active:scale-95 transition-all cursor-pointer shadow-xs"
                    onClick={() => {
                      form.resetear({ nombre: perfil.nombre || '', telefono: perfil.telefono || '', correo: perfil.correo || '' });
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="inline-flex items-center gap-1.5 px-7 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60"
                  >
                    <Check size={16} />
                    <span>{guardando ? 'Guardando...' : 'Guardar cambios'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-body text-[#1F1410] font-medium pt-2 border-t-2 border-stone-200">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-[#E12927]" />
                  <span>{perfil.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-[#E12927]" />
                  <span>{perfil.correo}</span>
                </div>
              </div>
            )}

            {/* Métricas Rápidas HeroUI Stat slots */}
            <div className="flex items-center justify-around pt-4 border-t-2 border-stone-200 text-center">
              <div>
                <span className="block font-mono text-2xl font-bold text-[#E12927]">{perfil.visitasRealizadas}</span>
                <span className="font-body text-xs text-[#8E7A74] font-medium">Visitas a Marfil</span>
              </div>
              <div className="w-px h-8 bg-stone-300" />
              <div>
                <span className="block font-mono text-2xl font-bold text-[#E12927]">{reservacionesCount}</span>
                <span className="font-body text-xs text-[#8E7A74] font-medium">Reservaciones</span>
              </div>
              <div className="w-px h-8 bg-stone-300" />
              <div>
                <span className="block font-mono text-2xl font-bold text-[#E12927]">{perfil.puntosFidelidad}</span>
                <span className="font-body text-xs text-[#8E7A74] font-medium">Puntos Marfil</span>
              </div>
            </div>
          </div>

          {/* Preferencias de Café y Experiencia */}
          <div className="bg-white rounded-lg border-2 border-stone-300 p-6 sm:p-8 shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Coffee size={22} className="text-[#E12927]" />
              <h3 className="font-display text-xl font-bold text-[#1F1410]">Mis Preferencias Gastronómicas</h3>
            </div>
            <p className="font-body text-xs sm:text-sm text-[#8E7A74] -mt-1 font-medium">
              Personalizamos tus bebidas y recomendaciones de cocina al momento de ordenar en Durango.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
              <div className="p-4 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 shadow-xs">
                <span className="block font-mono text-[10px] font-bold text-[#E12927] tracking-wider uppercase mb-1">
                  BEBIDA FAVORITA
                </span>
                <strong className="font-body text-sm text-[#1F1410]">{perfil.preferencias?.frappeFavorito || perfil.preferencias?.cafeFavorito || 'Flat White 12oz'}</strong>
              </div>

              <div className="p-4 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 shadow-xs">
                <span className="block font-mono text-[10px] font-bold text-[#E12927] tracking-wider uppercase mb-1">
                  PLATILLO ESTRELLA
                </span>
                <strong className="font-body text-sm text-[#1F1410]">{perfil.preferencias?.platilloFavorito || 'Chilaquiles verdes con boneless'}</strong>
              </div>

              <div className="p-4 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 shadow-xs">
                <span className="block font-mono text-[10px] font-bold text-[#E12927] tracking-wider uppercase mb-1">
                  EXPERIENCIA PREFERIDA
                </span>
                <strong className="font-body text-sm text-[#1F1410]">Noche de Juegos de Mesa (+60 títulos)</strong>
              </div>

              <div className="p-4 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 shadow-xs">
                <span className="block font-mono text-[10px] font-bold text-[#E12927] tracking-wider uppercase mb-1">
                  SUCURSAL FRECUENTE
                </span>
                <strong className="font-body text-sm text-[#1F1410]">{perfil.preferencias?.sucursalFrecuente || 'Centro Histórico (Casona)'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Accesos Directos y Ajustes */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-lg border-2 border-stone-300 p-6 sm:p-7 shadow-md flex flex-col gap-4">
            <h3 className="font-display text-xl font-bold text-[#1F1410]">Accesos Rápidos</h3>

            <div className="flex flex-col gap-3">
              <div
                className="flex items-center justify-between p-4 rounded-md bg-white border-2 border-stone-300 hover:border-[#E12927] hover:bg-[#FCEAE9] hover:translate-x-1 transition-all cursor-pointer group shadow-xs"
                onClick={() => {
                  sounds.playClick();
                  onViewReservations();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-[#FCEAE9] text-[#E12927] flex items-center justify-center border-2 border-[#E12927]/30">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-body text-sm font-bold text-[#1F1410] m-0">Mis Reservaciones</h4>
                    <span className="font-mono text-xs text-[#8E7A74] font-medium">{reservacionesCount} activas</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#E12927] group-hover:translate-x-1 transition-transform" />
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-md bg-white border-2 border-stone-300 hover:border-[#E12927] hover:bg-[#FCEAE9] hover:translate-x-1 transition-all cursor-pointer group shadow-xs"
                onClick={() => {
                  sounds.playClick();
                  onViewBenefits();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-[#FCEAE9] text-[#E12927] flex items-center justify-center border-2 border-[#E12927]/30">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h4 className="font-body text-sm font-bold text-[#1F1410] m-0">Mis Beneficios & Sellos</h4>
                    <span className="font-mono text-xs text-[#8E7A74] font-medium">6 de 8 sellos completados</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#E12927] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Ajuste de Tema */}
          <div className="bg-white rounded-lg border-2 border-stone-300 p-6 shadow-md flex items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-base font-bold text-[#1F1410] mb-0.5">Modo de Lectura</h4>
              <p className="font-body text-xs text-[#8E7A74] m-0 font-medium">Ajusta la paleta visual para lectura diurna o nocturna.</p>
            </div>

            <button
              className="w-11 h-11 rounded-md border-2 border-stone-300 bg-white flex items-center justify-center text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927] active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
              onClick={() => {
                sounds.playClick();
                toggleTheme();
              }}
              aria-label="Cambiar modo"
            >
              {theme === 'dark' ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-amber-500" />}
            </button>
          </div>

          {/* Cerrar sesión */}
          {onLogout && (
            <button
              type="button"
              className="p-3.5 rounded-md border-2 border-stone-300 bg-white font-mono text-xs font-bold uppercase tracking-wider text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927] active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              onClick={() => {
                sounds.playClick();
                onLogout();
              }}
            >
              Cerrar sesión
            </button>
          )}

          {/* Garantía de Comunidad */}
          <div className="bg-[#FCEAE9] rounded-lg border-2 border-[#E12927]/40 p-5 flex items-start gap-3.5 shadow-xs">
            <ShieldCheck size={24} className="text-[#E12927] shrink-0 mt-0.5" />
            <p className="font-body text-xs text-[#1F1410] leading-relaxed m-0 font-medium">
              Tus datos sólo se utilizan para gestionar tus reservaciones de mesa y validar tus sellos de fidelidad en Café Marfil Durango.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
