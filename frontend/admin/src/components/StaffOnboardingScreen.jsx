import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, Coffee, KeyRound, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { api } from '../api/cliente';
import { reglas } from '../utils/validacion';
import { AlertCard } from './ui/AlertSystem';
import { MainLoader } from './ui/MainLoader';

export function StaffOnboardingScreen({ token, onCompleted, onGoLogin }) {
  const [cargando, setCargando] = useState(true);
  const [invitacion, setInvitacion] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');

  const [form, setForm] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    password: '',
    confirmarPassword: ''
  });
  const [errores, setErrores] = useState({});
  const [errorSubmit, setErrorSubmit] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [registroSinPanel, setRegistroSinPanel] = useState(false);

  useEffect(() => {
    let activo = true;
    api(`/auth/invitacion/${encodeURIComponent(token)}`)
      .then((datos) => {
        if (!activo) return;
        setInvitacion(datos);
      })
      .catch((err) => {
        if (!activo) return;
        setErrorCarga(err.message || 'El enlace de invitación no es válido o ya expiró.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [token]);

  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: null }));
    setErrorSubmit('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      nombres: reglas.nombrePersona(form.nombres, { min: 2, max: 80 }),
      apellidoPaterno: reglas.nombrePersona(form.apellidoPaterno, { min: 2, max: 60 }),
      apellidoMaterno: reglas.nombrePersona(form.apellidoMaterno, { min: 2, max: 60, opcional: true }),
      password:
        !form.password || form.password.length < 8
          ? 'La contraseña debe tener al menos 8 caracteres.'
          : !(/[A-Za-z]/.test(form.password) && /\d/.test(form.password))
            ? 'Incluye al menos una letra y un número.'
            : null,
      confirmarPassword:
        form.confirmarPassword !== form.password ? 'Las contraseñas no coinciden.' : null
    };
    setErrores(errs);
    if (Object.values(errs).some(Boolean) || guardando) return;

    setGuardando(true);
    setErrorSubmit('');
    try {
      const resp = await api('/auth/invitacion/completar', {
        metodo: 'POST',
        body: {
          token,
          nombres: form.nombres.trim(),
          apellidoPaterno: form.apellidoPaterno.trim(),
          apellidoMaterno: form.apellidoMaterno.trim() || undefined,
          password: form.password
        }
      });
      if (resp.token) {
        onCompleted(resp);
      } else {
        setRegistroSinPanel(true);
      }
    } catch (err) {
      setErrorSubmit(err.message || 'No se pudo completar tu registro.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <MainLoader texto="Validando tu invitación..." />;
  }

  if (errorCarga) {
    return (
      <div className="min-h-screen w-screen bg-[#FAF7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <AlertCard
            variante="error"
            titulo="Invitación no disponible"
            mensaje={errorCarga}
            accionTexto="Ir al inicio de sesión"
            onAccion={onGoLogin}
          />
        </div>
      </div>
    );
  }

  if (registroSinPanel) {
    return (
      <div className="min-h-screen w-screen bg-[#FAF7F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <AlertCard
            variante="exito"
            titulo="¡Registro completado!"
            mensaje="Tus datos quedaron registrados en el equipo de Café Marfil. Ya puedes cerrar esta ventana."
            accionTexto="Ir al inicio"
            onAccion={onGoLogin}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#FAF7F5] flex items-center justify-center p-4 sm:p-6 font-body">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#1F1410]/10 shadow-xl overflow-hidden">
        {/* Cabecera Café Marfil con datos asignados por el admin */}
        <div className="bg-[#1F1410] p-6 sm:p-7 border-b-4 border-[#E12927] text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E12927] flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCEAE9]/80">
                CAFÉ MARFIL · ALTA DE EQUIPO
              </div>
              <h1 className="font-display font-bold text-2xl leading-tight">
                Termina tu registro
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white">
              <Mail className="w-3 h-3 text-[#FCEAE9]" /> {invitacion.email}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E12927] text-white uppercase font-bold">
              <ShieldCheck className="w-3 h-3" /> {invitacion.puesto} ({invitacion.rol})
            </span>
            {invitacion.sucursalNombre && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white">
                <MapPin className="w-3 h-3 text-[#FCEAE9]" /> {invitacion.sucursalNombre}
              </span>
            )}
            {invitacion.turno && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white">
                <Clock className="w-3 h-3 text-[#FCEAE9]" /> Turno: {invitacion.turno}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-7 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
              Nombre(s) *
            </label>
            <input
              type="text"
              value={form.nombres}
              onChange={(e) => actualizar('nombres', e.target.value)}
              placeholder="Ej. Andrea"
              autoComplete="given-name"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                errores.nombres ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
              }`}
            />
            {errores.nombres && <p className="text-xs font-semibold text-[#E12927] mt-1">{errores.nombres}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                Apellido Paterno *
              </label>
              <input
                type="text"
                value={form.apellidoPaterno}
                onChange={(e) => actualizar('apellidoPaterno', e.target.value)}
                placeholder="Ej. Morales"
                autoComplete="family-name"
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.apellidoPaterno ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.apellidoPaterno && (
                <p className="text-xs font-semibold text-[#E12927] mt-1">{errores.apellidoPaterno}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                Apellido Materno
              </label>
              <input
                type="text"
                value={form.apellidoMaterno}
                onChange={(e) => actualizar('apellidoMaterno', e.target.value)}
                placeholder="Opcional"
                autoComplete="additional-name"
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.apellidoMaterno ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.apellidoMaterno && (
                <p className="text-xs font-semibold text-[#E12927] mt-1">{errores.apellidoMaterno}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
              Contraseña * (mín. 8 caracteres, letra y número)
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => actualizar('password', e.target.value)}
              autoComplete="new-password"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                errores.password ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
              }`}
            />
            {errores.password && <p className="text-xs font-semibold text-[#E12927] mt-1">{errores.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              value={form.confirmarPassword}
              onChange={(e) => actualizar('confirmarPassword', e.target.value)}
              autoComplete="new-password"
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                errores.confirmarPassword ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
              }`}
            />
            {errores.confirmarPassword && (
              <p className="text-xs font-semibold text-[#E12927] mt-1">{errores.confirmarPassword}</p>
            )}
          </div>

          {errorSubmit && <AlertCard variante="error" mensaje={errorSubmit} />}

          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>{guardando ? 'Creando cuenta...' : 'Completar registro y entrar'}</span>
            {!guardando && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onGoLogin}
              className="text-xs font-mono text-[#1F1410]/55 hover:text-[#E12927] cursor-pointer"
            >
              ¿Ya tienes cuenta? Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
