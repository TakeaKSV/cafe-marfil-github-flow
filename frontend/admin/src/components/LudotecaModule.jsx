import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Dice5,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  X,
  Upload
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { esGerencia } from '../utils/permisos';
import { reglas } from '../utils/validacion';
import { resolverUrlImagen, subirImagen } from '../api/cliente';
import { TablePagination } from './ui/TablePagination';
import { CurvedRevealCard } from './ui/CurvedRevealCard';

const JUEGOS_POR_PAGINA = 6;

const IMAGENES_JUEGOS_PRESET = [
  { url: '/images/juegos/estrategia.jpg', label: 'Estrategia' },
  { url: '/images/juegos/creatividad.jpg', label: 'Creatividad' },
  { url: '/images/juegos/party.jpg', label: 'Party & Cartas' },
  { url: '/images/juegos/palabras.jpg', label: 'Palabras' }
];

function obtenerImagenJuego(game) {
  if (game.imagen && game.imagen !== '/images/board_games.jpg') {
    return resolverUrlImagen(game.imagen);
  }
  const texto = `${game.nombre || ''} ${game.categoria || ''}`.toLowerCase();
  if (texto.includes('catan') || texto.includes('carcassonne') || texto.includes('estrategia') || texto.includes('losetas')) {
    return resolverUrlImagen('/images/juegos/estrategia.jpg');
  }
  if (texto.includes('dixit') || texto.includes('wingspan') || texto.includes('creatividad') || texto.includes('gestión') || texto.includes('motor')) {
    return resolverUrlImagen('/images/juegos/creatividad.jpg');
  }
  if (texto.includes('código') || texto.includes('codigo') || texto.includes('codenames') || texto.includes('palabras')) {
    return resolverUrlImagen('/images/juegos/palabras.jpg');
  }
  if (texto.includes('kittens') || texto.includes('virus') || texto.includes('taco') || texto.includes('party') || texto.includes('cartas') || texto.includes('reflejos')) {
    return resolverUrlImagen('/images/juegos/party.jpg');
  }
  return resolverUrlImagen('/images/board_games.jpg');
}

