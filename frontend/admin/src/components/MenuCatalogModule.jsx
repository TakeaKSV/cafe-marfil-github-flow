import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit3,
  X,
  Eye,
  EyeOff,
  Upload,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Send
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { reglas } from '../utils/validacion';
import { resolverUrlImagen, subirImagenMenu } from '../api/cliente';
import { MenuProductPreviewCard } from './preview/MenuProductPreviewCard';
import { MenuFullPreviewModal } from './preview/MenuFullPreviewModal';

const COLORES_PRESET = [
  '#F5ECE8',
  '#FCEAE9',
  '#F48B89',
  '#C6A686',
  '#D8B288',
  '#BFA5E5',
  '#A9CFA5',
  '#E5A888',
  '#E6CA8E'
];

const IMAGENES_PRESET = [
  { label: 'Vaso Principal', url: '/images/Menu/vaso-principal.png' },
  { label: 'Vaso Café', url: '/images/Menu/vaso-cafe.png' },
  { label: 'Vaso Morado', url: '/images/Menu/vaso-morado.png' },
  { label: 'Hamburguesa', url: '/images/Menu/Hamburguesa.png' },
  { label: 'Desayunos', url: '/images/desayunos_marfil.jpg' },
  { label: 'Fresas Dubái', url: '/images/marfil_dubai_pistache.jpg' }
];

const CATEGORIAS_BASE = [
  { slug: 'salado', nombre: 'Brunch & Cocina Salada' },
  { slug: 'frappes', nombre: 'Frappés de Confitería' },
  { slug: 'especialidad', nombre: 'Barra de Especialidad' },
  { slug: 'postres', nombre: 'Postres & Dubái' },
  { slug: 'bar', nombre: 'Bebidas Sociales & Mezcal' }
];

function estadoInicialFormulario(base = null) {
  return {
    id: base?.id ?? null,
    nombre: base?.nombre ?? '',
    nombreCorto: base?.nombreCorto ?? '',
    categoriaSlug: base?.categoriaSlug ?? 'salado',
    etiqueta: base?.etiqueta ?? '',
    porcion: base?.porcion ?? '1 porción',
    precio: base?.precio ?? 145,
    calorias: base?.calorias ?? '',
    descripcion: base?.descripcion ?? '',
    imagen: base?.imagen ?? '/images/Menu/vaso-principal.png',
    colorCard: base?.colorCard ?? '#FCEAE9',
    badge: base?.badge ?? 'NUEVO',
    ingredientesTexto: Array.isArray(base?.ingredientes) ? base.ingredientes.join('\n') : '',
    alergenosTexto: Array.isArray(base?.alergenos) ? base.alergenos.join(', ') : '',
    disponibleEnCocina: base?.disponibleEnCocina ?? true,
    stockDiario: base?.stockDiario ?? 30,
    tiempoPrepMin: base?.tiempoPrepMin ?? 10,
    destacado: Boolean(base?.destacado),
    estado: base?.estado ?? 'borrador'
  };
}

