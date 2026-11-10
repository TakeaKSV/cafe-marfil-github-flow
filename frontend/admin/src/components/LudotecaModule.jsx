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
  Check,
  RotateCcw,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const LudotecaModule = ({
  juegos,
  onUpdateJuego,
  onAddJuego,
  mesas,
  soundEnabled
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  const [showLoanModal, setShowLoanModal] = useState(null);
  const [selectedMesaForLoan, setSelectedMesaForLoan] = useState('L01');
  const [showNewGameModal, setShowNewGameModal] = useState(false);

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
    piezasEstado: '100% Completo (Verificado)'
  });

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
    if (!newGame.nombre.trim()) return;

    const creado = {
      id: `game-${Date.now()}`,
      nombre: newGame.nombre,
      categoria: newGame.categoria,
      jugadores: newGame.jugadores,
      duracionMin: newGame.duracionMin,
      dificultad: newGame.dificultad,
      piezasEstado: newGame.piezasEstado,
      estado: 'disponible',
      mesaActual: null,
      vecesJugadoMes: 1,
      reposicionRequerida: false
    };

    onAddJuego(creado);
    if (soundEnabled) playSound('success');
    setShowNewGameModal(false);
    setNewGame({
      nombre: '',
      categoria: 'Estrategia & Tablero',
      jugadores: '2 - 4 jugadores',
      duracionMin: '45 min',
      dificultad: 'Media',
      piezasEstado: '100% Completo (Verificado)'
    });
  };

  return (
    <div className="space-y-6 animate-menu-in">

      {/* Header */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dice5 className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Ludoteca & Salón de Juegos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Control de inventario, préstamo de cajas a mesas, estado de componentes y solicitudes de anfitrión guiado
          </p>
        </div>

        <button
          onClick={() => {
            if (soundEnabled) playSound('toggle');
            setShowNewGameModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Registrar Nuevo Juego
        </button>
      </div>

      {/* Filtros de Estado y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

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
                if (soundEnabled) playSound('toggle');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap ${filterEstado === tab.id
                  ? 'bg-[#1F1410] border-[#1F1410] text-white'
                  : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#1F1410]/40" />
          <input
            type="text"
            placeholder="Buscar por juego (Catan, Dixit, Carcassonne...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#1F1410]/15 rounded-md focus:outline-hidden focus:border-[#E12927] font-body"
          />
        </div>

      </div>

      {/* Grid de Juegos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((game, idx) => {
          const isEnMesa = game.estado === 'en_mesa';

          return (
            <div
              key={game.id}
              style={{ animationDelay: `${(idx % 6) * 50}ms` }}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between hover-lift animate-fade-up ${isEnMesa
                  ? 'border-[#E12927]/40 bg-[#FCEAE9]/20 shadow-xs'
                  : game.reposicionRequerida
                    ? 'border-amber-300'
                    : 'border-[#1F1410]/10 hover:border-[#1F1410]/30'
                }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-[#FAF7F5] border border-[#1F1410]/15 text-[#1F1410] rounded-xs">
                    {game.categoria}
                  </span>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs ${isEnMesa
                      ? 'bg-[#E12927] text-white'
                      : 'bg-emerald-100 text-emerald-800'
                    }`}>
                    {isEnMesa ? 'EN JUEGO' : 'DISPONIBLE'}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-[#1F1410] mb-1">
                  {game.nombre}
                </h3>

                <div className="flex items-center gap-3 text-xs font-mono text-[#1F1410]/70 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#E12927]" /> {game.jugadores}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {game.duracionMin}
                  </span>
                  <span className="text-[#1F1410]/50 font-normal">
                    Dif: <strong>{game.dificultad}</strong>
                  </span>
                </div>

                {/* Estado de piezas / caja */}
                <div className={`p-2.5 rounded-sm border text-xs font-mono mb-3 ${game.reposicionRequerida
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-[#FAF7F5] text-[#1F1410]/80 border-[#1F1410]/10'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold">
                      {game.reposicionRequerida ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {game.piezasEstado}
                    </span>
                    <button
                      onClick={() => handleToggleReposicion(game)}
                      className="text-[10px] text-[#1F1410]/60 hover:underline cursor-pointer"
                    >
                      {game.reposicionRequerida ? 'Marcar OK' : 'Reportar Falla'}
                    </button>
                  </div>
                </div>

                {isEnMesa && (
                  <div className="text-xs font-mono bg-[#E12927] text-white p-2 rounded-xs mb-3 font-bold flex items-center justify-between">
                    <span>Jugando en: {game.mesaActual}</span>
                    <span className="text-[10px] opacity-80">Anfitrión asignado</span>
                  </div>
                )}
              </div>

              {/* Botón de Préstamo / Devolución */}
              <div className="pt-2 border-t border-[#1F1410]/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#1F1410]/50">
                  {game.vecesJugadoMes} partidas este mes
                </span>

                {isEnMesa ? (
                  <button
                    onClick={() => handleReturnGame(game)}
                    className="px-3 py-1 bg-[#1F1410] hover:bg-black text-white text-xs font-mono font-bold rounded-xs cursor-pointer transition-colors"
                  >
                    Recibir en Estantería
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (soundEnabled) playSound('toggle');
                      setShowLoanModal(game);
                    }}
                    className="px-3 py-1 bg-[#E12927] hover:bg-[#b51c1a] text-white text-xs font-mono font-bold rounded-xs cursor-pointer transition-colors"
                  >
                    + Prestar a Mesa
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Prestar a Mesa (Portal a document.body para tapar toda la pantalla) */}
      {showLoanModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setShowLoanModal(null)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-sm w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
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

            <form onSubmit={handleLoanGame} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Seleccionar Mesa Activa de Sala:
                </label>
                <select
                  value={selectedMesaForLoan}
                  onChange={(e) => setSelectedMesaForLoan(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden bg-white font-mono cursor-pointer transition-all"
                >
                  {mesas.map(m => (
                    <option key={m.id} value={m.numero}>
                      Mesa {m.numero} ({m.zona}) - {m.comensal || 'Comensales'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-[#FAF7F5] rounded-2xl text-xs text-[#1F1410]/70 font-mono border border-[#1F1410]/8">
                El anfitrión de ludoteca registrará la entrega y verificará las cartas al devolver.
              </div>

              <div className="pt-4 border-t border-[#1F1410]/8 flex justify-end gap-3">
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
          className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop"
          onClick={() => setShowNewGameModal(false)}
        >
          <div 
            className="bg-white rounded-[32px] border border-[#1F1410]/10 max-w-md w-full p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(31,20,16,0.35)] animate-modal-card relative max-h-[92vh] overflow-y-auto my-auto"
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

            <form onSubmit={handleCreateGame} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                  Nombre del Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Azul (Master Chocolatier)"
                  value={newGame.nombre}
                  onChange={(e) => setNewGame({ ...newGame, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newGame.categoria}
                    onChange={(e) => setNewGame({ ...newGame, categoria: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Número de Jugadores
                  </label>
                  <input
                    type="text"
                    placeholder="2 - 4 jugadores"
                    value={newGame.jugadores}
                    onChange={(e) => setNewGame({ ...newGame, jugadores: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                    Duración Estimada
                  </label>
                  <input
                    type="text"
                    placeholder="30 - 45 min"
                    value={newGame.duracionMin}
                    onChange={(e) => setNewGame({ ...newGame, duracionMin: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:ring-1 focus:ring-[#E12927] focus:outline-hidden font-mono transition-all"
                  />
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

              <div className="pt-4 border-t border-[#1F1410]/8 flex justify-end gap-3">
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
