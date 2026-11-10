import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Sparkles,
    Award,
    ArrowRight,
    Coffee,
    Check,
    Star,
    Flame,
    ArrowLeft
} from 'lucide-react';
import { sounds } from '../utils/audio';

/**
 * Catálogo de bebidas para el Hero interactivo "Coffee & Co." de Café Marfil Durango.
 * Utiliza los assets ubicados en /images/hero/ (/public/images/hero).
 */
const BEBIDAS_HERO = [
    {
        id: 'frappe-marfil-fresa',
        nombre: 'Frappé Fresa Dubái',
        subtitulo: 'EDICIÓN ESPECIAL ALL-DAY BRUNCH',
        categoria: 'COFFEE & CO.',
        badge: 'TOP SELLER',
        descripcion:
            'EXPLORE A REALM OF RICH AROMAS WITH OUR EXCLUSIVE COFFEE SELECTION. AT CAFÉ MARFIL, WE HARNESS THE ESSENCE OF NATURE’S BEST BEANS TO DELIVER YOU A TRULY EXCEPTIONAL EXPERIENCE.',
        precio: '$9.00',
        precioMXN: '$145 MXN',
        colorFondo: '#C85A48',
        gradienteFondo: 'linear-gradient(135deg, #DE7A68 0%, #C35645 50%, #B04737 100%)',
        colorAcento: '#FCEAE9',
        imagen: '/images/hero/vaso-principal.png',
        notas: 'Pistache & Kataifi Dubái',
        calorias: '380 kcal',
        tamano: '16 oz'
    },
    {
        id: 'frappe-kinder-bueno',
        nombre: 'Frappé Moka Avellana',
        subtitulo: 'SELECCIÓN CONFITERÍA & ARÁBICA',
        categoria: 'COFFEE & CO.',
        badge: 'ARÁBICA 100%',
        descripcion:
            'EXPLORE A REALM OF RICH AROMAS WITH OUR EXCLUSIVE COFFEE SELECTION. AT CAFÉ MARFIL, WE HARNESS THE ESSENCE OF NATURE’S BEST BEANS TO DELIVER YOU A TRULY EXCEPTIONAL EXPERIENCE.',
        precio: '$8.50',
        precioMXN: '$135 MXN',
        colorFondo: '#8C5238',
        gradienteFondo: 'linear-gradient(135deg, #A26245 0%, #874C32 50%, #6E3B24 100%)',
        colorAcento: '#F6E4D6',
        imagen: '/images/hero/vaso-cafe.png',
        notas: 'Avellana & Caramelo Tostado',
        calorias: '410 kcal',
        tamano: '16 oz'
    },
    {
        id: 'frappe-barbie-taro',
        nombre: 'Frappé Velvet Lavanda',
        subtitulo: 'COCTELERÍA LÚDICA DE SALA',
        categoria: 'COFFEE & CO.',
        badge: 'NUEVO',
        descripcion:
            'EXPLORE A REALM OF RICH AROMAS WITH OUR EXCLUSIVE COFFEE SELECTION. AT CAFÉ MARFIL, WE HARNESS THE ESSENCE OF NATURE’S BEST BEANS TO DELIVER YOU A TRULY EXCEPTIONAL EXPERIENCE.',
        precio: '$8.75',
        precioMXN: '$140 MXN',
        colorFondo: '#734C7D',
        gradienteFondo: 'linear-gradient(135deg, #8E5F9A 0%, #6E4578 50%, #54315D 100%)',
        colorAcento: '#EEDDF6',
        imagen: '/images/hero/vaso-morado.png',
        notas: 'Frutos del Bosque & Menta',
        calorias: '340 kcal',
        tamano: '16 oz'
    }
];

