import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { ReservationsTableView } from './components/ReservationsTableView';
import { FloorPlanModule } from './components/FloorPlanModule';
import { ScannerModule } from './components/ScannerModule';
import { MenuCatalogModule } from './components/MenuCatalogModule';
import { ActivitiesModule } from './components/ActivitiesModule';
import { PromotionsModule } from './components/PromotionsModule';
import { LudotecaModule } from './components/LudotecaModule';
import { StaffSettingsModule } from './components/StaffSettingsModule';
import { WalkInModal } from './components/WalkInModal';
import { LoginScreen } from './components/LoginScreen';
import { StaffOnboardingScreen } from './components/StaffOnboardingScreen';
import { AlertCard, AlertToastStack, useAlertas } from './components/ui/AlertSystem';
import { MainLoader } from './components/ui/MainLoader';
import { SkeletonDashboard } from './components/ui/Skeletons';

import { alExpirarSesion, api, sesion } from './api/cliente';
import { aClienteClub, aEscaneo, aJuego, aPersona, aReservacion, aSucursal } from './api/adaptadores';
import { cargarReservacionesPanel } from './api/reservaciones';
import { esAdmin, esGerencia, puedeVerTab } from './utils/permisos';

const SEGUNDOS_ENTRE_RECARGAS = 30;

const METRICAS_VACIAS = {
  fecha: null,
  reservasHoy: 0,
  comensalesHoy: 0,
  sellosEmitidosHoy: 0,
  codigosEscaneadosHoy: 0,
  distribucionHoraria: []
};

// Campos del producto que se comparan para enviar a la API solo lo que cambió.
const CAMPOS_PRODUCTO = [
  'nombre',
  'nombreCorto',
  'categoriaSlug',
  'etiqueta',
  'porcion',
  'precio',
  'calorias',
  'descripcion',
  'disponibleEnCocina',
  'stockDiario',
  'tiempoPrepMin',
  'imagen',
  'colorCard',
  'badge',
  'ingredientes',
  'alergenos',
  'destacado',
  'estado'
];
const CAMPOS_NUMERICOS_PRODUCTO = ['precio', 'stockDiario', 'tiempoPrepMin'];

