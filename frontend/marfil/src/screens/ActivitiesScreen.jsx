import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Search, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ActivitiesScreen({
  actividades,
  sucursales,
  onSelectActivity
}) {
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedSucursal, setSelectedSucursal] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const categorias = [
    { id: 'todas', label: 'Todas' },
    { id: 'cine', label: '🎬 Cine & Proyecciones' },
    { id: 'talleres', label: '🎨 Talleres Creativos' },
    { id: 'musica', label: '🎵 Música en Vivo' },
    { id: 'juegos', label: '🎲 Juegos de Mesa' },
    { id: 'privados', label: '🎉 Eventos Privados' },
    { id: 'temporada', label: '🎄 Temporada' },
  ];

  const filteredActividades = actividades.filter((act) => {
    const matchCat = selectedCategory === 'todas' || act.categoriaSlug === selectedCategory;
    const matchSuc = selectedSucursal === 'todas' || act.sucursalId === selectedSucursal;
    const matchSearch =
      act.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.resumen.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSuc && matchSearch;
  });

  return (
    <div className="flex flex-col gap-8 fade-in pb-16">
      {/* Encabezado Editorial */}
      <div className="max-w-2xl text-left">

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1F1410] tracking-tight mb-3">
          Actividades & Eventos
        </h1>
        <p className="font-body text-sm sm:text-base text-[#1F1410]/80 leading-relaxed font-medium">
          Noches de cine, talleres de pintura neón, flash tattoos, música en vivo, juegos de mesa y eventos privados. Elige tu experiencia y aparta tu lugar.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-4">
        {/* Categorías HeroUI Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categorias.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                className={`whitespace-nowrap px-5 py-2.5 rounded-md font-mono text-xs font-bold cursor-pointer transition-all duration-200 border-2 ${
                  isActive
                    ? 'bg-[#E12927] text-white border-[#E12927] shadow-md shadow-[#E12927]/30 scale-[1.02]'
                    : 'bg-white hover:bg-[#FCEAE9] text-[#1F1410] border-stone-300 hover:border-[#E12927] shadow-xs'
                }`}
                onClick={() => {
                  sounds.playClick();
                  setSelectedCategory(cat.id);
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filtro por Sucursal y Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-md bg-white border-2 border-stone-300 shadow-xs flex-1 sm:max-w-xs focus-within:border-[#E12927] transition-colors">
            <MapPin size={18} className="text-[#E12927] shrink-0" />
            <select
              className="w-full bg-transparent text-xs sm:text-sm font-body text-[#1F1410] font-medium focus:outline-none cursor-pointer"
              value={selectedSucursal}
              onChange={(e) => {
                sounds.playClick();
                setSelectedSucursal(e.target.value);
              }}
            >
              <option value="todas">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-3 rounded-md bg-white border-2 border-stone-300 shadow-xs flex-1 focus-within:border-[#E12927] transition-colors">
            <Search size={18} className="text-[#8E7A74] shrink-0" />
            <input
              type="text"
              placeholder="Buscar por juego, música, cata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-body text-[#1F1410] font-medium placeholder-[#8E7A74] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Listado de Actividades en Grid 100% Sólido */}
      {filteredActividades.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-lg bg-white border-2 border-stone-300 gap-3 shadow-md">
          <Sparkles size={36} className="text-[#E12927]" />
          <h3 className="font-display text-xl font-bold text-[#1F1410]">No se encontraron actividades con estos filtros</h3>
          <p className="font-body text-sm text-[#5A4840] max-w-md">Intenta cambiar la categoría o la sucursal seleccionada.</p>
          <button
            className="mt-3 px-6 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider text-[#1F1410] border-2 border-[#1F1410] bg-white hover:bg-[#1F1410] hover:text-white transition-all cursor-pointer shadow-xs"
            onClick={() => {
              setSelectedCategory('todas');
              setSelectedSucursal('todas');
              setSearchTerm('');
            }}
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActividades.map((act) => (
            <article
              key={act.id}
              className="bg-white rounded-lg border-2 border-stone-300 overflow-hidden flex flex-col shadow-md hover:shadow-2xl hover:border-[#E12927] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                sounds.playClick();
                onSelectActivity(act);
              }}
            >
              {/* Imagen */}
              <div className="relative h-52 bg-stone-100 overflow-hidden border-b-2 border-stone-200">
                <img
                  src={act.imagen}
                  alt={act.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono font-bold text-[#6B5A52] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={13} className="text-[#E12927]" /> {act.fechaCorta}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} className="text-[#E12927]" /> {act.hora.split('–')[0]}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} className="text-[#E12927]" /> {act.sucursalNombre}
                  </span>
                </div>

                <h2 className="font-display text-xl font-bold text-[#1F1410] leading-snug group-hover:text-[#E12927] transition-colors">
                  {act.nombre}
                </h2>
                <p className="font-body text-xs sm:text-sm text-[#5A4840] leading-relaxed line-clamp-3">
                  {act.resumen}
                </p>

                {/* Pie de tarjeta con costo y botón HeroUI */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-stone-200">
                  <div>
                    <span className="block font-mono text-[10px] font-bold tracking-wider text-[#8E7A74] uppercase">PRECIO / ACCESO</span>
                    <span className="font-mono text-lg font-bold text-[#E12927]">{act.precio}</span>
                  </div>

                  <button
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider bg-[#E12927] hover:bg-[#C81E1C] active:scale-95 text-white border-2 border-[#E12927] shadow-md shadow-[#E12927]/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onSelectActivity(act);
                    }}
                  >
                    <span>Ver detalles</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
