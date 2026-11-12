import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { ReservationsTableView } from './components/ReservationsTableView';
import { FloorPlanModule } from './components/FloorPlanModule';
import { ScannerModule } from './components/ScannerModule';
import { MenuCatalogModule } from './components/MenuCatalogModule';
import { PromotionsModule } from './components/PromotionsModule';
import { LudotecaModule } from './components/LudotecaModule';
import { StaffSettingsModule } from './components/StaffSettingsModule';
import { WalkInModal } from './components/WalkInModal';
import { LoginScreen } from './components/LoginScreen';

import { alExpirarSesion, api, sesion } from './api/cliente';
import { aClienteClub, aEscaneo, aJuego, aPersona, aReservacion, aSucursal } from './api/adaptadores';

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
  'nombre', 'categoriaSlug', 'porcion', 'precio', 'descripcion', 'disponibleEnCocina',
  'stockDiario', 'tiempoPrepMin', 'imagen', 'badge'
];
const CAMPOS_NUMERICOS_PRODUCTO = ['precio', 'stockDiario', 'tiempoPrepMin'];

export function App() {
  // Sesión y navegación
  const [usuario, setUsuario] = useState(null);
  const [restaurandoSesion, setRestaurandoSesion] = useState(Boolean(sesion.token));
  const [datosListos, setDatosListos] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [walkIn, setWalkIn] = useState({ abierto: false, mesaId: null });
  const [aviso, setAviso] = useState(null); // { tipo: 'error' | 'ok', texto }

  // Datos del servidor
  const [sucursales, setSucursales] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [clientesClub, setClientesClub] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [staff, setStaff] = useState([]);
  const [escaneos, setEscaneos] = useState([]);
  const [metricas, setMetricas] = useState(METRICAS_VACIAS);

  const mostrarError = (texto) => setAviso({ tipo: 'error', texto });

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // ------------------------------------------------------------------------
  // Sesión
  // ------------------------------------------------------------------------

  const cerrarSesion = useCallback(() => {
    sesion.cerrar();
    setUsuario(null);
    setDatosListos(false);
  }, []);

  useEffect(() => {
    alExpirarSesion(() => {
      setUsuario(null);
      setDatosListos(false);
      setAviso({ tipo: 'error', texto: 'Tu sesión expiró. Inicia sesión de nuevo.' });
    });
  }, []);

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
    setUsuario(respuesta.usuario);
  };

  // ------------------------------------------------------------------------
  // Carga de datos
  // ------------------------------------------------------------------------

  const cargarDatos = useCallback(async () => {
    const sucursalId = selectedSucursal === 'todas' ? undefined : selectedSucursal;
    // Las métricas traen la fecha de "hoy" según el servidor; con ella se piden las reservaciones.
    const nuevasMetricas = await api('/metricas/hoy', { query: { sucursalId } });
    const [s, m, r, productos, promos, clientes, j, personal, historial] = await Promise.all([
      api('/sucursales'),
      api('/mesas'),
      api('/reservaciones', { query: { fecha: nuevasMetricas.fecha } }),
      api('/menu/productos'),
      api('/promociones'),
      api('/club/clientes'),
      api('/juegos'),
      api('/personal'),
      api('/escaner/historial', { query: { limite: 30 } })
    ]);
    setMetricas(nuevasMetricas);
    setSucursales(s.map(aSucursal));
    setMesas(m);
    setReservaciones(r.map(aReservacion(nuevasMetricas.fecha)));
    setMenuItems(productos);
    setPromociones(promos);
    setClientesClub(clientes.map(aClienteClub));
    setJuegos(j.map(aJuego));
    setStaff(personal.map(aPersona));
    setEscaneos(historial.map(aEscaneo));
    setDatosListos(true);
  }, [selectedSucursal]);

  // Carga inicial y recarga periódica para que mesas y tiempos se mantengan al día.
  useEffect(() => {
    if (!usuario) return undefined;
    const recargar = () => cargarDatos().catch((error) => mostrarError(error.message));
    recargar();
    const intervalo = setInterval(recargar, SEGUNDOS_ENTRE_RECARGAS * 1000);
    return () => clearInterval(intervalo);
  }, [usuario, cargarDatos]);

  /**
   * Ejecuta una acción contra la API y recarga los datos. Devuelve true/false
   * para que el componente sepa si puede mostrar su mensaje de éxito.
   */
  const ejecutar = async (accion) => {
    try {
      await accion();
      await cargarDatos();
      return true;
    } catch (error) {
      mostrarError(error.message);
      cargarDatos().catch(() => {});
      return false;
    }
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
    if (nuevoEstado === 'limpieza') return ejecutar(() => post(`/mesas/${mesaId}/liberar`));

    // nuevoEstado === 'libre'
    return ejecutar(async () => {
      if (mesa.estado === 'ocupada') await post(`/mesas/${mesaId}/liberar`);
      if (mesa.estado !== 'reservada') await post(`/mesas/${mesaId}/limpia`);
    });
  };

  const handleAssignWalkIn = ({ mesaId, comensal, personas, notas }) =>
    ejecutar(() => post(`/mesas/${mesaId}/walk-in`, { comensal, personas, notas }));

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
    const anterior = reservaciones.find((r) => r.folio === actualizada.folio);
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
        fecha: metricas.fecha,
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
      const valor = CAMPOS_NUMERICOS_PRODUCTO.includes(campo) ? Number(actualizado[campo]) : actualizado[campo];
      if (valor !== anterior[campo]) cambios[campo] = valor;
    }
    if (Object.keys(cambios).length === 0) return Promise.resolve(true);
    return ejecutar(() => patch(`/menu/productos/${actualizado.id}`, cambios));
  };

  const handleAddMenuItem = (nuevo) =>
    ejecutar(() =>
      post('/menu/productos', {
        nombre: nuevo.nombre,
        categoriaSlug: nuevo.categoriaSlug,
        porcion: nuevo.porcion || undefined,
        precio: nuevo.precio,
        descripcion: nuevo.descripcion,
        stockDiario: nuevo.stockDiario,
        tiempoPrepMin: nuevo.tiempoPrepMin,
        imagen: nuevo.imagen || undefined,
        badge: nuevo.badge || undefined
      })
    );

  // ------------------------------------------------------------------------
  // Promociones y Club Marfil
  // ------------------------------------------------------------------------

  const handleUpdatePromocion = (actualizada) => {
    const anterior = promociones.find((p) => p.id === actualizada.id);
    if (!anterior) return Promise.resolve(false);
    if (actualizada.canjesHoy > anterior.canjesHoy) {
      return ejecutar(() => post(`/promociones/${actualizada.id}/canjear`));
    }
    if (actualizada.estado !== anterior.estado) {
      return ejecutar(() => patch(`/promociones/${actualizada.id}`, { estado: actualizada.estado }));
    }
    return Promise.resolve(true);
  };

  const handleAddPromocion = (nueva) =>
    ejecutar(() =>
      post('/promociones', {
        codigo: nueva.codigo,
        titulo: nueva.titulo,
        categoria: nueva.categoria,
        descuentoBadge: nueva.descuentoBadge,
        beneficio: nueva.beneficio,
        vigencia: nueva.vigencia,
        limiteDiario: nueva.limiteDiario,
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
    reservasHoy: reservaciones.filter(r => r.estado === 'confirmada' || r.estado === 'en_curso').length,
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
      case 'promotions': return 'Promociones & Cuponera';
      case 'ludoteca': return 'Ludoteca (+60 Juegos)';
      case 'staff': return 'Personal en Turno & Aforos';
      default: return 'Panel Administrativo';
    }
  };

  const avisoFlotante = aviso && (
    <div
      role="alert"
      onClick={() => setAviso(null)}
      className={`fixed bottom-5 right-5 z-[10000] max-w-sm px-4 py-3 rounded-2xl shadow-lg text-xs font-body font-semibold cursor-pointer animate-menu-in ${
        aviso.tipo === 'error' ? 'bg-[#1F1410] text-white border-l-4 border-[#E12927]' : 'bg-emerald-600 text-white'
      }`}
    >
      {aviso.texto}
    </div>
  );

  if (restaurandoSesion) {
    return <PantallaDeEspera texto="Recuperando tu sesión..." />;
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
        <PantallaDeEspera texto="Cargando la operación del día..." />
        {avisoFlotante}
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-body selection:bg-[#E12927] selection:text-white">

      {/* Sidebar Lateral Fijo: Siempre visible al 100%, nunca cambia de posición con el scroll */}
      <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedSucursal={selectedSucursal}
          onSelectSucursal={setSelectedSucursal}
          sucursales={sucursales}
          soundEnabled={soundEnabled}
          badges={badges}
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
                  reservaciones={reservaciones}
                  promociones={promociones}
                  clientesClub={clientesClub}
                  historial={escaneos}
                  onUpdateReservacion={handleUpdateReservacion}
                  onUpdatePromocion={handleUpdatePromocion}
                  onUpdateClienteClub={handleUpdateClienteClub}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 5. Menú & Cocina en Vivo */}
              {activeTab === 'menu' && (
                <MenuCatalogModule
                  menuItems={menuItems}
                  onUpdateMenuItem={handleUpdateMenuItem}
                  onAddMenuItem={handleAddMenuItem}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 6. Promociones & Cupones */}
              {activeTab === 'promotions' && (
                <PromotionsModule
                  promociones={promociones}
                  onUpdatePromocion={handleUpdatePromocion}
                  onAddPromocion={handleAddPromocion}
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
                  soundEnabled={soundEnabled}
                />
              )}

              {/* 8. Personal & Configuración */}
              {activeTab === 'staff' && (
                <StaffSettingsModule
                  staff={staff}
                  sucursales={sucursales}
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

function PantallaDeEspera({ texto }) {
  return (
    <div className="h-screen w-screen bg-[#1F1410] flex flex-col items-center justify-center gap-4 font-body text-white/80 text-sm">
      <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#E12927] animate-spin" />
      <span>{texto}</span>
    </div>
  );
}

export default App;
