import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  CalendarDays, 
  QrCode, 
  CheckCircle2, 
  MoreVertical, 
  Building2, 
  User, 
  Check, 
  X, 
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Ticket
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const ReservationsTableView = ({ 
  reservaciones, 
  onUpdateReservacion, 
  onAddReservacion,
  promociones,
  sucursales,
  selectedSucursal,
  soundEnabled 
}) => {
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [qrModalItem, setQrModalItem] = useState(null);

  // Formulario nueva reserva
  const [newRes, setNewRes] = useState({
    comensal: '',
    telefono: '',
    sucursalId: selectedSucursal === 'todas' ? 'porras-matriz' : selectedSucursal,
    hora: '10:30 AM',
    personas: 2,
    mesaAsignada: 'M03',
    tipo: 'brunch',
    tipoNombre: 'Desayuno & Brunch',
    notas: ''
  });

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (qrModalItem) setQrModalItem(null);
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrModalItem, showAddModal]);

  // Filtrado de reservaciones
  const filtered = reservaciones.filter(r => {
    const matchesBranch = selectedSucursal === 'todas' || r.sucursalId === selectedSucursal;
    
    let matchesTab = true;
    if (activeTab === 'en_sala') matchesTab = r.estado === 'en_curso';
    if (activeTab === 'proximas') matchesTab = r.estado === 'confirmada';
    if (activeTab === 'completadas') matchesTab = r.estado === 'asistida' || r.estado === 'no_show';
    if (activeTab === 'cupones') matchesTab = true;

    const matchesSearch = searchTerm === '' ||
      r.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comensal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono.includes(searchTerm);

    return matchesBranch && matchesTab && matchesSearch;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(filtered.map(r => r.folio));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelectOne = (folio) => {
    if (selectedItems.includes(folio)) {
      setSelectedItems(selectedItems.filter(id => id !== folio));
    } else {
      setSelectedItems([...selectedItems, folio]);
    }
  };

  const handleStatusChange = (folio, nuevoEstado) => {
    const res = reservaciones.find(r => r.folio === folio);
    if (!res) return;
    onUpdateReservacion({ ...res, estado: nuevoEstado });
    setActiveActionMenu(null);
    if (soundEnabled) playSound(nuevoEstado === 'en_curso' ? 'checkin' : 'success');
  };

  const handleCreateReservation = (e) => {
    e.preventDefault();
    if (!newRes.comensal.trim()) return;

    const randomFolio = `MF-RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const sucursalObj = sucursales.find(s => s.id === newRes.sucursalId) || sucursales[0];

    const creada = {
      folio: randomFolio,
      comensal: newRes.comensal,
      telefono: newRes.telefono || '618-123-4567',
      email: 'comensal@cafemarfil.mx',
      sucursalId: newRes.sucursalId,
      sucursalNombre: sucursalObj.nombre,
      fecha: 'Hoy (02 Oct 2026)',
      hora: newRes.hora,
      personas: Number(newRes.personas),
      mesaAsignada: newRes.mesaAsignada || 'M03',
      tipo: newRes.tipo,
      tipoNombre: newRes.tipoNombre,
      estado: 'confirmada',
      notas: newRes.notas || 'Reservación registrada en Host Desk.',
      tokenQR: `QR-${randomFolio}-AUTH`,
      totalEstimado: `$${Number(newRes.personas) * 180} MXN`
    };

    onAddReservacion(creada);
    if (soundEnabled) playSound('success');
    setShowAddModal(false);
    setNewRes({
      comensal: '',
      telefono: '',
      sucursalId: 'porras-matriz',
      hora: '10:30 AM',
      personas: 2,
      mesaAsignada: 'M03',
      tipo: 'brunch',
      tipoNombre: 'Desayuno & Brunch',
      notas: ''
    });
  };

  // Resumen métrico superior exactamente como en Zendenta
  const enSalaCount = reservaciones.filter(r => r.estado === 'en_curso').length;
  const pendientesCount = reservaciones.filter(r => r.estado === 'confirmada').length;
  const completadasCount = reservaciones.filter(r => r.estado === 'asistida').length;
  const totalCount = reservaciones.length;

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* 1. Header Summary Cards estilo Zendenta (Asset Value & Product Stock) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Card 1: Total Reservaciones del Día */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-[#1F1410]/8 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-[#6366F1]/20 flex items-center justify-center text-[#4338CA] shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider text-[#1F1410]/50 uppercase">
              RESERVACIONES DEL DÍA
            </div>
            <div className="font-display font-bold text-2xl sm:text-3xl text-[#1F1410] mt-0.5">
              {totalCount} Reservas
            </div>
            <div className="text-xs text-[#1F1410]/60 font-body mt-0.5">
              Tasa de asistencia confirmada: <strong className="text-emerald-700">96.4%</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Códigos Escaneados & Segmented Progress Bar (Idéntico a Zendenta) */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-[#1F1410]/8 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl text-[#1F1410]">
                46 códigos
              </span>
              <span className="text-xs text-[#1F1410]/50 font-body">
                escaneados & validados en turno
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FAF7F5] border border-[#1F1410]/10 text-[#1F1410]">
              Lector POS Activo
            </span>
          </div>

          {/* Segmented Horizontal Bar como en Zendenta */}
          <div className="w-full h-2.5 bg-[#FAF7F5] rounded-full overflow-hidden flex gap-1 mb-3 p-0.5 border border-[#1F1410]/8">
            <div 
              style={{ width: `${(enSalaCount / totalCount) * 100}%` }} 
              className="h-full bg-[#10B981] rounded-full transition-all" 
              title="En Sala"
            />
            <div 
              style={{ width: `${(pendientesCount / totalCount) * 100}%` }} 
              className="h-full bg-[#F59E0B] rounded-full transition-all" 
              title="Pendientes de Llegada"
            />
            <div 
              style={{ width: `${(completadasCount / totalCount) * 100}%` }} 
              className="h-full bg-[#E12927] rounded-full transition-all" 
              title="Completadas / Canjeadas"
            />
          </div>

          {/* Leyenda con puntos de color exactamente como Zendenta */}
          <div className="flex items-center gap-4 text-xs font-body flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-[#1F1410]/70">En sala: <strong>{enSalaCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="text-[#1F1410]/70">Pendientes: <strong>{pendientesCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E12927]" />
              <span className="text-[#1F1410]/70">Completadas: <strong>{completadasCount}</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Pestañas de Navegación (Inventory / Order Stock) */}
      <div className="flex items-center justify-between border-b border-[#1F1410]/8 pb-2">
        <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold">
          {[
            { id: 'todas', label: 'Todas las Reservas' },
            { id: 'en_sala', label: 'En Sala (Check-in)' },
            { id: 'proximas', label: 'Próximas por Llegar' },
            { id: 'completadas', label: 'Historial Concluido' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (soundEnabled) playSound('toggle');
              }}
              className={`pb-2 relative transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#E12927] font-bold'
                  : 'text-[#1F1410]/50 hover:text-[#1F1410]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E12927] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Barra de Búsqueda, Filtros y Botón '+ Order Stock' estilo Zendenta */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Input con borde redondeado suave */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1F1410]/35" />
          <input
            type="text"
            placeholder="Buscar reservación por folio, comensal o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#1F1410]/10 rounded-full text-xs font-body text-[#1F1410] placeholder:text-[#1F1410]/40 focus:outline-hidden focus:border-[#E12927] shadow-2xs"
          />
        </div>

        {/* Botones: Filtros & + Nueva Reservación */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Filtro por sucursal, horario o experiencia de ludoteca activo.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#1F1410]/10 rounded-full text-xs font-semibold text-[#1F1410]/70 hover:text-[#1F1410] hover:bg-[#FAF7F5] shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-semibold rounded-full shadow-xs transition-all hover:scale-102 cursor-pointer font-body"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Nueva Reservación</span>
          </button>
        </div>

      </div>

      {/* 4. Tabla de Datos Estilo Zendenta (Filas suaves, espaciosas y redondeadas) */}
      <div className="bg-white rounded-2xl border border-[#1F1410]/8 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="border-b border-[#1F1410]/8 text-[#1F1410]/40 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="rounded-md accent-[#E12927] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#1F1410]">
                    <span>FOLIO / RESERVA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#1F1410]">
                    <span>HORA / FECHA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#1F1410]">
                    <span>COMENSAL</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-[#1F1410]">
                    <span>ESTADO</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-[#1F1410]">
                    <span>COMENSALES / ASISTENCIA</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <span>PASE DIGITAL QR</span>
                </th>
                <th className="py-3.5 px-5 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1F1410]/5 font-body">
              {filtered.map(r => {
                const isSelected = selectedItems.includes(r.folio);

                // Status Badge en Español
                let statusBadge = {
                  label: 'PENDIENTE',
                  className: 'border border-amber-300 text-amber-800 bg-amber-50/50'
                };

                if (r.estado === 'en_curso') {
                  statusBadge = {
                    label: 'EN SALA',
                    className: 'border border-purple-300 text-purple-800 bg-purple-50/50'
                  };
                } else if (r.estado === 'asistida') {
                  statusBadge = {
                    label: 'COMPLETADA',
                    className: 'border border-emerald-300 text-emerald-800 bg-emerald-50/50'
                  };
                } else if (r.estado === 'no_show') {
                  statusBadge = {
                    label: 'CANCELADA',
                    className: 'border border-rose-300 text-rose-800 bg-rose-50/50'
                  };
                }

                // Cálculo visual de la barra de progreso (ej. 2/2, 5/5)
                const progresoPct = r.estado === 'asistida' ? 100 : r.estado === 'en_curso' ? 75 : 30;

                return (
                  <tr 
                    key={r.folio}
                    className={`hover:bg-[#FAF7F5]/70 transition-colors ${
                      isSelected ? 'bg-[#FCEAE9]/30' : ''
                    }`}
                  >
                    
                    {/* Checkbox */}
                    <td className="py-4 px-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(r.folio)}
                        className="rounded-md accent-[#E12927] cursor-pointer"
                      />
                    </td>

                    {/* ORDER / FOLIO */}
                    <td className="py-4 px-4 font-body">
                      <span className="font-mono font-bold text-sm text-[#1F1410] block">
                        #{r.folio}
                      </span>
                      <span className="text-[11px] text-[#1F1410]/50 font-mono block">
                        {r.personas} personas · Mesa {r.mesaAsignada || 'M01'}
                      </span>
                    </td>

                    {/* CREATED / HORA */}
                    <td className="py-4 px-4 font-body text-xs text-[#1F1410]/70">
                      <span className="block font-medium text-[#1F1410]">{r.hora}</span>
                      <span className="text-[11px] text-[#1F1410]/50">{r.fecha}</span>
                    </td>

                    {/* COMENSAL (Icono de usuario o edificio como en Zendenta) */}
                    <td className="py-4 px-4 font-body">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF7F5] border border-[#1F1410]/8 flex items-center justify-center text-[#1F1410]/60 shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#1F1410]">{r.comensal}</div>
                          <div className="text-[10px] text-[#1F1410]/40 font-mono">{r.telefono}</div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS (Píldora suave idéntica a Zendenta) */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* ITEM RECEIVED / PAX (Barra de progreso visual idéntica a Zendenta) */}
                    <td className="py-4 px-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#FAF7F5] rounded-full overflow-hidden border border-[#1F1410]/8">
                          <div 
                            style={{ width: `${progresoPct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              r.estado === 'asistida' ? 'bg-[#10B981]' : r.estado === 'en_curso' ? 'bg-[#4338CA]' : 'bg-[#F59E0B]'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#1F1410]/60 font-semibold w-8 text-right">
                          {r.personas}/{r.personas}
                        </span>
                      </div>
                    </td>

                    {/* SEND EMAIL / QR (Icono verde circular como en Zendenta) */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setQrModalItem(r)}
                        className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto hover:scale-110 transition-transform cursor-pointer"
                        title="Ver Pase QR Verificado"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </td>

                    {/* ACCIONES: Botón 'Receive' + Tres puntos ⋮ exactamente como Zendenta */}
                    <td className="py-4 px-5 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        
                        {r.estado === 'confirmada' ? (
                          <button
                            onClick={() => handleStatusChange(r.folio, 'en_curso')}
                            className="px-3 py-1 bg-white hover:bg-[#FAF7F5] border border-[#1F1410]/15 text-[#1F1410] rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Dar Acceso / Entrada
                          </button>
                        ) : r.estado === 'en_curso' ? (
                          <button
                            onClick={() => handleStatusChange(r.folio, 'asistida')}
                            className="px-3 py-1 bg-[#FAF7F5] hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Completada
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-700 font-semibold px-2">
                            Concluida
                          </span>
                        )}

                        <button
                          onClick={() => setActiveActionMenu(activeActionMenu === r.folio ? null : r.folio)}
                          className="w-7 h-7 rounded-full text-[#1F1410]/40 hover:text-[#1F1410] hover:bg-[#FAF7F5] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                      </div>

                      {/* Menú Dropdown ⋮ */}
                      {activeActionMenu === r.folio && (
                        <div className="absolute right-5 top-12 w-44 bg-white border border-[#1F1410]/15 rounded-2xl shadow-xl p-1.5 z-40 text-left font-body animate-menu-in">
                          <button
                            onClick={() => setQrModalItem(r)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#FAF7F5] rounded-xl text-[#1F1410] font-medium cursor-pointer"
                          >
                            Ver Pase QR Digital
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.folio, 'asistida')}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 rounded-xl text-emerald-800 font-medium cursor-pointer"
                          >
                            Marcar Asistida
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.folio, 'no_show')}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-rose-50 rounded-xl text-rose-800 font-medium cursor-pointer"
                          >
                            Marcar No-Show
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

      {/* Modal Pase QR (Portal a document.body para tapar toda la pantalla) */}
      {qrModalItem && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setQrModalItem(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-sm w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card text-center relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setQrModalItem(null)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-16 h-16 bg-[#FCEAE9] text-[#E12927] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-xs">
              <QrCode className="w-8 h-8" />
            </div>

            <h3 className="font-display font-bold text-xl text-[#1F1410]">
              Pase QR de Reservación
            </h3>
            <p className="text-xs text-[#1F1410]/60 mb-4 font-body">
              Folio: <strong className="font-mono text-[#E12927] text-sm">{qrModalItem.folio}</strong>
            </p>

            {/* Simulación visual QR */}
            <div className="p-4 bg-[#FAF7F5] rounded-2xl border border-dashed border-[#1F1410]/20 inline-block mb-4 shadow-inner">
              <div className="w-36 h-36 bg-[#1F1410] p-2 flex flex-col justify-between rounded-xl mx-auto shadow-md">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-white bg-[#1F1410]" />
                  <div className="w-8 h-8 border-4 border-white bg-[#1F1410]" />
                </div>
                <div className="text-center text-white font-mono text-[9px] font-bold tracking-wider">
                  CAFÉ MARFIL
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-4 border-white bg-[#1F1410]" />
                  <div className="w-5 h-5 bg-[#E12927] rounded-xs self-end" />
                </div>
              </div>
            </div>

            <div className="text-xs text-left bg-[#FAF7F5] p-4 rounded-2xl border border-[#1F1410]/8 font-mono space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span className="text-[#1F1410]/60">Comensal:</span>
                <strong className="text-[#1F1410]">{qrModalItem.comensal}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1F1410]/60">Personas:</span>
                <span className="font-bold">{qrModalItem.personas} comensales</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1F1410]/60">Horario:</span>
                <span className="font-bold text-[#E12927]">{qrModalItem.hora}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1F1410]/60">Mesa asignada:</span>
                <span className="font-bold">{qrModalItem.mesaAsignada}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1F1410]/5">
                <span className="text-[#1F1410]/60">Sucursal:</span>
                <span className="font-semibold text-[11px] truncate max-w-[150px]">{qrModalItem.sucursalNombre}</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleStatusChange(qrModalItem.folio, 'en_curso');
                setQrModalItem(null);
              }}
              className="w-full py-3 bg-[#E12927] hover:bg-[#c9201f] text-white font-mono font-bold text-xs rounded-full shadow-md shadow-[#E12927]/25 cursor-pointer transition-transform active:scale-[0.98]"
            >
              Hacer Check-In en Sala
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Nueva Reservación (Portal a document.body para tapar toda la pantalla) */}
      {showAddModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                  Registrar Nueva Reservación
                </h3>
                <p className="text-xs text-[#1F1410]/60 font-body mt-0.5">
                  Host Desk · Asignación y Pase Digital
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Nombre Completo del Comensal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Herrera"
                  value={newRes.comensal}
                  onChange={(e) => setNewRes({ ...newRes, comensal: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="618-123-4567"
                    value={newRes.telefono}
                    onChange={(e) => setNewRes({ ...newRes, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Comensales (Personas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newRes.personas}
                    onChange={(e) => setNewRes({ ...newRes, personas: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Horario
                  </label>
                  <select
                    value={newRes.hora}
                    onChange={(e) => setNewRes({ ...newRes, hora: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden bg-white font-mono cursor-pointer"
                  >
                    <option value="09:00 AM">09:00 AM (Desayuno)</option>
                    <option value="10:30 AM">10:30 AM (Brunch)</option>
                    <option value="11:30 AM">11:30 AM (Brunch)</option>
                    <option value="01:30 PM">01:30 PM (Comida)</option>
                    <option value="06:00 PM">06:00 PM (Ludoteca)</option>
                    <option value="08:00 PM">08:00 PM (Noche / Tragos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Experiencia
                  </label>
                  <select
                    value={newRes.tipo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nombre = val === 'juegos' ? 'Tarde de Juegos' : 'Desayuno & Brunch';
                      setNewRes({ ...newRes, tipo: val, tipoNombre: nombre });
                    }}
                    className="w-full px-3 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="brunch">Desayuno & Brunch</option>
                    <option value="juegos">Ludoteca con Anfitrión</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1F1410]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer rounded-full hover:bg-[#FAF7F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-full cursor-pointer shadow-md shadow-[#E12927]/25 font-mono transition-transform active:scale-[0.98]"
                >
                  Generar Folio QR
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
