import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import NotificationsDrawer from './components/NotificationsDrawer';
import ReservationModal from './components/ReservationModal';
import ElephantLogo from './components/ElephantLogo';
import { AlertCard, AlertToastStack, useAlertas } from './components/ui/AlertSystem';
import { MainLoader } from './components/ui/MainLoader';
import { SkeletonList, SkeletonMenuGrid } from './components/ui/Skeletons';

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
import EmailFlowScreen from './screens/EmailFlowScreen';
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
  const [emailToken, setEmailToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verificar') || params.get('restablecer') || '';
  });
  const [reenviandoVerif, setReenviandoVerif] = useState(false);

  // Sistema de alertas flotantes (éxito, error, advertencia, info)
  const {
    alertas,
    cerrarAlerta,
    exito: mostrarExito,
    error: mostrarError,
    advertencia: mostrarAdvertencia,
    info: mostrarInfo
  } = useAlertas();

  // 1. Estado de Pantalla Activa con soporte para URL /hero, /menu, ?verificar o ?restablecer
  const [activeScreen, setActiveScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verificar')) return 'verificar_correo';
    if (params.get('restablecer')) return 'restablecer_password';
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verificado = params.get('verificado');
    if (verificado === 'ok') {
      mostrarExito('¡Tu correo electrónico fue verificado con éxito!', 'Correo verificado');
    } else if (verificado === 'error') {
      mostrarError('El enlace de verificación no es válido o ya expiró.');
    }
    if (params.has('verificar') || params.has('restablecer') || params.has('verificado')) {
      window.history.replaceState({}, '', window.location.pathname || '/');
    }
  }, [mostrarExito, mostrarError]);

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
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationModalSuccess, setReservationModalSuccess] = useState(false);
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

  const toggleTheme = (event) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (!document.startViewTransition || reduceMotion) {
      setTheme(nextTheme);
      return;
    }

    let x = window.innerWidth - 48;
    let y = 36;
    if (event?.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (typeof event?.clientX === 'number' && typeof event?.clientY === 'number') {
      x = event.clientX;
      y = event.clientY;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('marfil_theme', nextTheme);
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      })
      .catch(() => {});
  };

  // 4. Catálogo público (sucursales, actividades, promociones, menú y juegos)
  const [sucursales, setSucursales] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [juegosCatalogo, setJuegosCatalogo] = useState([]);
  const [catalogoListo, setCatalogoListo] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  // 5. Cuenta del cliente. `cliente` es null cuando se navega como invitado.
  const [cliente, setCliente] = useState(null);
  const [reservaciones, setReservaciones] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const perfil = cliente ? aPerfil(cliente) : null;

  const [cargandoCuenta, setCargandoCuenta] = useState(false);

  const cargarCatalogo = useCallback(async () => {
    setErrorCatalogo('');
    const [s, a, p, listaProductos, listaJuegos] = await Promise.all([
      api('/sucursales'),
      api('/actividades'),
      api('/promociones'),
      api('/menu/productos'),
      api('/juegos/catalogo').catch(() => [])
    ]);
    setSucursales(s);
    setActividades(a.map(aActividad));
    setPromociones(p.map(aPromocion));
    setProductos(listaProductos);
    setSecciones(aSeccionesDeMenu(listaProductos));
    setJuegosCatalogo(Array.isArray(listaJuegos) ? listaJuegos : []);
    setCatalogoListo(true);
  }, []);

  /**
   * Reservaciones, beneficios y notificaciones. Con sesión salen de la cuenta;
   * como invitado solo hay reservaciones: las que se hicieron en este dispositivo.
   */
  const cargarCuenta = useCallback(async (conSesion) => {
    setCargandoCuenta(true);
    try {
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
    } finally {
      setCargandoCuenta(false);
    }
  }, []);

  // Arranque: catálogo, y la sesión guardada si la hay.
  useEffect(() => {
    cargarCatalogo().catch((error) => setErrorCatalogo(error.message));

    alExpirarSesion(() => {
      setCliente(null);
      mostrarAdvertencia('Tu sesión expiró. Inicia sesión de nuevo.', 'Sesión expirada');
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
  const iniciarSesion = async (email, password) => {
    await entrar(await api('/auth/clientes/login', { metodo: 'POST', body: { email, password } }));
    mostrarExito('¡Bienvenido de vuelta a Club Marfil!', 'Sesión iniciada');
  };
  const crearCuenta = async (datos) => {
    const respuesta = await api('/auth/clientes/registro', { metodo: 'POST', body: datos });
    if (respuesta?.token) {
      await entrar(respuesta);
    } else {
      mostrarInfo(
        'Te enviamos un código de 6 dígitos a tu correo para confirmar tu identidad.',
        'Confirma tu correo'
      );
    }
    return respuesta;
  };

  const verificarCodigoCuenta = async (email, codigo) => {
    const respuesta = await api('/auth/verificar-codigo', {
      metodo: 'POST',
      body: { email, codigo }
    });
    await entrar(respuesta);
    mostrarExito('¡Correo verificado! Ya iniciaste sesión en Club Marfil.', 'Cuenta activada');
  };

  const reenviarCodigoCuenta = async (email) => {
    const resp = await api('/auth/verificacion/reenviar', {
      metodo: 'POST',
      body: { email }
    });
    mostrarExito(resp?.mensaje || 'Te enviamos un nuevo código de 6 dígitos.', 'Código reenviado');
  };

  const handleReenviarVerificacion = async () => {
    if (reenviandoVerif) return;
    setReenviandoVerif(true);
    try {
      const resp = await api('/auth/verificacion/reenviar', { metodo: 'POST' });
      mostrarExito(resp?.mensaje || 'Te enviamos un nuevo correo de verificación.', 'Correo enviado');
      if (resp?.yaVerificado) {
        const me = await api('/auth/me').catch(() => null);
        if (me?.cliente) setCliente(me.cliente);
      }
    } catch (error) {
      mostrarError(error.message);
    } finally {
      setReenviandoVerif(false);
    }
  };

  const handleCorreoVerificado = useCallback((clienteActualizado) => {
    if (clienteActualizado) {
      setCliente((prev) => (prev && prev.id === clienteActualizado.id ? clienteActualizado : prev));
    }
  }, []);

  const cerrarSesion = () => {
    sesion.cerrar();
    setCliente(null);
    cargarCuenta(false).catch(() => {});
    mostrarInfo('Cerraste tu sesión correctamente.', 'Hasta pronto');
    navigateTo('inicio');
  };

  const handleUpdatePerfil = async (nuevo) => {
    try {
      const actualizado = await api('/mi/perfil', {
        metodo: 'PATCH',
        body: {
          nombre: nuevo.nombre,
          nombres: nuevo.nombres,
          apellidoPaterno: nuevo.apellidoPaterno,
          apellidoMaterno: nuevo.apellidoMaterno || '',
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
      mostrarExito('Tu perfil se actualizó correctamente.', 'Perfil guardado');
    } catch (error) {
      mostrarError(error.message);
    }
  };

  // Métodos de navegación y acciones
  const navigateTo = (screenId) => {
    if (screenId === 'reservar') {
      setReservationModalSuccess(false);
      setReservationModalOpen(true);
      return;
    }
    if (screenId === 'confirmacion_reservacion' && reservationModalOpen) {
      setReservationModalSuccess(true);
      return;
    }
    setReservationModalOpen(false);
    setReservationModalSuccess(false);
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
  };

  const handleSelectPromo = (promo) => {
    setSelectedPromo(promo);
  };

  // Reservar directamente una actividad
  const handleBookActivity = (activity) => {
    setSelectedActivity(null);
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
          juegoId: nueva.juegoId || undefined,
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
      mostrarExito(`La reservación ${reservationId} fue cancelada.`, 'Reservación cancelada');
    } catch (error) {
      mostrarError(error.message);
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
        isLoggedIn={Boolean(perfil)}
      />

      {/* Banner de verificación pendiente de correo */}
      {perfil && perfil.correo && !perfil.emailVerificado && activeScreen !== 'hero' && (
        <div className="w-full bg-[#FCEAE9] border-b border-[#E12927]/30 px-4 py-2.5 mt-[72px] -mb-[72px] relative z-30">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-xs sm:text-sm text-[#1F1410] font-medium m-0">
              <strong className="text-[#E12927]">Verifica tu correo electrónico ({perfil.correo})</strong> para poder canjear tus beneficios Club Marfil en sucursal.
            </p>
            <button
              type="button"
              onClick={handleReenviarVerificacion}
              disabled={reenviandoVerif}
              className="px-3.5 py-1.5 rounded-md bg-[#E12927] hover:bg-[#C81E1C] text-white font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60 transition-colors"
            >
              {reenviandoVerif ? 'Enviando...' : 'Reenviar correo'}
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal con Enrutador React */}
      <main className={activeScreen === 'hero' || activeScreen === 'inicio' || activeScreen === 'menu' || activeScreen === 'promociones' || activeScreen === 'perfil' || activeScreen === 'beneficios' ? 'w-full p-0 m-0 max-w-none flex-1' : 'main-content'} id="main-content">
        {!catalogoListo && activeScreen !== 'hero' && (
          errorCatalogo ? (
            <div className="max-w-lg mx-auto my-24 px-4">
              <AlertCard
                variante="error"
                titulo="No se pudo conectar con Café Marfil"
                mensaje={errorCatalogo}
                accionTexto="Reintentar"
                onAccion={() => cargarCatalogo().catch((e) => setErrorCatalogo(e.message))}
              />
            </div>
          ) : activeScreen === 'inicio' ? (
            <MainLoader texto="Preparando Café Marfil..." />
          ) : ['menu', 'actividades', 'promociones'].includes(activeScreen) ? (
            <SkeletonMenuGrid cantidad={6} />
          ) : (
            <SkeletonList filas={4} />
          )
        )}

        {/* PROTOTIPO HERO COFFEE & CO. (/hero) */}
        {activeScreen === 'hero' && (
          <HeroSection
            productos={productos}
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
            productos={productos}
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

        {/* PROMOCIONES */}
        {catalogoListo && activeScreen === 'promociones' && (
          <PromotionsScreen
            promociones={promociones}
            onSelectPromo={handleSelectPromo}
          />
        )}

        {/* MIS BENEFICIOS / FIDELIDAD */}
        {activeScreen === 'beneficios' && (
          perfil ? (
            <BenefitsScreen
              perfil={perfil}
              beneficios={beneficios}
              onResendVerification={handleReenviarVerificacion}
              resendingVerification={reenviandoVerif}
            />
          ) : (
            <AuthScreen
              onLogin={iniciarSesion}
              onRegister={crearCuenta}
              onVerifyCode={verificarCodigoCuenta}
              onResendCode={reenviarCodigoCuenta}
              onForgotPassword={() => navigateTo('olvide_password')}
              motivo="Inicia sesión para ver tu pasaporte de sellos y tus beneficios."
            />
          )
        )}

        {/* SISTEMA DE RESERVACIONES (WIZARD EN 6 PASOS - REQUIERE CUENTA) */}
        {catalogoListo && activeScreen === 'reservar' && (
          perfil ? (
            <ReservationWizard
              sucursales={sucursales}
              actividades={actividades}
              juegos={juegosCatalogo}
              initialData={reservationWizardInitialData}
              contacto={perfil}
              onCancel={() => navigateTo('inicio')}
              onCompleteReservation={handleCompleteReservation}
            />
          ) : (
            <AuthScreen
              modoInicial="registrar"
              onLogin={iniciarSesion}
              onRegister={crearCuenta}
              onVerifyCode={verificarCodigoCuenta}
              onResendCode={reenviarCodigoCuenta}
              onForgotPassword={() => navigateTo('olvide_password')}
              motivo="Para apartar tu mesa o lugar en una actividad necesitas una cuenta Club Marfil. Crea tu cuenta (o inicia sesión) y continuaremos automáticamente con tu reservación."
            />
          )
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
          !perfil ? (
            <AuthScreen
              modoInicial="entrar"
              onLogin={iniciarSesion}
              onRegister={crearCuenta}
              onVerifyCode={verificarCodigoCuenta}
              onResendCode={reenviarCodigoCuenta}
              onForgotPassword={() => navigateTo('olvide_password')}
              motivo="Inicia sesión o crea tu cuenta para ver y administrar tus reservaciones."
            />
          ) : cargandoCuenta ? (
            <SkeletonList filas={4} />
          ) : (
            <MyReservationsScreen
              reservaciones={reservaciones}
              onCancelReservation={handleCancelReservation}
              onNewReservation={() => {
                setReservationWizardInitialData(null);
                navigateTo('reservar');
              }}
            />
          )
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
          <AuthScreen
            onLogin={iniciarSesion}
            onRegister={crearCuenta}
            onVerifyCode={verificarCodigoCuenta}
            onResendCode={reenviarCodigoCuenta}
            onForgotPassword={() => navigateTo('olvide_password')}
          />
        )}
        {activeScreen === 'verificar_correo' && (
          <EmailFlowScreen
            modo="verificar"
            token={emailToken}
            onVerified={handleCorreoVerificado}
            onGoLogin={() => {
              setEmailToken('');
              navigateTo('perfil');
            }}
            onGoHome={() => {
              setEmailToken('');
              navigateTo('inicio');
            }}
          />
        )}
        {activeScreen === 'olvide_password' && (
          <EmailFlowScreen
            modo="olvide"
            onGoLogin={() => navigateTo('perfil')}
            onGoHome={() => navigateTo('inicio')}
          />
        )}
        {activeScreen === 'restablecer_password' && (
          <EmailFlowScreen
            modo="restablecer"
            token={emailToken}
            onGoLogin={() => {
              setEmailToken('');
              navigateTo('perfil');
            }}
            onGoHome={() => {
              setEmailToken('');
              navigateTo('inicio');
            }}
          />
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

      {/* Footer Compacto Café Marfil (oculto en Perfil para ajustar 100% a pantalla sin scroll) */}
      {!(activeScreen === 'perfil' && perfil) && (
      <footer className="marfil-footer">
        <div className="footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ElephantLogo size={32} color="negro" />
                <div>
                  <div className="footer-logo font-display">Café Marfil</div>
                  <span className="footer-subtitle">Durango, Dgo. · 2 Sucursales</span>
                </div>
              </div>
            </div>

            <nav className="footer-nav-inline font-body" aria-label="Enlaces del pie">
              <button type="button" onClick={() => navigateTo('menu')}>Menú</button>
              <button type="button" onClick={() => navigateTo('actividades')}>Actividades</button>
              <button type="button" onClick={() => navigateTo('promociones')}>Promociones</button>
              <button type="button" onClick={() => navigateTo('reservar')}>Reservar</button>
              <button type="button" onClick={() => navigateTo('beneficios')}>Club Marfil</button>
              <button type="button" onClick={() => navigateTo('sucursales')}>Sucursales</button>
            </nav>

            <div className="footer-contact-col">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-link"
              >
                @cafe.marfil
              </a>
              <span className="footer-sep">·</span>
              <span className="footer-phone">(618) 811-2345</span>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© 2026 Café Marfil Durango. Todos los derechos reservados.</span>
            <span>Café de Especialidad · Desayunos · Juegos de Mesa</span>
          </div>
        </div>
      </footer>
      )}

      {/* Navegación Móvil Inferior con botón Reservar Elevado */}
      <BottomNav
        activeScreen={activeScreen}
        isLoggedIn={Boolean(perfil)}
        setActiveScreen={(s) => {
          setReservationWizardInitialData(null);
          navigateTo(s);
        }}
      />

      <AlertToastStack alertas={alertas} onDismiss={cerrarAlerta} />

      {/* Modal de Reservación de Mesa / Apartar Lugares */}
      <ReservationModal
        isOpen={reservationModalOpen}
        onClose={() => {
          setReservationModalOpen(false);
          setReservationModalSuccess(false);
        }}
        titulo={
          reservationModalSuccess
            ? 'Reservación Confirmada'
            : reservationWizardInitialData?.actividad
            ? `Apartar lugares · ${reservationWizardInitialData.actividad.nombre}`
            : 'Reservar Mesa en Café Marfil'
        }
        subtitulo={
          reservationModalSuccess
            ? 'Tu pase digital está listo para mostrarse al llegar.'
            : reservationWizardInitialData?.actividad
            ? 'Confirma tus lugares para esta experiencia en minutos.'
            : 'Elige tu sucursal, horario, personas y mesa favorita.'
        }
      >
        {reservationModalSuccess ? (
          <ReservationSuccessScreen
            reservation={lastConfirmedReservation || reservaciones[0]}
            onGoHome={() => {
              setReservationModalOpen(false);
              setReservationModalSuccess(false);
              navigateTo('inicio');
            }}
            onViewReservations={() => {
              setReservationModalOpen(false);
              setReservationModalSuccess(false);
              navigateTo('mis_reservaciones');
            }}
          />
        ) : !catalogoListo ? (
          <SkeletonList filas={4} />
        ) : (
          <ReservationWizard
            key={reservationWizardInitialData?.actividadId || reservationWizardInitialData?.sucursalId || 'mesa'}
            sucursales={sucursales}
            actividades={actividades}
            juegos={juegosCatalogo}
            initialData={reservationWizardInitialData}
            contacto={perfil}
            onCancel={() => {
              setReservationModalOpen(false);
              setReservationModalSuccess(false);
            }}
            onCompleteReservation={handleCompleteReservation}
          />
        )}
      </ReservationModal>

      {/* Modales de detalle de Actividad y Promoción */}
      <ActivityDetailScreen
        activity={selectedActivity}
        onBack={() => setSelectedActivity(null)}
        onBookActivity={handleBookActivity}
      />
      <PromotionDetailScreen
        promo={selectedPromo}
        onBack={() => setSelectedPromo(null)}
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
          border-top: 1px solid var(--border-light);
          padding: 1.4rem 1.25rem 5.25rem 1.25rem;
          margin-top: auto;
        }
        @media (min-width: 768px) {
          .marfil-footer {
            padding: 1.4rem 2rem;
          }
        }
        .footer-inner {
          max-width: var(--max-content-width);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .footer-top-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.9rem;
        }
        @media (min-width: 900px) {
          .footer-top-row {
            flex-direction: row;
            align-items: center;
          }
        }
        .footer-logo {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--negro-cafe);
          line-height: 1.1;
        }
        .footer-subtitle {
          font-size: 0.72rem;
          color: var(--text-light);
          display: block;
        }
        .footer-nav-inline {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem 1.15rem;
        }
        .footer-nav-inline button {
          color: var(--text-muted);
          font-size: 0.82rem;
          padding: 0;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .footer-nav-inline button:hover {
          color: var(--rojo-marfil);
        }
        .footer-contact-col {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-light);
        }
        .footer-social-link {
          color: var(--negro-cafe);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-social-link:hover {
          color: var(--rojo-marfil);
        }
        .footer-sep {
          opacity: 0.4;
        }
        .footer-bottom-bar {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          border-top: 1px solid var(--border-light);
          padding-top: 0.85rem;
          font-size: 0.72rem;
          color: var(--text-light);
        }
        @media (min-width: 768px) {
          .footer-bottom-bar {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
