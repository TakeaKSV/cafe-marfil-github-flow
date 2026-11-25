import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Monitor, Smartphone, X, CheckCircle2, Flame } from 'lucide-react';
import { MenuProductPreviewCard } from './MenuProductPreviewCard';
import { resolverUrlImagen } from '../../api/cliente';

/**
 * Vista previa completa del menú tal como lo verá el cliente en la PWA.
 * Permite alternar entre escritorio y móvil, e incluir o esconder borradores.
 */
export function MenuFullPreviewModal({ isOpen, onClose, menuItems = [], onPublishItem }) {
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'mobile'
  const [mostrarBorradores, setMostrarBorradores] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const secciones = useMemo(() => {
    const visibles = menuItems.filter((p) => mostrarBorradores || p.estado !== 'borrador');
    const grupos = new Map();
    for (const p of visibles) {
      const slug = p.categoriaSlug || 'otros';
      if (!grupos.has(slug)) {
        grupos.set(slug, { slug, titulo: p.categoria || 'Especialidades', productos: [] });
      }
      grupos.get(slug).productos.push(p);
    }
    return [...grupos.values()].map((g, idx) => ({
      ...g,
      numero: `Sección ${idx + 1}`
    }));
  }, [menuItems, mostrarBorradores]);

  if (!isOpen) return null;

  const totalBorradores = menuItems.filter((p) => p.estado === 'borrador').length;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-[#1F1410]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF8F5] rounded-[28px] border border-[#1F1410]/15 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior del simulador */}
        <div className="bg-[#1F1410] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E12927] flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base leading-none">
                Vista Previa del Menú Cliente (PWA)
              </h3>
              <p className="font-mono text-[10px] text-white/60 mt-0.5">
                Simulación en tiempo real · {secciones.reduce((s, x) => s + x.productos.length, 0)} productos mostrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Toggle borradores */}
            <label className="inline-flex items-center gap-2 text-xs font-mono bg-white/10 px-3 py-1.5 rounded-full cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mostrarBorradores}
                onChange={(e) => setMostrarBorradores(e.target.checked)}
                className="accent-[#E12927] cursor-pointer"
              />
              <span>Mostrar borradores ({totalBorradores})</span>
            </label>

            {/* Selector Desktop / Móvil */}
            <div className="flex items-center bg-white/10 p-1 rounded-full">
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewport === 'desktop' ? 'bg-[#E12927] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Escritorio
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewport === 'mobile' ? 'bg-[#E12927] text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Móvil
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E12927] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lienzo del menú simulado */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex justify-center">
          <div
            className={`w-full transition-all duration-300 ${
              viewport === 'mobile'
                ? 'max-w-[390px] bg-white rounded-[36px] border-4 border-[#1F1410] p-4 shadow-xl self-start'
                : 'max-w-5xl'
            }`}
          >
            {secciones.length === 0 ? (
              <div className="py-20 text-center text-[#1F1410]/50 font-body text-sm">
                No hay productos para mostrar con el filtro actual.
              </div>
            ) : (
              <div className="space-y-10">
                {secciones.map((sec) => (
                  <section key={sec.slug}>
                    <div className="mb-4">
                      <h4 className="font-display font-bold text-2xl text-[#1F1410] leading-none">{sec.numero}</h4>
                      <span className="font-mono text-[11px] font-bold text-[#1F1410]/50 uppercase tracking-wider">
                        {sec.titulo} · {sec.productos.length} opciones
                      </span>
                    </div>

                    {viewport === 'mobile' ? (
                      <div className="flex flex-col gap-3.5 pl-4">
                        {sec.productos.map((prod) => (
                          <MenuProductPreviewCard
                            key={prod.id}
                            producto={prod}
                            modo="mobile"
                            onClick={() => setDetalle(prod)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-6 pt-14 pb-4">
                        {sec.productos.map((prod) => (
                          <MenuProductPreviewCard
                            key={prod.id}
                            producto={prod}
                            modo="desktop"
                            onClick={() => setDetalle(prod)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sub-modal de detalle del producto */}
        {detalle && (
          <div
            className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setDetalle(null)}
          >
            <div
              style={{ backgroundColor: detalle.colorCard || '#FFFFFF' }}
              className="rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#1F1410]/10 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-white text-[#E12927]">
                  {detalle.categoria}
                </span>
                <button
                  type="button"
                  onClick={() => setDetalle(null)}
                  className="w-8 h-8 rounded-full bg-white text-[#1F1410] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={resolverUrlImagen(detalle.imagen)}
                  alt={detalle.nombre}
                  className="w-24 h-24 object-contain shrink-0"
                />
                <div>
                  <h4 className="font-display font-bold text-xl text-[#1F1410] leading-tight">{detalle.nombre}</h4>
                  <p className="font-mono font-black text-lg text-[#E12927] mt-1">
                    ${Number(detalle.precio || 0).toFixed(0)} MXN
                  </p>
                  <p className="font-mono text-[11px] text-[#1F1410]/70">
                    {detalle.porcion || 'Individual'} {detalle.calorias ? `· ${detalle.calorias} kcal` : ''}
                  </p>
                </div>
              </div>

              {detalle.descripcion && (
                <p className="font-body text-xs text-[#1F1410]/85 bg-white/75 p-3 rounded-xl leading-relaxed">
                  {detalle.descripcion}
                </p>
              )}

              {Array.isArray(detalle.ingredientes) && detalle.ingredientes.length > 0 && (
                <div className="bg-white/80 p-3 rounded-xl space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#1F1410]/60 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-[#E12927]" /> ¿Qué trae?
                  </span>
                  <ul className="list-disc pl-4 text-xs text-[#1F1410]/85 space-y-0.5">
                    {detalle.ingredientes.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {detalle.estado === 'borrador' && onPublishItem && (
                <button
                  type="button"
                  onClick={() => {
                    onPublishItem(detalle.id);
                    setDetalle(null);
                  }}
                  className="w-full py-2.5 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Publicar este borrador ahora
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
