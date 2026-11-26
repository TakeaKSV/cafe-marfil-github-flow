import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Check,
  CheckCircle2,
  Clock,
  Gift,
  Lock,
  Mail,
  QrCode,
  Ticket
} from 'lucide-react';
import { sounds } from '../utils/audio';
import ElephantLogo from '../components/ElephantLogo';
import QRModal from '../components/QRModal';

const STAMP_ROTATIONS = [
  '-rotate-6',
  'rotate-3',
  '-rotate-3',
  'rotate-6',
  '-rotate-4',
  'rotate-4',
  '-rotate-2',
  'rotate-5'
];

export default function BenefitsScreen({
  perfil,
  beneficios = [],
  onResendVerification,
  resendingVerification
}) {
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const containerRef = useRef(null);

  const handleUseBenefit = (benefit) => {
    sounds.playClick();
    setSelectedBenefit(benefit);
    setShowQR(true);
  };

  const totalMeta = Math.max(1, Number(perfil?.sellosTotalesParaMeta) || 8);
  const sellosActuales = Math.max(0, Math.min(totalMeta, Number(perfil?.sellosActuales) || 0));
  const sellosFaltantes = Math.max(0, totalMeta - sellosActuales);
  const progresoPct = Math.round((sellosActuales / totalMeta) * 100);

  const disponibles = beneficios.filter((b) => b.estado === 'disponible');
  const bloqueados = beneficios.filter((b) => b.estado === 'bloqueado');
  const usados = beneficios.filter((b) => b.estado === 'usado');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.benefits-hero-reveal', {
        y: 18,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out'
      });
      gsap.from('.benefits-stamp-cell', {
        scale: 0.9,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        delay: 0.12,
        ease: 'back.out(1.4)'
      });
      gsap.from('.benefits-coupon-card', {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
        delay: 0.18,
        ease: 'power2.out',
        clearProps: 'transform'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const showDisponibles = activeTab === 'todos' || activeTab === 'disponible';
  const showBloqueados = activeTab === 'todos' || activeTab === 'bloqueado';
  const showUsados = activeTab === 'todos' || activeTab === 'usado';

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[calc(100dvh-72px)] mt-[72px] bg-[#FAF7F5] dark:bg-[#14100E] px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 pb-16 flex flex-col gap-8 sm:gap-10"
    >
      {/* ====================================================================
          1. HERO PASAPORTE DE SELLOS (ESTILO EDITORIAL + HOJA DE SELLOS)
          ==================================================================== */}
      <section className="benefits-hero-reveal relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FCEAE9]/70 via-[#FFF9F7] to-[#F7EFE6]/80 dark:from-[#261614] dark:via-[#1B1411] dark:to-[#221714] border border-[#E12927]/20 dark:border-white/10 shadow-xl shadow-stone-200/50 dark:shadow-black/40 p-5 sm:p-8 lg:p-10">
        {/* Halos y geometría editorial igual al inicio */}
        <div className="absolute -top-16 -right-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#E12927]/10 dark:bg-[#E12927]/15 blur-3xl pointer-events-none" />
        <div className="hidden lg:block w-64 h-64 rounded-full bg-[#E12927] opacity-90 absolute -right-14 -top-12 pointer-events-none shadow-2xl shadow-[#E12927]/30" />
        <div className="hidden lg:block w-80 h-80 rounded-full border-2 border-dashed border-[#E12927]/25 absolute -right-22 -top-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 sm:gap-7">
          {/* Fila superior: Título editorial + imagen sellos.png + métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider bg-[#1F1410] dark:bg-white/10 text-white">
                  Nivel {perfil?.nivelFidelidad || 'Marfil'}
                </span>
                <span className="font-mono text-xs font-semibold text-[#7A635A] dark:text-[#C5B3AA]">
                  {sellosActuales} de {totalMeta} sellos coleccionados
                </span>
              </div>

              <div className="mb-2.5">
                <span className="font-display italic text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#E12927] tracking-tight block leading-[0.95]">
                  Pasaporte
                </span>
                <span className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-[#1F1410] dark:text-[#F5EFEA] uppercase tracking-wider block mt-1">
                  DE SELLOS DIGITAL
                </span>
              </div>

              <p className="font-body text-sm sm:text-base text-[#4A3B35] dark:text-[#CFC2BA] leading-relaxed max-w-xl">
                {sellosFaltantes === 0
                  ? '¡Completaste tu hoja de sellos! Ya puedes canjear tu recompensa de cortesía en barra.'
                  : `Te faltan ${sellosFaltantes} ${sellosFaltantes === 1 ? 'visita' : 'visitas'} para completar tu hoja de sellos y desbloquear tu siguiente cortesía en Durango.`}
              </p>
            </div>

            {/* Lado derecho: Ilustración de sellos.png + tarjeta de puntos */}
            <div className="lg:col-span-5 flex items-center justify-between lg:justify-end gap-4">
              <div className="bg-white/95 dark:bg-[#16100E]/90 backdrop-blur-sm rounded-2xl border border-[#E6DCD0] dark:border-white/10 px-5 py-4 shadow-md flex items-center gap-4 min-w-[180px]">
                <div className="w-11 h-11 rounded-full bg-[#FCEAE9] dark:bg-[#E12927]/20 flex items-center justify-center shrink-0">
                  <ElephantLogo size={28} color="rojo" />
                </div>
                <div>
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#8E7A74] dark:text-[#A99890]">
                    Tus Puntos
                  </span>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1F1410] dark:text-white leading-tight">
                    {perfil?.puntosFidelidad ?? 0}
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#E12927] uppercase tracking-wider">
                    Club Marfil
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-28 lg:w-36 shrink-0 select-none pointer-events-none">
                <img
                  src="/images/sellos.png"
                  alt="Hoja de sellos Café Marfil"
                  className="w-full h-auto object-contain drop-shadow-[0_14px_22px_rgba(31,20,16,0.22)] -rotate-3"
                />
              </div>
            </div>
          </div>

          {/* ================================================================
              HOJA DE SELLOS PERFORADA (INSPIRADA EN SELLOS.PNG)
              ================================================================ */}
          <div className="relative rounded-2xl bg-[#F6EFE1] dark:bg-[#241B17] border border-[#DDD0B8] dark:border-white/10 p-4 sm:p-6 shadow-inner">
            {/* Marco interior punteado estilo estampilla */}
            <div className="rounded-xl border-2 border-dashed border-[#D1C1A5] dark:border-white/15 p-3 sm:p-5 bg-[#FAF5EA]/70 dark:bg-[#1D1613]/70">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-dashed border-[#D8C9AF] dark:border-white/10">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A635A] dark:text-[#C5B3AA]">
                  HOJA OFICIAL · CAFÉ MARFIL DURANGO
                </span>
                <span className="font-mono text-xs font-bold text-[#E12927]">
                  {progresoPct}% completado
                </span>
              </div>

              {/* Cuadrícula de estampillas perforadas */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
                {Array.from({ length: totalMeta }).map((_, idx) => {
                  const isStamped = idx < sellosActuales;
                  const isNext = idx === sellosActuales;
                  const rotationClass = STAMP_ROTATIONS[idx % STAMP_ROTATIONS.length];

                  return (
                    <div
                      key={idx}
                      className={`benefits-stamp-cell relative rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1.5 border border-dashed transition-all duration-300 ${
                        isStamped
                          ? 'bg-[#FFFDF8] dark:bg-[#2B201B] border-[#C9A89B] dark:border-[#E12927]/40 shadow-xs'
                          : isNext
                          ? 'bg-[#FCEAE9]/75 dark:bg-[#E12927]/15 border-[#E12927] shadow-xs'
                          : 'bg-[#F2E9D8]/60 dark:bg-white/[0.03] border-[#D3C4AA] dark:border-white/10'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative transition-transform duration-300 ${
                          isStamped
                            ? `border-2 border-[#C62828]/70 bg-[#FCEAE9]/35 dark:bg-[#E12927]/10 ${rotationClass}`
                            : isNext
                            ? 'border-2 border-dashed border-[#E12927] text-[#E12927] animate-pulse'
                            : 'border border-dashed border-[#BFB098] dark:border-white/20 text-[#9B8B77] dark:text-white/35'
                        }`}
                      >
                        {isStamped ? (
                          <>
                            <ElephantLogo
                              size={30}
                              color="rojo"
                              className="opacity-90"
                            />
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#E12927] text-white flex items-center justify-center shadow-xs">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-none ${
                          isStamped
                            ? 'text-[#B82925] dark:text-[#F48A88]'
                            : isNext
                            ? 'text-[#E12927]'
                            : 'text-[#8C7B6B] dark:text-white/40'
                        }`}
                      >
                        {isStamped ? `Sello ${idx + 1}` : isNext ? 'Siguiente' : `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Barra de progreso + meta del pasaporte */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-[#D8C9AF] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E12927]/12 dark:bg-[#E12927]/20 text-[#E12927] flex items-center justify-center shrink-0">
                    <Gift size={16} />
                  </div>
                  <p className="font-body text-xs sm:text-sm text-[#3A2B25] dark:text-[#E5DAD4] m-0">
                    Al completar {totalMeta} sellos recibes:{' '}
                    <strong className="text-[#1F1410] dark:text-white">
                      Copa de Fresas Estilo Dubái con Pistache &amp; Kataifi
                    </strong>{' '}
                    de cortesía.
                  </p>
                </div>

                <div className="w-full sm:w-40 h-2 rounded-full bg-[#E4D7C1] dark:bg-white/10 overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E12927] to-[#B81F1D] transition-all duration-500"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2. BANNER DE VERIFICACIÓN DE CORREO (PRESERVADO)
          ==================================================================== */}
      {perfil?.correo && !perfil?.emailVerificado && (
        <div className="rounded-2xl bg-[#FCEAE9]/80 dark:bg-[#2A1716] border border-[#E12927]/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1E1412] text-[#E12927] border border-[#E12927]/25 flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#1F1410] dark:text-white m-0">
                Confirma tu correo para canjear tus cupones
              </h3>
              <p className="font-body text-xs sm:text-sm text-[#4A3B35] dark:text-[#CFC2BA] mt-1 mb-0">
                Enviamos un enlace de verificación a <strong>{perfil.correo}</strong>. Una vez verificado podrás redimir tus beneficios en caja.
              </p>
            </div>
          </div>
          {onResendVerification && (
            <button
              type="button"
              onClick={onResendVerification}
              disabled={resendingVerification}
              className="px-5 py-2.5 rounded-full bg-[#E12927] hover:bg-[#C81E1C] text-white font-mono text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-60 transition-colors"
            >
              {resendingVerification ? 'Enviando...' : 'Reenviar enlace'}
            </button>
          )}
        </div>
      )}

      {/* ====================================================================
          3. FILTRO DE CARTERA DE CUPONES
          ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1410] dark:text-white tracking-tight">
            Cartera de Cupones
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#6B5A52] dark:text-[#B9AAA2] mt-1">
            Toca cualquier cupón disponible para abrir su pase QR y mostrarlo en barra.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F5EFE9] dark:bg-[#231B17] border border-[#E6DCD0] dark:border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'todos', label: 'Todos', count: beneficios.length },
            { id: 'disponible', label: 'Disponibles', count: disponibles.length },
            { id: 'bloqueado', label: 'Próximos', count: bloqueados.length },
            { id: 'usado', label: 'Canjeados', count: usados.length }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1F1410] dark:bg-[#E12927] text-white shadow-xs'
                    : 'text-[#6B5A52] dark:text-[#BFB1A8] hover:text-[#1F1410] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-[#6B5A52] dark:text-[#BFB1A8]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          4. CUPONES DISPONIBLES (TARJETAS ESTILO BOLETO / CUPÓN PERFORADO)
          ==================================================================== */}
      {showDisponibles && (
        <section className="flex flex-col gap-4">
          {activeTab === 'todos' && (
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#1F1410] dark:text-white">
                Listos para Canjear
              </h3>
              <span className="font-mono text-xs text-[#8E7A74] dark:text-[#A99890]">
                {disponibles.length} {disponibles.length === 1 ? 'cupón activo' : 'cupones activos'}
              </span>
            </div>
          )}

          {disponibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D6C8B2] dark:border-white/15 bg-[#FAF6EE]/70 dark:bg-[#1E1714] p-8 text-center">
              <Ticket size={28} className="mx-auto text-[#B8A593] mb-2" />
              <p className="font-display text-base font-bold text-[#1F1410] dark:text-white mb-1">
                Aún no tienes cupones activos
              </p>
              <p className="font-body text-xs sm:text-sm text-[#6B5A52] dark:text-[#B9AAA2]">
                Sigue acumulando sellos en tus visitas a Café Marfil para desbloquear cortesías.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {disponibles.map((b) => (
                <article
                  key={b.id}
                  className="benefits-coupon-card group relative flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-[#FFFDF9] dark:bg-[#1F1815] border border-[#E6DCD0] dark:border-white/10 shadow-md hover:shadow-xl hover:border-[#E12927]/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {/* Talón izquierdo carmesí con sello de elefante */}
                  <div className="relative sm:w-32 shrink-0 bg-gradient-to-br from-[#D62826] via-[#B81D1B] to-[#6B1211] text-white p-4 sm:p-5 flex sm:flex-col items-center justify-between sm:justify-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-dashed border-white/40 bg-white/10 flex items-center justify-center shrink-0">
                      <ElephantLogo size={30} color="blanco" />
                    </div>
                    <div className="sm:text-center">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                        Cupón
                      </span>
                      <span className="block font-display italic text-sm font-semibold text-white">
                        Café Marfil
                      </span>
                    </div>

                    {/* Muescas de perforación entre el talón y el cuerpo */}
                    <span className="hidden sm:block absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#FDFBF7] dark:bg-[#14100E] border border-[#E6DCD0] dark:border-white/10 z-10" />
                    <span className="hidden sm:block absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#FDFBF7] dark:bg-[#14100E] border border-[#E6DCD0] dark:border-white/10 z-10" />
                  </div>

                  {/* Línea punteada de corte */}
                  <div className="hidden sm:block w-0 border-l-2 border-dashed border-[#E6DCD0] dark:border-white/15 my-3" />

                  {/* Cuerpo del cupón en papel marfil */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#15803D] dark:text-[#4ADE80]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          Disponible para canje
                        </span>
                        {b.codigo && (
                          <span className="font-mono text-[10px] font-bold text-[#8E7A74] dark:text-[#A99890] uppercase">
                            {b.codigo}
                          </span>
                        )}
                      </div>

                      <h4 className="font-display text-lg sm:text-xl font-bold text-[#1F1410] dark:text-white leading-snug group-hover:text-[#E12927] transition-colors">
                        {b.titulo}
                      </h4>
                      <p className="font-body text-xs sm:text-sm text-[#5A4840] dark:text-[#C5B7AF] leading-relaxed mt-1">
                        {b.subtitulo}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-dashed border-[#E6DCD0] dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-[#7A635A] dark:text-[#B5A59C] flex items-center gap-1.5">
                        <Clock size={13} className="text-[#E12927] shrink-0" />
                        <span>{b.vigencia}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUseBenefit(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider bg-[#1F1410] hover:bg-[#E12927] dark:bg-[#E12927] dark:hover:bg-[#C81E1C] active:scale-95 text-white shadow-sm transition-all cursor-pointer"
                      >
                        <QrCode size={14} />
                        <span>Canjear QR</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          5. PRÓXIMOS BENEFICIOS POR DESBLOQUEAR
          ==================================================================== */}
      {showBloqueados && bloqueados.length > 0 && (
        <section className="flex flex-col gap-4">
          {activeTab === 'todos' && (
            <h3 className="font-display text-xl font-bold text-[#1F1410] dark:text-white">
              Próximos por Desbloquear
            </h3>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bloqueados.map((b) => (
              <div
                key={b.id}
                className="benefits-coupon-card rounded-2xl border border-dashed border-[#D6C8B2] dark:border-white/15 bg-[#FAF6EE]/75 dark:bg-[#1B1512] p-5 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-[#EFE7D8] dark:bg-white/5 border border-dashed border-[#CBBBA0] dark:border-white/15 text-[#7A635A] dark:text-[#B5A59C] flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 className="font-display text-base font-bold text-[#1F1410] dark:text-white leading-snug">
                      {b.titulo}
                    </h4>
                    {b.progreso && (
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-[#1F1410] dark:bg-white/10 text-white shrink-0">
                        {b.progreso}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs sm:text-sm text-[#6B5A52] dark:text-[#B9AAA2] leading-relaxed m-0">
                    {b.subtitulo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          6. HISTORIAL DE CUPONES CANJEADOS
          ==================================================================== */}
      {showUsados && usados.length > 0 && (
        <section className="flex flex-col gap-4">
          {activeTab === 'todos' && (
            <h3 className="font-display text-xl font-bold text-[#1F1410] dark:text-white">
              Historial de Canjes
            </h3>
          )}

          <div className="flex flex-col gap-2.5">
            {usados.map((b) => (
              <div
                key={b.id}
                className="benefits-coupon-card rounded-2xl bg-white dark:bg-[#1C1512] border border-[#EBE3DA] dark:border-white/10 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#FCEAE9] dark:bg-[#E12927]/15 text-[#E12927] flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-body text-sm font-bold text-[#1F1410] dark:text-white truncate m-0">
                      {b.titulo}
                    </h4>
                    <span className="font-mono text-[11px] text-[#8E7A74] dark:text-[#A99890]">
                      {b.fechaUso} · Folio {b.codigo}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full border border-dashed border-[#C62828]/40 text-[#B82925] dark:text-[#F48A88] font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 -rotate-2">
                  Canjeado
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal QR para Canjear Beneficio */}
      {selectedBenefit && (
        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          titulo={selectedBenefit.titulo}
          subtitulo={selectedBenefit.subtitulo}
          codigo={selectedBenefit.codigo}
          vigencia={selectedBenefit.vigencia}
          instruccion="Muestra este código al barista o mesero al momento de pagar tu cuenta en mostrador."
        />
      )}
    </div>
  );
}
