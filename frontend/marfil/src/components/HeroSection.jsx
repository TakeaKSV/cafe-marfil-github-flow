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
export const BEBIDAS_HERO = [
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

export default function HeroSection({ onOrderNow, onNavigateBack, fullBleed = true }) {
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
            className="relative w-full min-h-[620px] sm:min-h-[680px] md:min-h-[740px] lg:min-h-screen pt-28 sm:pt-36 md:pt-40 lg:pt-44 flex flex-col justify-between overflow-hidden select-none font-body transition-all duration-700 ease-in-out"
            style={{
                background: activeDrink.gradienteFondo
            }}
            aria-label="Coffee & Co. Hero Showcase"
        >
            {/* ====================================================================
            2. CAPA DE LOGO HERO / GRANOS FLOTANTES - ELEVADA
            ==================================================================== */}
            <div className="absolute inset-0 pointer-events-none z-15 flex items-start justify-center overflow-hidden pt-4 sm:pt-6">
                <img
                    src="/images/hero/logo-hero.png"
                    alt="Café Marfil"
                    className="w-full h-full object-contain scale-90 sm:scale-95 -translate-y-16 sm:-translate-y-28 md:-translate-y-36 opacity-95 drop-shadow-[0_14px_16px_rgba(0,0,0,0.5)] pointer-events-none"
                />
            </div>

            {/* ====================================================================
            3. SECCIÓN CENTRAL: CARRUSEL DE VASOS EN COMPOSICIÓN ^ (BAJADOS Y MÁS JUNTOS, SALIENDO 75%)
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
            4. CONTENEDOR INFERIOR CURVO (CREMA / OFF-WHITE) A PANTALLA COMPLETA
            ==================================================================== */}
            <div className="relative z-30 w-full bg-[#FAF6F0] rounded-t-[34px] sm:rounded-t-[44px] px-6 sm:px-12 py-6 sm:py-7 text-[#1F1410] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] border-t border-white/60">

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
        @keyframes cloudPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(24px) rotate(-8deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.08) translateY(-6px) rotate(2deg);
          }
          85% {
            transform: scale(0.96) translateY(2px) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotate(0deg);
          }
        }
        .animate-slide-next {
          animation: slideInFromRight 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-slide-prev {
          animation: slideInFromLeft 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-cloud-pop {
          animation: cloudPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
        </section>
    );
}
