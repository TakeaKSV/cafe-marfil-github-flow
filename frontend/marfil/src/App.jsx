import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import NotificationsDrawer from './components/NotificationsDrawer';
import ElephantLogo from './components/ElephantLogo';

// Pantallas
import HomeScreen from './screens/HomeScreen';
import ActivitiesScreen from './screens/ActivitiesScreen';
import ActivityDetailScreen from './screens/ActivityDetailScreen';
import PromotionsScreen from './screens/PromotionsScreen';
import PromotionDetailScreen from './screens/PromotionDetailScreen';
import BenefitsScreen from './screens/BenefitsScreen';
import ReservationWizard from './screens/ReservationWizard';
import ReservationSuccessScreen from './screens/ReservationSuccessScreen';
import MyReservationsScreen from './screens/MyReservationsScreen';
import BranchesScreen from './screens/BranchesScreen';
import ProfileScreen from './screens/ProfileScreen';
import HeroSection from './components/HeroSection';
import MenuScreen from './screens/MenuScreen';

// Datos oficiales
import {
  SUCURSALES,
  ACTIVIDADES,
  PROMOCIONES,
  PERFIL_USUARIO,
  BENEFICIOS_USUARIO,
  NOTIFICACIONES_INICIALES,
  RESERVACIONES_INICIALES
} from './data/marfilData';
import { sounds } from './utils/audio';

