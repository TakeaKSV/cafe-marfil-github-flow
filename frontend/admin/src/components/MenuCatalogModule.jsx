import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Flame, 
  X,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const MenuCatalogModule = ({ 
  menuItems, 
  onUpdateMenuItem, 
  onAddMenuItem,
  soundEnabled 
}) => {
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingItem) setEditingItem(null);
        if (showNewModal) setShowNewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem, showNewModal]);

  // Formulario nuevo producto
  const [newItem, setNewItem] = useState({
    nombre: '',
    categoria: 'Brunch & Cocina Salada',
    categoriaSlug: 'salado',
    porcion: '1 porción',
    precio: 150,
    descripcion: '',
    disponibleEnCocina: true,
    stockDiario: 30,
    tiempoPrepMin: 12,
    imagen: '/images/desayunos_marfil.jpg',
    badge: 'NUEVO'
  });

  const categories = [
    { id: 'todas', label: 'Todo el Menú' },
    { id: 'salado', label: 'Brunch & Salado' },
    { id: 'frappes', label: 'Frappés de Confitería' },
    { id: 'especialidad', label: 'Barra Especialidad' },
    { id: 'postres', label: 'Postres & Dubái' },
    { id: 'bar', label: 'Bebidas & Mezcal' }
  ];

  const filtered = menuItems.filter(item => {
    const matchesCat = activeCategory === 'todas' || item.categoriaSlug === activeCategory;
    const matchesSearch = searchTerm === '' ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleDisponibilidad = (item) => {
    const nuevoEstado = !item.disponibleEnCocina;
    const updated = { ...item, disponibleEnCocina: nuevoEstado };
    onUpdateMenuItem(updated);

    if (soundEnabled) {
      playSound(nuevoEstado ? 'toggle' : 'alert');
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateMenuItem({
      ...editingItem,
      precio: Number(editingItem.precio),
      precioStr: `$${editingItem.precio} MXN`
    });

    if (soundEnabled) playSound('success');
    setEditingItem(null);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newItem.nombre.trim()) return;

    const nuevo = {
      id: `prod-${Date.now()}`,
      nombre: newItem.nombre,
      categoria: newItem.categoria,
      categoriaSlug: newItem.categoriaSlug,
      porcion: newItem.porcion,
      precio: Number(newItem.precio),
      precioStr: `$${newItem.precio} MXN`,
      descripcion: newItem.descripcion,
      disponibleEnCocina: true,
      stockDiario: Number(newItem.stockDiario) || 30,
      vendidosHoy: 0,
      tiempoPrepMin: Number(newItem.tiempoPrepMin) || 10,
      imagen: newItem.imagen || '/images/desayunos_marfil.jpg',
      badge: newItem.badge || 'NUEVO'
    };

    onAddMenuItem(nuevo);
    if (soundEnabled) playSound('success');
    setShowNewModal(false);
    setNewItem({
      nombre: '',
      categoria: 'Brunch & Cocina Salada',
      categoriaSlug: 'salado',
      porcion: '1 porción',
      precio: 150,
      descripcion: '',
      disponibleEnCocina: true,
      stockDiario: 30,
      tiempoPrepMin: 12,
      imagen: '/images/desayunos_marfil.jpg',
      badge: 'NUEVO'
    });
  };

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Cocina en Vivo & Catálogo de Menú
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Apagador de insumos agotados en cocina, ajuste de precios y tiempos de preparación
          </p>
        </div>

        <button
          onClick={() => {
            if (soundEnabled) playSound('toggle');
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nuevo Platillo / Bebida
        </button>
      </div>

      {/* Filtros de Categoría y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (soundEnabled) playSound('toggle');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#1F1410] border-[#1F1410] text-white'
                  : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#1F1410]/40" />
          <input
            type="text"
            placeholder="Buscar por nombre o ingrediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#1F1410]/15 rounded-md focus:outline-hidden focus:border-[#E12927] font-body"
          />
        </div>

      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <div 
            key={item.id}
            style={{ animationDelay: `${(idx % 6) * 50}ms` }}
            className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all flex flex-col justify-between hover-lift animate-fade-up ${
              item.disponibleEnCocina 
                ? 'border-[#1F1410]/10 hover:border-[#1F1410]/30' 
                : 'border-amber-300 bg-amber-50/20'
            }`}
          >
            <div>
              {/* Imagen y Badges */}
              <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3 border border-[#1F1410]/10 bg-[#FAF7F5] group">
                <img 
                  src={item.imagen} 
                  alt={item.nombre} 
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
                    !item.disponibleEnCocina ? 'grayscale-75 opacity-60' : ''
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/desayunos_marfil.jpg';
                  }}
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#1F1410] text-white rounded-full shadow-2xs">
                  {item.badge}
                </span>

                <span className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-mono font-bold bg-[#E12927] text-white rounded-full shadow-sm">
                  ${item.precio} MXN
                </span>
              </div>

              {/* Nombre y categoría */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display font-bold text-base text-[#1F1410] leading-snug">
                  {item.nombre}
                </h3>
              </div>

              <div className="text-[11px] font-mono text-[#1F1410]/60 mb-2">
                {item.categoria} · {item.porcion}
              </div>

              <p className="text-xs text-[#1F1410]/75 line-clamp-2 leading-relaxed mb-3">
                {item.descripcion}
              </p>
            </div>

            {/* Fila de Controles: Disponibilidad y Botón Editar */}
            <div className="pt-3 border-t border-[#1F1410]/10 flex items-center justify-between gap-2">
              
              {/* Toggle Switch Disponibilidad en Cocina */}
              <button
                onClick={() => handleToggleDisponibilidad(item)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-xs transition-colors cursor-pointer border ${
                  item.disponibleEnCocina
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
                title="Haz clic para apagar si se agotaron ingredientes en cocina"
              >
                <span className={`w-2 h-2 rounded-full ${item.disponibleEnCocina ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                {item.disponibleEnCocina ? 'En Cocina (Activo)' : 'Agotado (Apagado)'}
              </button>

              <button
                onClick={() => setEditingItem(item)}
                className="p-1.5 text-[#1F1410]/70 hover:text-[#1F1410] hover:bg-[#FAF7F5] rounded-xs border border-[#1F1410]/15 cursor-pointer"
                title="Editar precio y detalles"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>
        ))}
      </div>

      {/* Modal de Edición de Platillo (Portal a document.body para tapar toda la pantalla) */}
      {editingItem && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setEditingItem(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                  Editar Platillo
                </h3>
                <p className="text-xs text-[#E12927] font-semibold mt-0.5 truncate max-w-[260px]">
                  {editingItem.nombre}
                </p>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Precio al Público (MXN) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-[#1F1410]/50" />
                  <input
                    type="number"
                    required
                    value={editingItem.precio}
                    onChange={(e) => setEditingItem({ ...editingItem, precio: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-mono border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Porción / Especificación de Onzas
                </label>
                <input
                  type="text"
                  value={editingItem.porcion}
                  onChange={(e) => setEditingItem({ ...editingItem, porcion: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Badge Promocional
                </label>
                <input
                  type="text"
                  value={editingItem.badge}
                  onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                  placeholder="Ej. NUEVO, POPULAR, 2X1"
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono uppercase transition-all"
                />
              </div>

              <div className="pt-4 border-t border-[#1F1410]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer rounded-full hover:bg-[#FAF7F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-full cursor-pointer shadow-md shadow-[#E12927]/25 font-mono transition-transform active:scale-[0.98]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Nuevo Platillo (Portal a document.body para tapar toda la pantalla) */}
      {showNewModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setShowNewModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-lg w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                  Registrar Nuevo Platillo o Bebida
                </h3>
                <p className="text-xs text-[#1F1410]/60 font-body mt-0.5">
                  Catálogo Digital & Cocina en Vivo
                </p>
              </div>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 font-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Nombre del Platillo / Bebida *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Waffle Frutos Rojos & Nutella"
                    value={newItem.nombre}
                    onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Categoría Gastronómica
                  </label>
                  <select
                    value={newItem.categoriaSlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      const catName = categories.find(c => c.id === slug)?.label || 'Brunch';
                      setNewItem({ ...newItem, categoriaSlug: slug, categoria: catName });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="salado">Brunch & Cocina Salada</option>
                    <option value="frappes">Frappés de Confitería</option>
                    <option value="especialidad">Barra de Especialidad</option>
                    <option value="postres">Postres & Dubái</option>
                    <option value="bar">Bebidas Sociales & Mezcal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Precio (MXN) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newItem.precio}
                    onChange={(e) => setNewItem({ ...newItem, precio: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Porción / Medida
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 16 oz, 200g"
                    value={newItem.porcion}
                    onChange={(e) => setNewItem({ ...newItem, porcion: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Tiempo Prep (min)
                  </label>
                  <input
                    type="number"
                    value={newItem.tiempoPrepMin}
                    onChange={(e) => setNewItem({ ...newItem, tiempoPrepMin: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Descripción Gastronómica
                </label>
                <textarea
                  rows="2"
                  placeholder="Detallar ingredientes y preparación de autor..."
                  value={newItem.descripcion}
                  onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div className="pt-4 border-t border-[#1F1410]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer rounded-full hover:bg-[#FAF7F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-full cursor-pointer shadow-md shadow-[#E12927]/25 font-mono transition-transform active:scale-[0.98]"
                >
                  Guardar en Catálogo
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
