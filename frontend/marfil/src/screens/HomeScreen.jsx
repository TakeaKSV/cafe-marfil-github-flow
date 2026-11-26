import React from 'react';
import {
  CalendarDays,
  Compass,
  Tag,
  Gift,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  Award,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Flame,
  Star,
  ExternalLink,
  ShieldCheck,
  Zap,
  Phone
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import { aProductoDeMenu } from '../api/adaptadores';
import { sounds } from '../utils/audio';

/**
 * Pantalla Principal (HomeScreen / Landing Page) de Café Marfil Durango.
 * Conecta visualmente con todas las secciones de la plataforma usando datos reales de la API.
 */
export default function HomeScreen({
  onOrderNow,
  onNavigate,
  onSelectProduct,
  onSelectActivity,
  onSelectPromo,
  productos = [],
  actividades = [],
  promociones = [],
  sucursales = []
}) {
  const [activeSucursalId, setActiveSucursalId] = React.useState(sucursales[0]?.id || '');
  const activeSucursal = sucursales.find((s) => s.id === activeSucursalId) || sucursales[0] || null;

  // Destacados desde la API (si hay marcados como destacado se priorizan; si no, los primeros 6 disponibles)
  const tendencias = React.useMemo(() => {
    const disponibles = productos.filter((p) => p.disponibleEnCocina !== false);
    const destacados = disponibles.filter((p) => p.destacado);
    const origen = destacados.length >= 2 ? destacados : disponibles;
    return origen.slice(0, 6).map((p) => {
      const adaptado = aProductoDeMenu(p);
      return {
        ...adaptado,
        subtitulo: (p.etiqueta || p.categoria || 'ESPECIALIDAD MARFIL').toUpperCase(),
        codigo: `${p.badge || 'MARFIL'} · ${p.porcion || 'INDIVIDUAL'}`.toUpperCase()
      };
    });
  }, [productos]);

  const colIzquierda = tendencias.filter((_, idx) => idx % 2 === 0);
  const colDerecha = tendencias.filter((_, idx) => idx % 2 === 1);

  const handleHeroOrder = (drink) => {
    sounds.playClick();
    if (onOrderNow) {
      onOrderNow(drink);
    } else if (onNavigate) {
      onNavigate('reservar');
    }
  };

  const handleItemClick = (item) => {
    sounds.playClick();
    if (onSelectProduct) {
      onSelectProduct(item);
    } else if (onNavigate) {
      onNavigate('menu');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoTo = (screenId) => {
    sounds.playClick();
    if (onNavigate) {
      onNavigate(screenId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleActivityClick = (act) => {
    sounds.playClick();
    if (onSelectActivity) {
      onSelectActivity(act);
    } else if (onNavigate) {
      onNavigate('actividades');
    }
  };

  const handlePromoClick = (promo) => {
    sounds.playClick();
    if (onSelectPromo) {
      onSelectPromo(promo);
    } else if (onNavigate) {
      onNavigate('promociones');
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#FAF8F5] text-[#1F1410] font-body">
      {/* ====================================================================
          1. HERO PRINCIPAL INTERACTIVO "COFFEE & CO."
          ==================================================================== */}
      <HeroSection productos={productos} onOrderNow={handleHeroOrder} />


      {/* ====================================================================
          3. ADN GASTRONÓMICO: PLATILLOS & POSTRES ESTRELLA (CATÁLOGO EDITORIAL)
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="w-full rounded-[36px] s p-6 sm:p-10 lg:p-14  overflow-hidden">
          {/* Sutil resplandor o gradiente editorial de fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full blur-3xl pointer-events-none" />

          {tendencias.length === 0 ? (
            <div className="py-12 text-center relative z-10">
              <h2 className="font-display text-3xl sm:text-5xl font-black text-[#1F1410] tracking-tight uppercase leading-none">
                TENDENCIAS
              </h2>
              <p className="font-body text-sm text-stone-500 mt-4">
                Aún no hay productos destacados publicados en el menú.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 relative z-10">
              {/* COLUMNA IZQUIERDA */}
              <div className="flex flex-col gap-8 sm:gap-12">
                <div>
                  <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#1F1410] tracking-tight uppercase leading-none">
                    TENDENCIAS
                  </h2>
                  <div className="w-36 sm:w-56 h-[2px] bg-[#1F1410]/70 my-3" />
                  <p className="font-mono text-[11px] sm:text-xs font-bold text-[#1F1410]/80 uppercase tracking-wider leading-relaxed max-w-xs">
                    SABORES DE AUTOR & INDULGENCIA CON INGREDIENTES SELECTOS
                  </p>
                </div>

                {colIzquierda.map((item, idx) => {
                  const invertido = idx % 2 === 1;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex items-center ${invertido ? 'justify-between flex-row-reverse' : ''} gap-4 sm:gap-6 group cursor-pointer p-2.5 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] select-none`}
                    >
                      <div className="relative w-28 sm:w-36 h-36 sm:h-44 shrink-0 flex items-center justify-center">
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(31,20,16,0.22)] group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex flex-col text-left">
                        <h3 className="font-display font-black text-base sm:text-lg text-[#1F1410] tracking-tight uppercase leading-tight group-hover:text-[#E12927] transition-colors">
                          {item.nombre}
                        </h3>
                        <span className="font-mono text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider leading-snug mt-0.5">
                          {item.subtitulo}
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-stone-500 tracking-wider mt-0.5">
                          {item.codigo}
                        </span>
                        <span className="font-mono font-black text-base sm:text-xl text-[#1F1410] mt-1.5 tracking-tight group-hover:text-[#E12927] transition-colors">
                          {item.precio}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* COLUMNA DERECHA */}
              <div className="flex flex-col gap-8 sm:gap-12 pt-2 md:pt-4">
                {colDerecha.map((item, idx) => {
                  const invertido = idx > 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex items-center ${invertido ? 'justify-between flex-row-reverse' : ''} gap-4 sm:gap-6 group cursor-pointer p-2.5 rounded-2xl hover:bg-white/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] select-none`}
                    >
                      <div className="relative w-32 sm:w-40 h-44 sm:h-52 shrink-0 flex items-center justify-center">
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-contain filter drop-shadow-[0_14px_22px_rgba(31,20,16,0.22)] group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex flex-col text-left">
                        <h3 className="font-display font-black text-base sm:text-lg text-[#1F1410] tracking-tight uppercase leading-tight group-hover:text-[#E12927] transition-colors">
                          {item.nombre}
                        </h3>
                        <span className="font-mono text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider leading-snug mt-0.5">
                          {item.subtitulo}
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-stone-500 tracking-wider mt-0.5">
                          {item.codigo}
                        </span>
                        <span className="font-mono font-black text-base sm:text-xl text-[#1F1410] mt-1.5 tracking-tight group-hover:text-[#E12927] transition-colors">
                          {item.precio}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pie de catálogo con acción para ver menú */}
          <div className="mt-10 sm:mt-12 pt-6 border-t border-[#1F1410]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-mono text-xs text-stone-600 font-semibold uppercase tracking-wider">
              Disponibles todos los días en cualquiera de nuestras sucursales
            </span>
            <button
              onClick={() => handleGoTo('menu')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-[#1F1410] hover:bg-[#E12927] text-white transition-all cursor-pointer shadow-md active:scale-95"
            >
              <span>Ver Menú Completo</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. ACTIVIDADES, LUDOTECA & EVENTOS (EXPERIENCIAS CAFÉ MARFIL - LAYOUT EN Z)
          ==================================================================== */}
      <section className="w-full bg-[#FAF7F5] py-16 sm:py-20 lg:py-24 relative overflow-hidden border-y border-stone-200/70">
        {/* Atmósfera suave con halos decorativos en Rosa Marfil */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#FCEAE9] rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#FCEAE9]/60 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* ============================================================
                COLUMNA IZQUIERDA: 3 BANDAS EN DISPOSICIÓN Z (ZIG-ZAG ESCALONADO)
                ============================================================ */}
            <div className="lg:col-span-6 relative w-full max-w-lg mx-auto lg:max-w-none">
              {/* Decoración: Matriz de puntos sutil en Rojo Marfil */}
              <div className="absolute -left-3 sm:-left-6 top-6 w-8 h-28 grid grid-cols-2 gap-2 opacity-30 pointer-events-none z-0">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#E12927]" />
                ))}
              </div>

              {/* Decoración: Cuadro en tono suave moka */}
              <div className="absolute -top-3 right-16 w-8 h-8 bg-[#C6A686]/25 rounded-md pointer-events-none z-0" />

              {/* Contenedor de las 3 Tiras en Z (Zig-Zag con desfases escalonados) */}
              <div className="flex flex-col gap-3.5 sm:gap-4 relative z-10">
                {/* TIRA 1 (Superior del patrón Z): Alineada a la izquierda */}
                <div
                  onClick={() => handleGoTo('actividades')}
                  className="w-[92%] sm:w-[90%] mr-auto h-24 sm:h-28 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-stone-300/40 border border-stone-200/80 group cursor-pointer relative bg-stone-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                >
                  <img
                    src="/images/live_music.jpg"
                    alt="Música en Vivo en Café Marfil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 contrast-105"
                    style={{ objectPosition: 'center 35%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20 shadow-sm">
                      01 · Música en Vivo
                    </span>
                    <span className="hidden sm:inline-block font-mono text-[9px] font-bold text-white bg-[#E12927] px-2 py-0.5 rounded uppercase">
                      Viernes & Sábados
                    </span>
                  </div>
                </div>

                {/* TIRA 2 (Vértice central del patrón Z): Desplazada hacia la DERECHA */}
                <div
                  onClick={() => handleGoTo('actividades')}
                  className="w-[92%] sm:w-[90%] ml-auto h-24 sm:h-28 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl shadow-stone-400/30 border-2 border-[#E12927]/25 group cursor-pointer relative bg-stone-100 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] z-20"
                >
                  <img
                    src="/images/board_games.jpg"
                    alt="Ludoteca y Juegos de Mesa Café Marfil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 contrast-105"
                    style={{ objectPosition: 'center 45%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20 shadow-sm">
                      02 · Noche de Juegos
                    </span>
                    <span className="font-mono text-[9px] font-bold text-white bg-[#1F1410] px-2 py-0.5 rounded uppercase">
                      Acceso Libre
                    </span>
                  </div>
                </div>

                {/* TIRA 3 (Base del patrón Z): Vuelve hacia la IZQUIERDA */}
                <div
                  onClick={() => handleGoTo('actividades')}
                  className="w-[92%] sm:w-[90%] mr-auto h-24 sm:h-28 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-stone-300/40 border border-stone-200/80 group cursor-pointer relative bg-stone-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
                >
                  <img
                    src="/images/specialty_coffee.jpg"
                    alt="Barra de Especialidad y Catas Café Marfil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 contrast-105"
                    style={{ objectPosition: 'center 55%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20 shadow-sm">
                      03 · Barra de Especialidad & Catas
                    </span>
                    <span className="hidden sm:inline-block font-mono text-[9px] font-bold text-white bg-[#C6A686] px-2 py-0.5 rounded uppercase">
                      Talleres
                    </span>
                  </div>
                </div>
              </div>

              {/* Decoración: Triángulo rojo en el flanco */}
              <span className="absolute top-[42%] -right-2 sm:-right-3 text-[#E12927] font-black text-xl select-none pointer-events-none drop-shadow z-20">
                ▲
              </span>

              {/* Decoración: Cruz en Negro Café */}
              <span className="absolute -bottom-3 left-6 text-[#1F1410]/70 font-black text-2xl select-none pointer-events-none drop-shadow z-20">
                ✕
              </span>

              {/* Decoración: Círculos concéntricos sutiles abajo */}
              <div className="absolute -bottom-8 left-1/4 w-32 h-32 rounded-full border border-stone-300/60 flex items-center justify-center pointer-events-none z-0">
                <div className="w-20 h-20 rounded-full border border-stone-300/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border border-stone-300/30" />
                </div>
              </div>
            </div>

            {/* ============================================================
                COLUMNA DERECHA: TEXTO CONCISO QUE INCITA A VER TODOS LOS EVENTOS
                ============================================================ */}
            <div className="lg:col-span-6 flex flex-col items-start text-left lg:pl-4">
              {/* Título en Negro Café (#1F1410) y Rojo Marfil (#E12927) */}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#1F1410] tracking-tight leading-[1.12] mb-3">
                Música en Vivo, <br />
                <span className="text-[#E12927]">Juegos & Buena Vibra</span>
              </h2>

              {/* Hook breve y directo */}
              <p className="font-body text-sm sm:text-base text-stone-600 mb-6 max-w-lg leading-relaxed">
                Cada semana nuestras sucursales se llenan de experiencias únicas. Descubre la agenda completa de actividades para compartir con amigos o en pareja.
              </p>
              {/* Botón CTA destacado que incita a explorar todos los eventos */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleGoTo('actividades')}
                  className="bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-[#E12927]/25 hover:shadow-xl hover:shadow-[#E12927]/35 transition-all cursor-pointer inline-flex items-center gap-2.5"
                >
                  <span>VER TODOS LOS EVENTOS</span>
                  <ArrowRight size={16} />
                </button>
                <span className="font-mono text-xs text-stone-500 sm:ml-2">
                  ✦ Entrada libre · Cupos limitados
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. PASAPORTE DE SELLOS Y CLUB MARFIL (BANNER EDITORIAL CON SELLOS.PNG)
          ==================================================================== */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FCEAE9]/60 via-[#FFF9F9] to-[#FCEAE9]/30 border border-[#E12927]/20 shadow-xl shadow-stone-200/50 p-6 sm:p-10 lg:p-12">
          {/* Halos decorativos suaves en el fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FCEAE9] rounded-full blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#E12927]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* ============================================================
                LADO IZQUIERDO: SEMICÍRCULO GEOMÉTRICO + IMAGEN SELLOS.PNG
                ============================================================ */}
            <div className="lg:col-span-6 relative flex items-center justify-center py-4 lg:py-6">
              {/* Semicírculo / Disco geométrico de fondo en Rojo Marfil */}
              <div className="w-52 h-52 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full bg-[#E12927] opacity-95 absolute -left-6 sm:left-4 top-1/2 -translate-y-1/2 -z-0 shadow-2xl shadow-[#E12927]/30" />

              {/* Aro decorativo concéntrico discontinuo */}
              <div className="w-64 h-64 sm:w-88 sm:h-88 lg:w-96 lg:h-96 rounded-full border-2 border-dashed border-[#E12927]/25 absolute -left-12 sm:left-0 top-1/2 -translate-y-1/2 -z-0 pointer-events-none" />

              {/* Imagen sellos.png de public/images */}
              <div
                className="relative z-10 w-full max-w-xs sm:max-w-sm lg:max-w-md cursor-pointer group"
                onClick={() => handleGoTo('beneficios')}
              >
                <img
                  src="/images/sellos.png"
                  alt="Pasaporte de Sellos Café Marfil"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.22)] group-hover:scale-105 group-hover:-rotate-1 transition-all duration-500"
                />
              </div>

              {/* Elementos flotantes decorativos */}
              <span className="absolute top-6 right-10 text-[#E12927] font-black text-xl select-none pointer-events-none drop-shadow">
                ✦
              </span>
              <span className="absolute bottom-4 left-10 text-[#1F1410]/40 font-mono text-sm select-none pointer-events-none">
                ✦
              </span>
            </div>

            {/* ============================================================
                LADO DERECHO: TIPOGRAFÍA ESTILO EDITORIAL POSTER + BENEFICIOS
                ============================================================ */}
            <div className="lg:col-span-6 text-left flex flex-col items-start lg:pl-4">
              {/* Gran Titular Display con contraste Cursivo Serif / Bold Sans */}
              <div className="mb-3">
                <span className="font-display italic text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#E12927] tracking-tight block leading-[0.95] drop-shadow-xs">
                  Pasaporte
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-[#1F1410] uppercase tracking-wider block mt-1">
                  DE SELLOS DIGITAL
                </span>
              </div>

              {/* Descripción concisa */}
              <p className="font-body text-sm sm:text-base text-stone-600 leading-relaxed max-w-lg mb-6">
                Colecciona sellos con cada visita a Café Marfil. Al completar tu pasaporte, disfruta de bebidas de especialidad gratis, regalos de cumpleaños y accesos exclusivos a nuestro menú secreto.
              </p>


              {/* Botón CTA y micro-texto */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleGoTo('beneficios')}
                  className="bg-[#1F1410] hover:bg-[#E12927] active:scale-95 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-black/10 hover:shadow-[#E12927]/25 transition-all cursor-pointer inline-flex items-center gap-2.5"
                >
                  <span>VER MI PASAPORTE DE SELLOS</span>
                  <ArrowRight size={16} />
                </button>
                <span className="font-mono text-xs text-stone-500 sm:ml-2">
                  ✦ Acumula sellos en tu celular
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          6. NUESTRAS SUCURSALES REALES EN DURANGO (CON GOOGLE MAPS IFRAME)
          ==================================================================== */}
      <section className="w-full bg-[#FAF7F5] border-t border-stone-200/80 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1F1410] tracking-tight">
                Visítanos en Nuestras Sucursales
              </h2>
              <p className="font-body text-sm sm:text-base text-stone-600 max-w-2xl mt-1">
                Conoce nuestras ubicaciones reales en Durango: Casona Matriz en Calle Porras y Barrio del Calvario.
              </p>
            </div>
            <button
              onClick={() => handleGoTo('sucursales')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-[#1F1410] hover:bg-[#E12927] text-white transition-colors cursor-pointer shadow-md self-start md:self-auto"
            >
              <span>Ver Pantalla de Sucursales</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Grid de las 2 Sucursales Reales con Fotos Reales */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {sucursales.map((sucursal) => {
              const isActive = activeSucursalId === sucursal.id;
              return (
                <div
                  key={sucursal.id}
                  onClick={() => setActiveSucursalId(sucursal.id)}
                  className={`bg-white rounded-[24px] border overflow-hidden transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-xl ${isActive
                    ? 'border-[#E12927] ring-2 ring-[#E12927]/15 shadow-md'
                    : 'border-stone-200 hover:border-stone-300'
                    }`}
                >
                  <div>
                    {/* Foto Real de la Sucursal en proporción 16:10 */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1F1410]">
                      <img
                        src={sucursal.imagen}
                        alt={sucursal.nombre}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />

                      {sucursal.destacada && (
                        <span className="absolute top-3 left-3 bg-[#E12927] text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                          MATRIZ · ZONA CENTRO
                        </span>
                      )}

                      {/* Botón Indicador de Ubicación Activa */}
                      <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white font-mono text-[10px] px-2.5 py-1 rounded-md border border-white/20">
                        <MapPin size={11} className={isActive ? 'text-[#E12927]' : 'text-stone-300'} />
                        <span>{isActive ? 'Ubicación activa' : 'Toca para ver mapa'}</span>
                      </div>
                    </div>

                    <div className="p-5 text-left">
                      <h3 className="font-display font-bold text-xl text-[#1F1410] group-hover:text-[#E12927] transition-colors">
                        {sucursal.nombre}
                      </h3>
                      <p className="font-body text-xs text-stone-600 mt-1 leading-relaxed">
                        {sucursal.subtitulo}
                      </p>

                      <div className="mt-4 flex items-start gap-2 text-xs font-body text-stone-700">
                        <MapPin size={15} className="text-[#E12927] shrink-0 mt-0.5" />
                        <span className="font-medium">{sucursal.direccion}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs font-body text-stone-600">
                        <Phone size={14} className="text-stone-400 shrink-0" />
                        <span className="font-mono text-xs font-semibold text-[#1F1410]">{sucursal.telefono}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs font-body text-stone-600">
                        <Clock size={14} className="text-stone-400 shrink-0" />
                        <span className="font-mono text-[11px]">{sucursal.horario}</span>
                      </div>

                      {/* Características destacadas */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {sucursal.caracteristicas.slice(0, 3).map((caract, i) => (
                          <span
                            key={i}
                            className="font-mono text-[10px] bg-[#FAF8F5] border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md"
                          >
                            {caract}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-stone-100 mt-3 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoTo('reservar');
                      }}
                      className="font-mono text-xs font-bold text-[#E12927] hover:text-[#C81E1C] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Reservar Mesa Aquí</span>
                      <ArrowRight size={13} />
                    </button>

                    <a
                      href={sucursal.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-stone-500 hover:text-[#1F1410] flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <span>Google Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============================================================
              MAPA INTERACTIVO GOOGLE MAPS (IFRAME)
              ============================================================ */}
          {activeSucursal && (
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden text-left">
            {/* Header del Mapa con Pestañas de Sucursal */}
            <div className="bg-stone-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E12927] text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base sm:text-lg text-white">
                    Ubicación: {activeSucursal.nombre}
                  </h4>
                  <p className="font-mono text-xs text-stone-300">
                    {activeSucursal.direccion}
                  </p>
                </div>
              </div>

              {/* Selector de Sucursal en Pestañas */}
              <div className="flex flex-wrap items-center gap-2">
                {sucursales.map((suc) => (
                  <button
                    key={suc.id}
                    onClick={() => setActiveSucursalId(suc.id)}
                    className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeSucursalId === suc.id
                      ? 'bg-[#E12927] text-white shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white'
                      }`}
                  >
                    {suc.nombre.replace('Sucursal ', '')}
                  </button>
                ))}

                <a
                  href={activeSucursal.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-white text-[#1F1410] hover:bg-stone-100 px-3.5 py-1.5 rounded-lg transition-all shadow-xs"
                >
                  <span>Abrir en Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Google Maps iFrame */}
            <div className="relative w-full h-[360px] sm:h-[440px] bg-stone-100">
              <iframe
                title={`Google Maps - ${activeSucursal.nombre}`}
                src={activeSucursal.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

          </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          8. BANNER CTA FINAL: RESERVA INMEDIATA ONLINE
          ==================================================================== */}
      <section className="w-full bg-[#E12927] text-white py-12 sm:py-16 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="font-display text-3xl sm:text-5xl font-black leading-tight tracking-tight">
            ¿Listo para Vivir la Experiencia Marfil?
          </h2>
          <p className="font-body text-base sm:text-lg text-white/90 max-w-2xl mx-auto mt-3">
            Elige tu sucursal favorita en Durango, fecha, hora y vive el mejor Urban Brunch, café de especialidad y ludoteca de la ciudad.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleGoTo('reservar')}
              className="w-full sm:w-auto px-9 py-4 rounded-full font-mono text-sm font-black uppercase tracking-wider bg-white hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] transition-all duration-200 cursor-pointer shadow-xl active:scale-95"
            >
              Iniciar Reservación Ahora
            </button>
            <button
              onClick={() => handleGoTo('actividades')}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-mono text-sm font-bold uppercase tracking-wider bg-black/25 hover:bg-black/40 text-white border-2 border-white/30 transition-all cursor-pointer"
            >
              Ver Noches de Juegos
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
