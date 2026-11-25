import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { sounds } from '../utils/audio';
import { reglas, useFormulario } from '../utils/validacion';

const claseInput = (tieneError) =>
  `p-3.5 rounded-md border-2 bg-white font-body text-sm text-[#1F1410] focus:outline-none transition-colors ${
    tieneError ? 'border-[#E12927] bg-[#FCEAE9]/20' : 'border-stone-300 focus:border-[#E12927]'
  }`;
const CLASE_LABEL = 'font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider';

/**
 * Acceso a la cuenta Club Marfil: iniciar sesión o crear cuenta.
 */
export default function AuthScreen({ onLogin, onRegister, onForgotPassword, motivo }) {
  const [modo, setModo] = useState('entrar'); // entrar | registrar
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
    form.setErrores({});
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
      if (esRegistro) {
        await onRegister({
          nombre: form.valores.nombre.trim(),
          email: form.valores.correo.trim(),
          password: form.valores.password,
          telefono: form.valores.telefono.trim() || undefined
        });
      } else {
        await onLogin(form.valores.correo.trim(), form.valores.password);
      }
    } catch (err) {
      const mapeado = form.aplicarErroresApi(err, { email: 'correo' });
      if (!mapeado) setErrorGeneral(err.message);
      setEnviando(false);
    }
  };

  const renderError = (campo) =>
    form.errores[campo] ? (
      <p id={`error-${campo}`} role="alert" className="font-body text-xs text-[#E12927] font-semibold mt-0.5">
        {form.errores[campo]}
      </p>
    ) : null;

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
          <span>{enviando ? 'Un momento...' : esRegistro ? 'Crear mi cuenta' : 'Entrar a mi cuenta'}</span>
          {!enviando && <ArrowRight size={16} />}
        </button>

        <p className="font-body text-xs text-[#8E7A74] m-0 font-medium text-center">
          {esRegistro
            ? 'Al crear tu cuenta recibirás un correo para verificar tu dirección.'
            : 'Para reservar una mesa no necesitas cuenta: puedes hacerlo como invitado.'}
        </p>
      </form>
    </div>
  );
}
