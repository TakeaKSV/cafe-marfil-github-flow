import React, { useState } from 'react';
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

import {
  INITIAL_SUCURSALES,
  INITIAL_MESAS,
  INITIAL_RESERVACIONES,
  INITIAL_MENU,
  INITIAL_PROMOCIONES,
  INITIAL_CLIENTES_CLUB,
  INITIAL_LUDOTECA,
  METRICAS_DIARIAS,
  STAFF_ACTIVO
} from './data/adminMockData';

export function App() {
  // Estado Global de Autenticación & Navegación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  // Estados de Entidades Modificables
  const [sucursales, setSucursales] = useState(INITIAL_SUCURSALES);
  const [mesas, setMesas] = useState(INITIAL_MESAS);
  const [reservaciones, setReservaciones] = useState(INITIAL_RESERVACIONES);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [promociones, setPromociones] = useState(INITIAL_PROMOCIONES);
  const [clientesClub, setClientesClub] = useState(INITIAL_CLIENTES_CLUB);
  const [juegos, setJuegos] = useState(INITIAL_LUDOTECA);
  const [metricas, setMetricas] = useState(METRICAS_DIARIAS);
  const [staff, setStaff] = useState(STAFF_ACTIVO);

  // Contadores y Badges reactivos
  const currentBranchMesas = selectedSucursal === 'todas'
    ? mesas
    : mesas.filter(m => m.sucursalId === selectedSucursal);

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

  // Mutaciones reactivas
  const handleUpdateMesa = (updatedMesa) => {
    setMesas(prev => prev.map(m => m.id === updatedMesa.id ? updatedMesa : m));
  };

  const handleAssignWalkIn = ({ mesaId, comensal, personas, tipo, notas }) => {
    setMesas(prev => prev.map(m => {
      if (m.id === mesaId) {
        return {
          ...m,
          estado: 'ocupada',
          comensal,
          personas,
          tiempoMinutos: 1,
          ticketAprox: personas * 180,
          notas
        };
      }
      return m;
    }));
  };

  const handleUpdateReservacion = (updatedRes) => {
    setReservaciones(prev => prev.map(r => r.folio === updatedRes.folio ? updatedRes : r));
    if (updatedRes.estado === 'en_curso' && updatedRes.mesaAsignada) {
      setMesas(prev => prev.map(m => {
        if (m.numero === updatedRes.mesaAsignada) {
          return {
            ...m,
            estado: 'ocupada',
            comensal: updatedRes.comensal,
            personas: updatedRes.personas,
            tiempoMinutos: 1,
            ticketAprox: updatedRes.personas * 180,
            reservaFolio: updatedRes.folio,
            notas: updatedRes.notas
          };
        }
        return m;
      }));
    }
  };

  const handleAddReservacion = (newRes) => {
    setReservaciones(prev => [newRes, ...prev]);
  };

  const handleUpdateMenuItem = (updatedItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleAddMenuItem = (newItem) => {
    setMenuItems(prev => [newItem, ...prev]);
  };

  const handleUpdatePromocion = (updatedPromo) => {
    setPromociones(prev => prev.map(p => p.id === updatedPromo.id ? updatedPromo : p));
  };

  const handleAddPromocion = (newPromo) => {
    setPromociones(prev => [newPromo, ...prev]);
  };

  const handleUpdateClienteClub = (updatedCliente) => {
    setClientesClub(prev => prev.map(c => c.codigoCliente === updatedCliente.codigoCliente ? updatedCliente : c));
  };

  const handleUpdateJuego = (updatedJuego) => {
    setJuegos(prev => prev.map(j => j.id === updatedJuego.id ? updatedJuego : j));
  };

  const handleAddJuego = (newJuego) => {
    setJuegos(prev => [newJuego, ...prev]);
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        soundEnabled={soundEnabled}
      />
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
          onLogout={() => setIsAuthenticated(false)}
        />

        {/* Área Central de Contenido con scroll independiente (el sidebar NO se mueve) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8FAFC]">

          {/* Topbar Superior Fijo */}
          <Topbar
            activeTabTitle={getTabTitle()}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
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
                  onOpenWalkInModal={() => setIsWalkInModalOpen(true)}
                />
              )}

              {/* 4. Scanner POS & Caja */}
              {activeTab === 'scanner' && (
                <ScannerModule
                  reservaciones={reservaciones}
                  promociones={promociones}
                  clientesClub={clientesClub}
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
                  mesas={mesas}
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
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        mesas={mesas}
        onAssignWalkIn={handleAssignWalkIn}
        selectedSucursal={selectedSucursal}
        soundEnabled={soundEnabled}
      />

    </div>
  );
}

export default App;
