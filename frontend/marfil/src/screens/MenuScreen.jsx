import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Menu as MenuIcon,
  Play,
  UtensilsCrossed,
  ThumbsUp,
  Coffee,
  Utensils,
  CakeSlice,
  Wine,
  CupSoda,
  Info
} from 'lucide-react';
import { sounds } from '../utils/audio';

const PILL_ACCENTS = ['#FFA35C', '#A6D49F', '#F4C95D', '#F5A3A0', '#A3C4F3'];

function splitTituloDosLineas(nombre = '', fallbackTop = 'CAFÉ MARFIL') {
  const limpio = String(nombre || '').trim();
  if (!limpio) return [fallbackTop, 'ESPECIALIDAD'];
  const palabras = limpio.split(/\s+/);
  if (palabras.length === 1) {
    return [fallbackTop, palabras[0]];
  }
  const corte = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, corte).join(' '), palabras.slice(corte).join(' ')];
}

function iconoParaSeccion(seccion) {
  const clave = `${seccion?.slug || ''} ${seccion?.nombre || ''} ${seccion?.titulo || ''}`.toLowerCase();
  if (clave.includes('frappe') || clave.includes('frappé') || clave.includes('malteada') || clave.includes('fria') || clave.includes('fría')) return CupSoda;
  if (clave.includes('salado') || clave.includes('brunch') || clave.includes('comida') || clave.includes('desayuno') || clave.includes('hamburg')) return Utensils;
  if (clave.includes('postre') || clave.includes('dulce') || clave.includes('waffle') || clave.includes('fresa')) return CakeSlice;
  if (clave.includes('social') || clave.includes('coctel') || clave.includes('soda') || clave.includes('cerveza')) return Wine;
  if (clave.includes('cafe') || clave.includes('café') || clave.includes('especialidad') || clave.includes('espresso')) return Coffee;
  return UtensilsCrossed;
}

