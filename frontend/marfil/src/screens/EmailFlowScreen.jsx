import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { api } from '../api/cliente';
import { sounds } from '../utils/audio';
import { reglas, useFormulario } from '../utils/validacion';

const claseInput = (tieneError) =>
  `p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none transition-colors ${
    tieneError ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
  }`;
const CLASE_LABEL = 'font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider';

/**
 * Pantallas del flujo de correo:
 *  - modo="verificar": valida el enlace recibido por correo (?verificar=...)
 *  - modo="olvide": solicita un correo de recuperación de contraseña
 *  - modo="restablecer": define una nueva contraseña con el token (?restablecer=...)
 */
export default function EmailFlowScreen({
  modo,
  token,
  onVerified,
  onGoLogin,
  onGoHome
}) {
  const [estadoVerif, setEstadoVerif] = useState('cargando'); // cargando | ok | error
  const [mensajeVerif, setMensajeVerif] = useState('');

  useEffect(() => {
    if (modo !== 'verificar') return undefined;
    let activo = true;
    const verificar = async () => {
      if (!token) {
        setEstadoVerif('error');
        setMensajeVerif('El enlace de verificación está incompleto.');
        return;
      }
      try {
        const resp = await api(`/auth/verificar?token=${encodeURIComponent(token)}&formato=json`);
        if (!activo) return;
        setEstadoVerif('ok');
        setMensajeVerif(resp?.mensaje || '¡Tu correo electrónico fue verificado correctamente!');
        if (onVerified) onVerified(resp?.cliente || null);
      } catch (err) {
        if (!activo) return;
        setEstadoVerif('error');
        setMensajeVerif(err.message || 'El enlace de verificación no es válido o ya expiró.');
      }
    };
    verificar();
    return () => {
      activo = false;
    };
  }, [modo, token, onVerified]);

  // --- Formulario: olvidé contraseña ---
  const [olvideEnviado, setOlvideEnviado] = useState('');
  const [olvideError, setOlvideError] = useState('');
  const [enviandoOlvide, setEnviandoOlvide] = useState(false);

  const esquemaOlvide = useMemo(() => ({ correo: (v) => reglas.email(v) }), []);
  const formOlvide = useFormulario({ correo: '' }, esquemaOlvide);

  const handleOlvideSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setOlvideError('');
    const { valido } = formOlvide.validarTodo(['correo']);
    if (!valido) return;

    setEnviandoOlvide(true);
    try {
      const resp = await api('/auth/password/olvide', {
        metodo: 'POST',
        body: { email: formOlvide.valores.correo.trim() }
      });
      setOlvideEnviado(
        resp?.mensaje || 'Si ese correo está registrado en Club Marfil, recibirás un enlace para restablecer tu contraseña.'
      );
    } catch (err) {
      const mapeado = formOlvide.aplicarErroresApi(err, { email: 'correo' });
      if (!mapeado) setOlvideError(err.message);
    } finally {
      setEnviandoOlvide(false);
    }
  };

  // --- Formulario: restablecer contraseña ---
  const [resetOk, setResetOk] = useState('');
  const [resetError, setResetError] = useState('');
  const [enviandoReset, setEnviandoReset] = useState(false);

  const esquemaReset = useMemo(
    () => ({
      password: (v) => reglas.passwordSegura(v),
      confirmarPassword: (v, all) => reglas.confirmarPassword(v, all.password)
    }),
    []
  );
  const formReset = useFormulario({ password: '', confirmarPassword: '' }, esquemaReset);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setResetError('');
    const { valido } = formReset.validarTodo(['password', 'confirmarPassword']);
    if (!valido) return;

    setEnviandoReset(true);
    try {
      const resp = await api('/auth/password/restablecer', {
        metodo: 'POST',
        body: { token, password: formReset.valores.password }
      });
      setResetOk(resp?.mensaje || 'Tu contraseña se actualizó correctamente.');
    } catch (err) {
      const mapeado = formReset.aplicarErroresApi(err);
      if (!mapeado) setResetError(err.message);
    } finally {
      setEnviandoReset(false);
    }
  };

  if (modo === 'verificar') {
    return (
      <div className="max-w-lg mx-auto my-8 pb-16 fade-in">
        <div className="bg-white rounded-xl border-2 border-stone-300 p-7 sm:p-8 shadow-md text-center flex flex-col items-center gap-4">
          {estadoVerif === 'cargando' && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#FCEAE9] text-[#E12927] flex items-center justify-center">
                <RefreshCw size={26} className="animate-spin" />
              </div>
              <h1 className="font-display text-2xl font-bold text-[#1F1410]">Verificando tu correo...</h1>
              <p className="font-body text-sm text-[#6E5A52]">Un segundo, estamos confirmando tu cuenta Club Marfil.</p>
            </>
          )}

          {estadoVerif === 'ok' && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#FCEAE9] text-[#E12927] flex items-center justify-center border-2 border-[#E12927]/30">
                <CheckCircle2 size={28} />
              </div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#E12927]">
                CORREO CONFIRMADO
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410]">¡Cuenta verificada!</h1>
              <p className="font-body text-sm text-[#1F1410]/80 leading-relaxed">{mensajeVerif}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-2 w-full">
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="px-6 py-3 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Ir a mi cuenta
                </button>
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-6 py-3 rounded-md bg-white border-2 border-stone-300 hover:border-[#1F1410] text-[#1F1410] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Ir al inicio
                </button>
              </div>
            </>
          )}

          {estadoVerif === 'error' && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#FCEAE9] text-[#E12927] flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <h1 className="font-display text-2xl font-bold text-[#1F1410]">No pudimos verificar el enlace</h1>
              <p className="font-body text-sm text-[#1F1410]/80 leading-relaxed">{mensajeVerif}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="px-6 py-3 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Ir a mi perfil
                </button>
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-6 py-3 rounded-md bg-white border-2 border-stone-300 text-[#1F1410] font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Volver al inicio
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (modo === 'olvide') {
    return (
      <div className="max-w-lg mx-auto my-6 pb-16 fade-in flex flex-col gap-6">
        <button
          type="button"
          onClick={onGoLogin}
          className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#8E7A74] hover:text-[#E12927] bg-transparent border-none p-0 cursor-pointer self-start"
        >
          <ArrowLeft size={15} />
          <span>Volver a iniciar sesión</span>
        </button>

        <div className="bg-white rounded-xl border-2 border-stone-300 p-6 sm:p-8 shadow-md flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#1F1410] m-0">Recuperar contraseña</h1>
              <p className="font-body text-xs sm:text-sm text-[#6E5A52] m-0">
                Te enviaremos un enlace seguro para crear una nueva contraseña.
              </p>
            </div>
          </div>

          {olvideEnviado ? (
            <div className="p-4 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/30 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={20} className="text-[#E12927] shrink-0 mt-0.5" />
                <p className="font-body text-sm text-[#1F1410] font-medium m-0">{olvideEnviado}</p>
              </div>
              <button
                type="button"
                onClick={onGoLogin}
                className="self-start px-5 py-2.5 rounded-md bg-[#1F1410] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleOlvideSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="olvide-correo" className={CLASE_LABEL}>CORREO REGISTRADO *</label>
                <input
                  id="olvide-correo"
                  type="email"
                  value={formOlvide.valores.correo}
                  onChange={(e) => formOlvide.setCampo('correo', e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  autoComplete="email"
                  className={claseInput(formOlvide.errores.correo)}
                  {...formOlvide.propsCampo('correo')}
                />
                {formOlvide.errores.correo && (
                  <p id="error-correo" role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5">
                    {formOlvide.errores.correo}
                  </p>
                )}
              </div>

              {olvideError && (
                <div role="alert" className="p-3 rounded-md bg-[#FCEAE9] border border-[#E12927]/40 flex items-start gap-2">
                  <AlertCircle size={16} className="text-[#E12927] shrink-0 mt-0.5" />
                  <span className="font-body text-xs text-[#1F1410] font-medium">{olvideError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={enviandoOlvide}
                className="p-3.5 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
              >
                <span>{enviandoOlvide ? 'Enviando...' : 'Enviar enlace de recuperación'}</span>
                {!enviandoOlvide && <ArrowRight size={15} />}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-6 pb-16 fade-in flex flex-col gap-6">
      <div className="bg-white rounded-xl border-2 border-stone-300 p-6 sm:p-8 shadow-md flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#FCEAE9] text-[#E12927] flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#1F1410] m-0">Nueva contraseña</h1>
            <p className="font-body text-xs sm:text-sm text-[#6E5A52] m-0">
              Elige una contraseña segura de al menos 8 caracteres con letras y números.
            </p>
          </div>
        </div>

        {resetOk ? (
          <div className="p-4 rounded-lg bg-[#FCEAE9] border-2 border-[#E12927]/30 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={20} className="text-[#E12927] shrink-0 mt-0.5" />
              <p className="font-body text-sm text-[#1F1410] font-medium m-0">{resetOk}</p>
            </div>
            <button
              type="button"
              onClick={onGoLogin}
              className="self-start px-5 py-2.5 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Iniciar sesión ahora
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="reset-password" className={CLASE_LABEL}>NUEVA CONTRASEÑA *</label>
              <input
                id="reset-password"
                type="password"
                value={formReset.valores.password}
                onChange={(e) => formReset.setCampo('password', e.target.value)}
                autoComplete="new-password"
                className={claseInput(formReset.errores.password)}
                {...formReset.propsCampo('password')}
              />
              {formReset.errores.password && (
                <p id="error-password" role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5">
                  {formReset.errores.password}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="reset-confirmar" className={CLASE_LABEL}>CONFIRMAR CONTRASEÑA *</label>
              <input
                id="reset-confirmar"
                type="password"
                value={formReset.valores.confirmarPassword}
                onChange={(e) => formReset.setCampo('confirmarPassword', e.target.value)}
                autoComplete="new-password"
                className={claseInput(formReset.errores.confirmarPassword)}
                {...formReset.propsCampo('confirmarPassword')}
              />
              {formReset.errores.confirmarPassword && (
                <p id="error-confirmarPassword" role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5">
                  {formReset.errores.confirmarPassword}
                </p>
              )}
            </div>

            {resetError && (
              <div role="alert" className="p-3 rounded-md bg-[#FCEAE9] border border-[#E12927]/40 flex items-start gap-2">
                <AlertCircle size={16} className="text-[#E12927] shrink-0 mt-0.5" />
                <span className="font-body text-xs text-[#1F1410] font-medium">{resetError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={enviandoReset}
              className="p-3.5 rounded-md bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
            >
              <span>{enviandoReset ? 'Guardando...' : 'Actualizar contraseña'}</span>
              {!enviandoReset && <ArrowRight size={15} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
