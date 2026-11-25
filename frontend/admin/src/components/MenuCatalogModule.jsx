import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  Upload,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Monitor,
  Smartphone,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';
import { reglas } from '../utils/validacion';
import { resolverUrlImagen, subirImagen } from '../api/cliente';
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
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDelete, showFullPreview]);

  const filtrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (activeCategory !== 'todas' && item.categoriaSlug !== activeCategory) return false;
      const estadoItem = item.estado || 'publicado';
      if (filterEstado !== 'todos' && estadoItem !== filterEstado) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        (item.descripcion || '').toLowerCase().includes(q) ||
        (item.categoria || '').toLowerCase().includes(q)
      );
    });
  }, [menuItems, activeCategory, filterEstado, searchTerm]);

  const totalBorradores = useMemo(
    () => menuItems.filter((i) => i.estado === 'borrador').length,
    [menuItems]
  );

  const abrirNuevo = () => {
    if (!esGerencia) return;
    setEsNuevo(true);
    setForm(estadoInicialFormulario());
    setErrores({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const abrirEditar = (item) => {
    if (!esGerencia) return;
    setEsNuevo(false);
    setForm(estadoInicialFormulario(item));
    setErrores({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const duplicarProducto = (item) => {
    if (!esGerencia) return;
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
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const actualizarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const handleSubirImagen = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (archivo.type !== 'image/png') {
      setErrores((prev) => ({ ...prev, imagen: 'Solo se permiten imágenes en formato PNG.' }));
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setErrores((prev) => ({ ...prev, imagen: 'La imagen no debe superar 2 MB.' }));
      return;
    }
    setSubiendoImagen(true);
    setErrores((prev) => ({ ...prev, imagen: null }));
    try {
      const resp = await subirImagen(archivo, 'menu');
      actualizarCampo('imagen', resp.url);
      if (soundEnabled) playSound('success');
    } catch (err) {
      setErrores((prev) => ({ ...prev, imagen: err.message }));
      if (soundEnabled) playSound('alert');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const construirPayload = useCallback(
    (estadoDestino) => {
      const ingredientes = form.ingredientesTexto
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const alergenos = form.alergenosTexto
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        ...(form.id ? { id: form.id } : {}),
        nombre: form.nombre.trim(),
        nombreCorto: form.nombreCorto.trim() || null,
        categoriaSlug: form.categoriaSlug,
        etiqueta: form.etiqueta.trim() || null,
        porcion: form.porcion.trim() || '1 porción',
        precio: Number(form.precio),
        calorias: form.calorias === '' || form.calorias === null ? null : Number(form.calorias),
        descripcion: form.descripcion.trim(),
        imagen: form.imagen.trim() || '/images/Menu/vaso-principal.png',
        colorCard: form.colorCard || '#FCEAE9',
        badge: form.badge.trim() || null,
        ingredientes,
        alergenos,
        disponibleEnCocina: Boolean(form.disponibleEnCocina),
        stockDiario: Number(form.stockDiario || 30),
        tiempoPrepMin: Number(form.tiempoPrepMin || 10),
        destacado: Boolean(form.destacado),
        estado: estadoDestino
      };
    },
    [form]
  );

  const validarFormulario = () => {
    const e = {
      nombre: reglas.texto(form.nombre, { min: 3, max: 120, etiqueta: 'El nombre' }),
      precio: reglas.precio(form.precio, { min: 1, max: 10000 }),
      descripcion: reglas.texto(form.descripcion, { min: 5, max: 600, etiqueta: 'La descripción' }),
      imagen: form.imagen ? reglas.rutaImagen(form.imagen, { opcional: true }) : null,
      stockDiario: reglas.entero(form.stockDiario, { min: 0, max: 5000, etiqueta: 'El stock diario' }),
      tiempoPrepMin: reglas.entero(form.tiempoPrepMin, { min: 0, max: 240, etiqueta: 'El tiempo de preparación' })
    };
    setErrores(e);
    return !Object.values(e).some(Boolean);
  };

  const handleGuardar = async (estadoDestino) => {
    if (!validarFormulario() || guardando) {
      if (soundEnabled) playSound('alert');
      return;
    }
    setGuardando(true);
    try {
      const payload = construirPayload(estadoDestino);
      const ok = esNuevo ? await onAddMenuItem(payload) : await onUpdateMenuItem(payload);
      if (ok) {
        if (soundEnabled) playSound('success');
        setEditorAbierto(false);
      }
    } finally {
      setGuardando(false);
    }
  };

  const moverProducto = async (idx, direccion) => {
    if (!esGerencia || !onReorderMenuItems) return;
    const destino = idx + direccion;
    if (destino < 0 || destino >= filtrados.length) return;
    const copia = [...filtrados];
    const [movido] = copia.splice(idx, 1);
    copia.splice(destino, 0, movido);
    const items = copia.map((item, posicion) => ({ id: item.id, orden: posicion + 1 }));
    await onReorderMenuItems(items);
    if (soundEnabled) playSound('toggle');
  };

  const productoPreview = useMemo(() => {
    const cat = listaCategorias.find((c) => c.slug === form.categoriaSlug);
    return {
      ...construirPayload(form.estado),
      categoria: cat?.nombre || 'Especialidad'
    };
  }, [construirPayload, form.estado, form.categoriaSlug, listaCategorias]);

  // =========================================================================
  // PANTALLA COMPLETA DE EDICIÓN / ALTA DE PLATILLO
  // =========================================================================
  if (editorAbierto) {
    return (
      <div className="space-y-5 animate-menu-in pb-10">
        {/* Barra Superior Fija de Pantalla Completa (pegada arriba sin huecos) */}
        <div className="sticky top-0 z-40 -mt-6 -mx-4 sm:-mx-6 lg:-mx-9 px-4 sm:px-6 lg:px-9 py-4 bg-white border-b border-[#1F1410]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditorAbierto(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al menú
            </button>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410]">
                {esNuevo ? 'Nuevo Platillo o Bebida' : `Editando: ${form.nombre || 'Platillo'}`}
              </h1>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Solo llena lo esencial y observa en tiempo real cómo se verá en la app de tus clientes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={guardando}
              onClick={() => handleGuardar('borrador')}
              className="px-4 py-2.5 rounded-full bg-white border border-[#1F1410]/20 hover:border-[#1F1410] text-[#1F1410] text-xs font-mono font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => handleGuardar('publicado')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {guardando ? 'Publicando...' : 'Publicar en menú'}
            </button>
          </div>
        </div>

        {/* Editor Dividido a Pantalla Completa: Formulario Simplificado + Vista Previa PWA */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Campos Esenciales + Opciones Avanzadas */}
          <div className="xl:col-span-7 bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-5">
            {/* 1. Nombre */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Nombre del platillo o bebida *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. Frappé Kinder Bueno 16oz"
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.nombre ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.nombre && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.nombre}</p>}
            </div>

            {/* 2. Categoría + 3. Precio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Categoría *</label>
                <select
                  value={form.categoriaSlug}
                  onChange={(e) => actualizarCampo('categoriaSlug', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-[#1F1410]/15 rounded-xl bg-white focus:outline-hidden focus:border-[#E12927]"
                >
                  {listaCategorias.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Precio (MXN) *</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={form.precio}
                  onChange={(e) => actualizarCampo('precio', e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm font-mono font-bold border rounded-xl focus:outline-hidden ${
                    errores.precio ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                  }`}
                />
                {errores.precio && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.precio}</p>}
              </div>
            </div>

            {/* 4. Descripción */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Descripción para el menú *
              </label>
              <textarea
                rows="3"
                value={form.descripcion}
                onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                placeholder="Describe brevemente los ingredientes principales y el sabor..."
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.descripcion ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.descripcion && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.descripcion}</p>}
            </div>

            {/* 5. Foto (Solo PNG, subida a la nube) */}
            <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-mono font-bold text-[#1F1410]">Fotografía del platillo</span>
                  <span className="text-[11px] text-[#1F1410]/60">Solo formato PNG (máx. 2 MB) · subida a la nube</span>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {subiendoImagen ? 'Subiendo...' : 'Subir PNG'}
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleSubirImagen}
                    className="hidden"
                    disabled={subiendoImagen}
                  />
                </label>
              </div>
              {errores.imagen && <p className="text-xs text-[#E12927] font-semibold">{errores.imagen}</p>}
            </div>

            {/* Toggles rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#1F1410]/12 bg-[#FAF7F5] cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-[#1F1410]">Disponible en cocina</span>
                  <span className="text-[11px] text-[#1F1410]/60">Si se apaga se marca como Agotado</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.disponibleEnCocina}
                  onChange={(e) => actualizarCampo('disponibleEnCocina', e.target.checked)}
                  className="accent-[#E12927] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#1F1410]/12 bg-[#FAF7F5] cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-[#1F1410]">Destacar en inicio</span>
                  <span className="text-[11px] text-[#1F1410]/60">Aparece en Tendencias de la PWA</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) => actualizarCampo('destacado', e.target.checked)}
                  className="accent-[#E12927] w-4 h-4"
                />
              </label>
            </div>

            {/* Opciones Avanzadas Colapsables */}
            <div className="border border-[#1F1410]/12 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarAvanzado((v) => !v)}
                className="w-full px-4 py-3 bg-[#FAF7F5] hover:bg-[#FCEAE9]/50 flex items-center justify-between text-xs font-mono font-bold text-[#1F1410] cursor-pointer"
              >
                <span>Opciones avanzadas (porción, color, badge, ingredientes y stock)</span>
                {mostrarAvanzado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mostrarAvanzado && (
                <div className="p-4 space-y-4 border-t border-[#1F1410]/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Nombre corto</label>
                      <input
                        type="text"
                        value={form.nombreCorto}
                        onChange={(e) => actualizarCampo('nombreCorto', e.target.value)}
                        placeholder="Ej. KINDER BUENO"
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Porción</label>
                      <input
                        type="text"
                        value={form.porcion}
                        onChange={(e) => actualizarCampo('porcion', e.target.value)}
                        placeholder="Ej. 16 oz / 1 plato"
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Badge</label>
                      <input
                        type="text"
                        value={form.badge}
                        onChange={(e) => actualizarCampo('badge', e.target.value)}
                        placeholder="Ej. TOP 1, NUEVO"
                        className="w-full px-3 py-2 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Stock diario</label>
                      <input
                        type="number"
                        min="0"
                        value={form.stockDiario}
                        onChange={(e) => actualizarCampo('stockDiario', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Tiempo prep (min)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.tiempoPrepMin}
                        onChange={(e) => actualizarCampo('tiempoPrepMin', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Calorías (kcal)</label>
                      <input
                        type="number"
                        min="0"
                        value={form.calorias}
                        onChange={(e) => actualizarCampo('calorias', e.target.value)}
                        placeholder="Opcional"
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1.5">Color de tarjeta</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORES_PRESET.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => actualizarCampo('colorCard', hex)}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                            form.colorCard === hex ? 'border-[#1F1410] scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">
                      Ingredientes (uno por línea)
                    </label>
                    <textarea
                      rows="3"
                      value={form.ingredientesTexto}
                      onChange={(e) => actualizarCampo('ingredientesTexto', e.target.value)}
                      placeholder={'Espresso doble\nLeche cremada\nAvellana'}
                      className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">
                      Alérgenos (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={form.alergenosTexto}
                      onChange={(e) => actualizarCampo('alergenosTexto', e.target.value)}
                      placeholder="Lácteos, Gluten, Frutos secos"
                      className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Vista Previa PWA en Vivo */}
          <div className="xl:col-span-5 sticky top-28 bg-[#FAF7F5] p-5 rounded-2xl border border-[#1F1410]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1F1410] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#E12927]" />
                Vista previa en vivo
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#1F1410]/10">
                <button
                  type="button"
                  onClick={() => setPreviewModo('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer ${
                    previewModo === 'desktop' ? 'bg-[#1F1410] text-white' : 'text-[#1F1410]/60'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Web
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModo('mobile')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer ${
                    previewModo === 'mobile' ? 'bg-[#1F1410] text-white' : 'text-[#1F1410]/60'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Móvil
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className={previewModo === 'mobile' ? 'w-[300px]' : 'w-full'}>
                <MenuProductPreviewCard producto={productoPreview} modo={previewModo} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA PRINCIPAL DEL CATÁLOGO
  // =========================================================================
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
            Controla platillos, precios, borradores, orden y disponibilidad en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFullPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FCEAE9] hover:bg-[#E12927] text-[#E12927] hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Vista Previa Menú
          </button>

          {esGerencia && (
            <button
              type="button"
              onClick={abrirNuevo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuevo Platillo
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#1F1410]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar platillo o bebida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927]"
          >
            <option value="todas">Todas las categorías ({menuItems.length})</option>
            {listaCategorias.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.nombre}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#1F1410]/10">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'publicado', label: 'Publicados' },
              { id: 'borrador', label: `Borradores (${totalBorradores})` }
            ].map((est) => (
              <button
                key={est.id}
                type="button"
                onClick={() => setFilterEstado(est.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                  filterEstado === est.id ? 'bg-[#E12927] text-white' : 'text-[#1F1410]/70 hover:bg-[#FCEAE9]'
                }`}
              >
                {est.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((item, idx) => {
          const esBorrador = item.estado === 'borrador';
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs flex flex-col justify-between gap-3 transition-all ${
                esBorrador
                  ? 'border-dashed border-amber-400 bg-amber-50/20'
                  : item.disponibleEnCocina
                    ? 'border-[#1F1410]/10 hover:border-[#E12927]/40'
                    : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex gap-3.5">
                <div className="w-20 h-20 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/10 overflow-hidden shrink-0">
                  <img
                    src={resolverUrlImagen(item.imagen)}
                    alt={item.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-[#FAF7F5] text-[#1F1410]/70">
                      {item.categoria}
                    </span>
                    {esBorrador && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800">
                        Borrador
                      </span>
                    )}
                    {item.destacado && (
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-[#FCEAE9] text-[#E12927]">
                        Top
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-[#1F1410] leading-snug truncate">
                    {item.nombre}
                  </h3>
                  <p className="text-xs text-[#1F1410]/65 line-clamp-2 mt-0.5">{item.descripcion}</p>
                  <div className="font-mono font-bold text-sm text-[#E12927] mt-1.5">
                    {item.precioStr || `$${item.precio} MXN`}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F1410]/8 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateMenuItem({ ...item, disponibleEnCocina: !item.disponibleEnCocina })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                    item.disponibleEnCocina
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {item.disponibleEnCocina ? 'Disponible' : 'Agotado'}
                </button>

                {esGerencia && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moverProducto(idx, -1)}
                      disabled={idx === 0}
                      title="Subir orden"
                      className="p-1.5 rounded-lg text-[#1F1410]/60 hover:bg-[#FAF7F5] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverProducto(idx, 1)}
                      disabled={idx === filtrados.length - 1}
                      title="Bajar orden"
                      className="p-1.5 rounded-lg text-[#1F1410]/60 hover:bg-[#FAF7F5] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        esBorrador ? onPublishMenuItem(item.id) : onUnpublishMenuItem(item.id)
                      }
                      title={esBorrador ? 'Publicar en menú' : 'Pasar a borrador'}
                      className="p-1.5 rounded-lg text-[#1F1410]/70 hover:bg-[#FCEAE9] hover:text-[#E12927] cursor-pointer"
                    >
                      {esBorrador ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicarProducto(item)}
                      title="Duplicar"
                      className="p-1.5 rounded-lg text-[#1F1410]/70 hover:bg-[#FAF7F5] cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEditar(item)}
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F5] hover:bg-[#FCEAE9] text-xs font-semibold text-[#1F1410] hover:text-[#E12927] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item)}
                      title="Eliminar"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Vista Previa Completa */}
      {showFullPreview && (
        <MenuFullPreviewModal
          isOpen={showFullPreview}
          onClose={() => setShowFullPreview(false)}
          productos={menuItems}
          categorias={listaCategorias}
          onPublish={esGerencia ? onPublishMenuItem : undefined}
        />
      )}

      {/* Modal Confirmación Eliminar */}
      {confirmDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="bg-white rounded-2xl border border-[#1F1410]/10 max-w-sm w-full p-6 shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-lg text-[#1F1410]">¿Eliminar del menú?</h3>
              <p className="text-xs text-[#1F1410]/70">
                Se ocultará <strong>{confirmDelete.nombre}</strong> de la carta pública y del panel.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#1F1410]/70 hover:bg-[#FAF7F5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onDeleteMenuItem(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#E12927] hover:bg-[#c9201f] text-white text-xs font-mono font-bold cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