export const LudotecaModule = ({
  juegos,
  onUpdateJuego,
  onAddJuego,
  mesas,
  usuario,
  soundEnabled
}) => {
  const puedeGestionarCatalogo = esGerencia(usuario);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [showLoanModal, setShowLoanModal] = useState(null);
  const [selectedMesaForLoan, setSelectedMesaForLoan] = useState('L01');
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [subiendoJuegoId, setSubiendoJuegoId] = useState(null);

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLoanModal) setShowLoanModal(null);
        if (showNewGameModal) setShowNewGameModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLoanModal, showNewGameModal]);

  const [newGame, setNewGame] = useState({
    nombre: '',
    categoria: 'Estrategia & Tablero',
    jugadores: '2 - 4 jugadores',
    duracionMin: '45 min',
    dificultad: 'Media',
    piezasEstado: '100% Completo (Verificado)',
    imagen: '/images/juegos/estrategia.jpg'
  });
  const [gameErrors, setGameErrors] = useState({});
  const [loanError, setLoanError] = useState('');

  const filtered = juegos.filter(j => {
    const matchesEstado = filterEstado === 'todas' ||
      (filterEstado === 'disponible' && j.estado === 'disponible') ||
      (filterEstado === 'en_mesa' && j.estado === 'en_mesa') ||
      (filterEstado === 'reposicion' && j.reposicionRequerida);

    const matchesSearch = searchTerm === '' ||
      j.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEstado && matchesSearch;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / JUEGOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const juegosPaginados = filtered.slice(
    (paginaActual - 1) * JUEGOS_POR_PAGINA,
    paginaActual * JUEGOS_POR_PAGINA
  );

  const handleReturnGame = (juego) => {
    onUpdateJuego({
      ...juego,
      estado: 'disponible',
      mesaActual: null
    });
    if (soundEnabled) playSound('success');
  };

  const handleLoanGame = (e) => {
    e.preventDefault();
    if (!showLoanModal) return;
    if (!selectedMesaForLoan || mesas.length === 0) {
      setLoanError('No hay mesas ocupadas disponibles para prestar este juego.');
      if (soundEnabled) playSound('alert');
      return;
    }
    setLoanError('');
    onUpdateJuego({
      ...showLoanModal,
      estado: 'en_mesa',
      mesaActual: `Mesa ${selectedMesaForLoan}`,
      vecesJugadoMes: showLoanModal.vecesJugadoMes + 1
    });

    if (soundEnabled) playSound('coin');
    setShowLoanModal(null);
  };

  const handleToggleReposicion = (juego) => {
    const nuevo = !juego.reposicionRequerida;
    onUpdateJuego({
      ...juego,
      reposicionRequerida: nuevo,
      piezasEstado: nuevo ? 'Requiere reposición de piezas' : '100% Completo (Verificado)'
    });
    if (soundEnabled) playSound(nuevo ? 'alert' : 'success');
  };

  const handleCreateGame = (e) => {
    e.preventDefault();
    const errs = {
      nombre: reglas.nombreItem(newGame.nombre, { min: 2, max: 120, etiqueta: 'El título del juego' }),
      categoria: reglas.texto(newGame.categoria, { min: 2, max: 80, etiqueta: 'La categoría' }),
      jugadores: reglas.texto(newGame.jugadores, { min: 2, max: 60, etiqueta: 'El rango de jugadores' }),
      duracionMin: reglas.texto(newGame.duracionMin, { min: 2, max: 40, etiqueta: 'La duración estimada' })
    };
    setGameErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      if (soundEnabled) playSound('alert');
      return;
    }

    const creado = {
      id: `game-${Date.now()}`,
      nombre: newGame.nombre.trim(),
      categoria: newGame.categoria.trim(),
      jugadores: newGame.jugadores.trim(),
      duracionMin: newGame.duracionMin.trim(),
      dificultad: newGame.dificultad,
      piezasEstado: newGame.piezasEstado,
      imagen: newGame.imagen,
      estado: 'disponible',
      mesaActual: null,
      vecesJugadoMes: 0,
      reposicionRequerida: false
    };

    onAddJuego(creado);
    if (soundEnabled) playSound('success');
    setShowNewGameModal(false);
    setGameErrors({});
    setNewGame({
      nombre: '',
      categoria: 'Estrategia & Tablero',
      jugadores: '2 - 4 jugadores',
      duracionMin: '45 min',
      dificultad: 'Media',
      piezasEstado: '100% Completo (Verificado)',
      imagen: '/images/juegos/estrategia.jpg'
    });
  };

  const validarArchivoImagen = (archivo) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      return 'Formato no permitido. Solo JPG, PNG o WebP.';
    }
    if (archivo.size > 2 * 1024 * 1024) {
      return 'La imagen no debe superar 2 MB.';
    }
    return null;
  };

  const handleUploadGameImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errorArchivo = validarArchivoImagen(file);
    if (errorArchivo) {
      setGameErrors((prev) => ({ ...prev, imagen: errorArchivo }));
      if (soundEnabled) playSound('alert');
      return;
    }
    setSubiendoImagen(true);
    setGameErrors((prev) => ({ ...prev, imagen: null }));
    try {
      const { url } = await subirImagen(file, 'juegos');
      setNewGame((prev) => ({ ...prev, imagen: url }));
      if (soundEnabled) playSound('success');
    } catch (err) {
      setGameErrors((prev) => ({ ...prev, imagen: err.message || 'No se pudo subir la imagen.' }));
      if (soundEnabled) playSound('alert');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleChangeExistingGameImage = async (game, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (validarArchivoImagen(file)) {
      if (soundEnabled) playSound('alert');
      return;
    }
    setSubiendoJuegoId(game.id);
    try {
      const { url } = await subirImagen(file, 'juegos');
      await onUpdateJuego({ ...game, imagen: url });
      if (soundEnabled) playSound('success');
    } catch {
      if (soundEnabled) playSound('alert');
    } finally {
      setSubiendoJuegoId(null);
    }
  };

  return (
    <div className="lg:h-[calc(100dvh-6.2rem)] lg:overflow-hidden flex flex-col gap-3 animate-menu-in">

      {/* Header compacto */}
      <div className="bg-white px-4 py-3 sm:px-5 rounded-2xl border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Dice5 className="w-5 h-5 text-[#E12927] shrink-0" />
            <h1 className="font-display font-bold text-xl text-[#1F1410] truncate">
              Ludoteca & Salón de Juegos
            </h1>
          </div>
          <p className="text-xs text-[#1F1410]/60 font-body truncate">
            Pasa el cursor sobre cualquier juego para ver estado de piezas, partidas del mes y registrar préstamos
          </p>
        </div>

        {puedeGestionarCatalogo && (
          <button
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              setShowNewGameModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Registrar Nuevo Juego
          </button>
        )}
      </div>

      {/* Filtros de Estado y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">

        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todas', label: 'Toda la Colección' },
            { id: 'disponible', label: 'En Estantería' },
            { id: 'en_mesa', label: 'En Préstamo a Mesa' },
            { id: 'reposicion', label: 'Requiere Piezas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterEstado(tab.id);
                setPagina(1);
                setExpandedGameId(null);
                if (soundEnabled) playSound('toggle');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${filterEstado === tab.id
                  ? 'bg-[#1F1410] border-[#1F1410] text-white'
                  : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-0 w-full sm:min-w-[280px] sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1F1410]/40" />
          <input
            type="text"
            placeholder="Buscar juego (Catan, Dixit, Carcassonne...)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagina(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927] font-body"
          />
        </div>

      </div>

      {/* Grid de Juegos sin scroll en escritorio (3x2) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-3.5">
        {juegosPaginados.map((game) => {
          const isEnMesa = game.estado === 'en_mesa';
          const isOpen = expandedGameId === game.id;

          return (
            <CurvedRevealCard
              key={game.id}
              image={obtenerImagenJuego(game)}
              imageAlt={game.nombre}
              title={game.nombre}
              subtitle={`${game.jugadores} · ${game.duracionMin}`}
              isOpen={isOpen}
              onToggle={() => {
                setExpandedGameId((prev) => (prev === game.id ? null : game.id));
                if (soundEnabled) playSound('toggle');
              }}
              borderClassName={
                isEnMesa
                  ? 'border-[#E12927]/50'
                  : game.reposicionRequerida
                    ? 'border-amber-400'
                    : 'border-[#1F1410]/10 hover:border-[#E12927]/40'
              }
              topLeft={
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#1F1410] rounded-full shadow-xs">
                  {game.categoria}
                </span>
              }
              topRight={
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                    isEnMesa
                      ? 'bg-[#E12927] text-white'
                      : game.reposicionRequerida
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isEnMesa ? 'EN JUEGO' : game.reposicionRequerida ? 'PIEZA FALTANTE' : 'DISPONIBLE'}
                </span>
              }
            >
              {/* Detalles desplegados al hacer clic */}
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#1F1410]/70">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#E12927]" /> Dif: <strong>{game.dificultad}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-[#1F1410]/55">
                  <Clock className="w-3 h-3" /> {game.vecesJugadoMes} partidas/mes
                </span>
              </div>

              <div
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono flex items-center justify-between gap-2 ${
                  game.reposicionRequerida
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-[#FAF7F5] text-[#1F1410]/80 border-[#1F1410]/10'
                }`}
              >
                <span className="flex items-center gap-1 font-semibold truncate">
                  {game.reposicionRequerida ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">{game.piezasEstado}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleReposicion(game)}
                  className="text-[10px] font-bold text-[#E12927] hover:underline cursor-pointer shrink-0"
                >
                  {game.reposicionRequerida ? 'Marcar OK' : 'Reportar'}
                </button>
              </div>

              {isEnMesa && (
                <div className="text-[11px] font-mono bg-[#FCEAE9] text-[#E12927] px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-between">
                  <span className="truncate">Jugando en: {game.mesaActual}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEnMesa ? (
                  <button
                    type="button"
                    onClick={() => handleReturnGame(game)}
                    className="flex-1 py-1.5 bg-[#1F1410] hover:bg-black text-white text-[11px] font-mono font-bold rounded-full cursor-pointer transition-colors"
                  >
                    Recibir en Estantería
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSound('toggle');
                      setShowLoanModal(game);
                    }}
                    className="flex-1 py-1.5 bg-[#E12927] hover:bg-[#b51c1a] text-white text-[11px] font-mono font-bold rounded-full cursor-pointer transition-colors"
                  >
                    + Prestar a Mesa
                  </button>
                )}

                {puedeGestionarCatalogo && (
                  <label
                    title="Subir imagen a la nube (JPG, PNG o WebP)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] border border-[#1F1410]/12 text-[#1F1410] hover:text-[#E12927] text-[10px] font-mono font-bold cursor-pointer transition-colors shrink-0"
                  >
                    <Upload className="w-3 h-3" />
                    {subiendoJuegoId === game.id ? '...' : 'Foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleChangeExistingGameImage(game, e)}
                      className="hidden"
                      disabled={subiendoJuegoId === game.id}
                    />
                  </label>
                )}
              </div>
            </CurvedRevealCard>
          );
        })}
      </div>

      {filtered.length > JUEGOS_POR_PAGINA && (
        <div className="bg-white rounded-2xl border border-[#1F1410]/10 overflow-hidden shadow-2xs shrink-0">
          <TablePagination
            page={paginaActual}
            totalItems={filtered.length}
            pageSize={JUEGOS_POR_PAGINA}
            onPageChange={(p) => {
              setPagina(p);
              setExpandedGameId(null);
            }}
            itemLabel="juegos"
          />
        </div>
      )}

      {/* Modal Prestar a Mesa (Portal a document.body para tapar toda la pantalla) */}
      {showLoanModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
          onClick={() => setShowLoanModal(null)}
        >
          <div 
            className="bg-white rounded-[28px] border border-[#1F1410]/10 max-w-sm w-full p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg text-[#1F1410]">
                  Prestar Juego
                </h3>
                <p className="text-xs text-[#E12927] font-semibold mt-0.5 truncate max-w-[200px]">
                  {showLoanModal.nombre}
                </p>
              </div>
              <button 
                onClick={() => setShowLoanModal(null)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLoanGame} noValidate className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Seleccionar Mesa Activa de Sala:
                </label>
                <select
                  value={selectedMesaForLoan}
                  onChange={(e) => {
                    setSelectedMesaForLoan(e.target.value);
                    setLoanError('');
                  }}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden bg-white font-mono cursor-pointer transition-all"
                >
                  {mesas.map(m => (
                    <option key={m.id} value={m.numero}>
                      Mesa {m.numero} ({m.zona}) - {m.comensal || 'Comensales'}
                    </option>
                  ))}
                </select>
                {loanError && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{loanError}</p>}
              </div>

              <div className="p-4 bg-[#FAF7F5] rounded-2xl text-xs text-[#1F1410]/70 font-mono border border-[#1F1410]/8">
                El anfitrión de ludoteca registrará la entrega y verificará las cartas al devolver.
              </div>

              <div className="pt-3 border-t border-[#1F1410]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(null)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer rounded-full hover:bg-[#FAF7F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-full cursor-pointer shadow-md shadow-[#E12927]/25 font-mono transition-transform active:scale-[0.98]"
                >
                  Confirmar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Nuevo Juego (Portal a document.body para tapar toda la pantalla) */}
      {showNewGameModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-modal-backdrop"
          onClick={() => setShowNewGameModal(false)}
        >
          <div 
            className="bg-white rounded-[28px] border border-[#1F1410]/10 max-w-md w-full p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1F1410]/8 mb-5">
              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#1F1410]">
                  Ingresar Nuevo Juego
                </h3>
                <p className="text-xs text-[#1F1410]/60 font-body mt-0.5">
                  Ludoteca Marfil · Acervo & Fichas
                </p>
              </div>
              <button 
                onClick={() => setShowNewGameModal(false)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/50 hover:text-[#E12927] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGame} noValidate className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Nombre del Título *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Azul (Master Chocolatier)"
                  value={newGame.nombre}
                  onChange={(e) => {
                    setNewGame({ ...newGame, nombre: e.target.value });
                    setGameErrors((p) => ({ ...p, nombre: null }));
                  }}
                  aria-invalid={Boolean(gameErrors.nombre)}
                  className={`w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-1 focus:outline-hidden transition-all ${
                    gameErrors.nombre ? 'border-[#E12927] focus:border-[#E12927] focus:ring-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]'
                  }`}
                />
                {gameErrors.nombre && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{gameErrors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Categoría *
                  </label>
                  <input
                    type="text"
                    value={newGame.categoria}
                    onChange={(e) => {
                      setNewGame({ ...newGame, categoria: e.target.value });
                      setGameErrors((p) => ({ ...p, categoria: null }));
                    }}
                    aria-invalid={Boolean(gameErrors.categoria)}
                    className={`w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-1 focus:outline-hidden transition-all ${
                      gameErrors.categoria ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]'
                    }`}
                  />
                  {gameErrors.categoria && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{gameErrors.categoria}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Número de Jugadores *
                  </label>
                  <input
                    type="text"
                    placeholder="2 - 4 jugadores"
                    value={newGame.jugadores}
                    onChange={(e) => {
                      setNewGame({ ...newGame, jugadores: e.target.value });
                      setGameErrors((p) => ({ ...p, jugadores: null }));
                    }}
                    aria-invalid={Boolean(gameErrors.jugadores)}
                    className={`w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-1 focus:outline-hidden font-mono transition-all ${
                      gameErrors.jugadores ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]'
                    }`}
                  />
                  {gameErrors.jugadores && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{gameErrors.jugadores}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Duración Estimada *
                  </label>
                  <input
                    type="text"
                    placeholder="30 - 45 min"
                    value={newGame.duracionMin}
                    onChange={(e) => {
                      setNewGame({ ...newGame, duracionMin: e.target.value });
                      setGameErrors((p) => ({ ...p, duracionMin: null }));
                    }}
                    aria-invalid={Boolean(gameErrors.duracionMin)}
                    className={`w-full px-4 py-2.5 text-xs border rounded-xl focus:ring-1 focus:outline-hidden font-mono transition-all ${
                      gameErrors.duracionMin ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927] focus:ring-[#E12927]'
                    }`}
                  />
                  {gameErrors.duracionMin && <p role="alert" className="text-[11px] font-semibold text-[#E12927] mt-1">{gameErrors.duracionMin}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Dificultad
                  </label>
                  <select
                    value={newGame.dificultad}
                    onChange={(e) => setNewGame({ ...newGame, dificultad: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden bg-white cursor-pointer"
                  >
                    <option value="Muy Fácil">Muy Fácil (Party)</option>
                    <option value="Fácil">Fácil (Familiar)</option>
                    <option value="Media">Media (Estrategia Ligera)</option>
                    <option value="Alta">Alta (Experto)</option>
                  </select>
                </div>
              </div>

              {/* Imagen del juego (subida a Cloudinary / nube igual que el menú) */}
              <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={resolverUrlImagen(newGame.imagen)}
                      alt="Vista previa"
                      className="w-10 h-10 rounded-lg object-cover border border-[#1F1410]/15 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-mono font-bold text-[#1F1410]">
                        Fotografía del juego
                      </span>
                      <span className="block text-[10px] text-[#1F1410]/60 truncate">
                        JPG, PNG o WebP (máx. 2 MB) · subida a la nube
                      </span>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white text-[11px] font-mono font-bold cursor-pointer transition-colors shrink-0">
                    <Upload className="w-3 h-3" />
                    {subiendoImagen ? 'Subiendo...' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadGameImage}
                      className="hidden"
                      disabled={subiendoImagen}
                    />
                  </label>
                </div>
                {gameErrors.imagen && (
                  <p role="alert" className="text-[11px] font-semibold text-[#E12927]">
                    {gameErrors.imagen}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {IMAGENES_JUEGOS_PRESET.map((preset) => {
                    const active = newGame.imagen === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setNewGame((prev) => ({ ...prev, imagen: preset.url }));
                          setGameErrors((prev) => ({ ...prev, imagen: null }));
                        }}
                        className={`relative h-11 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          active ? 'border-[#E12927] ring-2 ring-[#E12927]/25' : 'border-[#1F1410]/10 opacity-75 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={resolverUrlImagen(preset.url)} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F1410]/8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewGameModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] cursor-pointer rounded-full hover:bg-[#FAF7F5] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-bold rounded-full cursor-pointer shadow-md shadow-[#E12927]/25 font-mono transition-transform active:scale-[0.98]"
                >
                  Guardar en Inventario
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
