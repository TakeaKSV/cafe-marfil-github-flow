import React, { useState } from 'react';
import { 
  Download, 
  ChevronDown, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Check, 
  QrCode, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const OrderListView = ({ 
  reservaciones, 
  onUpdateReservacion, 
  onAddReservacion,
  sucursales,
  selectedSucursal,
  soundEnabled 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(['Porras Matriz', 'Brunch Salado']);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  // Formulario nueva comanda/reserva
  const [newOrder, setNewOrder] = useState({
    comensal: '',
    telefono: '',
    categoria: 'Brunch & Cocina Salada',
    precio: 360,
    hora: '11:00 AM',
    sucursalId: selectedSucursal === 'todas' ? 'porras-matriz' : selectedSucursal,
    personas: 2,
    pago: 'Tarjeta'
  });

  const removeFilter = (filterName) => {
    setActiveFilters(activeFilters.filter(f => f !== filterName));
    if (soundEnabled) playSound('toggle');
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    if (soundEnabled) playSound('toggle');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(reservaciones.map(r => r.folio));
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleSelectOne = (folio) => {
    if (selectedOrders.includes(folio)) {
      setSelectedOrders(selectedOrders.filter(id => id !== folio));
    } else {
      setSelectedOrders([...selectedOrders, folio]);
    }
  };

  const handleStatusChange = (folio, nuevoEstado) => {
    const res = reservaciones.find(r => r.folio === folio);
    if (!res) return;
    onUpdateReservacion({ ...res, estado: nuevoEstado });
    setActiveActionMenu(null);
    if (soundEnabled) playSound('checkin');
  };

  const handleExportCSV = () => {
    if (soundEnabled) playSound('success');
    alert('Exportando listado de órdenes y comandas a CSV para contabilidad de Café Marfil Durango.');
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrder.comensal.trim()) return;

    const folio = `MF-RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const sucursalObj = sucursales.find(s => s.id === newOrder.sucursalId) || sucursales[0];

    const creada = {
      folio,
      comensal: newOrder.comensal,
      telefono: newOrder.telefono || '618-123-4567',
      email: 'comensal@cafemarfil.mx',
      sucursalId: newOrder.sucursalId,
      sucursalNombre: sucursalObj.nombre,
      fecha: 'Hoy (02 Oct 2026)',
      hora: newOrder.hora,
      personas: Number(newOrder.personas),
      mesaAsignada: 'M02',
      tipo: 'brunch',
      tipoNombre: newOrder.categoria,
      estado: 'confirmada',
      notas: 'Orden creada desde listado maestro.',
      tokenQR: `QR-${folio}-AUTH`,
      totalEstimado: `$${newOrder.precio} MXN`
    };

    onAddReservacion(creada);
    if (soundEnabled) playSound('success');
    setShowAddModal(false);
    setNewOrder({
      comensal: '',
      telefono: '',
      categoria: 'Brunch & Cocina Salada',
      precio: 360,
      hora: '11:00 AM',
      sucursalId: 'porras-matriz',
      personas: 2,
      pago: 'Tarjeta'
    });
  };

  // Filtrado
  const filtered = reservaciones.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comensal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* 1. Header exactamente como la imagen: "Order list" */}
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1410]">
          Order list
        </h1>
        <span className="text-xs font-mono text-[#1F1410]/50 hidden sm:inline-block">
          Comandas & Reservaciones en Piso
        </span>
      </div>

      {/* 2. 4 Tarjetas Horizontales con fondo pastel de resumen de estados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: New orders (Pastel Lavender/Blue) */}
        <div className="bg-[#EEF2FF] p-5 rounded-3xl border border-[#6366F1]/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
          <div className="text-xs font-semibold text-[#4338CA] font-body">
            New orders
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-bold text-3xl text-[#1E1B4B]">
              12
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F87171] text-white">
              - 2.4%
            </span>
          </div>
          <span className="text-[11px] text-[#4338CA]/70 font-body">
            Than last week
          </span>
        </div>

        {/* Card 2: Await accepting orders (Pastel Orange/Peach) */}
        <div className="bg-[#FFF7ED] p-5 rounded-3xl border border-[#F97316]/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
          <div className="text-xs font-semibold text-[#C2410C] font-body">
            Await accepting orders
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-bold text-3xl text-[#431407]">
              20
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981] text-white">
              + 2.4%
            </span>
          </div>
          <span className="text-[11px] text-[#C2410C]/70 font-body">
            Than last week
          </span>
        </div>

        {/* Card 3: On way orders (Pastel Yellow/Cream) */}
        <div className="bg-[#FEFCE8] p-5 rounded-3xl border border-[#EAB308]/15 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
          <div className="text-xs font-semibold text-[#A16207] font-body">
            On way orders (En Cocina)
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-bold text-3xl text-[#422006]">
              57
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F87171] text-white">
              - 1.2%
            </span>
          </div>
          <span className="text-[11px] text-[#A16207]/70 font-body">
            Than last week
          </span>
        </div>

        {/* Card 4: Delivered orders (Pastel Mint/Green) */}
        <div className="bg-[#F0FDF4] p-5 rounded-3xl border border-[#22C55E]/15 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
          <div className="text-xs font-semibold text-[#15803D] font-body">
            Delivered orders (Completadas)
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-display font-bold text-3xl text-[#052E16]">
              98
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#10B981] text-white">
              + 2.8%
            </span>
          </div>
          <span className="text-[11px] text-[#15803D]/70 font-body">
            Than last week
          </span>
        </div>

      </div>

      {/* 3. Barra de Búsqueda y Botones de Acción (Search, 180 orders, Export, Sort, + Add order) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2">
        
        {/* Left: Search input con count */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1F1410]/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#1F1410]/10 rounded-full text-xs font-body text-[#1F1410] focus:outline-hidden focus:border-[#E12927] shadow-2xs"
            />
          </div>
          <span className="text-xs font-mono text-[#1F1410]/60 whitespace-nowrap">
            <strong>{filtered.length}</strong> orders
          </span>
        </div>

        {/* Right: Export, Sort, Add order */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#1F1410]/10 hover:bg-[#FAF7F5] text-xs font-semibold rounded-full shadow-2xs transition-colors cursor-pointer text-[#1F1410]"
          >
            <Download className="w-3.5 h-3.5 text-[#1F1410]/60" />
            <span>Export</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-[#1F1410]/10 rounded-full px-4 py-2 pr-8 text-xs font-semibold text-[#1F1410] shadow-2xs hover:bg-[#FAF7F5] transition-colors cursor-pointer"
            >
              <option value="default">Sort: default</option>
              <option value="recent">Sort: más recientes</option>
              <option value="price">Sort: mayor consumo</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F1410]/50 pointer-events-none" />
          </div>

          <button
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add order</span>
          </button>

        </div>

      </div>

      {/* 4. Fila de Filtros y Paginación exactamente como la imagen de referencia */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        
        {/* Chips de Filtros activos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#1F1410]/40 font-mono text-[11px]">Filtros:</span>
          {activeFilters.map(filter => (
            <span 
              key={filter}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#1F1410]/10 rounded-full font-medium text-[#1F1410] shadow-2xs text-xs"
            >
              {filter}
              <button 
                onClick={() => removeFilter(filter)}
                className="text-[#1F1410]/40 hover:text-[#E12927] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {activeFilters.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-[#1F1410]/60 hover:text-[#E12927] font-semibold underline text-xs cursor-pointer ml-1"
            >
              Clear all ({activeFilters.length})
            </button>
          )}
        </div>

        {/* Paginador "1 of 18 < >" */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#1F1410]/60 self-end sm:self-auto">
          <span>1 of 4</span>
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 rounded-full border border-[#1F1410]/10 flex items-center justify-center text-[#1F1410]/40 hover:text-[#1F1410] cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-6 h-6 rounded-full border border-[#1F1410]/10 flex items-center justify-center text-[#1F1410]/40 hover:text-[#1F1410] cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. Tabla de Datos Elegante y de Alta Densidad */}
      <div className="bg-white rounded-3xl border border-[#1F1410]/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-[#FAF7F5]/80 border-b border-[#1F1410]/5 text-[#1F1410]/50 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === reservaciones.length}
                    onChange={handleSelectAll}
                    className="rounded-sm accent-[#E12927] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">ORDER NUMBER</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">PRICE</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">PAYMENT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1F1410]/5 font-body">
              {filtered.map(r => {
                const isSelected = selectedOrders.includes(r.folio);

                // Asignación de Badge de Estado exactamente como en la imagen
                let statusBadge = { label: 'on way', bg: 'bg-[#FEFCE8] text-[#A16207] border-[#EAB308]/20' };
                if (r.estado === 'asistida') {
                  statusBadge = { label: 'delivered', bg: 'bg-[#F0FDF4] text-[#15803D] border-[#22C55E]/20' };
                } else if (r.estado === 'confirmada') {
                  statusBadge = { label: 'await', bg: 'bg-[#FFF7ED] text-[#C2410C] border-[#F97316]/20' };
                } else if (r.estado === 'no_show') {
                  statusBadge = { label: 'cancelled', bg: 'bg-[#FEF2F2] text-[#B91C1C] border-[#EF4444]/20' };
                }

                return (
                  <tr 
                    key={r.folio} 
                    className={`hover:bg-[#FAF7F5] transition-colors ${
                      isSelected ? 'bg-[#FCEAE9]/30' : ''
                    }`}
                  >
                    
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(r.folio)}
                        className="rounded-sm accent-[#E12927] cursor-pointer"
                      />
                    </td>

                    {/* ORDER NUMBER */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1F1410]">
                      {r.folio}
                    </td>

                    {/* CUSTOMER */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1F1410]">{r.comensal}</div>
                      <div className="text-[10px] font-mono text-[#1F1410]/40">{r.telefono}</div>
                    </td>

                    {/* CATEGORY */}
                    <td className="py-3.5 px-4 text-[#1F1410]/70 capitalize">
                      {r.tipoNombre.toLowerCase()}
                    </td>

                    {/* PRICE */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1F1410]">
                      {r.totalEstimado}
                    </td>

                    {/* DATE */}
                    <td className="py-3.5 px-4 font-mono text-[#1F1410]/60 text-[11px]">
                      02.10.2026
                    </td>

                    {/* PAYMENT */}
                    <td className="py-3.5 px-4 text-[#1F1410]/70 font-mono text-[11px]">
                      {r.folio.includes('9') ? 'Tarjeta Visa' : r.folio.includes('8') ? 'PayPal / QR' : 'Efectivo'}
                    </td>

                    {/* STATUS PILL */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.bg}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-right relative">
                      <button
                        onClick={() => setActiveActionMenu(activeActionMenu === r.folio ? null : r.folio)}
                        className="p-1 rounded-md text-[#1F1410]/40 hover:text-[#1F1410] hover:bg-[#FAF7F5] cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown de Acciones */}
                      {activeActionMenu === r.folio && (
                        <div className="absolute right-4 top-10 w-44 bg-white border border-[#1F1410]/15 rounded-xl shadow-xl p-1.5 z-40 text-left font-body animate-menu-in">
                          <button
                            onClick={() => handleStatusChange(r.folio, 'en_curso')}
                            className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-[#FAF7F5] rounded-lg text-[#1F1410] font-medium cursor-pointer"
                          >
                            ✓ Asignar Mesa / On way
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.folio, 'asistida')}
                            className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-[#FAF7F5] rounded-lg text-emerald-800 font-medium cursor-pointer"
                          >
                            ✔ Completar Comanda
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.folio, 'no_show')}
                            className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-rose-50 rounded-lg text-rose-800 font-medium cursor-pointer"
                          >
                            ✕ Cancelar / No-Show
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>

      {/* Modal Add Order */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#1F1410]/10 max-w-md w-full p-6 shadow-2xl animate-menu-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10 mb-4">
              <h3 className="font-display font-bold text-lg text-[#1F1410]">
                Nueva Comanda / Pedido
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                  Nombre del Comensal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Eric Mayer"
                  value={newOrder.comensal}
                  onChange={(e) => setNewOrder({ ...newOrder, comensal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="618-123-4567"
                    value={newOrder.telefono}
                    onChange={(e) => setNewOrder({ ...newOrder, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Consumo Estimado ($)
                  </label>
                  <input
                    type="number"
                    value={newOrder.precio}
                    onChange={(e) => setNewOrder({ ...newOrder, precio: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xl focus:border-[#E12927] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                  Categoría
                </label>
                <select
                  value={newOrder.categoria}
                  onChange={(e) => setNewOrder({ ...newOrder, categoria: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#1F1410]/20 rounded-xl focus:border-[#E12927] focus:outline-hidden bg-white"
                >
                  <option value="Brunch & Cocina Salada">Brunch & Cocina Salada</option>
                  <option value="Frappés & Bebidas">Frappés & Bebidas</option>
                  <option value="Café de Especialidad">Café de Especialidad</option>
                  <option value="Postres & Dubái">Postres & Dubái</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#1F1410]/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E12927] text-white text-xs font-bold rounded-full cursor-pointer shadow-xs font-mono"
                >
                  Guardar Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
