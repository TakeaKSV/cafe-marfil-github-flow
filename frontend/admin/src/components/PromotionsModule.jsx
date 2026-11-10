import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tag, 
  Plus, 
  Gift, 
  Calendar, 
  CheckCircle2, 
  PauseCircle, 
  Sparkles, 
  Flame, 
  X,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const PromotionsModule = ({ 
  promociones, 
  onUpdatePromocion, 
  onAddPromocion,
  soundEnabled 
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showNewModal) {
        setShowNewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewModal]);

  const [newPromo, setNewPromo] = useState({
    codigo: '',
    titulo: '',
    categoria: 'Frappés & Indulgencia',
    descuentoBadge: '2x1',
    beneficio: '',
    vigencia: 'Válido esta semana',
    limiteDiario: 40
  });

  const handleToggleEstado = (promo) => {
    const nuevoEstado = promo.estado === 'activo' ? 'pausado' : 'activo';
    onUpdatePromocion({ ...promo, estado: nuevoEstado });
    if (soundEnabled) playSound('toggle');
  };

  const handleCopyCode = (codigo) => {
    navigator.clipboard?.writeText(codigo);
    setCopiedCode(codigo);
    if (soundEnabled) playSound('success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreatePromo = (e) => {
    e.preventDefault();
    if (!newPromo.codigo.trim() || !newPromo.titulo.trim()) return;

    const creada = {
      id: `promo-${Date.now()}`,
      codigo: newPromo.codigo.toUpperCase().trim(),
      titulo: newPromo.titulo,
      categoria: newPromo.categoria,
      descuentoBadge: newPromo.descuentoBadge.toUpperCase(),
      beneficio: newPromo.beneficio,
      vigencia: newPromo.vigencia,
      canjesHoy: 0,
      limiteDiario: Number(newPromo.limiteDiario) || 50,
      estado: 'activo',
      sucursales: ['porras-matriz', 'calvario']
    };

    onAddPromocion(creada);
    if (soundEnabled) playSound('success');
    setShowNewModal(false);
    setNewPromo({
      codigo: '',
      titulo: '',
      categoria: 'Frappés & Indulgencia',
      descuentoBadge: '2x1',
      beneficio: '',
      vigencia: 'Válido esta semana',
      limiteDiario: 40
    });
  };

  return (
    <div className="space-y-6 animate-menu-in">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Promociones Semanales & Cuponera Digital
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Configuración de dinámicas comerciales ("2x1", "Combo Dubái"), límites diarios y monitoreo de canjes en caja
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
          Nueva Promoción o Cupón
        </button>
      </div>

      {/* Grid de Campañas Promocionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promociones.map((promo, idx) => {
          const isActiva = promo.estado === 'activo';
          const porcentajeUso = Math.round((promo.canjesHoy / promo.limiteDiario) * 100);

          return (
            <div 
              key={promo.id}
              style={{ animationDelay: `${(idx % 4) * 60}ms` }}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between hover-lift animate-fade-up ${
                isActiva 
                  ? 'border-[#1F1410]/10 hover:border-[#E12927]/40' 
                  : 'border-gray-200 bg-gray-50/50 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#E12927] text-white px-2 py-0.5 rounded-xs shadow-2xs">
                      {promo.descuentoBadge}
                    </span>
                    <span className="text-xs text-[#1F1410]/60 font-mono">
                      {promo.categoria}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleEstado(promo)}
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      isActiva 
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {isActiva ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    {isActiva ? 'Campaña Activa' : 'Pausada'}
                  </button>
                </div>

                <h3 className="font-display font-bold text-lg text-[#1F1410] mb-1">
                  {promo.titulo}
                </h3>
                <p className="text-xs text-[#1F1410]/80 leading-relaxed mb-4">
                  {promo.beneficio}
                </p>

                {/* Código de Cupón para Caja */}
                <div className="flex items-center justify-between p-2.5 bg-[#FAF7F5] border border-dashed border-[#1F1410]/20 rounded-sm mb-4">
                  <div className="font-mono text-xs">
                    <span className="text-[#1F1410]/50 block text-[10px]">CÓDIGO DIGITAL:</span>
                    <strong className="text-sm text-[#1F1410] tracking-wider">{promo.codigo}</strong>
                  </div>
                  <button
                    onClick={() => handleCopyCode(promo.codigo)}
                    className="p-1.5 bg-white border border-[#1F1410]/15 hover:border-[#E12927] text-[#1F1410] rounded-xs text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode === promo.codigo ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Estadísticas de canje hoy */}
              <div className="pt-3 border-t border-[#1F1410]/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#1F1410]/60">Canjes Hoy en Caja:</span>
                  <span className="font-bold text-[#1F1410]">
                    {promo.canjesHoy} / {promo.limiteDiario} cupos ({porcentajeUso}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FAF7F5] rounded-xs overflow-hidden border border-[#1F1410]/10">
                  <div 
                    className="h-full bg-[#E12927] rounded-xs transition-all duration-300"
                    style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#1F1410]/50 font-mono">
                  Vigencia: {promo.vigencia}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Nueva Promoción (Portal a document.body para tapar toda la pantalla) */}
      {showNewModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setShowNewModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                  Crear Campaña o Cupón
                </h3>
                <p className="text-xs text-[#1F1410]/60 font-body mt-0.5">
                  Cuponera Digital & Promociones Marfil
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

            <form onSubmit={handleCreatePromo} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Código de Activación (POS) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MF-PROMO-WAFFLE"
                  value={newPromo.codigo}
                  onChange={(e) => setNewPromo({ ...newPromo, codigo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Título de la Promoción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Miércoles de Waffles al 50%"
                  value={newPromo.titulo}
                  onChange={(e) => setNewPromo({ ...newPromo, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Badge de Descuento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 2x1, 50% OFF"
                    value={newPromo.descuentoBadge}
                    onChange={(e) => setNewPromo({ ...newPromo, descuentoBadge: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Límite Canjes / Día
                  </label>
                  <input
                    type="number"
                    value={newPromo.limiteDiario}
                    onChange={(e) => setNewPromo({ ...newPromo, limiteDiario: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Beneficio / Descripción para el Cliente
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalle de términos, consumo mínimo o productos participantes..."
                  value={newPromo.beneficio}
                  onChange={(e) => setNewPromo({ ...newPromo, beneficio: e.target.value })}
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
                  Lanzar Promoción
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
