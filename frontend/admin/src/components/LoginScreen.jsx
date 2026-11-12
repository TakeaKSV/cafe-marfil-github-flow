import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Coffee,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const LoginScreen = ({ onLogin, soundEnabled = true }) => {
  const [username, setUsername] = useState('admin@cafemarfil.mx');
  const [password, setPassword] = useState('marfil2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa usuario y contraseña.');
      if (soundEnabled) playSound('alert');
      return;
    }

    setIsLoading(true);
    if (soundEnabled) playSound('toggle');

    // onLogin valida las credenciales contra la API; si falla lanza el mensaje a mostrar.
    try {
      await onLogin(username.trim(), password);
      if (soundEnabled) playSound('success');
    } catch (error) {
      setErrorMessage(error.message);
      if (soundEnabled) playSound('alert');
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setUsername('admin@cafemarfil.mx');
    setPassword('marfil2026');
    setErrorMessage('');
    if (soundEnabled) playSound('coin');
  };

  return (
    <div className="h-screen w-screen bg-[#1F1410] flex flex-col lg:flex-row overflow-hidden font-body selection:bg-[#E12927] selection:text-white relative">

      {/* ========================================================= */}
      {/* SECCIÓN IZQUIERDA: LONA BLANCA CON ONDA ORGÁNICA & HERO CUP */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[58%] h-full relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden shrink-0 z-10">

          {/* Fondo Blanco con Corte Curvo Orgánico (SVG S-Curve) hacia la sección oscura */}
          <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              {/* Onda orgánica: recta en extremos, arco convexo amplio y curva cóncava suave */}
              <path
                d="M 0,0 L 720,0 C 780,180 1000,280 1000,500 C 1000,720 820,820 940,1000 L 0,1000 Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          {/* 1. Header de Marca (Top-Left) */}
          <div className="flex items-center gap-3.5 relative z-20">
            <div className="w-12 h-12 rounded-2xl bg-[#FCEAE9] border border-[#E12927]/25 flex items-center justify-center shadow-xs shrink-0 overflow-hidden p-1.5">
              <img
                src="/images/logo_badge_rosa.png"
                alt="Café Marfil Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/logo_rojo_marfil.png';
                }}
              />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410] tracking-tight leading-none">
                Café Marfil
              </h2>
              <span className="text-[10px] sm:text-[11px] font-mono text-[#E12927] font-bold tracking-wider uppercase block mt-1">
                Urban Brunch & All-Day Dining · Durango
              </span>
            </div>
          </div>

          {/* 2. Ilustración Central con marfil_hero_cup.png y burbujas orgánicas */}
          <div className="flex-1 flex items-center justify-center relative my-4 z-20">

            {/* Burbuja orgánica suave de fondo en Rosa Muy Claro (#FCEAE9) */}
            <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] lg:w-[440px] lg:h-[440px] bg-[#FCEAE9] rounded-[48%_52%_62%_38%/45%_58%_42%_55%] -z-10 opacity-95 transition-transform duration-700 hover:scale-105" />

            {/* Círculos decorativos flotantes de ambientación (como en la referencia) */}
            <div className="absolute -top-4 left-10 sm:left-20 w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-[#FAF7F5] border border-pink-100/60 -z-10" />
            <div className="absolute top-12 -right-2 sm:right-10 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#FCEAE9]/80 -z-10" />
            <div className="absolute -bottom-6 left-16 sm:left-24 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#FAF7F5] -z-10" />
            <div className="absolute bottom-10 right-4 sm:right-16 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white shadow-xs -z-10" />

            {/* Fotografía Protagonista de la Copa Frappé con granos flotantes */}
            <img
              src="/images/marfil_hero_cup.png"
              alt="Frappé Café Marfil Artesanal"
              className="relative z-10 max-h-[300px] sm:max-h-[380px] md:max-h-[440px] lg:max-h-[480px] w-auto object-contain drop-shadow-[0_20px_30px_rgba(31,20,16,0.25)] animate-float-slow select-none pointer-events-none"
            />

          </div>

          {/* 3. Footer Informativo de la Empresa (Bottom-Left) */}
          <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#1F1410]/50 font-body gap-1 pt-2">
            <span>© 2026 Café Marfil · Panel Administrativo & Host Station</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* SECCIÓN DERECHA: FORMULARIO DE ACCESO (NEGRO CAFÉ ELEGANTE) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-gradient-to-br from-[#1F1410] via-[#1B110D] to-[#120B08] text-white z-20 relative">

          {/* Luz de ambiente cálida sutil en esquina */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#E12927]/10 rounded-full blur-3xl pointer-events-none" />


          {/* Formulario Central */}
          <div className="max-w-xs sm:max-w-sm w-full mx-auto my-auto space-y-6">

            {/* Título de la pantalla */}
            <div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-xs sm:text-sm text-white/60 font-body mt-1">
                Ingresa tus credenciales autorizadas de Café Marfil.
              </p>
            </div>

            {/* Mensaje de error si falla */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 animate-menu-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Campo: Usuario / Correo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/85 font-body">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@cafemarfil.mx"
                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/15 rounded-full text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-hidden focus:border-[#E12927] focus:ring-2 focus:ring-[#E12927]/30 transition-all font-body shadow-inner"
                  />
                </div>
              </div>

              {/* Campo: Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/85 font-body">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-black/40 border border-white/15 rounded-full text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-hidden focus:border-[#E12927] focus:ring-2 focus:ring-[#E12927]/30 transition-all font-body shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Enlace "¿Olvidaste tu contraseña?" */}
                <div className="text-right pt-1">
                  <a
                    href="#recuperar"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Para restablecer tu acceso, contacta al Administrador de TI de Café Marfil Durango.');
                    }}
                    className="text-[11px] text-white/60 hover:text-[#E12927] font-medium font-body transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

              {/* Botón Principal de Acceso (Píldora Roja Marfil #E12927) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#E12927] hover:bg-[#c9201f] active:scale-[0.99] text-white font-semibold text-sm rounded-full shadow-lg shadow-[#E12927]/30 transition-all hover:scale-[1.01] cursor-pointer font-body flex items-center justify-center gap-2 mt-2 select-none"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verificando Credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Panel</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

            </form>


            {/* Texto inferior de ayuda */}
            <div className="text-center pt-2">
              <p className="text-xs text-white/60 font-body">
                ¿No tienes credenciales asignadas?{' '}
                <a
                  href="#ayuda"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('El registro de nuevos operadores debe ser autorizado por Gerencia de Café Marfil.');
                  }}
                  className="text-white hover:text-[#E12927] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Solicitar a Gerencia
                </a>
              </p>
            </div>

          </div>

          {/* Footer de enlaces inferiores */}
          <div className="flex items-center justify-center gap-6 text-[11px] text-white/40 font-body pt-6">
            <a
              href="#terminos"
              onClick={(e) => { e.preventDefault(); alert('Términos de confidencialidad y operación Café Marfil.'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Términos del Servicio
            </a>
            <span>·</span>
            <a
              href="#soporte"
              onClick={(e) => { e.preventDefault(); alert('Soporte de sistemas Café Marfil: soporte@cafemarfil.mx'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Soporte Operativo
            </a>
          </div>

        </div>

    </div>
  );
};

export default LoginScreen;
