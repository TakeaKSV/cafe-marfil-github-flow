import React, { useState } from 'react';
import { AlertCircle, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { sounds } from '../utils/audio';

const CLASE_INPUT =
  'p-3.5 rounded-md border-2 border-stone-300 bg-white font-body text-sm text-[#1F1410] focus:outline-none focus:border-[#E12927]';
const CLASE_LABEL = 'font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider';

/**
 * Acceso a la cuenta Club Marfil: iniciar sesión o crear cuenta.
 * Se muestra en lugar de las pantallas que necesitan saber quién es el cliente
 * (perfil y beneficios). `onLogin` y `onRegister` lanzan un error con el
 * mensaje a mostrar si la API rechaza los datos.
 */
export default function AuthScreen({ onLogin, onRegister, motivo }) {
  const [modo, setModo] = useState('entrar'); // entrar | registrar
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const esRegistro = modo === 'registrar';

  const cambiarModo = (nuevo) => {
    sounds.playClick();
    setModo(nuevo);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setError('');
    setEnviando(true);
    try {
      if (esRegistro) {
        await onRegister({ nombre: nombre.trim(), email: correo.trim(), password, telefono: telefono.trim() || undefined });
      } else {
        await onLogin(correo.trim(), password);
      }
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-lg bg-white border-2 border-stone-300 flex flex-col gap-4 shadow-md">
        {esRegistro && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-nombre" className={CLASE_LABEL}>NOMBRE COMPLETO *</label>
            <input
              id="auth-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre..."
              autoComplete="name"
              className={CLASE_INPUT}
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-correo" className={CLASE_LABEL}>CORREO ELECTRÓNICO *</label>
          <input
            id="auth-correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu.correo@ejemplo.com"
            autoComplete="email"
            className={CLASE_INPUT}
            required
          />
        </div>

        {esRegistro && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-telefono" className={CLASE_LABEL}>TELÉFONO / WHATSAPP (OPCIONAL)</label>
            <input
              id="auth-telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="(618) 123-4567"
              autoComplete="tel"
              className={CLASE_INPUT}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-password" className={CLASE_LABEL}>
            CONTRASEÑA *{esRegistro && ' (MÍNIMO 8 CARACTERES)'}
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={esRegistro ? 8 : undefined}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            className={CLASE_INPUT}
            required
          />
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-md bg-[#FCEAE9] border-2 border-[#E12927]/40 flex items-start gap-2.5">
            <AlertCircle size={18} className="text-[#E12927] shrink-0 mt-0.5" />
            <span className="font-body text-xs sm:text-sm text-[#1F1410] font-medium">{error}</span>
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
            ? 'Al crear tu cuenta recibes tu pasaporte de sellos Club Marfil.'
            : 'Para reservar una mesa no necesitas cuenta: puedes hacerlo como invitado.'}
        </p>
      </form>
    </div>
  );
}