export const MenuCatalogModule = ({
  menuItems = [],
  categorias = [],
  usuario,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  onPublishMenuItem,
  onUnpublishMenuItem,
  onReorderMenuItems,
  soundEnabled
}) => {
  const esGerencia = usuario?.rol === 'admin' || usuario?.rol === 'gerente';

  const [activeCategory, setActiveCategory] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos'); // todos | publicado | borrador
  const [searchTerm, setSearchTerm] = useState('');
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [esNuevo, setEsNuevo] = useState(true);
  const [form, setForm] = useState(() => estadoInicialFormulario());
  const [errores, setErrores] = useState({});
  const [previewModo, setPreviewModo] = useState('desktop'); // desktop | mobile
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const listaCategorias = useMemo(
    () => (categorias.length > 0 ? categorias : CATEGORIAS_BASE),
    [categorias]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(null);
        else if (showFullPreview) setShowFullPreview(false);
        else if (editorAbierto) setEditorAbierto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorAbierto, showFullPreview, confirmDelete]);

  const filtered = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchesCat = activeCategory === 'todas' || item.categoriaSlug === activeCategory;
        const matchesEstado =
          filterEstado === 'todos' || (item.estado || 'publicado') === filterEstado;
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.nombre.toLowerCase().includes(q) ||
          (item.descripcion || '').toLowerCase().includes(q) ||
          (item.badge || '').toLowerCase().includes(q);
        return matchesCat && matchesEstado && matchesSearch;
      }),
    [menuItems, activeCategory, filterEstado, searchTerm]
  );

  const borradoresCount = menuItems.filter((i) => i.estado === 'borrador').length;

  const abrirNuevo = () => {
    setEsNuevo(true);
    setForm(estadoInicialFormulario());
    setErrores({});
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const abrirEditar = (item) => {
    setEsNuevo(false);
    setForm(estadoInicialFormulario(item));
    setErrores({});
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const abrirDuplicar = (item) => {
    setEsNuevo(true);
    setForm(
      estadoInicialFormulario({
        ...item,
        id: null,
        nombre: `${item.nombre} (Copia)`,
        estado: 'borrador'
      })
    );
    setErrores({});
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const setCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: null } : prev));
  };

  const handleSubirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      setErrores((p) => ({ ...p, imagen: 'Solo se permiten imágenes JPG, PNG o WebP.' }));
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setErrores((p) => ({ ...p, imagen: 'La imagen no puede superar 2 MB.' }));
      return;
    }

    setSubiendoImagen(true);
    setErrores((p) => ({ ...p, imagen: null }));
    try {
      const { url } = await subirImagenMenu(archivo);
      setCampo('imagen', url);
      if (soundEnabled) playSound('success');
    } catch (err) {
      setErrores((p) => ({ ...p, imagen: err.message }));
      if (soundEnabled) playSound('alert');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const construirPayload = (estadoDestino) => {
    const ingredientes = form.ingredientesTexto
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const alergenos = form.alergenosTexto
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      id: form.id,
      nombre: form.nombre.trim(),
      nombreCorto: form.nombreCorto.trim() || null,
      categoriaSlug: form.categoriaSlug,
      etiqueta: form.etiqueta.trim() || null,
      porcion: form.porcion.trim() || null,
      precio: Number(form.precio),
      calorias: form.calorias === '' || form.calorias === null ? null : Number(form.calorias),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim() || null,
      colorCard: form.colorCard || null,
      badge: form.badge.trim() || null,
      ingredientes,
      alergenos,
      disponibleEnCocina: Boolean(form.disponibleEnCocina),
      stockDiario: Number(form.stockDiario),
      tiempoPrepMin: Number(form.tiempoPrepMin),
      destacado: Boolean(form.destacado),
      estado: estadoDestino
    };
  };

  const validarFormulario = () => {
    const errs = {
      nombre: reglas.nombreItem(form.nombre, { min: 2, max: 120, etiqueta: 'El nombre del producto' }),
      nombreCorto: reglas.texto(form.nombreCorto, { max: 40, opcional: true, etiqueta: 'El nombre corto' }),
      categoriaSlug: reglas.requerido(form.categoriaSlug, 'Selecciona una categoría.'),
      precio: reglas.precio(form.precio, { min: 1, max: 100000 }),
      porcion: reglas.texto(form.porcion, { max: 80, opcional: true, etiqueta: 'La porción' }),
      calorias:
        form.calorias === '' || form.calorias === null
          ? null
          : reglas.entero(form.calorias, { min: 0, max: 5000, etiqueta: 'Las calorías' }),
      descripcion: reglas.texto(form.descripcion, { max: 600, opcional: true, etiqueta: 'La descripción' }),
      imagen: reglas.rutaImagen(form.imagen, { opcional: true }),
      stockDiario: reglas.entero(form.stockDiario, { min: 0, max: 10000, etiqueta: 'El stock diario' }),
      tiempoPrepMin: reglas.entero(form.tiempoPrepMin, { min: 0, max: 240, etiqueta: 'El tiempo de preparación' })
    };
    setErrores(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleGuardar = async (estadoDestino) => {
    if (guardando) return;
    if (!validarFormulario()) {
      if (soundEnabled) playSound('alert');
      return;
    }

    setGuardando(true);
    const payload = construirPayload(estadoDestino);
    const ok = esNuevo ? await onAddMenuItem(payload) : await onUpdateMenuItem(payload);
    setGuardando(false);
    if (!ok) return;

    if (soundEnabled) playSound('success');
    setEditorAbierto(false);
  };

  const handleToggleDisponibilidad = (item) => {
    const nuevoEstado = !item.disponibleEnCocina;
    onUpdateMenuItem({ ...item, disponibleEnCocina: nuevoEstado });
    if (soundEnabled) playSound(nuevoEstado ? 'toggle' : 'alert');
  };

  const handleMoverOrden = async (item, direccion) => {
    if (!onReorderMenuItems) return;
    const mismos = menuItems.filter((p) => p.categoriaSlug === item.categoriaSlug);
    const idx = mismos.findIndex((p) => p.id === item.id);
    const destino = idx + direccion;
    if (idx === -1 || destino < 0 || destino >= mismos.length) return;
    const reordenados = [...mismos];
    const [movido] = reordenados.splice(idx, 1);
    reordenados.splice(destino, 0, movido);
    const pares = reordenados.map((p, orden) => ({ id: p.id, orden }));
    await onReorderMenuItems(pares);
    if (soundEnabled) playSound('toggle');
  };

  const productoPreview = useMemo(() => {
    const cat = listaCategorias.find((c) => c.slug === form.categoriaSlug);
    return {
      ...construirPayload(form.estado),
      categoria: cat?.nombre || 'Especialidad'
    };
  }, [form, listaCategorias]);

  return (
    <div className="space-y-6 animate-menu-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#1F1410]/10 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Editor de Menú & Cocina en Vivo
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Crea, edita y previsualiza platillos como los verá el cliente antes de publicarlos en la PWA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playSound('toggle');
              setShowFullPreview(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F1410] hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Vista previa del menú completo
          </button>

          {esGerencia && (
            <button
              type="button"
              onClick={abrirNuevo}
              className="flex items-center gap-2 px-4 py-2 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Filtros: Estado (Publicados / Borradores), Categorías y Buscador */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('todas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'todas'
                  ? 'bg-[#1F1410] border-[#1F1410] text-white'
                  : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
              }`}
            >
              Todo el Menú ({menuItems.length})
            </button>
            {listaCategorias.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.slug
                    ? 'bg-[#1F1410] border-[#1F1410] text-white'
                    : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70 hover:bg-[#FAF7F5]'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white border border-[#1F1410]/15 rounded-xl p-0.5 text-xs font-mono">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'publicado', label: 'Publicados' },
                { id: 'borrador', label: `Borradores (${borradoresCount})` }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterEstado(st.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterEstado === st.id ? 'bg-[#FCEAE9] text-[#E12927]' : 'text-[#1F1410]/60 hover:text-[#1F1410]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2 text-[#1F1410]/40" />
              <input
                type="text"
                placeholder="Buscar platillo o bebida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927] font-body"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1F1410]/10 p-12 text-center">
          <UtensilsCrossed className="w-8 h-8 text-[#1F1410]/25 mx-auto mb-2" />
          <p className="font-display font-bold text-base text-[#1F1410]">No se encontraron productos</p>
          <p className="text-xs text-[#1F1410]/55 mt-1">
            Prueba cambiando los filtros o crea un nuevo producto con el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const esBorrador = item.estado === 'borrador';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all flex flex-col justify-between ${
                  esBorrador
                    ? 'border-amber-400 border-dashed bg-amber-50/20'
                    : item.disponibleEnCocina
                      ? 'border-[#1F1410]/10 hover:border-[#E12927]/40'
                      : 'border-rose-200 bg-rose-50/20 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      style={{ backgroundColor: item.colorCard || '#FAF7F5' }}
                      className="w-16 h-16 rounded-xl p-1.5 shrink-0 flex items-center justify-center border border-black/5 overflow-hidden"
                    >
                      <img
                        src={resolverUrlImagen(item.imagen)}
                        alt={item.nombre}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/images/Menu/vaso-principal.png';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            esBorrador
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {esBorrador ? 'BORRADOR' : 'PUBLICADO'}
                        </span>
                        {item.destacado && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FCEAE9] text-[#E12927] inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Inicio
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base text-[#1F1410] leading-tight truncate">
                        {item.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-black text-sm text-[#E12927]">
                          ${Number(item.precio).toFixed(0)} MXN
                        </span>
                        <span className="text-[11px] font-mono text-[#1F1410]/55 truncate">
                          · {item.porcion || 'Individual'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.descripcion && (
                    <p className="text-xs text-[#1F1410]/70 font-body line-clamp-2 mb-3">
                      {item.descripcion}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1F1410]/8 flex flex-col gap-2">
                  {/* Switch de disponibilidad en cocina (permitido a todos los roles) */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#1F1410]/65">
                      {item.disponibleEnCocina ? 'Disponible en cocina' : 'Agotado hoy'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleDisponibilidad(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        item.disponibleEnCocina
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {item.disponibleEnCocina ? 'ACTIVO' : 'AGOTADO'}
                    </button>
                  </div>

                  {/* Controles de gerencia */}
                  {esGerencia && (
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <div className="flex items-center gap-1">
                        {esBorrador ? (
                          <button
                            type="button"
                            onClick={() => onPublishMenuItem && onPublishMenuItem(item.id)}
                            className="px-2.5 py-1 bg-[#E12927] hover:bg-[#c51e1c] text-white text-[10px] font-mono font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            title="Publicar en la PWA"
                          >
                            <Send className="w-3 h-3" /> Publicar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUnpublishMenuItem && onUnpublishMenuItem(item.id)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-mono font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            title="Ocultar en borrador"
                          >
                            <EyeOff className="w-3 h-3" /> Borrador
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoverOrden(item, -1)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] hover:bg-[#1F1410] hover:text-white text-[#1F1410]/65 cursor-pointer transition-colors"
                          title="Subir orden"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoverOrden(item, 1)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] hover:bg-[#1F1410] hover:text-white text-[#1F1410]/65 cursor-pointer transition-colors"
                          title="Bajar orden"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirDuplicar(item)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] hover:bg-[#1F1410] hover:text-white text-[#1F1410]/65 cursor-pointer transition-colors"
                          title="Duplicar producto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEditar(item)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] hover:bg-[#E12927] hover:text-white text-[#1F1410]/75 cursor-pointer transition-colors"
                          title="Editar y previsualizar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(item)}
                          className="p-1.5 rounded-lg bg-[#FAF7F5] hover:bg-rose-600 hover:text-white text-rose-600 cursor-pointer transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editor con Vista Previa en Vivo (Split View) */}
      {editorAbierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
            onClick={() => setEditorAbierto(false)}
          >
            <div
              className="bg-white rounded-[28px] border border-[#1F1410]/15 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="px-6 py-4 border-b border-[#1F1410]/10 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F1410]">
                    {esNuevo ? 'Crear Producto del Menú' : 'Editar Producto del Menú'}
                  </h3>
                  <p className="text-xs text-[#1F1410]/55 font-body">
                    Edita a la izquierda y revisa la vista previa en tiempo real a la derecha.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditorAbierto(false)}
                  className="w-9 h-9 rounded-full bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410]/60 hover:text-[#E12927] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cuerpo Split: Formulario + Vista Previa */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
                {/* Columna Izquierda: Formulario */}
                <div className="lg:col-span-7 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#1F1410]/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setCampo('nombre', e.target.value)}
                        placeholder="Ej. Frappé Fresa Estilo Dubái"
                        className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-hidden ${
                          errores.nombre ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                        }`}
                      />
                      {errores.nombre && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.nombre}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Nombre corto (en tarjeta)
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        value={form.nombreCorto}
                        onChange={(e) => setCampo('nombreCorto', e.target.value)}
                        placeholder="Ej. FRESA DUBÁI"
                        className="w-full px-3.5 py-2 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                      {errores.nombreCorto && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.nombreCorto}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Categoría *
                      </label>
                      <select
                        value={form.categoriaSlug}
                        onChange={(e) => setCampo('categoriaSlug', e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-xl bg-white focus:border-[#E12927] focus:outline-hidden cursor-pointer"
                      >
                        {listaCategorias.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Precio (MXN) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={form.precio}
                        onChange={(e) => setCampo('precio', e.target.value)}
                        className={`w-full px-3.5 py-2 text-xs font-mono border rounded-xl focus:outline-hidden ${
                          errores.precio ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                        }`}
                      />
                      {errores.precio && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.precio}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Porción / Tamaño
                      </label>
                      <input
                        type="text"
                        value={form.porcion}
                        onChange={(e) => setCampo('porcion', e.target.value)}
                        placeholder="Ej. 16 oz"
                        className="w-full px-3.5 py-2 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">Badge</label>
                      <input
                        type="text"
                        maxLength={40}
                        value={form.badge}
                        onChange={(e) => setCampo('badge', e.target.value)}
                        placeholder="TOP SELLER"
                        className="w-full px-3 py-2 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">Calorías</label>
                      <input
                        type="number"
                        min="0"
                        max="5000"
                        value={form.calorias}
                        onChange={(e) => setCampo('calorias', e.target.value)}
                        placeholder="380"
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                      {errores.calorias && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.calorias}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">Stock/día *</label>
                      <input
                        type="number"
                        min="0"
                        value={form.stockDiario}
                        onChange={(e) => setCampo('stockDiario', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                      {errores.stockDiario && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.stockDiario}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">Prep (min) *</label>
                      <input
                        type="number"
                        min="0"
                        max="240"
                        value={form.tiempoPrepMin}
                        onChange={(e) => setCampo('tiempoPrepMin', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                      {errores.tiempoPrepMin && <p className="text-[11px] text-[#E12927] font-semibold mt-0.5">{errores.tiempoPrepMin}</p>}
                    </div>
                  </div>

                  {/* Imagen + Upload */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]">
                      Imagen del producto (sube JPG/PNG/WebP máx. 2 MB o elige una existente)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.imagen}
                        onChange={(e) => setCampo('imagen', e.target.value)}
                        placeholder="/images/Menu/vaso-principal.png"
                        className={`flex-1 px-3 py-2 text-xs font-mono border rounded-xl focus:outline-hidden ${
                          errores.imagen ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                        }`}
                      />
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold cursor-pointer transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{subiendoImagen ? 'Subiendo...' : 'Subir'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleSubirArchivo}
                          disabled={subiendoImagen}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {errores.imagen && <p className="text-[11px] text-[#E12927] font-semibold">{errores.imagen}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGENES_PRESET.map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => setCampo('imagen', img.url)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border cursor-pointer transition-colors ${
                            form.imagen === img.url
                              ? 'bg-[#FCEAE9] border-[#E12927] text-[#E12927] font-bold'
                              : 'bg-[#FAF7F5] border-[#1F1410]/10 text-[#1F1410]/70 hover:border-[#1F1410]/30'
                          }`}
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color de tarjeta */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]">
                      Color de fondo de tarjeta en la PWA
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLORES_PRESET.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCampo('colorCard', hex)}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                            form.colorCard === hex ? 'border-[#1F1410] scale-110' : 'border-black/10'
                          }`}
                          title={hex}
                        />
                      ))}
                      <input
                        type="color"
                        value={form.colorCard || '#FCEAE9'}
                        onChange={(e) => setCampo('colorCard', e.target.value)}
                        className="w-8 h-7 rounded cursor-pointer border border-[#1F1410]/15"
                        title="Elegir otro color"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono font-bold text-[#1F1410]">Descripción</label>
                      <span className="text-[10px] font-mono text-[#1F1410]/45">
                        {form.descripcion.length}/600
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={600}
                      value={form.descripcion}
                      onChange={(e) => setCampo('descripcion', e.target.value)}
                      placeholder="Describe los ingredientes estrella y preparación..."
                      className="w-full px-3.5 py-2 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                    />
                  </div>

                  {/* Ingredientes y Alérgenos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                        Ingredientes (uno por línea)
                      </label>
                      <textarea
                        rows={3}
                        value={form.ingredientesTexto}
                        onChange={(e) => setCampo('ingredientesTexto', e.target.value)}
                        placeholder={'Espresso Chiapas\nCrema de pistache\nKataifi dorado'}
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-mono font-bold text-[#1F1410] mb-1">
                          Alérgenos (separados por coma)
                        </label>
                        <input
                          type="text"
                          value={form.alergenosTexto}
                          onChange={(e) => setCampo('alergenosTexto', e.target.value)}
                          placeholder="Lácteos, Gluten, Pistache"
                          className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-xl focus:border-[#E12927] focus:outline-hidden"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FCEAE9]/60 border border-[#E12927]/20 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.destacado}
                          onChange={(e) => setCampo('destacado', e.target.checked)}
                          className="accent-[#E12927] w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#1F1410]">
                          Destacar en inicio (Tendencias)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Vista Previa en Vivo */}
                <div className="lg:col-span-5 p-6 bg-[#FAF8F5] flex flex-col items-center justify-between gap-4">
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#E12927]">
                        VISTA PREVIA EN VIVO
                      </span>
                      <p className="text-xs text-[#1F1410]/60 font-body">Así aparecerá en la PWA de clientes</p>
                    </div>
                    <div className="flex items-center bg-white border border-[#1F1410]/10 p-0.5 rounded-full">
                      <button
                        type="button"
                        onClick={() => setPreviewModo('desktop')}
                        className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                          previewModo === 'desktop' ? 'bg-[#1F1410] text-white' : 'text-[#1F1410]/55'
                        }`}
                        title="Vista escritorio"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewModo('mobile')}
                        className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                          previewModo === 'mobile' ? 'bg-[#1F1410] text-white' : 'text-[#1F1410]/55'
                        }`}
                        title="Vista móvil"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex-1 flex items-center justify-center py-12 px-2">
                    <div className={previewModo === 'mobile' ? 'w-full max-w-[330px] pl-4' : ''}>
                      <MenuProductPreviewCard producto={productoPreview} modo={previewModo} />
                    </div>
                  </div>

                  <div className="w-full p-3 rounded-xl bg-white border border-[#1F1410]/10 text-[11px] font-body text-[#1F1410]/70">
                    <strong>Borrador vs. Publicado:</strong> guarda como <em>Borrador</em> para revisar sin que lo vean los clientes, o pulsa <em>Publicar</em> para mostrarlo al instante en la carta.
                  </div>
                </div>
              </div>

              {/* Footer acciones */}
              <div className="px-6 py-4 border-t border-[#1F1410]/10 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorAbierto(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-[#1F1410]/60 hover:text-[#1F1410] hover:bg-[#FAF7F5] rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleGuardar('borrador')}
                    className="px-5 py-2.5 rounded-full border-2 border-[#1F1410] text-[#1F1410] hover:bg-[#1F1410] hover:text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Guardar borrador</span>
                  </button>
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => handleGuardar('publicado')}
                    className="px-6 py-2.5 rounded-full bg-[#E12927] hover:bg-[#c51e1c] text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#E12927]/25 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{guardando ? 'Guardando...' : 'Publicar en menú'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmación de eliminación */}
      {confirmDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#1F1410]/10 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-display font-bold text-lg text-[#1F1410]">¿Eliminar producto?</h4>
              <p className="text-xs text-[#1F1410]/70 font-body">
                Se retirará <strong>{confirmDelete.nombre}</strong> del menú activo. Su historial de ventas se conservará.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#1F1410]/70 hover:bg-[#FAF7F5] rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = confirmDelete.id;
                    setConfirmDelete(null);
                    if (onDeleteMenuItem) await onDeleteMenuItem(id);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold rounded-full cursor-pointer"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Vista Previa Completa */}
      <MenuFullPreviewModal
        isOpen={showFullPreview}
        onClose={() => setShowFullPreview(false)}
        menuItems={menuItems}
        onPublishItem={esGerencia ? onPublishMenuItem : null}
      />
    </div>
  );
};
