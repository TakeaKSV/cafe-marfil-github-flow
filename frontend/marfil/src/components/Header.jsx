import React, { useState, useEffect } from 'react';
import { Bell, CalendarDays, User, LogIn } from 'lucide-react';
import ElephantLogo from './ElephantLogo';
import { sounds } from '../utils/audio';

export default function Header({
  activeScreen,
  setActiveScreen,
  unreadCount,
  openNotifications,
  isLoggedIn = false
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeScreen]);

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'menu', label: 'Menú' },
    { id: 'actividades', label: 'Actividades & Ludoteca' },
    { id: 'promociones', label: 'Promociones' },
    { id: 'beneficios', label: 'Club Marfil' },
    { id: 'sucursales', label: 'Sucursales' }
  ];

  const handleNav = (screenId) => {
    sounds.playClick();
    setActiveScreen(screenId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFixedOverlay = activeScreen === 'inicio' || activeScreen === 'hero';
  const isHeroOverlay = isFixedOverlay && !isScrolled;

  return (
    <>
      {/* Navbar Principal: Transparente sobre el Hero al inicio / Sólida legible al scrollear */}
      <header
        className={`marfil-site-header ${isFixedOverlay ? 'fixed top-0 inset-x-0' : 'sticky top-0'} z-40 ${
          isHeroOverlay
            ? 'bg-transparent border-b border-white/15 backdrop-blur-xs text-white'
            : 'bg-white/95 backdrop-blur-xl border-b border-stone-200/70 text-[#1F1410] shadow-sm'
        } transition-all duration-300`}
      >
        <div className="marfil-site-header-inner max-w-[1240px] mx-auto px-2.5 sm:px-6 h-[72px] flex items-center justify-between gap-2 sm:gap-4">
          {/* Isotipo del Elefante + Logotipo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
            onClick={() => handleNav('inicio')}
            role="button"
            tabIndex={0}
          >
            <div className="transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3">
              <ElephantLogo size={40} color={isHeroOverlay ? 'blanco' : 'negro'} />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-display text-lg sm:text-2xl font-bold ${
                  isHeroOverlay ? 'text-white' : 'text-[#1F1410]'
                } leading-none tracking-tight drop-shadow-sm`}
              >
                Café Marfil
              </span>
            </div>
          </div>

          {/* Navegación de Escritorio (en móvil y tablet se usa la barra móvil inferior) */}
          <nav
            className={`hidden lg:flex items-center p-1 rounded-full ${
              isHeroOverlay
                ? 'bg-black/20 border border-white/15 backdrop-blur-md'
                : 'bg-black/5 border border-stone-200/50 backdrop-blur-sm'
            } gap-1`}
            aria-label="Navegación principal"
          >
            {navItems.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  className={`relative px-4 py-2 rounded-full font-body text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#E12927] text-white shadow-md shadow-[#E12927]/30'
                      : isHeroOverlay
                      ? 'text-white/90 hover:text-white hover:bg-white/20'
                      : 'text-[#1F1410] hover:text-[#E12927] hover:bg-white/60'
                  }`}
                  onClick={() => handleNav(item.id)}
                >
                  <span className="flex items-center gap-1.5">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Botón CTA Primario en Rojo Marfil */}
            <button
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => handleNav('reservar')}
              aria-label="Reservar mesa en Café Marfil"
            >
              <CalendarDays size={15} />
              <span className="hidden sm:inline">Reservar Mesa</span>
              <span className="sm:hidden">Reservar</span>
            </button>

            {/* Notificaciones */}
            <button
              className={`relative w-10 h-10 rounded-full border ${
                isHeroOverlay
                  ? 'border-white/25 bg-black/20 hover:bg-black/35 text-white backdrop-blur-md'
                  : 'border-stone-200/80 bg-white/60 text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927]'
              } flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs`}
              onClick={() => {
                sounds.playClick();
                openNotifications();
              }}
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#E12927] text-white text-[10px] font-mono font-bold shadow-md ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Perfil o Iniciar sesión */}
            {isLoggedIn ? (
              <button
                className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs ${
                  activeScreen === 'perfil' || activeScreen === 'mis_reservaciones'
                    ? 'bg-[#1F1410] text-white border-[#1F1410]'
                    : isHeroOverlay
                    ? 'border-white/25 bg-black/20 hover:bg-black/35 text-white backdrop-blur-md'
                    : 'border-stone-200/80 bg-white/60 backdrop-blur-md text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927]'
                }`}
                onClick={() => handleNav('perfil')}
                aria-label="Mi Perfil y Reservaciones"
                title="Mi Perfil"
              >
                <User size={18} />
              </button>
            ) : (
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-full border font-mono text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-xs ${
                  activeScreen === 'perfil'
                    ? 'bg-[#1F1410] text-white border-[#1F1410]'
                    : isHeroOverlay
                    ? 'border-white/30 bg-black/25 hover:bg-white hover:text-[#1F1410] text-white backdrop-blur-md'
                    : 'border-[#1F1410]/20 bg-white text-[#1F1410] hover:bg-[#FCEAE9] hover:border-[#E12927] hover:text-[#E12927]'
                }`}
                onClick={() => handleNav('perfil')}
                aria-label="Iniciar sesión en Café Marfil"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
