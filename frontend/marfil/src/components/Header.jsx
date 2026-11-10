import React from 'react';
import { Bell, Moon, Sun, CalendarDays, User, Sparkles } from 'lucide-react';
import ElephantLogo from './ElephantLogo';
import { sounds } from '../utils/audio';

export default function Header({
  activeScreen,
  setActiveScreen,
  theme,
  toggleTheme,
  unreadCount,
  openNotifications
}) {
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

  const isHeroOverlay = activeScreen === 'inicio' || activeScreen === 'hero';

  return (
    <>
      {/* Navbar Principal: Transparente sobre el Hero / Glassmorphic en otras vistas */}
      <header
        className={`${
          isHeroOverlay
            ? 'fixed top-0 inset-x-0 z-40 bg-transparent border-b border-white/15 backdrop-blur-xs text-white'
            : 'sticky top-0 z-40 bg-white/90 dark:bg-[#1F1410]/90 backdrop-blur-xl border-b border-stone-200/60 dark:border-white/10 text-[#1F1410] dark:text-white shadow-xs'
        } transition-all duration-300`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
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
                className={`font-display text-xl sm:text-2xl font-bold ${
                  isHeroOverlay ? 'text-white' : 'text-[#1F1410] dark:text-white'
                } leading-none tracking-tight drop-shadow-sm`}
              >
                Café Marfil
              </span>
            </div>
          </div>

          {/* Navegación de Escritorio & Tablet */}
          <nav
            className={`hidden md:flex items-center p-1 rounded-full ${
              isHeroOverlay
                ? 'bg-black/20 border border-white/15 backdrop-blur-md'
                : 'bg-black/5 dark:bg-white/5 border border-stone-200/50 dark:border-white/10 backdrop-blur-sm'
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
                      : 'text-[#1F1410] dark:text-stone-200 hover:text-[#E12927] hover:bg-white/60 dark:hover:bg-white/10'
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
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
                  : 'border-stone-200/80 dark:border-white/15 bg-white/60 dark:bg-white/10 text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:border-[#E12927] dark:hover:bg-white/20'
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
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#E12927] text-white text-[10px] font-mono font-bold shadow-md ring-2 ring-white dark:ring-[#1F1410]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Toggle Tema */}
            <button
              className={`w-10 h-10 rounded-full border ${
                isHeroOverlay
                  ? 'border-white/25 bg-black/20 hover:bg-black/35 text-white backdrop-blur-md'
                  : 'border-stone-200/80 dark:border-white/15 bg-white/60 dark:bg-white/10 text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:border-[#E12927] dark:hover:bg-white/20'
              } flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs`}
              onClick={() => {
                sounds.playClick();
                toggleTheme();
              }}
              aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-inherit" />}
            </button>

            {/* Perfil */}
            <button
              className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs ${
                activeScreen === 'perfil' || activeScreen === 'mis_reservaciones'
                  ? 'bg-[#1F1410] text-white border-[#1F1410]'
                  : isHeroOverlay
                  ? 'border-white/25 bg-black/20 hover:bg-black/35 text-white backdrop-blur-md'
                  : 'border-stone-200/80 dark:border-white/15 bg-white/60 dark:bg-white/10 backdrop-blur-md text-[#1F1410] dark:text-white hover:bg-[#FCEAE9] hover:border-[#E12927] dark:hover:bg-white/20'
              }`}
              onClick={() => handleNav('perfil')}
              aria-label="Mi Perfil y Reservaciones"
              title="Mi Perfil"
            >
              <User size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