export default function HeroSectionPrototype({ onOrderNow, onNavigateBack }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState('next'); // 'next' | 'prev'
    const [isAnimating, setIsAnimating] = useState(false);
    const [orderedSuccess, setOrderedSuccess] = useState(false);
    const containerRef = useRef(null);

    const activeDrink = BEBIDAS_HERO[activeIndex];
    const prevIndex = (activeIndex - 1 + BEBIDAS_HERO.length) % BEBIDAS_HERO.length;
    const nextIndex = (activeIndex + 1) % BEBIDAS_HERO.length;

    const handlePrev = () => {
        if (isAnimating) return;
        sounds.playClick();
        setDirection('prev');
        setIsAnimating(true);
        setActiveIndex(prevIndex);
    };

    const handleNext = () => {
        if (isAnimating) return;
        sounds.playClick();
        setDirection('next');
        setIsAnimating(true);
        setActiveIndex(nextIndex);
    };

    const handleSelectDrink = (index) => {
        if (isAnimating || index === activeIndex) return;
        sounds.playClick();
        setDirection(index > activeIndex ? 'next' : 'prev');
        setIsAnimating(true);
        setActiveIndex(index);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 600);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    // Transición automática cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setDirection('next');
            setIsAnimating(true);
            setActiveIndex((prev) => (prev + 1) % BEBIDAS_HERO.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Soporte para flechas del teclado (izquierda/derecha)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, isAnimating]);

    // Soporte para gestos táctiles (Swipe en móvil)
    const touchStartX = useRef(null);
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (diff > 50) handlePrev();
        else if (diff < -50) handleNext();
        touchStartX.current = null;
    };

    const handleActionOrder = () => {
        sounds.playClick();
        setOrderedSuccess(true);
        setTimeout(() => setOrderedSuccess(false), 2400);
        if (onOrderNow) onOrderNow(activeDrink);
    };

    return (
        <section
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden select-none font-body transition-all duration-700 ease-in-out"
            style={{
                background: activeDrink.gradienteFondo
            }}
            aria-label="Coffee & Co. Hero Showcase"
        >
            {/* Botón flotante para regresar al Inicio si viene de la app */}
            {onNavigateBack && (
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2 text-white/80 text-xs font-mono">
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer bg-black/25 hover:bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-md"
                    >
                        <ArrowLeft size={14} />
                        <span>Volver a la App</span>
                    </button>
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-[11px]">
                        Ruta: /hero · Prototipo Coffee & Co.
                    </span>
                </div>
            )}

            {/* ====================================================================
            2. CAPA DE GRANOS FLOTANTES REALES / LOGO HERO - ELEVADA
            ==================================================================== */}
            <div className="absolute inset-0 pointer-events-none z-15 flex items-start justify-center overflow-hidden pt-4 sm:pt-6">
                <img
                    src="/images/hero/logo-hero.png"
                    alt="Café Marfil"
                    className="w-full h-full object-contain scale-90 sm:scale-95 -translate-y-16 sm:-translate-y-28 md:-translate-y-36 opacity-95 drop-shadow-[0_14px_16px_rgba(0,0,0,0.5)] pointer-events-none"
                />
            </div>

            {/* ====================================================================
            5. SECCIÓN CENTRAL: CARRUSEL DE VASOS EN COMPOSICIÓN ^ (BAJADOS Y MÁS JUNTOS, SALIENDO 75%)
            ==================================================================== */}
            <div className="relative z-20 w-full flex-1 flex items-end justify-center px-4 sm:px-8 pb-0 pt-16 sm:pt-20 overflow-visible -mb-16 sm:-mb-24 md:-mb-28">
                <div className="relative w-full max-w-4xl flex items-end justify-center">
                    {/* VASO IZQUIERDO (Bebida previa - Más juntos y solapados) */}
                    <div
                        onClick={handlePrev}
                        className="relative z-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:scale-105 active:scale-95 opacity-95 hover:opacity-100 -mr-24 sm:-mr-36 md:-mr-44 translate-y-6 sm:translate-y-10"
                        style={{
                            transform: isAnimating && direction === 'next'
                                ? 'translate(-40px, 35px) scale(0.72)'
                                : isAnimating && direction === 'prev'
                                    ? 'translate(25px, 15px) scale(0.92)'
                                    : 'translateY(20px) scale(0.85)'
                        }}
                        title={`Sabor anterior: ${BEBIDAS_HERO[prevIndex].nombre}`}
                    >
                        <div className="relative w-44 sm:w-56 md:w-64 h-56 sm:h-72 md:h-80 flex items-center justify-center">
                            <img
                                src={BEBIDAS_HERO[prevIndex].imagen}
                                alt={BEBIDAS_HERO[prevIndex].nombre}
                                className="w-full h-full object-contain filter drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)] transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* VASO ACTIVO CENTRAL (HÉROE DESTACADO - VÉRTICE SUPERIOR DEL CHEVRON ^) */}
                    <div className="relative z-25 flex flex-col items-center justify-center">
                        <div
                            className="relative w-72 sm:w-88 md:w-[420px] lg:w-[460px] aspect-3/4 max-h-[420px] sm:max-h-[480px] flex items-center justify-center transition-all duration-500 ease-out cursor-pointer"
                            onClick={handleNext}
                        >
                            {/* Sombra realista proyectada abajo */}
                            <div className="absolute bottom-1 w-60 sm:w-72 h-9 bg-black/50 rounded-full blur-xl pointer-events-none" />

                            {/* Vaso Central animado con animación de deslizamiento suave */}
                            <div
                                key={activeDrink.id}
                                className={`relative z-20 w-full h-full flex items-center justify-center ${direction === 'next' ? 'animate-slide-next' : 'animate-slide-prev'
                                    }`}
                            >
                                <img
                                    src={activeDrink.imagen}
                                    alt={activeDrink.nombre}
                                    className="w-full h-full object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-300 scale-105"
                                    style={{
                                        animation: 'floatCup 4.5s ease-in-out infinite alternate'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* VASO DERECHO (Bebida siguiente - Más juntos y solapados) */}
                    <div
                        onClick={handleNext}
                        className="relative z-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:scale-105 active:scale-95 opacity-95 hover:opacity-100 -ml-24 sm:-ml-36 md:-ml-44 translate-y-6 sm:translate-y-10"
                        style={{
                            transform: isAnimating && direction === 'next'
                                ? 'translate(-25px, 15px) scale(0.92)'
                                : isAnimating && direction === 'prev'
                                    ? 'translate(40px, 35px) scale(0.72)'
                                    : 'translateY(20px) scale(0.85)'
                        }}
                        title={`Siguiente sabor: ${BEBIDAS_HERO[nextIndex].nombre}`}
                    >
                        <div className="relative w-44 sm:w-56 md:w-64 h-56 sm:h-72 md:h-80 flex items-center justify-center">
                            <img
                                src={BEBIDAS_HERO[nextIndex].imagen}
                                alt={BEBIDAS_HERO[nextIndex].nombre}
                                className="w-full h-full object-contain filter drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)] transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================================
            6. CONTENEDOR INFERIOR CURVO (CREMA / OFF-WHITE) A PANTALLA COMPLETA
            ==================================================================== */}
            <div className="relative z-30 w-full bg-[#FAF6F0] rounded-t-[34px] sm:rounded-t-[44px] px-6 sm:px-12 py-6 sm:py-7 text-[#1F1410] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] border-t border-white/60">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
                    {/* IZQUIERDA: Párrafo en Mayúsculas con la descripción */}
                    <div className="w-full lg:w-[32%] text-left">
                        <p className="font-mono text-[10px] sm:text-[11px] text-[#2C2420] font-bold leading-relaxed tracking-wider uppercase m-0">
                            {activeDrink.descripcion}
                        </p>
                    </div>

                    {/* CENTRO: Controles en Píldora [Prev] [ORDER NOW] [Next] */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {/* Botón Prev (Verde bosque / oscuro) */}
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#18392B] hover:bg-[#122B20] text-white font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow"
                        >
                            Prev
                        </button>

                        {/* Botón ORDER NOW central (Blanco con borde o verde acento) */}
                        <button
                            type="button"
                            onClick={handleActionOrder}
                            className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer border shadow-sm ${orderedSuccess
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white hover:bg-[#FCEAE9] text-[#1F1410] border-stone-300 hover:border-[#E12927]'
                                }`}
                        >
                            {orderedSuccess ? 'ADDED!' : 'ORDER NOW'}
                        </button>

                        {/* Botón Next (Verde bosque / oscuro) */}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#18392B] hover:bg-[#122B20] text-white font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow"
                        >
                            Next
                        </button>
                    </div>

                    {/* DERECHA: Métricas con cajas separadas idénticas a la imagen */}
                    <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3 bg-white/70 p-1.5 sm:p-2 rounded-2xl border border-stone-200/80">
                        {/* Métrica 1 */}
                        <div className="px-3 sm:px-4 py-1.5 rounded-xl border border-stone-200 bg-white text-left">
                            <span className="block font-mono text-sm sm:text-base font-black text-[#1F1410] leading-none">
                                10+
                            </span>
                            <span className="block font-body text-[9px] sm:text-[10px] text-stone-500 font-medium whitespace-nowrap mt-0.5">
                                Unique Coffee
                            </span>
                        </div>

                        {/* Métrica 2 */}
                        <div className="px-3 sm:px-4 py-1.5 rounded-xl border border-stone-200 bg-white text-left">
                            <span className="block font-mono text-sm sm:text-base font-black text-[#1F1410] leading-none">
                                20K+
                            </span>
                            <span className="block font-body text-[9px] sm:text-[10px] text-stone-500 font-medium whitespace-nowrap mt-0.5">
                                Customer satisfied
                            </span>
                        </div>

                        {/* Métrica 3 */}
                        <div className="px-3 sm:px-4 py-1.5 rounded-xl border border-stone-200 bg-white text-left">
                            <span className="block font-mono text-sm sm:text-base font-black text-[#E12927] leading-none">
                                100%
                            </span>
                            <span className="block font-body text-[9px] sm:text-[10px] text-stone-500 font-medium whitespace-nowrap mt-0.5">
                                Premium Arabica Beans
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ESTILOS DE ANIMACIÓN EN LÍNEA PARA EL HERO */}
            <style>{`
        @keyframes floatCup {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(0.8deg);
          }
          100% {
            transform: translateY(2px) rotate(-0.5deg);
          }
        }
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(110px) scale(0.82) rotate(6deg);
          }
          60% {
            transform: translateX(-10px) scale(1.02) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0px) scale(1) rotate(0deg);
          }
        }
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-110px) scale(0.82) rotate(-6deg);
          }
          60% {
            transform: translateX(10px) scale(1.02) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0px) scale(1) rotate(0deg);
          }
        }
        .animate-slide-next {
          animation: slideInFromRight 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-slide-prev {
          animation: slideInFromLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
        </section>
    );
}
