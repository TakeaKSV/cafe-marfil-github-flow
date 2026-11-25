import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, LogIn, RefreshCw, UserPlus } from 'lucide-react';
import { sounds } from '../utils/audio';
import { reglas, useFormulario } from '../utils/validacion';

const claseInput = (tieneError) =>
  `p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none transition-colors ${
    tieneError ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
  }`;
const CLASE_LABEL = 'font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider';

/**
 * Acceso a la cuenta Club Marfil: iniciar sesión, crear cuenta o confirmar código de 6 dígitos.
 */
export default function AuthScreen({
  onLogin,
  onRegister,
  onVerifyCode,
  onResendCode,
  onForgotPassword,
  motivo
}) {
  const [modo, setModo] = useState('entrar'); // entrar | registrar | verificar
  const [emailPendiente, setEmailPendiente] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [reenviando, setReenviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const esRegistro = modo === 'registrar';

  const esquema = useMemo(
    () => ({
      nombre: (v) => (esRegistro ? reglas.nombre(v, { min: 2, max: 120, etiqueta: 'Tu nombre' }) : null),
      correo: (v) => reglas.email(v),
      telefono: (v) => (esRegistro ? reglas.telefonoMX(v, { opcional: true }) : null),
      password: (v) =>
        esRegistro ? reglas.passwordSegura(v) : reglas.requerido(v, 'Ingresa tu contraseña.'),
      confirmarPassword: (v, all) =>
        esRegistro ? reglas.confirmarPassword(v, all.password) : null
    }),
    [esRegistro]
  );

  const form = useFormulario(
    { nombre: '', correo: '', telefono: '', password: '', confirmarPassword: '' },
    esquema
  );

  const cambiarModo = (nuevo) => {
    sounds.playClick();
    setModo(nuevo);
    setErrorGeneral('');
    setErrorCodigo('');
    form.setErrores({});
  };

  const abrirVerificacion = (correo) => {
    setEmailPendiente(correo);
    setCodigo('');
    setErrorCodigo('');
    setErrorGeneral('');
    setModo('verificar');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setErrorGeneral('');

    const camposActivos = esRegistro
      ? ['nombre', 'correo', 'telefono', 'password', 'confirmarPassword']
      : ['correo', 'password'];
    const { valido } = form.validarTodo(camposActivos);
    if (!valido) return;

    setEnviando(true);
    try {
      const correoLimpio = form.valores.correo.trim().toLowerCase();
      if (esRegistro) {
        const resp = await onRegister({
          nombre: form.valores.nombre.trim(),
          email: correoLimpio,
          password: form.valores.password,
          telefono: form.valores.telefono.trim() || undefined
        });
        if (resp?.requiereVerificacion) {
          abrirVerificacion(resp.email || correoLimpio);
        }
      } else {
        await onLogin(correoLimpio, form.valores.password);
      }
    } catch (err) {
      const requiereVerif =
        err?.status === 403 &&
        Array.isArray(err?.detalles) &&
        err.detalles.some((d) => d.mensaje === 'requiere_verificacion');

      if (requiereVerif) {
        const correoLimpio = form.valores.correo.trim().toLowerCase();
        abrirVerificacion(correoLimpio);
        setErrorGeneral(err.message);
        if (onResendCode) onResendCode(correoLimpio).catch(() => {});
      } else {
        const mapeado = form.aplicarErroresApi(err, { email: 'correo' });
        if (!mapeado) setErrorGeneral(err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setErrorCodigo('');
    setErrorGeneral('');

    const limpio = codigo.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(limpio)) {
      setErrorCodigo('Ingresa los 6 dígitos numéricos enviados a tu correo.');
      return;
    }

    setEnviando(true);
    try {
      await onVerifyCode(emailPendiente, limpio);
    } catch (err) {
      setErrorCodigo(err.message || 'Código incorrecto o expirado.');
    } finally {
      setEnviando(false);
    }
  };

  const handleReenviar = async () => {
    if (!onResendCode || reenviando) return;
    sounds.playClick();
    setReenviando(true);
    setErrorCodigo('');
    try {
      await onResendCode(emailPendiente);
    } catch (err) {
      setErrorCodigo(err.message);
    } finally {
      setReenviando(false);
    }
  };

  const renderError = (campo) =>
    form.errores[campo] ? (
      <p id={`error-${campo}`} role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5">
        {form.errores[campo]}
      </p>
    ) : null;

  if (modo === 'verificar') {
    return (
      <div className="flex flex-col gap-6 fade-in pb-16 max-w-xl mx-auto w-full">
        <button
          type="button"
          onClick={() => cambiarModo('entrar')}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#8E7A74] hover:text-[#E12927] bg-transparent border-none p-0 cursor-pointer self-start"
        >
          <ArrowLeft size={15} />
          <span>Volver a iniciar sesión</span>
        </button>

        <form
          onSubmit={handleVerificarCodigo}
          noValidate
          className="p-6 sm:p-8 rounded-xl bg-white border-2 border-stone-300 flex flex-col gap-5 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shrink-0">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#1F1410] m-0">
                Confirma tu correo
              </h1>
              <p className="font-body text-xs sm:text-sm text-[#6E5A52] m-0">
                Ingresa el código de 6 dígitos enviado a <strong className="text-[#1F1410]">{emailPendiente}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-codigo" className={CLASE_LABEL}>
              CÓDIGO DE 6 DÍGITOS *
            </label>
            <input
              id="auth-codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6));
                setErrorCodigo('');
              }}
              placeholder="000000"
              className={`p-4 rounded-xl border-2 bg-[#FAF7F5] font-mono text-2xl font-bold text-center tracking-[0.45em] text-[#1F1410] focus:outline-none transition-colors ${
                errorCodigo ? 'border-[#E12927]' : 'border-stone-300 focus:border-[#E12927]'
              }`}
            />
            {errorCodigo && (
              <p role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5 text-center">
                {errorCodigo}
              </p>
            )}
          </div>

          {errorGeneral && (
            <div role="alert" className="p-3.5 rounded-md bg-[#FCEAE9] border border-[#E12927]/40 flex items-start gap-2.5">
              <AlertCircle size={17} className="text-[#E12927] shrink-0 mt-0.5" />
              <span className="font-body text-xs text-[#1F1410] font-medium">{errorGeneral}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || codigo.length !== 6}
            className="p-3.5 rounded-md bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <span>{enviando ? 'Verificando...' : 'Confirmar código y entrar'}</span>
            {!enviando && <ArrowRight size={16} />}
          </button>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
            <span className="font-body text-[#8E7A74]">¿No recibiste el código?</span>
            <button
              type="button"
              disabled={reenviando}
              onClick={handleReenviar}
              className="inline-flex items-center gap-1.5 font-mono font-bold text-[#E12927] hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={reenviando ? 'animate-spin' : ''} />
              <span>{reenviando ? 'Reenviando...' : 'Reenviar código'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 fade-in pb-16 max-w-xl mx-auto w-full">
      <div className="text-left">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1410] tracking-tight mb-3">
          Tu cuenta Club Marfil
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
          {motivo || 'Inicia sesión para ver tus sellos, beneficios y reservaciones.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'entrar', texto: 'Iniciar sesión', Icono: LogIn },
          { id: 'registrar', texto: 'Crear cuenta', Icono: UserPlus }
        ].map(({ id, texto, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => cambiarModo(id)}
            className={`p-3.5 rounded-md border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              modo === id
                ? 'bg-[#E12927] text-white border-[#E12927] shadow-md'
                : 'bg-white border-stone-300 hover:border-[#E12927] text-[#1F1410] shadow-xs'
            }`}
          >
            <Icono size={15} />
            <span>{texto}</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-7 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-4 shadow-md"
      >
        {esRegistro && (
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-nombre" className={CLASE_LABEL}>NOMBRE COMPLETO *</label>
            <input
              id="auth-nombre"
              type="text"
              value={form.valores.nombre}
              onChange={(e) => form.setCampo('nombre', e.target.value)}
              placeholder="Ej. Sofía Navarro"
              autoComplete="name"
              className={claseInput(form.errores.nombre)}
              {...form.propsCampo('nombre')}
            />
            {renderError('nombre')}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="auth-correo" className={CLASE_LABEL}>CORREO ELECTRÓNICO *</label>
          <input
            id="auth-correo"
            type="email"
            value={form.valores.correo}
            onChange={(e) => form.setCampo('correo', e.target.value)}
            placeholder="tu.correo@ejemplo.com"
            autoComplete="email"
            className={claseInput(form.errores.correo)}
            {...form.propsCampo('correo')}
          />
          {renderError('correo')}
        </div>

        {esRegistro && (
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-telefono" className={CLASE_LABEL}>TELÉFONO / WHATSAPP (OPCIONAL)</label>
            <input
              id="auth-telefono"
              type="tel"
              value={form.valores.telefono}
              onChange={(e) => form.setCampo('telefono', e.target.value)}
              placeholder="(618) 123-4567"
              autoComplete="tel"
              className={claseInput(form.errores.telefono)}
              {...form.propsCampo('telefono')}
            />
            {renderError('telefono')}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="auth-password" className={CLASE_LABEL}>
            CONTRASEÑA *{esRegistro && ' (MÍN. 8 CARACTERES, LETRA Y NÚMERO)'}
          </label>
          <input
            id="auth-password"
            type="password"
            value={form.valores.password}
            onChange={(e) => form.setCampo('password', e.target.value)}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            className={claseInput(form.errores.password)}
            {...form.propsCampo('password')}
          />
          {renderError('password')}
        </div>

        {esRegistro && (
          <div className="flex flex-col gap-1">
            <label htmlFor="auth-confirmar" className={CLASE_LABEL}>CONFIRMAR CONTRASEÑA *</label>
            <input
              id="auth-confirmar"
              type="password"
              value={form.valores.confirmarPassword}
              onChange={(e) => form.setCampo('confirmarPassword', e.target.value)}
              autoComplete="new-password"
              className={claseInput(form.errores.confirmarPassword)}
              {...form.propsCampo('confirmarPassword')}
            />
            {renderError('confirmarPassword')}
          </div>
        )}

        {!esRegistro && onForgotPassword && (
          <div className="text-right -mt-1">
            <button
              type="button"
              onClick={onForgotPassword}
              className="font-mono text-xs font-bold text-[#8E7A74] hover:text-[#E12927] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {errorGeneral && (
          <div role="alert" className="p-3.5 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#E12927] shrink-0 mt-0.5" />
            <span className="font-body text-xs sm:text-sm text-[#1F1410] font-medium">{errorGeneral}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-1 p-3.5 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <span>{enviando ? 'Un momento...' : esRegistro ? 'Crear cuenta y recibir código' : 'Entrar a mi cuenta'}</span>
          {!enviando && <ArrowRight size={16} />}
        </button>

        <p className="font-body text-xs text-[#8E7A74] m-0 font-medium text-center">
          {esRegistro
            ? 'Te enviaremos un código de 6 dígitos para confirmar tu identidad antes de iniciar sesión.'
            : 'Para reservar una mesa no necesitas cuenta: puedes hacerlo como invitado.'}
        </p>
      </form>
    </div>
  );
}