function nombreSeccion(seccion) {
  return seccion?.nombre || seccion?.titulo || 'Menú';
}

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

  // Estado del escaparate interactivo estilo Pinterest
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeProductId, setActiveProductId] = useState(null);
  const [infoTab, setInfoTab] = useState('overview'); // 'overview' | 'ingredients'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [likedIds, setLikedIds] = useState({});

  const carouselRef = useRef(null);
  const directionRef = useRef(1);

  // Refs para animaciones GSAP
  const stageRef = useRef(null);
  const ribbonRef = useRef(null);
  const dishRef = useRef(null);
  const kickerRef = useRef(null);
  const titleLine1Ref = useRef(null);
  const titleLine2Ref = useRef(null);
  const actionsRef = useRef(null);
  const cardRef = useRef(null);
  const pillRef = useRef(null);
  const tabBodyRef = useRef(null);

  const safeSectionIdx = secciones.length > 0 ? Math.min(activeSectionIdx, secciones.length - 1) : 0;
  const activeSection = secciones[safeSectionIdx] || null;

  const allProducts = useMemo(
    () => secciones.flatMap((s) => (s.productos || []).map((p) => ({ ...p, _seccionNombre: nombreSeccion(s) }))),
    [secciones]
  );

  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return allProducts.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(q) ||
          p.nombreCompleto?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.categoria?.toLowerCase().includes(q)
      );
    }
    return activeSection?.productos || [];
  }, [searchQuery, allProducts, activeSection]);

  const activeProduct = useMemo(() => {
    if (!visibleProducts.length) return null;
    const found = visibleProducts.find((p) => p.id === activeProductId);
    return found || visibleProducts[0];
  }, [visibleProducts, activeProductId]);

  const activeProductIndex = useMemo(() => {
    if (!activeProduct) return 0;
    const idx = visibleProducts.findIndex((p) => p.id === activeProduct.id);
    return idx >= 0 ? idx : 0;
  }, [visibleProducts, activeProduct]);

  useEffect(() => {
    if (!initialProduct) return;
    const todos = secciones.flatMap((s) => s.productos || []);
    const encontrado = todos.find((p) => p.id === initialProduct.id || p.nombreCompleto === initialProduct.nombreCompleto);
    if (encontrado) {
      setActiveProductId(encontrado.id);
      setSelectedProduct(encontrado);
    }
    if (onClearInitialProduct) onClearInitialProduct();
  }, [initialProduct, secciones, onClearInitialProduct]);

  // Animación GSAP principal al cambiar de platillo (arco rotacional + reveal de texto + tarjeta frosted)
  useEffect(() => {
    if (!activeProduct || !stageRef.current) return undefined;
    const dir = directionRef.current || 1;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (ribbonRef.current) {
        tl.fromTo(
          ribbonRef.current,
          { x: dir * 32, scale: 0.96, opacity: 0.55 },
          { x: 0, scale: 1, opacity: 0.78, duration: 0.85, ease: 'power2.out' },
          0
        );
      }

      if (dishRef.current) {
        const isSmall = window.innerWidth < 640;
        tl.fromTo(
          dishRef.current,
          {
            x: isSmall ? -40 : -85,
            y: dir * (isSmall ? 50 : 95),
            rotation: dir * (isSmall ? -26 : -42),
            scale: 0.75,
            opacity: 0
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 0.78,
            ease: 'power3.out'
          },
          0
        );
      }

      const textTargets = [kickerRef.current, titleLine1Ref.current, titleLine2Ref.current, actionsRef.current].filter(Boolean);
      if (textTargets.length) {
        tl.fromTo(
          textTargets,
          { y: dir * 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.58, stagger: 0.065, ease: 'power3.out' },
          0.08
        );
      }

      if (cardRef.current) {
        tl.fromTo(
          cardRef.current,
          { x: 28, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
          0.12
        );
      }

      if (pillRef.current) {
        tl.fromTo(
          pillRef.current,
          { scale: 0.7, y: 12, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
          0.2
        );
      }
    }, stageRef);

    return () => ctx.revert();
  }, [activeProduct?.id]);

  // Micro-animación GSAP al alternar entre Resumen e Ingredientes
  useEffect(() => {
    if (!tabBodyRef.current) return undefined;
    const tween = gsap.fromTo(
      tabBodyRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    return () => tween.kill();
  }, [infoTab]);

  // Transición automática cada 5 segundos (se pausa si el modal, buscador o menú están abiertos)
  useEffect(() => {
    if (visibleProducts.length <= 1 || selectedProduct || searchOpen || sectionMenuOpen) {
      return undefined;
    }
    const timer = setInterval(() => {
      directionRef.current = 1;
      setActiveProductId((prevId) => {
        const currentIdx = visibleProducts.findIndex((p) => p.id === prevId);
        const safeIdx = currentIdx >= 0 ? currentIdx : 0;
        const nextIdx = (safeIdx + 1) % visibleProducts.length;
        return visibleProducts[nextIdx].id;
      });
      setInfoTab('overview');
    }, 5000);
    return () => clearInterval(timer);
  }, [visibleProducts, activeProduct?.id, selectedProduct, searchOpen, sectionMenuOpen]);

  const handleSelectSection = (idx) => {
    sounds.playClick();
    directionRef.current = idx >= safeSectionIdx ? 1 : -1;
    setSearchQuery('');
    setActiveSectionIdx(idx);
    const firstProd = secciones[idx]?.productos?.[0];
    setActiveProductId(firstProd?.id || null);
    setInfoTab('overview');
    setSectionMenuOpen(false);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCarouselProduct = (producto, idx) => {
    sounds.playClick();
    if (activeProduct?.id === producto.id) {
      setSelectedProduct(producto);
      return;
    }
    directionRef.current = idx >= activeProductIndex ? 1 : -1;
    setActiveProductId(producto.id);
    setInfoTab('overview');
  };

  const handleStepProduct = (direction) => {
    if (!visibleProducts.length) return;
    sounds.playClick();
    directionRef.current = direction === 'right' ? 1 : -1;
    const nextIdx =
      direction === 'left'
        ? (activeProductIndex - 1 + visibleProducts.length) % visibleProducts.length
        : (activeProductIndex + 1) % visibleProducts.length;
    setActiveProductId(visibleProducts[nextIdx].id);
    setInfoTab('overview');
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -180 : 180, behavior: 'smooth' });
    }
  };

  const handleOpenQueTrae = (producto) => {
    if (!producto) return;
    sounds.playClick();
    setSelectedProduct(producto);
  };

  const handleCloseModal = () => {
    sounds.playClick();
    setSelectedProduct(null);
  };

  const handleOrderProduct = (producto) => {
    if (!producto) return;
    sounds.playSuccess();
    if (onOrderNow) {
      onOrderNow(producto);
    } else if (onNavigate) {
      onNavigate('reservar');
    }
    setSelectedProduct(null);
  };

  const handleToggleLike = (productoId) => {
    sounds.playClick();
    setLikedIds((prev) => ({ ...prev, [productoId]: !prev[productoId] }));
  };

  const [tituloLinea1, tituloLinea2] = activeProduct
    ? splitTituloDosLineas(activeProduct.nombre, nombreSeccion(activeSection))
    : ['CAFÉ', 'MARFIL'];

  const precioCorto = activeProduct
    ? String(activeProduct.precio || '').replace(/\s*MXN/i, '').trim()
    : '$0';

  const pillColor = PILL_ACCENTS[activeProductIndex % PILL_ACCENTS.length];
  const isLiked = activeProduct ? !!likedIds[activeProduct.id] : false;

  return (
    <div
      ref={stageRef}
      className="relative w-full min-h-[calc(100dvh-72px)] bg-gradient-to-br from-[#F1F0EE] via-[#E9E7E5] to-[#E2E0DD] text-[#1F1410] font-body selection:bg-[#E12927] selection:text-white overflow-x-clip flex flex-col justify-between pb-24 md:pb-6"
    >
      {/* ====================================================================
          FONDOS GEOMÉTRICOS SUAVES ESTILO PIN (BANDA ROSA CURVA + ARCO GRIS)
          ==================================================================== */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none select-none absolute inset-0 w-full h-full z-0"
      >
        {/* Arco gris muy suave detrás del platillo principal a la izquierda */}
        <circle cx="160" cy="430" r="360" fill="#DCDAD7" fillOpacity="0.45" />
        {/* Banda curva pastel durazno/rosa cruzando detrás del título */}
        <path
          ref={ribbonRef}
          d="M 430 430 Q 670 300 840 -40 L 1030 -40 Q 820 380 510 500 Z"
          fill="#F4D7D4"
          fillOpacity="0.72"
        />
      </svg>

      {secciones.length === 0 ? (
        <div className="relative z-10 max-w-md mx-auto my-auto px-6 py-12 text-center bg-white/80 backdrop-blur-md rounded-3xl shadow-xs">
          <Utensils size={32} className="mx-auto text-stone-300 mb-3" />
          <h2 className="font-display font-bold text-xl text-[#1F1410]">Menú en preparación</h2>
          <p className="font-body text-sm text-stone-500 mt-1">
            Aún no hay productos publicados en el catálogo. Vuelve pronto.
          </p>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-3 sm:pt-5 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
          {/* ================================================================
              BARRA SUPERIOR: CATEGORÍA ACTIVA + BUSCADOR + MENÚ DE SECCIONES
              ================================================================ */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#5A5D62] min-w-0">
                <span className="font-semibold text-[#1F1410] truncate">
                  {searchQuery.trim() ? `Resultados para "${searchQuery}"` : nombreSeccion(activeSection)}
                </span>
                {!searchQuery.trim() && activeSection?.titulo && activeSection.titulo !== activeSection.nombre && (
                  <span className="hidden md:inline text-[#787A80] truncate">· {activeSection.titulo}</span>
                )}
              </div>

              <div className="relative flex items-center gap-1.5 sm:gap-3 shrink-0">
                {/* Buscador inline en sm+ */}
                {searchOpen && (
                  <div className="hidden sm:flex items-center bg-white/80 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-xs">
                    <Search size={15} className="text-[#5A5D62] mr-2 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar platillo o bebida..."
                      autoFocus
                      className="bg-transparent text-xs sm:text-sm text-[#1F1410] placeholder:text-[#8A8D93] focus:outline-none w-44 md:w-56"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[#787A80] hover:text-[#1F1410] ml-1 cursor-pointer"
                        aria-label="Limpiar búsqueda"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSearchOpen((prev) => !prev);
                    setSectionMenuOpen(false);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    searchOpen ? 'bg-white/80 text-[#E12927]' : 'hover:bg-white/60 text-[#2E3033]'
                  }`}
                  aria-label="Buscar en el menú"
                  title="Buscar"
                >
                  <Search size={19} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSectionMenuOpen((prev) => !prev);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    sectionMenuOpen ? 'bg-white/80 text-[#E12927]' : 'hover:bg-white/60 text-[#2E3033]'
                  }`}
                  aria-label="Cambiar sección del menú"
                  title="Secciones"
                >
                  <MenuIcon size={20} strokeWidth={2} />
                </button>

                {sectionMenuOpen && (
                  <div className="absolute right-0 top-11 sm:top-12 w-56 sm:w-60 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl p-2 z-40">
                    {secciones.map((sec, idx) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleSelectSection(idx)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer ${
                          idx === safeSectionIdx && !searchQuery.trim()
                            ? 'bg-[#FCEAE9] text-[#E12927] font-semibold'
                            : 'text-[#2E3033] hover:bg-black/5'
                        }`}
                      >
                        <span className="truncate">{nombreSeccion(sec)}</span>
                        <span className="text-xs opacity-60">{sec.productos?.length || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Buscador ancho completo en móvil cuando está abierto */}
            {searchOpen && (
              <div className="flex sm:hidden items-center bg-white/85 backdrop-blur-md rounded-full px-3.5 py-2 shadow-xs w-full">
                <Search size={15} className="text-[#5A5D62] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar platillo o bebida..."
                  autoFocus
                  className="bg-transparent text-sm text-[#1F1410] placeholder:text-[#8A8D93] focus:outline-none flex-1 min-w-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#787A80] hover:text-[#1F1410] ml-2 cursor-pointer"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================================================================
              ESCENARIO PRINCIPAL RESPONSIVO:
              - Móvil (<md): columna única compacta y centrada
              - Tablet (md): platillo + título en 2 columnas arriba, tarjeta abajo
              - Desktop (lg+): 3 columnas (platillo | título | tarjeta frosted)
              ================================================================ */}
          {!activeProduct ? (
            <div className="my-auto text-center bg-white/70 backdrop-blur-md rounded-3xl p-8 sm:p-10 max-w-md mx-auto">
              <p className="text-base text-[#2E3033]">No encontramos platillos con esa búsqueda.</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-5 py-2 rounded-full bg-[#1F1410] text-white text-xs cursor-pointer"
              >
                Ver todo el menú
              </button>
            </div>
          ) : (
            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center my-auto py-1 sm:py-2">
              {/* Indicador vertical de secciones en el borde izquierdo (xl+) */}
              <div className="hidden xl:flex flex-col items-center gap-2.5 absolute -left-8 top-1/2 -translate-y-1/2 z-20">
                {secciones.map((sec, idx) => {
                  const isCurrent = idx === safeSectionIdx && !searchQuery.trim();
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => handleSelectSection(idx)}
                      aria-label={nombreSeccion(sec)}
                      title={nombreSeccion(sec)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        isCurrent
                          ? 'w-[3px] h-7 bg-[#2E3033]'
                          : 'w-1.5 h-1.5 bg-[#2E3033]/30 hover:bg-[#2E3033]/70'
                      }`}
                    />
                  );
                })}
              </div>

              {/* 1. IMAGEN PRINCIPAL DEL PLATILLO CON ANIMACIÓN ROTACIONAL EN ARCO */}
              <div className="md:col-span-5 lg:col-span-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleOpenQueTrae(activeProduct)}
                  className="group relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-[310px] lg:h-[310px] xl:w-[360px] xl:h-[360px] flex items-center justify-center cursor-pointer focus:outline-none"
                  title="Toca para ver la ficha completa"
                >
                  <div ref={dishRef} className="w-full h-full flex items-center justify-center will-change-transform">
                    <img
                      src={activeProduct.imagen}
                      alt={activeProduct.nombreCompleto}
                      className="w-full h-full object-contain drop-shadow-[0_22px_28px_rgba(31,20,16,0.24)] group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </button>
              </div>

              {/* 2. TÍTULO DRAMÁTICO EN 2 LÍNEAS + ACCIONES INLINE (CENTRO) */}
              <div className="md:col-span-7 lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left px-1 sm:px-2 min-w-0">
                <div className="overflow-hidden mb-1.5 sm:mb-2">
                  <span ref={kickerRef} className="block text-xs sm:text-sm font-medium text-[#5A5D62]">
                    #{activeProductIndex + 1} {activeProduct.destacado ? 'Favorito de la casa' : nombreSeccion(activeSection)}
                  </span>
                </div>

                <h1 className="uppercase leading-none select-none w-full break-words">
                  <span className="block overflow-hidden">
                    <span
                      ref={titleLine1Ref}
                      className="block text-[clamp(1.65rem,6vw,3rem)] font-light tracking-[0.07em] text-[#2E3033] leading-[1.06]"
                    >
                      {tituloLinea1}
                    </span>
                  </span>
                  <span className="block overflow-hidden mt-0.5 sm:mt-1">
                    <span
                      ref={titleLine2Ref}
                      className="block text-[clamp(1.9rem,7vw,3.35rem)] font-black tracking-tight text-[#1F1410] leading-[1.02]"
                    >
                      {tituloLinea2}
                    </span>
                  </span>
                </h1>

                {/* Acciones limpias debajo del título */}
                <div
                  ref={actionsRef}
                  className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-5 sm:gap-6 text-xs sm:text-sm text-[#2E3033]"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenQueTrae(activeProduct)}
                    className="inline-flex items-center gap-2 hover:text-[#E12927] transition-colors cursor-pointer group"
                  >
                    <Play size={14} className="fill-current transition-transform group-hover:scale-110" />
                    <span className="font-medium">Ver detalles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOrderProduct(activeProduct)}
                    className="inline-flex items-center gap-2 hover:text-[#E12927] transition-colors cursor-pointer group"
                  >
                    <UtensilsCrossed size={15} className="transition-transform group-hover:scale-110" />
                    <span className="font-medium">Reservar mesa</span>
                  </button>
                </div>
              </div>

              {/* 3. TARJETA FROSTED-WHITE A LA DERECHA (RESUMEN / INGREDIENTES) */}
              <div className="md:col-span-12 lg:col-span-4 flex justify-center lg:justify-end">
                <div
                  ref={cardRef}
                  className="w-full max-w-full sm:max-w-[480px] lg:max-w-[330px] rounded-[24px] sm:rounded-[28px] bg-white/75 backdrop-blur-md p-5 sm:p-6 lg:p-7 shadow-[0_14px_40px_rgba(31,20,16,0.06)] flex flex-col justify-between lg:min-h-[290px] will-change-transform"
                >
                  {/* Pestañas superiores */}
                  <div className="flex items-center justify-around pb-3.5 sm:pb-4 text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setInfoTab('overview');
                      }}
                      className={`transition-colors cursor-pointer ${
                        infoTab === 'overview'
                          ? 'text-[#1F1410] font-bold'
                          : 'text-[#8C8F96] hover:text-[#2E3033]'
                      }`}
                    >
                      Resumen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setInfoTab('ingredients');
                      }}
                      className={`transition-colors cursor-pointer ${
                        infoTab === 'ingredients'
                          ? 'text-[#1F1410] font-bold'
                          : 'text-[#8C8F96] hover:text-[#2E3033]'
                      }`}
                    >
                      Ingredientes
                    </button>
                  </div>

                  <div ref={tabBodyRef} className="flex-1 flex flex-col justify-between">
                    {infoTab === 'overview' ? (
                      <>
                        <div>
                          {/* Badge vertical pastel detrás del precio */}
                          <div ref={pillRef} className="relative inline-flex items-center mb-3 sm:mb-4 mt-0.5">
                            <span
                              style={{ backgroundColor: pillColor }}
                              className="w-11 h-12 sm:w-12 sm:h-14 rounded-2xl shrink-0 transition-colors duration-300"
                            />
                            <span className="-ml-8 sm:-ml-9 text-3xl sm:text-4xl font-black tracking-tight text-[#1F1410] leading-none">
                              {precioCorto}
                            </span>
                          </div>

                          <h2 className="text-base sm:text-lg font-bold text-[#1F1410] leading-snug">
                            {activeProduct.nombreCompleto}
                          </h2>
                          <p className="text-xs text-[#787A80] mt-0.5">
                            {activeProduct.tamano} · {activeProduct.calorias}
                          </p>

                          <p className="text-xs sm:text-[13px] text-[#4A4D52] leading-relaxed mt-2.5 sm:mt-3.5 line-clamp-3">
                            {activeProduct.descripcion ||
                              (activeProduct.queTrae && activeProduct.queTrae.length > 0
                                ? activeProduct.queTrae.join(', ')
                                : 'Receta artesanal de Café Marfil preparada al momento con ingredientes selectos.')}
                          </p>
                        </div>

                        {/* Pie de tarjeta (like + botón ver modal) */}
                        <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(activeProduct.id)}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all cursor-pointer ${
                              isLiked
                                ? 'bg-[#FCEAE9] text-[#E12927]'
                                : 'bg-[#1F1410]/[0.05] text-[#2E3033] hover:bg-[#1F1410]/10'
                            }`}
                          >
                            <ThumbsUp size={13} className={isLiked ? 'fill-current' : ''} />
                            <span>{isLiked ? 'Te encanta' : 'Me gusta'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQueTrae(activeProduct)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1F1410]/[0.05] hover:bg-[#E12927] text-[#2E3033] hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            <Info size={13} />
                            <span>Detalles</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-[#787A80] mb-2">Qué incluye esta receta:</p>
                          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[13px] text-[#2E3033] max-h-36 sm:max-h-40 overflow-y-auto pr-1">
                            {(activeProduct.queTrae || []).map((ing, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span
                                  style={{ backgroundColor: pillColor }}
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                />
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>

                          {activeProduct.alergenos?.length > 0 && (
                            <p className="text-[11px] text-[#787A80] mt-2.5">
                              Alérgenos: {activeProduct.alergenos.join(', ')}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenQueTrae(activeProduct)}
                          className="mt-4 w-full py-2.5 rounded-full bg-[#1F1410]/[0.06] hover:bg-[#E12927] text-[#1F1410] hover:text-white text-xs transition-colors cursor-pointer"
                        >
                          Abrir ficha completa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              CARRUSEL HORIZONTAL INFERIOR (< ITEM ITEM ITEM >)
              ================================================================ */}
          {visibleProducts.length > 0 && (
            <div className="mt-1 sm:mt-2 flex items-center justify-center gap-1 sm:gap-4 max-w-4xl mx-auto w-full">
              <button
                type="button"
                onClick={() => handleStepProduct('left')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/60 text-[#2E3033] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                aria-label="Platillo anterior"
              >
                <ChevronLeft size={20} strokeWidth={2.2} />
              </button>

              <div
                ref={carouselRef}
                className="flex-1 flex items-stretch gap-2.5 sm:gap-5 overflow-x-auto py-2 px-1 sm:px-2 scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {visibleProducts.map((producto, idx) => {
                  const isActive = activeProduct?.id === producto.id;
                  return (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleSelectCarouselProduct(producto, idx)}
                      className={`snap-start shrink-0 w-24 sm:w-28 md:w-32 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-[20px] sm:rounded-[22px] flex flex-col items-center justify-start gap-1.5 sm:gap-2 transition-all duration-300 cursor-pointer text-center ${
                        isActive
                          ? 'bg-white/75 backdrop-blur-sm shadow-[0_10px_28px_rgba(31,20,16,0.07)] scale-[1.03]'
                          : 'bg-transparent hover:bg-white/40'
                      }`}
                    >
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 flex items-center justify-center">
                        <img
                          src={producto.imagen}
                          alt={producto.nombreCompleto}
                          className="w-full h-full object-contain drop-shadow-[0_10px_14px_rgba(31,20,16,0.2)]"
                        />
                      </div>
                      <span
                        className={`text-[11px] sm:text-xs leading-tight line-clamp-2 ${
                          isActive ? 'text-[#1F1410] font-bold' : 'text-[#4A4D52]'
                        }`}
                      >
                        {producto.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => handleStepProduct('right')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/60 text-[#2E3033] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                aria-label="Platillo siguiente"
              >
                <ChevronRight size={20} strokeWidth={2.2} />
              </button>
            </div>
          )}

          {/* ================================================================
              BARRA INFERIOR DE CATEGORÍAS (SCROLLABLE EN MÓVIL) + BOTÓN MODAL
              ================================================================ */}
          <div className="mt-1 sm:mt-2 flex items-center justify-between sm:justify-center gap-2 sm:gap-4 w-full">
            <div
              className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto py-1 px-0.5 flex-1 sm:flex-initial justify-start sm:justify-center"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {secciones.map((sec, idx) => {
                const Icono = iconoParaSeccion(sec);
                const isCurrent = idx === safeSectionIdx && !searchQuery.trim();
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectSection(idx)}
                    title={nombreSeccion(sec)}
                    className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1F1410]/[0.09] text-[#1F1410] font-semibold'
                        : 'text-[#5A5D62] hover:bg-white/50 hover:text-[#1F1410]'
                    }`}
                  >
                    <Icono size={17} strokeWidth={1.8} />
                    <span className="text-xs whitespace-nowrap">{nombreSeccion(sec)}</span>
                  </button>
                );
              })}
            </div>

            {activeProduct && (
              <button
                type="button"
                onClick={() => handleOpenQueTrae(activeProduct)}
                title="Abrir detalle del platillo"
                aria-label="Abrir detalle del platillo"
                className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#1F1410] hover:text-[#E12927] shadow-[0_10px_25px_rgba(31,20,16,0.12)] hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              >
                <Info size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          3. DETALLE DEL PRODUCTO: SIDEBAR LATERAL (DESKTOP) & BOTTOM SHEET (MÓVIL)
          ==================================================================== */}
      {selectedProduct && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end lg:items-stretch lg:justify-end bg-[#1F1410]/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200 will-change-opacity"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          {/* =========================================================
              A) VISTA DESKTOP (lg+): IMAGEN DETRÁS Y BARRA LATERAL DELANTE
              ========================================================= */}
          {/* 1. IMAGEN GIGANTE FUERA DEL ASIDE - ESTRICTAMENTE DETRÁS (Z-10) OPTIMIZADA CON GPU */}
          <div className="hidden lg:flex absolute right-[380px] top-1/2 -translate-y-1/2 w-[500px] xl:w-[560px] h-[580px] xl:h-[700px] pointer-events-none z-10 items-center justify-center animate-in fade-in duration-200 will-change-transform">
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
            className="hidden lg:flex relative w-[480px] xl:w-[520px] max-w-[92vw] h-full flex-col justify-between animate-in slide-in-from-right duration-250 z-30 select-none shadow-2xl will-change-transform"
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
              B) VISTA MÓVIL & TABLET (< lg): BOTTOM SHEET COMPACTO SIN RECORTAR IMAGEN
              ========================================================= */}
          <div
            style={{ backgroundColor: selectedProduct.colorCard || '#D9D9D9' }}
            className="lg:hidden relative w-full max-w-2xl mx-auto max-h-[68vh] sm:max-h-[72vh] rounded-t-[32px] pt-20 sm:pt-24 pb-6 px-5 sm:px-7 flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom duration-250 border-t border-white/40 select-none overflow-visible will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra indicadora de deslizamiento para móvil */}
            <div className="w-12 h-1 bg-[#1F1410]/30 rounded-full mx-auto absolute top-3 left-1/2 -translate-x-1/2" />

            {/* Botón cerrar */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 text-[#1F1410] hover:text-[#E12927] flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-transform"
              aria-label="Cerrar modal"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>

            {/* Imagen flotante con altura controlada para que nunca se recorte arriba */}
            <div className="absolute -top-24 sm:-top-28 left-1/2 -translate-x-1/2 w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center pointer-events-none z-20 will-change-transform">
              <img
                src={selectedProduct.imagen}
                alt={selectedProduct.nombreCompleto}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>

            {/* CUERPO COMPACTO Y SCROLLEABLE */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 pt-2 flex flex-col justify-start scrollbar-none text-left">
              {/* 1. TÍTULO Y NOMBRES */}
              <div>
                <span className="font-mono text-[11px] sm:text-xs font-black text-[#E12927] uppercase tracking-wider block mb-0.5">
                  {selectedProduct.categoria}
                </span>
                <h3
                  className="font-normal text-2xl sm:text-3xl text-[#1F1410] tracking-tight leading-[1.1]"
                  style={{ fontFamily: 'var(--font-menu-title)' }}
                >
                  {selectedProduct.nombre}
                </h3>
                <p className="font-body text-sm sm:text-base text-[#1F1410]/80 font-bold mt-1 leading-snug">
                  {selectedProduct.nombreCompleto}
                </p>

                {/* 2. DESCRIPCIÓN */}
                <p className="font-body text-xs sm:text-sm text-[#1F1410] leading-relaxed mt-2.5 opacity-100 text-justify font-medium">
                  {selectedProduct.descripcion ||
                    (selectedProduct.queTrae && selectedProduct.queTrae.length > 0
                      ? selectedProduct.queTrae.join(' ')
                      : 'Receta artesanal exclusiva de Café Marfil Durango elaborada con insumos de alta calidad, preparado al momento para garantizar frescura y textura insuperable.')}
                </p>
              </div>

              {/* 3. SECCIÓN: TAMAÑO O PRESENTACIÓN */}
              <div className="mt-4">
                <span className="font-body font-black text-sm sm:text-base text-[#1F1410] block mb-2">
                  {selectedProduct.id?.startsWith('frappe') || selectedProduct.categoria?.toLowerCase().includes('bebida')
                    ? 'Tamaño'
                    : 'Presentación'}
                </span>
                <div className="flex items-center gap-2">
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
                        className={`flex-1 py-2 px-2.5 rounded-full text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer border-2 text-center ${isSelected
                          ? 'bg-[#E12927] text-white border-[#E12927] shadow-md'
                          : 'bg-white/40 text-[#1F1410] border-[#1F1410]/20 hover:bg-[#FCEAE9]'
                          }`}
                      >
                        <span className={`block leading-tight font-body font-bold ${isSelected ? 'text-white' : 'text-[#1F1410]'}`}>{sizeItem.label}</span>
                        <span className={`block text-[10px] sm:text-xs font-mono mt-0.5 ${isSelected ? 'text-white/90' : 'text-[#1F1410]/70 font-bold'}`}>
                          {sizeItem.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. PRECIO & METADATOS INFERIORES */}
            <div className="w-full flex items-baseline justify-between pt-3 mt-3 border-t-2 border-[#1F1410]/15 shrink-0">
              <div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#1F1410]/70 uppercase tracking-wider block">
                  Precio en sucursal
                </span>
                <span
                  className="font-bold text-2xl sm:text-3xl text-[#1F1410] tracking-tight leading-none font-mono"
                >
                  {selectedProduct.precio}
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs sm:text-sm font-black text-[#E12927] uppercase tracking-wider block">
                  {selectedProduct.calorias}
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-[#1F1410]/70 font-bold">
                  En sala y para llevar
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
