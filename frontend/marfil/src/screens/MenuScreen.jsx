import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ShoppingBag,
  Sparkles,
  Flame,
  Info,
  Check,
  Coffee,
  ArrowRight,
  ArrowDown,
  SlidersHorizontal,
  Grid,
  ListFilter,
  Utensils
} from 'lucide-react';
import { sounds } from '../utils/audio';

// `secciones` llega desde la API (ver aSeccionesDeMenu).
export default function MenuScreen({
  onOrderNow,
  onNavigate,
  secciones = [],
  initialProduct = null,
  onClearInitialProduct
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Individual');
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (!initialProduct) return;
    const todos = secciones.flatMap((s) => s.productos || []);
    const encontrado = todos.find((p) => p.id === initialProduct.id || p.nombreCompleto === initialProduct.nombreCompleto);
    if (encontrado) setSelectedProduct(encontrado);
    if (onClearInitialProduct) onClearInitialProduct();
  }, [initialProduct, secciones, onClearInitialProduct]);

  const toggleSection = (seccionId) => {
    sounds.playClick();
    setExpandedSections((prev) => ({
      ...prev,
      [seccionId]: !prev[seccionId]
    }));
  };

  // Refs dinámicos para los carruseles de cada sección (Desktop)
  const carouselRefs = useRef({});
  const [scrollFades, setScrollFades] = useState({});

  const checkScrollFades = (seccionId) => {
    const el = carouselRefs.current[seccionId];
    if (el) {
      const canLeft = el.scrollLeft > 10;
      const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
      setScrollFades((prev) => ({
        ...prev,
        [seccionId]: { canScrollLeft: canLeft, canScrollRight: canRight }
      }));
    }
  };

  useEffect(() => {
    secciones.forEach((s) => checkScrollFades(s.id));
    const handleResize = () => {
      secciones.forEach((s) => checkScrollFades(s.id));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [secciones]);

  const handleScroll = (seccionId, direction) => {
    sounds.playClick();
    const container = carouselRefs.current[seccionId];
    if (container) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(() => checkScrollFades(seccionId), 300);
    }
  };

  const handleOpenQueTrae = (producto) => {
    sounds.playClick();
    setSelectedProduct(producto);
  };

  const handleCloseModal = () => {
    sounds.playClick();
    setSelectedProduct(null);
  };

  const handleOrderProduct = (producto) => {
    sounds.playSuccess();
    if (onOrderNow) {
      onOrderNow(producto);
    } else if (onNavigate) {
      onNavigate('reservar');
    }
    setSelectedProduct(null);
  };

  return (
    <div className="w-full min-h-screen text-[#1F1410] font-body selection:bg-[#E12927] selection:text-white pb-20">
      {/* ====================================================================
          1. VISTA DESKTOP: SECCIÓN CON CARRUSEL HORIZONTAL & CARDS VERTICALES
          ==================================================================== */}
      {secciones.length === 0 ? (
        <div className="max-w-md mx-auto my-20 px-6 py-12 text-center bg-white rounded-3xl border border-stone-200 shadow-xs">
          <Utensils size={32} className="mx-auto text-stone-300 mb-3" />
          <h2 className="font-display font-bold text-xl text-[#1F1410]">Menú en preparación</h2>
          <p className="font-body text-sm text-stone-500 mt-1">
            Aún no hay productos publicados en el catálogo. Vuelve pronto.
          </p>
        </div>
      ) : (
      <main className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-col gap-8">
        {secciones.map((seccion) => (
          <section key={seccion.id} className="w-full flex flex-col">
            {/* Título de la Sección ("Seccion 1", "Seccion 2") idéntico al diseño */}
            <div className="flex items-baseline justify-between mb-6">
              <div className="flex flex-col">
                <h2 className="text-4xl lg:text-5xl font-normal text-[#1F1410] tracking-tight" style={{ fontFamily: 'var(--font-menu-title)' }}>
                  {seccion.numero}
                </h2>
                <span className="font-mono text-xs text-stone-500 font-semibold tracking-wider uppercase mt-1">
                  {seccion.titulo}
                </span>
              </div>

              {/* Botones de navegación de carrusel en Desktop */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleScroll(seccion.id, 'left')}
                  className="w-9 h-9 rounded-full border border-stone-300 hover:border-[#E12927] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  aria-label="Anterior"
                  title="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => handleScroll(seccion.id, 'right')}
                  className="w-9 h-9 rounded-full border border-stone-300 hover:border-[#E12927] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  aria-label="Siguiente"
                  title="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* CARRUSEL DE PRODUCTOS DESKTOP CON DIFUMINADO DINÁMICO EN LOS BORDES */}
            <div className="relative w-full flex items-center">
              {/* Degradado lateral izquierdo: se quita si es el primer elemento */}
              {scrollFades[seccion.id]?.canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none transition-opacity duration-300 animate-in fade-in" />
              )}

              {/* Degradado lateral derecho: se quita si es el último elemento */}
              {scrollFades[seccion.id]?.canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none transition-opacity duration-300 animate-in fade-in" />
              )}

              <div
                ref={(el) => { carouselRefs.current[seccion.id] = el; }}
                onScroll={() => checkScrollFades(seccion.id)}
                className="w-full flex overflow-x-auto gap-7 pt-20 pb-10 px-8 scroll-smooth scrollbar-none snap-x snap-mandatory"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {seccion.productos.map((producto) => (
                  <div
                    key={producto.id}
                    onClick={() => handleOpenQueTrae(producto)}
                    style={{ backgroundColor: producto.colorCard || '#E2E2E2' }}
                    className="relative shrink-0 w-48 sm:w-52 rounded-[28px] pt-12 pb-4 px-3.5 flex flex-col items-center justify-between transition-transform duration-300 hover:scale-105 active:scale-95 group snap-start border border-black/5 hover:border-[#E12927]/40 cursor-pointer select-none"
                  >
                    {/* IMAGEN SOBRESALIENDO POR ARRIBA SIN SOMBRA */}
                    <div className="absolute -top-14 sm:-top-16 left-1/2 -translate-x-1/2 w-32 sm:w-36 h-38 sm:h-42 flex items-center justify-center pointer-events-none z-10">
                      <img
                        src={producto.imagen}
                        alt={producto.nombreCompleto}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Espaciador para la imagen flotante */}
                    <div className="h-14 sm:h-16 w-full pointer-events-none" />

                    {/* TÍTULO Y PRECIO REFINADOS */}
                    <div className="w-full text-center mt-1 flex flex-col items-center">
                      <h3
                        className="font-bold text-base sm:text-[17px] text-[#1F1410] tracking-tight leading-snug uppercase group-hover:text-[#E12927] transition-colors duration-200 line-clamp-1"
                        style={{ fontFamily: 'var(--font-menu-product)' }}
                        title={producto.nombre}
                      >
                        {producto.nombre}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-xs sm:text-[13px] text-[#1F1410] font-black tracking-tight"
                          style={{ fontFamily: 'var(--font-menu-product)' }}
                        >
                          {producto.precio}
                        </span>
                        <span className="font-mono text-[10px] text-stone-600/80 font-bold">
                          · {producto.tamano}
                        </span>
                      </div>
                    </div>

                    {/* BOTÓN ROJO "VER DETALLES" FORMA DE PÍLDORA SIN SOMBRA */}
                    <div className="w-full mt-3.5 mb-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQueTrae(producto);
                        }}
                        className="w-full py-2 px-3 bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white font-body font-bold text-xs sm:text-sm rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 tracking-wide group/btn"
                      >
                        <span>Ver detalles</span>
                        <ArrowRight size={14} className="stroke-[2.5] group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </section>
        ))}
      </main>
      )}

      {/* ====================================================================
          2. VISTA MÓVIL: BLOQUES CONTRAÍBLES/DESPLEGABLES Y CARDS HORIZONTALES
          (DISEÑO REDISEÑADO CON ALTA ESTÉTICA Y RESPONSIVIDAD)
          ==================================================================== */}
      <div className="block md:hidden w-full px-4 pt-2 pb-8 flex flex-col gap-4">
        {/* Cabecera editorial móvil con control de acordeones */}
        <div className="flex items-center justify-between px-1 pt-2 pb-1">
          <div>
            <h2
              className="font-extrabold text-2xl text-[#1F1410] tracking-tight"
              style={{ fontFamily: 'var(--font-menu-title)' }}
            >
              Nuestras Secciones
            </h2>
          </div>

        </div>

        {secciones.map((seccion, sIdx) => {
          const isExpanded = !!expandedSections[seccion.id];
          return (
            <div key={seccion.id} className="w-full flex flex-col">
              {/* ENCABEZADO DEL BLOQUE CONTRAÍBLE / DESPLEGABLE ELEVADO */}
              <button
                type="button"
                onClick={() => toggleSection(seccion.id)}
                className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer select-none border ${isExpanded
                  ? 'bg-white border-[#E12927]/40 shadow-xs'
                  : 'bg-[#F2EFEB] hover:bg-[#EAE6E1] border-stone-200/90 shadow-2xs'
                  }`}
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 text-left">
                  <span
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-colors shrink-0 ${isExpanded
                      ? 'bg-[#E12927] text-white shadow-xs'
                      : 'bg-stone-300 text-[#1F1410]'
                      }`}
                  >
                    {String(sIdx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-lg text-[#1F1410] tracking-tight"
                        style={{ fontFamily: 'var(--font-menu-title)' }}
                      >
                        {seccion.numero}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-stone-500 uppercase">
                        · {seccion.productos.length} opciones
                      </span>
                    </div>
                    <span className="font-body text-xs text-stone-500 font-medium line-clamp-1">
                      {seccion.titulo}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${isExpanded
                    ? 'bg-[#FCEAE9] text-[#E12927] rotate-180'
                    : 'bg-white text-stone-600 shadow-2xs rotate-0'
                    }`}
                >
                  <ArrowDown size={18} className="stroke-[2.5]" />
                </div>
              </button>

              {/* LISTA DE CARDS HORIZONTALES (CUANDO ESTÁ DESPLEGADO) */}
              {isExpanded && (
                <div className="flex flex-col gap-3.5 pt-4 pb-2 pl-7 pr-1 animate-in fade-in duration-200">
                  {seccion.productos.map((producto) => (
                    <div
                      key={producto.id}
                      onClick={() => handleOpenQueTrae(producto)}
                      style={{ backgroundColor: producto.colorCard || '#F2EFEB' }}
                      className="relative w-full active:scale-[0.99] transition-all rounded-[24px] h-[86px] pl-16 pr-3.5 flex items-center justify-between cursor-pointer group shadow-xs border border-black/5 hover:border-[#E12927]/40"
                    >
                      {/* IMAGEN SALIDA DESDE LA IZQUIERDA */}
                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center pointer-events-none z-10">
                        <img
                          src={producto.imagen}
                          alt={producto.nombreCompleto}
                          className="w-full h-full object-contain filter drop-shadow-[0_8px_14px_rgba(31,20,16,0.22)] group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* TEXTO EN EL CENTRO: BADGE, NOMBRE Y PRECIO */}
                      <div className="flex-1 flex flex-col justify-center pl-2 pr-2 overflow-hidden text-left">
                        {producto.badge && (
                          <span className="font-mono text-[9px] font-black text-[#E12927] tracking-wider uppercase leading-none mb-1">
                            {producto.badge}
                          </span>
                        )}
                        <h4
                          className="font-bold text-base text-[#1F1410] uppercase tracking-tight leading-tight truncate group-hover:text-[#E12927] transition-colors"
                          style={{ fontFamily: 'var(--font-menu-product)' }}
                        >
                          {producto.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs text-[#E12927] font-black"
                            style={{ fontFamily: 'var(--font-menu-product)' }}
                          >
                            {producto.precio}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400 font-medium">
                            · {producto.tamano}
                          </span>
                        </div>
                      </div>

                      {/* BOTÓN ROJO CUADRADO REDONDEADO CON FLECHA DERECHA (→) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenQueTrae(producto);
                        }}
                        className="w-11 h-11 rounded-2xl bg-[#E12927] hover:bg-[#C81E1C] active:scale-90 text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#E12927]/25 transition-all group-hover:scale-105 cursor-pointer"
                        aria-label={`Ver receta de ${producto.nombre}`}
                      >
                        <ArrowRight size={20} className="stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ====================================================================
          3. DETALLE DEL PRODUCTO: SIDEBAR LATERAL (DESKTOP) & BOTTOM SHEET (MÓVIL)
          ==================================================================== */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 will-change-opacity"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          {/* =========================================================
              A) VISTA DESKTOP: IMAGEN DETRÁS Y BARRA LATERAL DELANTE
              ========================================================= */}
          {/* 1. IMAGEN GIGANTE FUERA DEL ASIDE - ESTRICTAMENTE DETRÁS (Z-10) OPTIMIZADA CON GPU */}
          <div className="hidden md:flex absolute right-[320px] lg:right-[380px] top-1/2 -translate-y-1/2 w-[440px] lg:w-[560px] h-[540px] lg:h-[700px] pointer-events-none z-10 items-center justify-center animate-in fade-in duration-200 will-change-transform">
            <img
              src={selectedProduct.imagen}
              alt={selectedProduct.nombreCompleto}
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain drop-shadow-xl transform -rotate-3 select-none"
            />
          </div>

          {/* 2. BARRA LATERAL POR DELANTE CON TRANSICIÓN ULTRA SUAVE */}
          <aside
            style={{ backgroundColor: selectedProduct.colorCard || '#FFFFFF' }}
            className="hidden md:flex relative w-[480px] lg:w-[520px] max-w-[92vw] h-full flex-col justify-between animate-in slide-in-from-right duration-250 z-30 select-none shadow-2xl will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CORTINA DE DEGRADADO MÁS CORTA Y SUTIL HACIA LA IZQUIERDA */}
            <div
              className="absolute -left-10 top-0 bottom-0 w-10 pointer-events-none z-30"
              style={{
                background: `linear-gradient(to right, transparent, ${selectedProduct.colorCard || '#FFFFFF'})`
              }}
            />

            {/* Cabecera con botón de cerrar */}
            <div className="w-full flex items-center justify-between p-6 pb-2 z-20">
              <span className="font-mono text-xs font-black text-[#E12927] bg-white/90 backdrop-blur-xs px-3.5 py-1 rounded-full uppercase tracking-wider border border-white/60 shadow-xs">
                {selectedProduct.categoria}
              </span>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#1F1410] hover:text-[#E12927] shadow-sm flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                aria-label="Cerrar panel lateral"
              >
                <X size={22} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Contenedor central con scroll: texto directo y limpio */}
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-start scrollbar-none z-20 text-left">
              {/* 1. TÍTULO DEL PLATILLO O BEBIDA */}
              <div>
                <span className="font-mono text-xs font-bold text-[#E12927] uppercase tracking-wider block mb-1">
                  {selectedProduct.categoria}
                </span>
                <h3
                  className="font-normal text-3xl lg:text-4xl text-[#1F1410] tracking-tight leading-snug"
                  style={{ fontFamily: 'var(--font-menu-title)' }}
                >
                  {selectedProduct.nombre}
                </h3>
                <p className="font-body text-xs text-[#1F1410]/80 font-medium mt-1">
                  {selectedProduct.nombreCompleto}
                </p>

                {/* 2. DESCRIPCIÓN / RECETA */}
                <p className="font-body text-xs lg:text-[13px] text-[#1F1410]/90 leading-relaxed mt-3.5 text-justify">
                  {selectedProduct.descripcion ||
                    (selectedProduct.queTrae && selectedProduct.queTrae.length > 0
                      ? selectedProduct.queTrae.join(' ')
                      : 'Receta artesanal exclusiva de Café Marfil Durango elaborada con insumos de alta calidad, preparado al momento para garantizar frescura y textura insuperable.')}
                </p>
              </div>

              {/* 3. SECCIÓN: TAMAÑO O PRESENTACIÓN (ADAPTABLE PARA BEBIDAS Y COMIDAS) */}
              <div className="mt-6">
                <span className="font-body font-bold text-sm text-[#1F1410] block mb-2.5">
                  {selectedProduct.id?.startsWith('frappe') || selectedProduct.categoria?.toLowerCase().includes('bebida')
                    ? 'Tamaño'
                    : 'Presentación'}
                </span>
                <div className="flex items-center gap-3">
                  {(selectedProduct.id?.startsWith('frappe') || selectedProduct.categoria?.toLowerCase().includes('bebida')
                    ? [
                      { label: 'Chico', desc: '12 oz' },
                      { label: 'Mediano', desc: '16 oz' },
                      { label: 'Grande', desc: '20 oz' }
                    ]
                    : [
                      { label: 'Individual', desc: 'Con papas' },
                      { label: 'Doble', desc: 'Porción extra' },
                      { label: 'Combo', desc: 'Con bebida' }
                    ]
                  ).map((sizeItem, idx) => {
                    const isSelected = selectedSize === sizeItem.label || (selectedSize === 'Individual' && idx === 1);
                    return (
                      <button
                        key={sizeItem.label}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedSize(sizeItem.label);
                        }}
                        className={`flex-1 py-2 px-3 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer border text-center ${isSelected
                          ? 'bg-[#E12927] text-white border-[#E12927] shadow-xs'
                          : 'bg-white/40 text-[#1F1410] border-[#1F1410]/20 hover:border-[#E12927] hover:bg-[#FCEAE9]'
                          }`}
                      >
                        <span className={`block leading-tight font-body font-bold ${isSelected ? 'text-white' : 'text-[#1F1410]'}`}>{sizeItem.label}</span>
                        <span className={`block text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#1F1410]/70'}`}>
                          {sizeItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. PRECIO & PIE EDITORIAL (SIN BOTÓN PEDIR AHORA) */}
              <div className="mt-8 pt-5 border-t border-[#1F1410]/15 flex items-baseline justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#1F1410]/70 uppercase tracking-wider block">
                    Precio en sucursal
                  </span>
                  <span
                    className="font-bold text-3xl text-[#1F1410] tracking-tight font-mono"
                  >
                    {selectedProduct.precio}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[11px] font-bold text-[#E12927] uppercase tracking-wider block">
                    {selectedProduct.calorias}
                  </span>
                  <span className="font-mono text-[10px] text-[#1F1410]/70 font-medium">
                    Servicio en sala y para llevar
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* =========================================================
              B) VISTA MÓVIL: BOTTOM SHEET FLOTANTE
              ========================================================= */}
          <div
            style={{ backgroundColor: selectedProduct.colorCard || '#D9D9D9' }}
            className="md:hidden relative w-full h-[88vh] max-h-[92vh] rounded-t-[36px] pt-32 pb-8 px-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-250 border-t border-white/40 select-none overflow-visible will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra indicadora de deslizamiento para móvil */}
            <div className="w-12 h-1 bg-[#1F1410]/30 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" />

            {/* Botón cerrar */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 text-[#1F1410] hover:text-[#E12927] flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-transform"
              aria-label="Cerrar modal"
            >
              <X size={22} className="stroke-[2.5]" />
            </button>

            {/* Imagen flotante subida aún más para no estar pegada al título */}
            <div className="absolute -top-48 sm:-top-52 left-1/2 -translate-x-1/2 w-64 h-68 flex items-center justify-center pointer-events-none z-20 will-change-transform">
              <img
                src={selectedProduct.imagen}
                alt={selectedProduct.nombreCompleto}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>

            {/* CUERPO CON EXACTAMENTE LA MISMA ESTRUCTURA QUE DESKTOP - ULTRA LEGIBLE */}
            <div className="flex-1 overflow-y-auto pr-1 pt-3 flex flex-col justify-start scrollbar-none text-left">
              {/* 1. TÍTULO Y NOMBRES CON MÁXIMO CONTRASTE Y TAMAÑO */}
              <div>
                <span className="font-mono text-xs sm:text-sm font-black text-[#E12927] uppercase tracking-wider block mb-1">
                  {selectedProduct.categoria}
                </span>
                <h3
                  className="font-normal text-4xl sm:text-5xl text-[#1F1410] tracking-tight leading-[1.1]"
                  style={{ fontFamily: 'var(--font-menu-title)' }}
                >
                  {selectedProduct.nombre}
                </h3>
                <p className="font-body text-base sm:text-lg text-[#1F1410]/80 font-bold mt-1.5 leading-snug">
                  {selectedProduct.nombreCompleto}
                </p>

                {/* 2. DESCRIPCIÓN CON LETRA GRANDE */}
                <p className="font-body text-base sm:text-lg text-[#1F1410] leading-relaxed mt-4 opacity-100 text-justify font-medium">
                  {selectedProduct.descripcion ||
                    (selectedProduct.queTrae && selectedProduct.queTrae.length > 0
                      ? selectedProduct.queTrae.join(' ')
                      : 'Receta artesanal exclusiva de Café Marfil Durango elaborada con insumos de alta calidad, preparado al momento para garantizar frescura y textura insuperable.')}
                </p>
              </div>

              {/* 3. SECCIÓN: TAMAÑO O PRESENTACIÓN */}
              <div className="mt-6">
                <span className="font-body font-black text-lg text-[#1F1410] block mb-3">
                  {selectedProduct.id?.startsWith('frappe') || selectedProduct.categoria?.toLowerCase().includes('bebida')
                    ? 'Tamaño'
                    : 'Presentación'}
                </span>
                <div className="flex items-center gap-3">
                  {(selectedProduct.id?.startsWith('frappe') || selectedProduct.categoria?.toLowerCase().includes('bebida')
                    ? [
                      { label: 'Chico', desc: '12 oz' },
                      { label: 'Mediano', desc: '16 oz' },
                      { label: 'Grande', desc: '20 oz' }
                    ]
                    : [
                      { label: 'Individual', desc: 'Con papas' },
                      { label: 'Doble', desc: 'Porción extra' },
                      { label: 'Combo', desc: 'Con bebida' }
                    ]
                  ).map((sizeItem, idx) => {
                    const isSelected = selectedSize === sizeItem.label || (selectedSize === 'Individual' && idx === 1);
                    return (
                      <button
                        key={sizeItem.label}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedSize(sizeItem.label);
                        }}
                        className={`flex-1 py-3 px-3 rounded-full text-base sm:text-lg font-black transition-all duration-200 cursor-pointer border-2 text-center ${isSelected
                          ? 'bg-[#E12927] text-white border-[#E12927] shadow-md'
                          : 'bg-white/40 text-[#1F1410] border-[#1F1410]/20 hover:bg-[#FCEAE9]'
                          }`}
                      >
                        <span className={`block leading-tight font-body font-bold ${isSelected ? 'text-white' : 'text-[#1F1410]'}`}>{sizeItem.label}</span>
                        <span className={`block text-xs sm:text-sm font-mono mt-1 ${isSelected ? 'text-white/90' : 'text-[#1F1410]/70 font-bold'}`}>
                          {sizeItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. PRECIO & METADATOS INFERIORES */}
            <div className="w-full flex items-baseline justify-between pt-4 mt-3 border-t-2 border-[#1F1410]/15 shrink-0">
              <div>
                <span className="font-mono text-xs sm:text-sm font-bold text-[#1F1410]/70 uppercase tracking-wider block">
                  Precio en sucursal
                </span>
                <span
                  className="font-bold text-4xl sm:text-5xl text-[#1F1410] tracking-tight leading-none font-mono"
                >
                  {selectedProduct.precio}
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono text-base font-black text-[#E12927] uppercase tracking-wider block">
                  {selectedProduct.calorias}
                </span>
                <span className="font-mono text-xs sm:text-sm text-[#1F1410]/70 font-bold">
                  En sala y para llevar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