export function App() {
  // Sesión y navegación
  const [usuario, setUsuario] = useState(null);
  const [restaurandoSesion, setRestaurandoSesion] = useState(Boolean(sesion.token));
  const [datosListos, setDatosListos] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [walkIn, setWalkIn] = useState({ abierto: false, mesaId: null });
  const { alertas, cerrarAlerta, exito: mostrarExito, error: mostrarError, advertencia: mostrarAdvertencia } = useAlertas();

  // Datos del servidor
  const [sucursales, setSucursales] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);
  const [reservacionesHoy, setReservacionesHoy] = useState([]);
  const [fechaReservaciones, setFechaReservaciones] = useState('');
  const [cargandoReservaciones, setCargandoReservaciones] = useState(false);
  const cargaActual = useRef(0);
  const [menuItems, setMenuItems] = useState([]);
  const [categoriasMenu, setCategoriasMenu] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [clientesClub, setClientesClub] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [invitacionToken, setInvitacionToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invitacion') || '';
  });
  const [staff, setStaff] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [escaneos, setEscaneos] = useState([]);
  const [metricas, setMetricas] = useState(METRICAS_VACIAS);

  // ------------------------------------------------------------------------
  // Sesión
  // ------------------------------------------------------------------------

  const cerrarSesion = useCallback(() => {
    cargaActual.current += 1;
    sesion.cerrar();
    setUsuario(null);
    setDatosListos(false);
  }, []);

  useEffect(() => {
    alExpirarSesion(() => {
      cargaActual.current += 1;
      setUsuario(null);
      setDatosListos(false);
      mostrarAdvertencia('Tu sesión expiró. Inicia sesión de nuevo.', 'Sesión expirada');
    });
  }, [mostrarAdvertencia]);

  // Al abrir el panel: si hay un token guardado, se recupera la sesión.
  useEffect(() => {
    if (!sesion.token) return;
    api('/auth/me')
      .then((respuesta) => {
        if (respuesta.tipo === 'staff') setUsuario(respuesta.usuario);
        else sesion.cerrar();
      })
      .catch(() => {})
      .finally(() => setRestaurandoSesion(false));
  }, []);

  /** Lo llama LoginScreen; si las credenciales fallan lanza un error con el mensaje a mostrar. */
  const iniciarSesion = async (email, password) => {
    const respuesta = await api('/auth/staff/login', { metodo: 'POST', body: { email, password } });
    sesion.guardar(respuesta.token);
    setErrorCarga('');
    setUsuario(respuesta.usuario);
  };

  // ------------------------------------------------------------------------
  // Carga de datos
  // ------------------------------------------------------------------------

  const cargarDatos = useCallback(async () => {
    const carga = ++cargaActual.current;
    setCargandoReservaciones(true);
    setErrorCarga('');
    const sucursalId = selectedSucursal === 'todas' ? undefined : selectedSucursal;
    try {
      // La fecha del servidor solo delimita los indicadores y la operación de hoy.
      const nuevasMetricas = await api('/metricas/hoy', { query: { sucursalId } });
      const esAdminActual = esAdmin(usuario);
      const esGerenciaActual = esGerencia(usuario);
      const [s, m, r, productos, catsMenu, acts, promos, clientes, j, personal, invs, historial] = await Promise.all([
        api('/sucursales'),
        api('/mesas'),
        cargarReservacionesPanel(api, { hoy: nuevasMetricas.fecha, fecha: fechaReservaciones, sucursalId }),
        api('/menu/productos', { query: esGerenciaActual ? { incluirBorradores: '1' } : undefined }),
        api('/menu/categorias'),
        api('/actividades', { query: esGerenciaActual ? { incluirPasadas: '1', incluirInactivas: '1' } : undefined }),
        api('/promociones'),
        api('/club/clientes'),
        api('/juegos'),
        esAdminActual ? api('/personal') : Promise.resolve([]),
        esAdminActual ? api('/personal/invitaciones').catch(() => []) : Promise.resolve([]),
        api('/escaner/historial', { query: { limite: 30 } })
      ]);
      if (carga !== cargaActual.current) return;
      setMetricas(nuevasMetricas);
      setSucursales(s.map(aSucursal));
      setMesas(m);
      setReservaciones(r.reservaciones.map(aReservacion(nuevasMetricas.fecha)));
      setReservacionesHoy(r.reservacionesHoy.map(aReservacion(nuevasMetricas.fecha)));
      setMenuItems(productos);
      setCategoriasMenu(catsMenu);
      setActividades(acts);
      setPromociones(promos);
      setClientesClub(clientes.map(aClienteClub));
      setJuegos(j.map(aJuego));
      setStaff(personal.map(aPersona));
      setInvitaciones(Array.isArray(invs) ? invs : []);
      setEscaneos(historial.map(aEscaneo));
      setDatosListos(true);
    } catch (err) {
      if (carga !== cargaActual.current) return;
      setErrorCarga(err.message || 'No se pudieron cargar los datos del servidor.');
      throw err;
    } finally {
      if (carga === cargaActual.current) setCargandoReservaciones(false);
    }
  }, [selectedSucursal, fechaReservaciones, usuario]);

  // Si cambia el usuario o intenta acceder a una pestaña sin permiso, regresa a dashboard.
  useEffect(() => {
    if (usuario && !puedeVerTab(usuario.rol, activeTab)) {
      setActiveTab('dashboard');
    }
  }, [usuario, activeTab]);

  // Carga inicial y recarga periódica para que mesas y tiempos se mantengan al día.
  useEffect(() => {
    if (!usuario) return undefined;
    const recargar = () => cargarDatos().catch((error) => mostrarError(error.message));
    recargar();
    const intervalo = setInterval(recargar, SEGUNDOS_ENTRE_RECARGAS * 1000);
    return () => {
      clearInterval(intervalo);
      cargaActual.current += 1;
    };
  }, [usuario, cargarDatos]);

  /**
   * Ejecuta una acción contra la API y recarga los datos. Devuelve true/false
   * para que el componente sepa si puede mostrar su mensaje de éxito.
   */
  const ejecutar = async (accion, mensajeExito = '') => {
    try {
      await accion();
    } catch (error) {
      mostrarError(error.message);
      cargarDatos().catch(() => {});
      return false;
    }
    try {
      await cargarDatos();
      if (mensajeExito) mostrarExito(mensajeExito);
    } catch {
      mostrarAdvertencia('El cambio se guardó, pero no se pudo recargar el panel. Pulsa Actualizar para verlo.');
    }
    return true;
  };

  const post = (ruta, body = {}) => api(ruta, { metodo: 'POST', body });
  const patch = (ruta, body) => api(ruta, { metodo: 'PATCH', body });

  // ------------------------------------------------------------------------
  // Mesas
  // ------------------------------------------------------------------------

  /** Plano de mesas: el host pide llevar una mesa a `nuevoEstado`. */
  const handleUpdateMesa = (mesaId, nuevoEstado) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa || mesa.estado === nuevoEstado) return Promise.resolve(true);

    if (nuevoEstado === 'ocupada') {
      if (mesa.estado === 'libre') {
        setWalkIn({ abierto: true, mesaId }); // falta saber quién se sienta y cuántos son
      } else if (mesa.estado === 'reservada') {
        mostrarError(`La mesa ${mesa.numero} está reservada (folio ${mesa.reservaFolio}). Haz el check-in desde Reservaciones.`);
      } else {
        mostrarError(`La mesa ${mesa.numero} está en limpieza. Libérala antes de sentar a alguien.`);
      }
      return Promise.resolve(false);
    }
    if (nuevoEstado === 'limpieza') return ejecutar(() => post(`/mesas/${mesaId}/liberar`), `Mesa ${mesa.numero} liberada a limpieza.`);

    // nuevoEstado === 'libre'
    return ejecutar(async () => {
      if (mesa.estado === 'ocupada') await post(`/mesas/${mesaId}/liberar`);
      if (mesa.estado !== 'reservada') await post(`/mesas/${mesaId}/limpia`);
    }, `Mesa ${mesa.numero} marcada como libre.`);
  };

  const handleAssignWalkIn = ({ mesaId, comensal, personas, notas }) =>
    ejecutar(() => post(`/mesas/${mesaId}/walk-in`, { comensal, personas, notas }), 'Mesa asignada a comensal walk-in.');

  // ------------------------------------------------------------------------
  // Reservaciones
  // ------------------------------------------------------------------------

  /** Mesa libre más chica en la que cabe el grupo (las de ludoteca primero si viene a jugar). */
  const sugerirMesa = (reservacion) => {
    const candidatas = mesas
      .filter((m) => m.sucursalId === reservacion.sucursalId && m.estado === 'libre' && m.capacidad >= reservacion.personas)
      .sort((a, b) => a.capacidad - b.capacidad);
    const deLudoteca = candidatas.filter((m) => m.zona?.includes('Ludoteca'));
    return (reservacion.tipo === 'juegos' && deLudoteca[0]) || candidatas[0];
  };

  /** Los componentes mandan la reservación con su nuevo estado; aquí se traduce a la acción de la API. */
  const handleUpdateReservacion = (actualizada) => {
    const anterior = reservaciones.find((r) => r.folio === actualizada.folio)
      ?? reservacionesHoy.find((r) => r.folio === actualizada.folio);
    if (!anterior || anterior.estado === actualizada.estado) return Promise.resolve(true);
    const ruta = `/reservaciones/${actualizada.folio}`;

    switch (actualizada.estado) {
      case 'en_curso': {
        // Si la reservación no trae mesa se le asigna una libre al llegar.
        const mesaId = anterior.mesaId ?? sugerirMesa(anterior)?.id;
        return ejecutar(() => post(`${ruta}/check-in`, mesaId ? { mesaId } : {}));
      }
      case 'asistida':
        return ejecutar(() => post(`${ruta}/completar`));
      case 'cancelada':
        return ejecutar(() => post(`${ruta}/cancelar`));
      case 'no_show':
        return ejecutar(() => post(`${ruta}/no-show`));
      default:
        return Promise.resolve(false);
    }
  };

  const handleAddReservacion = (nueva) =>
    ejecutar(() =>
      post('/reservaciones', {
        tipo: nueva.tipo === 'juegos' ? 'juegos' : 'mesa',
        tipoNombre: nueva.tipoNombre,
        sucursalId: nueva.sucursalId,
        fecha: nueva.fechaISO || metricas.fecha,
        hora: nueva.hora,
        personas: nueva.personas,
        comensal: nueva.comensal,
        telefono: nueva.telefono,
        notas: nueva.notas
      })
    );

  // ------------------------------------------------------------------------
  // Menú
  // ------------------------------------------------------------------------

  const handleUpdateMenuItem = (actualizado) => {
    const anterior = menuItems.find((item) => item.id === actualizado.id);
    if (!anterior) return Promise.resolve(false);
    const cambios = {};
    for (const campo of CAMPOS_PRODUCTO) {
      if (actualizado[campo] === undefined) continue;
      const valor = CAMPOS_NUMERICOS_PRODUCTO.includes(campo) ? Number(actualizado[campo]) : actualizado[campo];
      if (JSON.stringify(valor) !== JSON.stringify(anterior[campo])) cambios[campo] = valor;
    }
    if (Object.keys(cambios).length === 0) return Promise.resolve(true);
    return ejecutar(() => patch(`/menu/productos/${actualizado.id}`, cambios));
  };

  const handleAddMenuItem = (nuevo) =>
    ejecutar(() =>
      post('/menu/productos', {
        nombre: nuevo.nombre,
        nombreCorto: nuevo.nombreCorto || undefined,
        categoriaSlug: nuevo.categoriaSlug,
        etiqueta: nuevo.etiqueta || undefined,
        porcion: nuevo.porcion || undefined,
        precio: nuevo.precio,
        calorias: nuevo.calorias ?? undefined,
        descripcion: nuevo.descripcion,
        stockDiario: nuevo.stockDiario,
        tiempoPrepMin: nuevo.tiempoPrepMin,
        imagen: nuevo.imagen || undefined,
        colorCard: nuevo.colorCard || undefined,
        badge: nuevo.badge || undefined,
        ingredientes: nuevo.ingredientes || [],
        alergenos: nuevo.alergenos || [],
        destacado: Boolean(nuevo.destacado),
        estado: nuevo.estado || 'publicado'
      })
    );

  const handleDeleteMenuItem = (id) => ejecutar(() => api(`/menu/productos/${id}`, { metodo: 'DELETE' }), 'Platillo eliminado del menú.');
  const handlePublishMenuItem = (id) => ejecutar(() => post(`/menu/productos/${id}/publicar`), 'Platillo publicado en la carta.');
  const handleUnpublishMenuItem = (id) => ejecutar(() => post(`/menu/productos/${id}/despublicar`), 'Platillo pasado a borrador.');
  const handleReorderMenuItems = (items) => ejecutar(() => patch('/menu/orden', { items }), 'Orden del menú actualizado.');

  // ------------------------------------------------------------------------
  // Actividades
  // ------------------------------------------------------------------------

  const handleAddActividad = (nueva) => ejecutar(() => post('/actividades', nueva), 'Actividad creada correctamente.');
  const handleUpdateActividad = (id, cambios) => ejecutar(() => patch(`/actividades/${id}`, cambios), 'Actividad actualizada.');

  // ------------------------------------------------------------------------
  // Promociones y Club Marfil
  // ------------------------------------------------------------------------

  const CAMPOS_PROMOCION = [
    'codigo',
    'titulo',
    'categoria',
    'categoriaSlug',
    'descuentoBadge',
    'beneficio',
    'descripcion',
    'vigencia',
    'imagen',
    'limiteDiario',
    'estado',
    'sucursales'
  ];

  const handleUpdatePromocion = (actualizada) => {
    const anterior = promociones.find((p) => p.id === actualizada.id);
    if (!anterior) return Promise.resolve(false);
    if (actualizada.canjesHoy !== undefined && actualizada.canjesHoy > anterior.canjesHoy) {
      return ejecutar(() => post(`/promociones/${actualizada.id}/canjear`));
    }
    const cambios = {};
    for (const campo of CAMPOS_PROMOCION) {
      if (actualizada[campo] === undefined) continue;
      const valor = campo === 'limiteDiario' ? Number(actualizada[campo]) : actualizada[campo];
      if (JSON.stringify(valor) !== JSON.stringify(anterior[campo])) cambios[campo] = valor;
    }
    if (Object.keys(cambios).length === 0) return Promise.resolve(true);
    return ejecutar(() => patch(`/promociones/${actualizada.id}`, cambios));
  };

  const handleCanjearPromocion = (promoId, { sucursalId, codigoCliente } = {}) =>
    ejecutar(
      () =>
        post(`/promociones/${promoId}/canjear`, {
          ...(sucursalId ? { sucursalId } : {}),
          ...(codigoCliente ? { codigoCliente } : {})
        }),
      'Cupón canjeado y aplicado correctamente.'
    );

  const handleCanjearBeneficio = (codigo) =>
    ejecutar(() => post(`/club/beneficios/${encodeURIComponent(codigo)}/canjear`), 'Beneficio Club Marfil entregado.');

  const handleAddPromocion = (nueva) =>
    ejecutar(() =>
      post('/promociones', {
        codigo: nueva.codigo,
        titulo: nueva.titulo,
        categoria: nueva.categoria,
        categoriaSlug: nueva.categoriaSlug || undefined,
        descuentoBadge: nueva.descuentoBadge,
        beneficio: nueva.beneficio,
        descripcion: nueva.descripcion || undefined,
        vigencia: nueva.vigencia,
        imagen: nueva.imagen || undefined,
        limiteDiario: Number(nueva.limiteDiario),
        sucursales: nueva.sucursales
      })
    );

  const handleUpdateClienteClub = (actualizado) => {
    const anterior = clientesClub.find((c) => c.codigoCliente === actualizado.codigoCliente);
    if (!anterior) return Promise.resolve(false);
    const ruta = `/club/clientes/${actualizado.codigoCliente}`;
    if (anterior.recompensaDisponible && !actualizado.recompensaDisponible) {
      return ejecutar(() => post(`${ruta}/canjear-recompensa`));
    }
    if (actualizado.puntos > anterior.puntos) return ejecutar(() => post(`${ruta}/sello`));
    return Promise.resolve(true);
  };

  // ------------------------------------------------------------------------
  // Ludoteca
  // ------------------------------------------------------------------------

  const handleUpdateJuego = (actualizado) => {
    const anterior = juegos.find((j) => j.id === actualizado.id);
    if (!anterior) return Promise.resolve(false);
    const ruta = `/juegos/${actualizado.id}`;

    if (actualizado.estado === 'en_mesa' && anterior.estado !== 'en_mesa') {
      // El componente manda 'Mesa L01': se busca esa mesa en la sucursal del juego.
      const numero = String(actualizado.mesaActual).replace('Mesa ', '').trim();
      const mesa = mesas.find((m) => m.sucursalId === anterior.sucursalId && m.numero === numero);
      if (!mesa) {
        mostrarError(`No existe la mesa ${numero} en la sucursal de este juego.`);
        return Promise.resolve(false);
      }
      return ejecutar(() => post(`${ruta}/prestar`, { mesaId: mesa.id }));
    }
    if (actualizado.estado === 'disponible' && anterior.estado === 'en_mesa') {
      return ejecutar(() => post(`${ruta}/devolver`));
    }
    if (actualizado.reposicionRequerida !== anterior.reposicionRequerida) {
      return ejecutar(() =>
        patch(ruta, { reposicionRequerida: actualizado.reposicionRequerida, piezasEstado: actualizado.piezasEstado })
      );
    }
    return Promise.resolve(true);
  };

  const handleAddJuego = (nuevo) =>
    ejecutar(() =>
      post('/juegos', {
        nombre: nuevo.nombre,
        categoria: nuevo.categoria,
        jugadores: nuevo.jugadores,
        duracion: nuevo.duracionMin,
        dificultad: nuevo.dificultad,
        piezasEstado: nuevo.piezasEstado,
        sucursalId: selectedSucursal === 'todas' ? sucursales[0]?.id : selectedSucursal
      })
    );

  // ------------------------------------------------------------------------
  // Vista
  // ------------------------------------------------------------------------

  const currentBranchMesas = selectedSucursal === 'todas'
    ? mesas
    : mesas.filter(m => m.sucursalId === selectedSucursal);

  // La ludoteca vive en una sucursal: solo se ofrecen sus mesas para prestar juegos.
  const sucursalLudoteca = juegos[0]?.sucursalId;
  const mesasLudoteca = mesas.filter((m) => m.sucursalId === sucursalLudoteca);

  const badges = {
    mesasOcupadas: currentBranchMesas.filter(m => m.estado === 'ocupada').length,
    reservasHoy: reservacionesHoy.filter(r => r.estado === 'confirmada' || r.estado === 'en_curso').length,
    agotados: menuItems.filter(i => !i.disponibleEnCocina).length,
    juegosEnMesa: juegos.filter(j => j.estado === 'en_mesa').length
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Panel Principal & Resumen';
      case 'reservations': return 'Reservaciones & Códigos QR';
      case 'floorplan': return 'Host Station & Mesas en Vivo';
      case 'scanner': return 'Terminal de Escáner QR & Pases';
      case 'menu': return 'Cocina en Vivo & Catálogo';
      case 'activities': return 'Actividades & Eventos';
      case 'promotions': return 'Promociones & Cuponera';
      case 'ludoteca': return 'Ludoteca (+60 Juegos)';
      case 'staff': return 'Personal en Turno & Aforos';
      default: return 'Panel Administrativo';
    }
  };

  const handleInvitarEmpleado = (datos) =>
    ejecutar(() => post('/personal/invitar', datos), `Invitación enviada a ${datos.email} (vigencia 12 h).`);

  const handleCancelarInvitacion = (id) =>
    ejecutar(() => api(`/personal/invitaciones/${id}`, { metodo: 'DELETE' }), 'Invitación cancelada.');

  const handleUpdateEmpleado = (id, cambios) =>
    ejecutar(() => patch(`/personal/${id}`, cambios), 'Horario y permisos del empleado actualizados.');

  const avisoFlotante = <AlertToastStack alertas={alertas} onDismiss={cerrarAlerta} />;

  if (invitacionToken) {
    return (
      <>
        <StaffOnboardingScreen
          token={invitacionToken}
          onCompleted={(resp) => {
            window.history.replaceState({}, '', window.location.pathname || '/');
            setInvitacionToken('');
            if (resp.token) {
              sesion.guardar(resp.token);
              setUsuario(resp.usuario);
              mostrarExito(`¡Bienvenido al equipo, ${resp.usuario.nombre}!`, 'Registro completado');
            }
          }}
          onGoLogin={() => {
            window.history.replaceState({}, '', window.location.pathname || '/');
            setInvitacionToken('');
          }}
        />
        {avisoFlotante}
      </>
    );
  }

  if (restaurandoSesion) {
    return <MainLoader texto="Recuperando tu sesión..." />;
  }

  if (!usuario) {
    return (
      <>
        <LoginScreen onLogin={iniciarSesion} soundEnabled={soundEnabled} />
        {avisoFlotante}
      </>
    );
  }

  if (!datosListos) {
    return (
      <>
        {errorCarga ? (
          <div className="h-screen w-screen bg-[#FAF7F5] flex flex-col items-center justify-center gap-4 px-6">
            <div className="max-w-md w-full space-y-3">
              <AlertCard
                variante="error"
                titulo="No se pudo conectar con la API"
                mensaje={errorCarga}
                accionTexto="Reintentar"
                onAccion={() => cargarDatos().catch(() => {})}
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="px-5 py-2 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-screen w-screen bg-[#F8FAFC] p-6 overflow-hidden">
            <SkeletonDashboard />
          </div>
        )}
        {avisoFlotante}
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-body selection:bg-[#E12927] selection:text-white">

      {/* Sidebar Lateral Fijo: Siempre visible al 100%, nunca cambia de posición con el scroll */}
      <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (puedeVerTab(usuario?.rol, tab)) setActiveTab(tab);
          }}
          selectedSucursal={selectedSucursal}
          onSelectSucursal={setSelectedSucursal}
          sucursales={sucursales}
          soundEnabled={soundEnabled}
          usuario={usuario}
          onLogout={cerrarSesion}
        />

        {/* Área Central de Contenido con scroll independiente (el sidebar NO se mueve) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAFC]">

          {/* Topbar Superior Fijo */}
          <Topbar
            activeTabTitle={getTabTitle()}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            usuario={usuario}
          />

          {/* Canvas Principal con scroll independiente o fit completo */}
          <main className={`flex-1 min-h-0 ${
            activeTab === 'dashboard'
              ? 'p-3 sm:p-4 lg:p-5 overflow-hidden flex flex-col justify-between'
              : 'px-4 sm:px-6 lg:px-9 py-6 overflow-y-auto'
          }`}>

            {/* Contenedor con animación de deslizamiento suave en cambio de pestaña */}
            <div key={activeTab} className={`animate-tab-slide ${activeTab === 'dashboard' ? 'h-full flex flex-col justify-between' : ''}`}>
              {/* 1. Vista Principal del Dashboard (Fit 100% de pantalla sin scroll) */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  metricas={metricas}
                  menuItems={menuItems}
                  selectedSucursal={selectedSucursal}
                  sucursales={sucursales}
                  soundEnabled={soundEnabled}
                  onNavigateToTab={setActiveTab}
                />
              )}

              {/* 2. Tabla de Reservaciones & Códigos QR (Idéntica a la foto de Zendenta) */}
              {activeTab === 'reservations' && (
                <ReservationsTableView
                  reservaciones={reservaciones}
                  reservacionesHoy={reservacionesHoy}
                  fecha={fechaReservaciones}
                  hoy={metricas.fecha}
                  onChangeFecha={(fecha) => {
                    if (fecha === fechaReservaciones) return;
                    setCargandoReservaciones(true);
                    setFechaReservaciones(fecha);
                  }}
                  cargando={cargandoReservaciones}
                  onRecargar={() => cargarDatos().catch((error) => mostrarError(error.message))}
                  onUpdateReservacion={handleUpdateReservacion}
                  onAddReservacion={handleAddReservacion}
                  promociones={promociones}
                  sucursales={sucursales}
                  selectedSucursal={selectedSucursal}
                  soundEnabled={soundEnabled}
                  codigosEscaneados={metricas.codigosEscaneadosHoy}
                />
              )}

              {/* 3. Host Station & Plano de Mesas */}
              {activeTab === 'floorplan' && (
                <FloorPlanModule
                  mesas={mesas}
                  onUpdateMesa={handleUpdateMesa}
                  selectedSucursal={selectedSucursal}
                  sucursales={sucursales}
                  soundEnabled={soundEnabled}
                  onOpenWalkInModal={() => setWalkIn({ abierto: true, mesaId: null })}
                />
              )}

              {/* 4. Scanner POS & Caja */}
              {activeTab === 'scanner' && (
                <ScannerModule
                  reservaciones={reservacionesHoy}
                  promociones={promociones}
                  historial={escaneos}
                  selectedSucursal={selectedSucursal}
                  onUpdateReservacion={handleUpdateReservacion}
                  onCanjearPromocion={handleCanjearPromocion}
                  onCanjearBeneficio={handleCanjearBeneficio}
                  onUpdateClienteClub={handleUpdateClienteClub}
                  onRecargar={() => cargarDatos().catch(() => {})}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 5. Menú & Cocina en Vivo */}
              {activeTab === 'menu' && (
                <MenuCatalogModule
                  menuItems={menuItems}
                  categorias={categoriasMenu}
                  usuario={usuario}
                  onUpdateMenuItem={handleUpdateMenuItem}
                  onAddMenuItem={handleAddMenuItem}
                  onDeleteMenuItem={handleDeleteMenuItem}
                  onPublishMenuItem={handlePublishMenuItem}
                  onUnpublishMenuItem={handleUnpublishMenuItem}
                  onReorderMenuItems={handleReorderMenuItems}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 5b. Editor de Actividades & Eventos */}
              {activeTab === 'activities' && puedeVerTab(usuario?.rol, 'activities') && (
                <ActivitiesModule
                  actividades={actividades}
                  sucursales={sucursales}
                  usuario={usuario}
                  onAddActividad={handleAddActividad}
                  onUpdateActividad={handleUpdateActividad}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 6. Promociones & Cupones */}
              {activeTab === 'promotions' && puedeVerTab(usuario?.rol, 'promotions') && (
                <PromotionsModule
                  promociones={promociones}
                  sucursales={sucursales}
                  selectedSucursal={selectedSucursal}
                  usuario={usuario}
                  onUpdatePromocion={handleUpdatePromocion}
                  onAddPromocion={handleAddPromocion}
                  onCanjearPromocion={handleCanjearPromocion}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 7. Ludoteca (+60 Juegos de Mesa) */}
              {activeTab === 'ludoteca' && (
                <LudotecaModule
                  juegos={juegos}
                  onUpdateJuego={handleUpdateJuego}
                  onAddJuego={handleAddJuego}
                  mesas={mesasLudoteca}
                  usuario={usuario}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 8. Personal & Configuración */}
              {activeTab === 'staff' && puedeVerTab(usuario?.rol, 'staff') && (
                <StaffSettingsModule
                  staff={staff}
                  sucursales={sucursales}
                  usuario={usuario}
                  invitaciones={invitaciones}
                  onInvitarEmpleado={handleInvitarEmpleado}
                  onCancelarInvitacion={handleCancelarInvitacion}
                  onUpdateEmpleado={handleUpdateEmpleado}
                  soundEnabled={soundEnabled}
                />
              )}
            </div>

          </main>

        </div>

      {/* Modal Walk-in Rápido con bordes redondeados y estilo moderno */}
      <WalkInModal
        isOpen={walkIn.abierto}
        mesaInicial={walkIn.mesaId}
        onClose={() => setWalkIn({ abierto: false, mesaId: null })}
        mesas={mesas}
        onAssignWalkIn={handleAssignWalkIn}
        selectedSucursal={selectedSucursal}
        soundEnabled={soundEnabled}
      />

      {avisoFlotante}

    </div>
  );
}

export default App;
