import React, { useState, useEffect, useCallback } from 'react';
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
import AuthScreen from './screens/AuthScreen';
import HeroSection from './components/HeroSection';
import MenuScreen from './screens/MenuScreen';

// Datos: todo llega de la API
import { alExpirarSesion, api, reservasDeInvitado, sesion } from './api/cliente';
import {
  aActividad,
  aBeneficio,
  aNotificacion,
  aPerfil,
  aPromocion,
  aReservacion,
  aSeccionesDeMenu
} from './api/adaptadores';

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

  // 4. Catálogo público (sucursales, actividades, promociones y menú)
  const [sucursales, setSucursales] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [catalogoListo, setCatalogoListo] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  // 5. Cuenta del cliente. `cliente` es null cuando se navega como invitado.
  const [cliente, setCliente] = useState(null);
  const [reservaciones, setReservaciones] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const perfil = cliente ? aPerfil(cliente) : null;

  // Aviso flotante para errores de la API
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const cargarCatalogo = useCallback(async () => {
    const [s, a, p, productos] = await Promise.all([
      api('/sucursales'),
      api('/actividades'),
      api('/promociones'),
      api('/menu/productos')
    ]);
    setSucursales(s);
    setActividades(a.map(aActividad));
    setPromociones(p.map(aPromocion));
    setSecciones(aSeccionesDeMenu(productos));
    setCatalogoListo(true);
  }, []);

  /**
   * Reservaciones, beneficios y notificaciones. Con sesión salen de la cuenta;
   * como invitado solo hay reservaciones: las que se hicieron en este dispositivo.
   */
  const cargarCuenta = useCallback(async (conSesion) => {
    if (conSesion) {
      const [r, b, n] = await Promise.all([
        api('/mi/reservaciones'),
        api('/mi/beneficios'),
        api('/mi/notificaciones')
      ]);
      setReservaciones(r.map(aReservacion));
      setBeneficios(b.map(aBeneficio));
      setNotificaciones(n.map(aNotificacion));
      return;
    }
    const delDispositivo = await Promise.all(
      reservasDeInvitado.tokens().map((token) => api(`/reservaciones/publica/${token}`).catch(() => null))
    );
    setReservaciones(delDispositivo.filter(Boolean).map(aReservacion));
    setBeneficios([]);
    setNotificaciones([]);
  }, []);

  // Arranque: catálogo, y la sesión guardada si la hay.
  useEffect(() => {
    cargarCatalogo().catch((error) => setErrorCatalogo(error.message));

    alExpirarSesion(() => {
      setCliente(null);
      setAviso('Tu sesión expiró. Inicia sesión de nuevo.');
    });

    const restaurarSesion = async () => {
      if (!sesion.token) return false;
      try {
        const respuesta = await api('/auth/me');
        if (respuesta.tipo !== 'cliente') throw new Error('La sesión guardada no es de un cliente.');
        setCliente(respuesta.cliente);
        return true;
      } catch {
        sesion.cerrar();
        return false;
      }
    };
    restaurarSesion()
      .then(cargarCuenta)
      .catch(() => {});
  }, [cargarCatalogo, cargarCuenta]);

  // Sesión -----------------------------------------------------------------

  /** Los usa AuthScreen; si la API rechaza los datos lanzan el mensaje a mostrar. */
  const entrar = async (respuesta) => {
    sesion.guardar(respuesta.token);
    setCliente(respuesta.cliente);
    await cargarCuenta(true);
  };
  const iniciarSesion = async (email, password) =>
    entrar(await api('/auth/clientes/login', { metodo: 'POST', body: { email, password } }));
  const crearCuenta = async (datos) =>
    entrar(await api('/auth/clientes/registro', { metodo: 'POST', body: datos }));

  const cerrarSesion = () => {
    sesion.cerrar();
    setCliente(null);
    cargarCuenta(false).catch(() => {});
    navigateTo('inicio');
  };

  const handleUpdatePerfil = async (nuevo) => {
    try {
      const actualizado = await api('/mi/perfil', {
        metodo: 'PATCH',
        body: {
          nombre: nuevo.nombre,
          telefono: nuevo.telefono || null,
          email: nuevo.correo,
          preferencias: {
            lechePreferida: nuevo.preferencias.lechePreferida,
            bebidaFavorita: nuevo.preferencias.bebidaFavorita,
            experienciaFavorita: nuevo.preferencias.experienciaFavorita
          }
        }
      });
      setCliente(actualizado);
    } catch (error) {
      setAviso(error.message);
    }
  };

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
  const handleFilterBranchActivities = () => {
    navigateTo('actividades');
  };

  /**
   * Completar reserva desde el wizard. Devuelve el mensaje de error si la API
   * la rechaza, para que el wizard lo muestre sin perder lo capturado.
   */
  const handleCompleteReservation = async (nueva) => {
    try {
      const creada = await api('/reservaciones', {
        metodo: 'POST',
        body: {
          tipo: nueva.tipoId,
          actividadId: nueva.actividadId || undefined,
          sucursalId: nueva.sucursalId,
          fecha: nueva.fechaISO,
          hora: nueva.hora,
          personas: nueva.personas,
          comensal: nueva.nombreCliente,
          telefono: nueva.telefonoCliente,
          email: nueva.correoCliente || undefined,
          notas: nueva.notas || undefined
        }
      });
      if (!cliente) reservasDeInvitado.agregar(creada.tokenQR);
      setLastConfirmedReservation(aReservacion(creada));
      // Se refresca la cuenta (nueva reservación y su notificación) y el cupo de actividades.
      cargarCuenta(Boolean(cliente)).catch(() => {});
      cargarCatalogo().catch(() => {});
      navigateTo('confirmacion_reservacion');
      return null;
    } catch (error) {
      return error.message;
    }
  };

  // Cancelar reservación (`reservationId` es el folio)
  const handleCancelReservation = async (reservationId) => {
    try {
      if (cliente) {
        await api(`/mi/reservaciones/${reservationId}/cancelar`, { metodo: 'POST' });
      } else {
        const { qrCode } = reservaciones.find((r) => r.id === reservationId);
        await api(`/reservaciones/publica/${qrCode}/cancelar`, { metodo: 'POST' });
      }
    } catch (error) {
      setAviso(error.message);
    }
    cargarCuenta(Boolean(cliente)).catch(() => {});
    cargarCatalogo().catch(() => {});
  };

  // Notificaciones
  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const handleMarkAllRead = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    if (cliente) api('/mi/notificaciones/leer-todas', { metodo: 'POST' }).catch(() => {});
  };

  const handleNotificationClick = (notif) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n))
    );
    if (cliente) api(`/mi/notificaciones/${notif.id}/leer`, { metodo: 'POST' }).catch(() => {});
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
        {!catalogoListo && activeScreen !== 'hero' && (
          <p className="font-mono text-xs font-bold text-[#8E7A74] uppercase tracking-wider text-center py-24">
            {errorCatalogo || 'Cargando Café Marfil...'}
          </p>
        )}

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
        {catalogoListo && activeScreen === 'inicio' && (
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
            actividades={actividades}
            promociones={promociones}
            sucursales={sucursales}
          />
        )}

        {/* MENÚ OFICIAL (CAROUSEL & DESKTOP/MÓVIL) */}
        {catalogoListo && activeScreen === 'menu' && (
          <MenuScreen
            secciones={secciones}
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
        {catalogoListo && activeScreen === 'actividades' && (
          <ActivitiesScreen
            actividades={actividades}
            sucursales={sucursales}
            onSelectActivity={handleSelectActivity}
            onGoToReservation={() => navigateTo('reservar')}
          />
        )}

        {/* DETALLE DE ACTIVIDAD */}
        {catalogoListo && activeScreen === 'detalle_actividad' && (
          <ActivityDetailScreen
            activity={selectedActivity || actividades[0]}
            onBack={() => navigateTo('actividades')}
            onBookActivity={handleBookActivity}
          />
        )}

        {/* PROMOCIONES */}
        {catalogoListo && activeScreen === 'promociones' && (
          <PromotionsScreen
            promociones={promociones}
            onSelectPromo={handleSelectPromo}
          />
        )}

        {/* DETALLE DE PROMOCIÓN */}
        {catalogoListo && activeScreen === 'detalle_promocion' && (
          <PromotionDetailScreen
            promo={selectedPromo || promociones[0]}
            onBack={() => navigateTo('promociones')}
          />
        )}

        {/* MIS BENEFICIOS / FIDELIDAD */}
        {activeScreen === 'beneficios' && (
          perfil ? (
            <BenefitsScreen
              perfil={perfil}
              beneficios={beneficios}
            />
          ) : (
            <AuthScreen
              onLogin={iniciarSesion}
              onRegister={crearCuenta}
              motivo="Inicia sesión para ver tu pasaporte de sellos y tus beneficios."
            />
          )
        )}

        {/* SISTEMA DE RESERVACIONES (WIZARD EN 6 PASOS) */}
        {catalogoListo && activeScreen === 'reservar' && (
          <ReservationWizard
            sucursales={sucursales}
            actividades={actividades}
            initialData={reservationWizardInitialData}
            contacto={perfil}
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
        {catalogoListo && activeScreen === 'sucursales' && (
          <BranchesScreen
            sucursales={sucursales}
            onReserveBranch={handleReserveBranch}
            onFilterBranchActivities={handleFilterBranchActivities}
          />
        )}

        {/* PERFIL DEL CLIENTE */}
        {activeScreen === 'perfil' && !perfil && (
          <AuthScreen onLogin={iniciarSesion} onRegister={crearCuenta} />
        )}
        {activeScreen === 'perfil' && perfil && (
          <ProfileScreen
            key={perfil.codigoCliente}
            perfil={perfil}
            onUpdatePerfil={handleUpdatePerfil}
            onLogout={cerrarSesion}
            onViewReservations={() => navigateTo('mis_reservaciones')}
            onViewBenefits={() => navigateTo('beneficios')}
            theme={theme}
            toggleTheme={toggleTheme}
            reservacionesCount={reservaciones.filter((r) => r.estado !== 'Cancelada').length}
            beneficiosCount={beneficios.filter((b) => b.estado === 'disponible').length}
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
                DURANGO, DGO. · 2 SUCURSALES
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

      {aviso && (
        <div
          role="alert"
          onClick={() => setAviso(null)}
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[10000] w-[min(92vw,28rem)] p-3.5 rounded-md bg-[#1F1410] text-white border-l-4 border-[#E12927] shadow-lg font-body text-xs sm:text-sm font-medium cursor-pointer"
        >
          {aviso}
        </div>
      )}

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