export default function App() {
  // 1. Estado de Pantalla Activa con soporte para URL /hero, /menu o hashes
  const [activeScreen, setActiveScreen] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/hero' || hash === '#/hero' || hash === '#hero') {
      return 'hero';
    }
    if (path === '/menu' || hash === '#/menu' || hash === '#menu') {
      return 'menu';
    }
    return 'inicio';
  });

  // Escuchar cambios de URL (popstate y hashchange) para soportar /hero y /menu
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/hero' || hash === '#/hero' || hash === '#hero') {
        setActiveScreen('hero');
      } else if (path === '/menu' || hash === '#/menu' || hash === '#menu') {
        setActiveScreen('menu');
      } else if (activeScreen === 'hero' || activeScreen === 'menu') {
        setActiveScreen('inicio');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [activeScreen]);

  // 2. Estado de Navegación contextual
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [lastConfirmedReservation, setLastConfirmedReservation] = useState(null);
  const [reservationWizardInitialData, setReservationWizardInitialData] = useState(null);
  const [initialMenuProduct, setInitialMenuProduct] = useState(null);

  // 3. Tema (Modo Oscuro / Claro) con persistencia
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('marfil_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('marfil_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 4. Reservaciones con persistencia
  const [reservaciones, setReservaciones] = useState(() => {
    const saved = localStorage.getItem('marfil_reservaciones');
    return saved ? JSON.parse(saved) : RESERVACIONES_INICIALES;
  });

  useEffect(() => {
    localStorage.setItem('marfil_reservaciones', JSON.stringify(reservaciones));
  }, [reservaciones]);

  // 5. Beneficios con persistencia
  const [beneficios, setBeneficios] = useState(() => {
    const saved = localStorage.getItem('marfil_beneficios');
    return saved ? JSON.parse(saved) : BENEFICIOS_USUARIO;
  });

  useEffect(() => {
    localStorage.setItem('marfil_beneficios', JSON.stringify(beneficios));
  }, [beneficios]);

  // 6. Notificaciones con persistencia
  const [notificaciones, setNotificaciones] = useState(() => {
    const saved = localStorage.getItem('marfil_notificaciones');
    return saved ? JSON.parse(saved) : NOTIFICACIONES_INICIALES;
  });

  useEffect(() => {
    localStorage.setItem('marfil_notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // 7. Perfil con persistencia
  const [perfil, setPerfil] = useState(() => {
    const saved = localStorage.getItem('marfil_perfil');
    return saved ? JSON.parse(saved) : PERFIL_USUARIO;
  });

  useEffect(() => {
    localStorage.setItem('marfil_perfil', JSON.stringify(perfil));
  }, [perfil]);

  // Métodos de navegación y acciones
  const navigateTo = (screenId) => {
    setActiveScreen(screenId);
    if (screenId === 'hero') {
      window.history.pushState({}, '', '/hero');
    } else {
      if (window.location.pathname.toLowerCase() === '/hero' || window.location.hash.toLowerCase().includes('hero')) {
        window.history.pushState({}, '', '/');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    navigateTo('detalle_actividad');
  };

  const handleSelectPromo = (promo) => {
    setSelectedPromo(promo);
    navigateTo('detalle_promocion');
  };

  // Reservar directamente una actividad
  const handleBookActivity = (activity) => {
    setReservationWizardInitialData({
      tipo: 'actividad',
      actividad: activity,
      actividadId: activity.id,
      sucursalId: activity.sucursalId
    });
    navigateTo('reservar');
  };

  // Reservar directamente en una sucursal
  const handleReserveBranch = (branchId) => {
    setReservationWizardInitialData({
      tipo: 'mesa',
      sucursalId: branchId
    });
    navigateTo('reservar');
  };

  // Filtrar actividades por sucursal
  const handleFilterBranchActivities = (branchId) => {
    navigateTo('actividades');
  };

  // Completar reserva desde el wizard
  const handleCompleteReservation = (newReservation) => {
    setReservaciones((prev) => [newReservation, ...prev]);
    setLastConfirmedReservation(newReservation);

    // Agregar notificación de confirmación
    const nuevaNotif = {
      id: `notif-${Date.now()}`,
      titulo: '¡Reservación confirmada!',
      mensaje: `Tu reservación #${newReservation.id} para el ${newReservation.fecha} a las ${newReservation.hora} en ${newReservation.sucursalNombre} quedó registrada exitosamente.`,
      tiempo: 'Justo ahora',
      tipo: 'reservacion',
      leida: false,
      screenDestino: 'mis_reservaciones'
    };
    setNotificaciones((prev) => [nuevaNotif, ...prev]);

    // Redirigir a pantalla de confirmación exitosa
    navigateTo('confirmacion_reservacion');
  };

  // Cancelar reservación
  const handleCancelReservation = (reservationId) => {
    setReservaciones((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, estado: 'Cancelada' } : r))
    );

    // Agregar notificación de cancelación
    const cancelNotif = {
      id: `notif-${Date.now()}`,
      titulo: 'Reservación cancelada',
      mensaje: `La reservación #${reservationId} ha sido cancelada correctamente.`,
      tiempo: 'Justo ahora',
      tipo: 'reservacion',
      leida: false,
      screenDestino: 'mis_reservaciones'
    };
    setNotificaciones((prev) => [cancelNotif, ...prev]);
  };

  // Reclamar beneficio de la ruleta o código
  const handleClaimBenefit = (newBenefit) => {
    setBeneficios((prev) => [newBenefit, ...prev]);

    // Aumentar puntos en el perfil
    setPerfil((prev) => ({
      ...prev,
      puntosFidelidad: prev.puntosFidelidad + 25
    }));

    // Notificación
    const notif = {
      id: `notif-${Date.now()}`,
      titulo: '¡Nuevo beneficio agregado!',
      mensaje: `Has obtenido "${newBenefit.titulo}". Disponible en tu sección de beneficios.`,
      tiempo: 'Justo ahora',
      tipo: 'beneficio',
      leida: false,
      screenDestino: 'beneficios'
    };
    setNotificaciones((prev) => [notif, ...prev]);
  };

  // Notificaciones
  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const handleMarkAllRead = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
    );
    setIsNotifDrawerOpen(false);
    if (notif.screenDestino) {
      navigateTo(notif.screenDestino);
    }
  };

  return (
    <div className="app-container">
      {/* Header Fijo con soporte Overlay */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={(s) => {
          setReservationWizardInitialData(null);
          navigateTo(s);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        unreadCount={unreadCount}
        openNotifications={() => setIsNotifDrawerOpen(true)}
      />

      {/* Contenido Principal con Enrutador React */}
      <main className={activeScreen === 'hero' || activeScreen === 'inicio' ? 'w-full p-0 m-0 max-w-none flex-1' : 'main-content'} id="main-content">
        {/* PROTOTIPO HERO COFFEE & CO. (/hero) */}
        {activeScreen === 'hero' && (
          <HeroSection
            onOrderNow={(drink) => {
              setReservationWizardInitialData({
                tipo: 'mesa',
                nota: `Orden: ${drink.nombre}`
              });
              navigateTo('reservar');
            }}
            onNavigateBack={() => navigateTo('inicio')}
          />
        )}

        {/* INICIO */}
        {activeScreen === 'inicio' && (
          <HomeScreen
            onNavigate={(s) => {
              setReservationWizardInitialData(null);
              navigateTo(s);
            }}
            onSelectProduct={(producto) => {
              setInitialMenuProduct(producto);
              navigateTo('menu');
            }}
            onSelectActivity={handleSelectActivity}
            onSelectPromo={handleSelectPromo}
            actividades={ACTIVIDADES}
            promociones={PROMOCIONES}
          />
        )}

        {/* MENÚ OFICIAL (CAROUSEL & DESKTOP/MÓVIL) */}
        {activeScreen === 'menu' && (
          <MenuScreen
            initialProduct={initialMenuProduct}
            onClearInitialProduct={() => setInitialMenuProduct(null)}
            onOrderNow={(producto) => {
              setReservationWizardInitialData({
                notas: `Deseo ordenar en mi reservación: ${producto.nombreCompleto} (${producto.precio})`
              });
              navigateTo('reservar');
            }}
            onNavigate={navigateTo}
          />
        )}

        {/* ACTIVIDADES */}
        {activeScreen === 'actividades' && (
          <ActivitiesScreen
            actividades={ACTIVIDADES}
            sucursales={SUCURSALES}
            onSelectActivity={handleSelectActivity}
            onGoToReservation={() => navigateTo('reservar')}
          />
        )}

        {/* DETALLE DE ACTIVIDAD */}
        {activeScreen === 'detalle_actividad' && (
          <ActivityDetailScreen
            activity={selectedActivity || ACTIVIDADES[0]}
            onBack={() => navigateTo('actividades')}
            onBookActivity={handleBookActivity}
          />
        )}

        {/* PROMOCIONES */}
        {activeScreen === 'promociones' && (
          <PromotionsScreen
            promociones={PROMOCIONES}
            onSelectPromo={handleSelectPromo}
          />
        )}

        {/* DETALLE DE PROMOCIÓN */}
        {activeScreen === 'detalle_promocion' && (
          <PromotionDetailScreen
            promo={selectedPromo || PROMOCIONES[0]}
            onBack={() => navigateTo('promociones')}
          />
        )}

        {/* MIS BENEFICIOS / FIDELIDAD */}
        {activeScreen === 'beneficios' && (
          <BenefitsScreen
            perfil={perfil}
            beneficios={beneficios}
          />
        )}

        {/* SISTEMA DE RESERVACIONES (WIZARD EN 6 PASOS) */}
        {activeScreen === 'reservar' && (
          <ReservationWizard
            sucursales={SUCURSALES}
            actividades={ACTIVIDADES}
            initialData={reservationWizardInitialData}
            onCancel={() => navigateTo('inicio')}
            onCompleteReservation={handleCompleteReservation}
          />
        )}

        {/* CONFIRMACIÓN DE RESERVACIÓN */}
        {activeScreen === 'confirmacion_reservacion' && (
          <ReservationSuccessScreen
            reservation={lastConfirmedReservation || reservaciones[0]}
            onGoHome={() => navigateTo('inicio')}
            onViewReservations={() => navigateTo('mis_reservaciones')}
          />
        )}

        {/* MIS RESERVACIONES */}
        {activeScreen === 'mis_reservaciones' && (
          <MyReservationsScreen
            reservaciones={reservaciones}
            onCancelReservation={handleCancelReservation}
            onNewReservation={() => {
              setReservationWizardInitialData(null);
              navigateTo('reservar');
            }}
          />
        )}

        {/* SUCURSALES */}
        {activeScreen === 'sucursales' && (
          <BranchesScreen
            sucursales={SUCURSALES}
            onReserveBranch={handleReserveBranch}
            onFilterBranchActivities={handleFilterBranchActivities}
          />
        )}

        {/* PERFIL DEL CLIENTE */}
        {activeScreen === 'perfil' && (
          <ProfileScreen
            perfil={perfil}
            onUpdatePerfil={setPerfil}
            onViewReservations={() => navigateTo('mis_reservaciones')}
            onViewBenefits={() => navigateTo('beneficios')}
            theme={theme}
            toggleTheme={toggleTheme}
            reservacionesCount={reservaciones.filter((r) => r.estado !== 'Cancelada').length}
            beneficiosCount={beneficios.length}
          />
        )}
      </main>

      {/* Footer Editorial Café Marfil Urban Brunch */}
      <footer className="marfil-footer">
        <div className="footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                <ElephantLogo size={46} color="rojo" />
                <div>
                  <div className="footer-logo font-display">Café Marfil</div>
                  <span className="font-mono" style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--rojo-marfil)', textTransform: 'uppercase' }}>
                    CAFÉ DE ESPECIALIDAD & DESAYUNOS
                  </span>
                </div>
              </div>
              <p className="footer-tagline font-body">
                Barra de especialidad, frappés de autor, cocina salada y dulce contundente en Durango, México. Desayunos todo el día, chilaquiles con boneless y fresas estilo Dubái.
              </p>
              <div className="footer-city-badge font-mono">
                DURANGO, DGO. · 3 SUCURSALES
              </div>
            </div>

            <div className="footer-links-col">
              <h4 className="font-mono" style={{ color: 'var(--rojo-marfil)', letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.82rem' }}>
                EXPLORAR CARTA & ESPACIOS
              </h4>
              <ul className="footer-nav-list font-body">
                <li><button onClick={() => navigateTo('menu')}>Menú & Carrusel</button></li>
                <li><button onClick={() => navigateTo('actividades')}>Actividades & Catas</button></li>
                <li><button onClick={() => navigateTo('promociones')}>Promociones & Combos</button></li>
                <li><button onClick={() => navigateTo('reservar')}>Reservar Mesa o Evento</button></li>
                <li><button onClick={() => navigateTo('beneficios')}>Pasaporte de Sellos</button></li>
                <li><button onClick={() => navigateTo('sucursales')}>Sucursales en Durango</button></li>
              </ul>
            </div>

            <div className="footer-social-col">
              <h4 className="font-mono" style={{ color: 'var(--rojo-marfil)', letterSpacing: '0.1em', fontWeight: 700, fontSize: '0.82rem' }}>
                COMUNIDAD MARFIL
              </h4>
              <p className="font-body" style={{ color: 'var(--text-light)', fontSize: '0.92rem' }}>
                Comparte tus momentos de café y juegos de mesa etiquetándonos en Instagram:
              </p>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="footer-insta-btn font-mono"
              >
                @cafe.marfil · #CafeMarfilDgo
              </a>
              <span className="font-mono" style={{ color: 'var(--text-light)', fontSize: '0.78rem', display: 'block', marginTop: '0.75rem' }}>
                ATENCIÓN & WHATSAPP: (618) 811-2345
              </span>
            </div>
          </div>

          <div className="footer-bottom-bar font-mono" style={{ fontSize: '0.78rem' }}>
            <span>© 2026 Café Marfil Durango. Todos los derechos reservados.</span>
            <span>Desayunos Todo el Día · Café de Especialidad · Juegos de Mesa</span>
          </div>
        </div>
      </footer>

      {/* Navegación Móvil Inferior con botón Reservar Elevado */}
      <BottomNav
        activeScreen={activeScreen}
        setActiveScreen={(s) => {
          setReservationWizardInitialData(null);
          navigateTo(s);
        }}
      />

      {/* Drawer Lateral de Notificaciones */}
      <NotificationsDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notificaciones={notificaciones}
        onMarkAllRead={handleMarkAllRead}
        onNotificationClick={handleNotificationClick}
      />

      <style>{`
        .marfil-footer {
          background-color: var(--blanco);
          border-top: 1px solid var(--border-medium);
          padding: 3.5rem 1.5rem 6.5rem 1.5rem;
          margin-top: auto;
        }
        @media (min-width: 900px) {
          .marfil-footer {
            padding-bottom: 3.5rem;
          }
        }
        .footer-inner {
          max-width: var(--max-content-width);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .footer-top-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        @media (min-width: 768px) {
          .footer-top-row {
            grid-template-columns: 1.5fr 1fr 1.25fr;
          }
        }
        .footer-logo {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--negro-cafe);
          margin: 0;
          line-height: 1.1;
        }
        .footer-tagline {
          max-width: 360px;
          line-height: 1.6;
          margin-bottom: 1rem;
          color: var(--text-light);
          font-size: 0.92rem;
        }
        .footer-city-badge {
          display: inline-block;
          background-color: var(--rosa-claro);
          border: 1px solid rgba(225, 41, 39, 0.2);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          font-weight: 700;
          color: var(--rojo-marfil);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
        }
        .footer-nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-top: 0.75rem;
        }
        .footer-nav-list button {
          color: var(--text-light);
          font-size: 0.92rem;
          padding: 0;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .footer-nav-list button:hover {
          color: var(--rojo-marfil);
        }
        .footer-social-col p {
          margin: 0.75rem 0 1rem 0;
          line-height: 1.5;
        }
        .footer-insta-btn {
          display: inline-flex;
          align-items: center;
          background-color: var(--bg-surface-tinted);
          border: 1px solid var(--border-medium);
          padding: 0.55rem 1.1rem;
          border-radius: var(--radius-full);
          color: var(--negro-cafe);
          font-weight: 700;
          font-size: 0.8rem;
          text-decoration: none;
          transition: all 0.18s ease;
        }
        .footer-insta-btn:hover {
          border-color: var(--rojo-marfil);
          color: var(--rojo-marfil);
          background-color: var(--rosa-claro);
        }
        .footer-bottom-bar {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid var(--border-medium);
          padding-top: 1.5rem;
          color: var(--text-light);
        }
        @media (min-width: 768px) {
          .footer-bottom-bar {
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
