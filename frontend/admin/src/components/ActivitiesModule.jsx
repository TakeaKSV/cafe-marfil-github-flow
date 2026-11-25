import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Upload,
  Users
} from 'lucide-react';
import { resolverUrlImagen, subirImagen } from '../api/cliente';
import { playSound } from '../utils/audioFeedback';
import { reglas } from '../utils/validacion';

const CATEGORIAS_ACTIVIDAD = [
  { slug: 'cine', nombre: 'Cine & Proyecciones' },
  { slug: 'taller', nombre: 'Talleres & Catas' },
  { slug: 'musica', nombre: 'Música & Noches Acústicas' },
  { slug: 'juegos', nombre: 'Juegos de Mesa & Torneos' },
  { slug: 'temporada', nombre: 'Actividad de Temporada' },
  { slug: 'privados', nombre: 'Eventos Privados' }
];

function estadoInicial(base = null, sucursales = []) {
  return {
    id: base?.id ?? null,
    nombre: base?.nombre ?? '',
    categoriaSlug: base?.categoriaSlug ?? 'taller',
    sucursalId: base?.sucursalId ?? sucursales[0]?.id ?? 'porras-matriz',
    cupoTotal: base?.cupoTotal ?? 25,
    precio: base?.precio ?? 0,
    esGratis: base ? Boolean(base.esGratis) : true,
    resumen: base?.resumen ?? '',
    imagen: base?.imagen ?? '/images/board_games.jpg',
    fecha: base?.fecha ?? '',
    fechaTexto: base?.fechaTexto ?? '',
    horaInicio: base?.horaInicio ?? '',
    horaFin: base?.horaFin ?? '',
    horarioTexto: base?.horarioTexto ?? '',
    duracion: base?.duracion ?? '2 horas',
    descripcion: base?.descripcion ?? '',
    incluyeTexto: Array.isArray(base?.incluye) ? base.incluye.join('\n') : '',
    requisitos: base?.requisitos ?? '',
    activa: base?.activa ?? true
  };
}

export const ActivitiesModule = ({
  actividades = [],
  sucursales = [],
  usuario,
  onAddActividad,
  onUpdateActividad,
  soundEnabled
}) => {
  const esGerencia = usuario?.rol === 'admin' || usuario?.rol === 'gerente';

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas | activas | archivadas
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [esNueva, setEsNueva] = useState(true);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
  const [form, setForm] = useState(() => estadoInicial(null, sucursales));
  const [errores, setErrores] = useState({});
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const filtradas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return actividades.filter((a) => {
      if (filtroEstado === 'activas' && !a.activa) return false;
      if (filtroEstado === 'archivadas' && a.activa) return false;
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        (a.categoria || '').toLowerCase().includes(q) ||
        (a.sucursalNombre || '').toLowerCase().includes(q)
      );
    });
  }, [actividades, searchTerm, filtroEstado]);

  const abrirNueva = () => {
    if (!esGerencia) return;
    setEsNueva(true);
    setForm(estadoInicial(null, sucursales));
    setErrores({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const abrirEditar = (act) => {
    if (!esGerencia) return;
    setEsNueva(false);
    setForm(estadoInicial(act, sucursales));
    setErrores({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const actualizarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const handleSubirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      setErrores((prev) => ({ ...prev, imagen: 'Solo se permiten imágenes JPG, PNG o WebP.' }));
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setErrores((prev) => ({ ...prev, imagen: 'La imagen no debe superar 2 MB.' }));
      return;
    }
    setSubiendo(true);
    try {
      const resp = await subirImagen(archivo, 'actividades');
      actualizarCampo('imagen', resp.url);
      if (soundEnabled) playSound('success');
    } catch (err) {
      setErrores((prev) => ({ ...prev, imagen: err.message }));
    } finally {
      setSubiendo(false);
    }
  };

  const validar = () => {
    const e = {
      nombre: reglas.texto(form.nombre, { min: 3, max: 140, etiqueta: 'El nombre' }),
      resumen: reglas.texto(form.resumen, { min: 10, max: 400, etiqueta: 'El resumen' }),
      cupoTotal: reglas.entero(form.cupoTotal, { min: 1, max: 1000, etiqueta: 'El cupo' }),
      precio: form.esGratis ? null : reglas.precio(form.precio, { min: 0, max: 50000 })
    };
    setErrores(e);
    return !Object.values(e).some(Boolean);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!validar() || guardando) {
      if (soundEnabled) playSound('alert');
      return;
    }
    setGuardando(true);
    try {
      const cat = CATEGORIAS_ACTIVIDAD.find((c) => c.slug === form.categoriaSlug) || CATEGORIAS_ACTIVIDAD[0];
      const precioNum = form.esGratis ? 0 : Number(form.precio || 0);
      const payload = {
        nombre: form.nombre.trim(),
        categoria: cat.nombre,
        categoriaSlug: cat.slug,
        sucursalId: form.sucursalId,
        cupoTotal: Number(form.cupoTotal),
        precio: precioNum,
        esGratis: Boolean(form.esGratis || precioNum === 0),
        resumen: form.resumen.trim(),
        imagen: form.imagen?.trim() || null,
        fecha: form.fecha || null,
        fechaTexto: form.fechaTexto?.trim() || null,
        horaInicio: form.horaInicio || null,
        horaFin: form.horaFin || null,
        horarioTexto: form.horarioTexto?.trim() || null,
        duracion: form.duracion?.trim() || null,
        descripcion: form.descripcion?.trim() || form.resumen.trim(),
        incluye: form.incluyeTexto
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requisitos: form.requisitos?.trim() || null
      };

      const ok = esNueva
        ? await onAddActividad(payload)
        : await onUpdateActividad(form.id, payload);

      if (ok) {
        if (soundEnabled) playSound('success');
        setEditorAbierto(false);
      }
    } finally {
      setGuardando(false);
    }
  };

  const sucursalNombrePreview =
    sucursales.find((s) => s.id === form.sucursalId)?.nombre || 'Sucursal Marfil';
  const catPreview = CATEGORIAS_ACTIVIDAD.find((c) => c.slug === form.categoriaSlug)?.nombre || 'Actividad';

  // --- PANTALLA COMPLETA DE EDICIÓN / ALTA ---
  if (editorAbierto) {
    return (
      <div className="space-y-5 animate-menu-in pb-10">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#1F1410]/10 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditorAbierto(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Actividades
            </button>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410]">
                {esNueva ? 'Nueva Actividad o Evento' : `Editando: ${form.nombre || 'Actividad'}`}
              </h1>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Completa los datos esenciales y revisa en vivo cómo se verá en la app de clientes.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardar}
            className="px-6 py-2.5 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-colors"
          >
            {guardando ? 'Guardando...' : esNueva ? 'Publicar Actividad' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Formulario Simplificado */}
          <form
            onSubmit={handleGuardar}
            noValidate
            className="xl:col-span-7 bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-5"
          >
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Nombre de la actividad *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. Noche de Cine & Frappés"
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.nombre ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.nombre && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.nombre}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Categoría *</label>
                <select
                  value={form.categoriaSlug}
                  onChange={(e) => actualizarCampo('categoriaSlug', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-[#1F1410]/15 rounded-xl bg-white focus:outline-hidden focus:border-[#E12927]"
                >
                  {CATEGORIAS_ACTIVIDAD.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Sucursal *</label>
                <select
                  value={form.sucursalId}
                  onChange={(e) => actualizarCampo('sucursalId', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-[#1F1410]/15 rounded-xl bg-white focus:outline-hidden focus:border-[#E12927]"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Cupo total *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={form.cupoTotal}
                  onChange={(e) => actualizarCampo('cupoTotal', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-mono border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927]"
                />
                {errores.cupoTotal && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.cupoTotal}</p>}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Precio (MXN)</label>
                <input
                  type="number"
                  min="0"
                  disabled={form.esGratis}
                  value={form.esGratis ? 0 : form.precio}
                  onChange={(e) => actualizarCampo('precio', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm font-mono border border-[#1F1410]/15 rounded-xl disabled:bg-stone-100 focus:outline-hidden focus:border-[#E12927]"
                />
              </div>

              <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#1F1410]/15 bg-[#FAF7F5] cursor-pointer text-xs font-semibold text-[#1F1410]">
                <input
                  type="checkbox"
                  checked={form.esGratis}
                  onChange={(e) => {
                    actualizarCampo('esGratis', e.target.checked);
                    if (e.target.checked) actualizarCampo('precio', 0);
                  }}
                  className="accent-[#E12927] w-4 h-4"
                />
                Entrada libre
              </label>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Resumen corto para la tarjeta *
              </label>
              <textarea
                rows="3"
                value={form.resumen}
                onChange={(e) => actualizarCampo('resumen', e.target.value)}
                placeholder="Describe brevemente de qué trata la actividad..."
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                  errores.resumen ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {errores.resumen && <p className="text-xs text-[#E12927] font-semibold mt-1">{errores.resumen}</p>}
            </div>

            {/* Foto en la nube */}
            <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#1F1410]/10 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-mono font-bold text-[#1F1410]">Fotografía de la actividad</span>
                  <span className="text-[11px] text-[#1F1410]/60">JPG, PNG o WebP (máx. 2 MB) · se sube a la nube</span>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {subiendo ? 'Subiendo...' : 'Subir foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSubirFoto} className="hidden" disabled={subiendo} />
                </label>
              </div>
              {errores.imagen && <p className="text-xs text-[#E12927] font-semibold">{errores.imagen}</p>}
            </div>

            {/* Opciones Avanzadas Colapsables */}
            <div className="border border-[#1F1410]/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarAvanzado((v) => !v)}
                className="w-full px-4 py-3 bg-[#FAF7F5] hover:bg-[#FCEAE9]/50 flex items-center justify-between text-xs font-mono font-bold text-[#1F1410] cursor-pointer"
              >
                <span>Horario, fecha fija y detalles opcionales</span>
                {mostrarAvanzado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {mostrarAvanzado && (
                <div className="p-4 space-y-4 border-t border-[#1F1410]/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Fecha fija</label>
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => actualizarCampo('fecha', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Hora inicio</label>
                      <input
                        type="time"
                        value={form.horaInicio}
                        onChange={(e) => actualizarCampo('horaInicio', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Hora fin</label>
                      <input
                        type="time"
                        value={form.horaFin}
                        onChange={(e) => actualizarCampo('horaFin', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Texto de fecha (si es recurrente)</label>
                      <input
                        type="text"
                        value={form.fechaTexto}
                        onChange={(e) => actualizarCampo('fechaTexto', e.target.value)}
                        placeholder="Ej. Todos los viernes"
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Duración</label>
                      <input
                        type="text"
                        value={form.duracion}
                        onChange={(e) => actualizarCampo('duracion', e.target.value)}
                        placeholder="Ej. 2 horas"
                        className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">¿Qué incluye? (una línea por punto)</label>
                    <textarea
                      rows="3"
                      value={form.incluyeTexto}
                      onChange={(e) => actualizarCampo('incluyeTexto', e.target.value)}
                      placeholder={'Material incluido\nBebida de cortesía'}
                      className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Requisitos</label>
                    <input
                      type="text"
                      value={form.requisitos}
                      onChange={(e) => actualizarCampo('requisitos', e.target.value)}
                      placeholder="Ej. Consumo mínimo o reservación previa"
                      className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Vista Previa PWA en Vivo */}
          <div className="xl:col-span-5 sticky top-28 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1F1410]/70 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#E12927]" />
              Vista previa en la App de Clientes
            </div>

            <article className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-md">
              <div className="relative h-52 bg-[#FCEAE9]">
                <img
                  src={resolverUrlImagen(form.imagen)}
                  alt={form.nombre || 'Vista previa'}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#E12927] text-white font-mono text-[11px] font-bold uppercase">
                  {catPreview}
                </span>
                <span className="absolute bottom-3 right-3 px-3 py-1 rounded-md bg-[#1F1410]/90 text-white font-mono text-xs font-bold">
                  {form.esGratis || Number(form.precio) === 0 ? 'Entrada Libre' : `$${Number(form.precio || 0)} MXN`}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <h2 className="font-display text-xl font-bold text-[#1F1410] leading-snug">
                  {form.nombre || 'Nombre de tu actividad'}
                </h2>
                <p className="text-xs sm:text-sm text-[#1F1410]/75 leading-relaxed">
                  {form.resumen || 'Aquí aparecerá el resumen que verán tus clientes al explorar eventos.'}
                </p>

                <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-[#1F1410]/70">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FCEAE9] text-[#E12927] font-bold">
                    <MapPin className="w-3.5 h-3.5" /> {sucursalNombrePreview}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF7F5]">
                    <Users className="w-3.5 h-3.5" /> Cupo: {form.cupoTotal || 0}
                  </span>
                  {(form.fecha || form.fechaTexto) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF7F5]">
                      <Calendar className="w-3.5 h-3.5" /> {form.fecha || form.fechaTexto}
                    </span>
                  )}
                  {(form.horaInicio || form.horarioTexto) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF7F5]">
                      <Clock className="w-3.5 h-3.5" /> {form.horarioTexto || `${form.horaInicio}${form.horaFin ? ` - ${form.horaFin}` : ''}`}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  // --- LISTADO DE ACTIVIDADES ---
  return (
    <div className="space-y-6 animate-menu-in">
      <div className="bg-white p-5 rounded-2xl border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Editor de Actividades & Eventos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Crea, edita y gestiona el cupo y las fotos de talleres, noches de cine y música en vivo
          </p>
        </div>

        {esGerencia && (
          <button
            type="button"
            onClick={abrirNueva}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Actividad
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#1F1410]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar actividad, categoría o sucursal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#1F1410]/10">
          {[
            { id: 'todas', label: `Todas (${actividades.length})` },
            { id: 'activas', label: 'Activas' },
            { id: 'archivadas', label: 'Archivadas' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-colors ${
                filtroEstado === tab.id ? 'bg-[#E12927] text-white' : 'text-[#1F1410]/70 hover:bg-[#FCEAE9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#1F1410]/10 text-center text-sm text-[#1F1410]/60">
          No hay actividades que coincidan con el filtro actual.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtradas.map((act) => {
            const ocupacionPct = act.cupoTotal ? Math.min(100, Math.round((act.lugaresOcupados / act.cupoTotal) * 100)) : 0;
            return (
              <div
                key={act.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-2xs flex flex-col justify-between transition-all ${
                  act.activa ? 'border-[#1F1410]/10 hover:border-[#E12927]/40' : 'border-stone-200 opacity-70'
                }`}
              >
                <div>
                  <div className="relative h-40 bg-[#FCEAE9]">
                    <img
                      src={resolverUrlImagen(act.imagen)}
                      alt={act.nombre}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#1F1410]/85 text-white font-mono text-[10px] font-bold uppercase">
                      {act.categoria}
                    </span>
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                        act.activa ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-white'
                      }`}
                    >
                      {act.activa ? 'Activa' : 'Archivada'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-base text-[#1F1410] leading-snug">{act.nombre}</h3>
                      <span className="font-mono text-xs font-bold text-[#E12927] shrink-0">
                        {act.precioTexto}
                      </span>
                    </div>

                    <p className="text-xs text-[#1F1410]/70 line-clamp-2">{act.resumen}</p>

                    <div className="text-[11px] font-mono text-[#1F1410]/65 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E12927]" /> {act.sucursalNombre}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#E12927]" /> {act.fechaTexto || act.fecha || 'Permanente'}
                        {act.horarioTexto ? ` · ${act.horarioTexto}` : ''}
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#1F1410]/60">Lugares apartados</span>
                        <strong className="text-[#1F1410]">{act.lugaresOcupados} / {act.cupoTotal}</strong>
                      </div>
                      <div className="w-full h-1.5 bg-[#FAF7F5] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E12927]" style={{ width: `${ocupacionPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {esGerencia && (
                  <div className="px-4 py-3 bg-[#FAF7F5] border-t border-[#1F1410]/8 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(act)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#1F1410]/15 hover:border-[#E12927] text-xs font-semibold text-[#1F1410] hover:text-[#E12927] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateActividad(act.id, { activa: !act.activa })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#1F1410]/15 hover:border-[#1F1410] text-xs font-mono font-bold text-[#1F1410]/75 cursor-pointer"
                    >
                      {act.activa ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {act.activa ? 'Archivar' : 'Reactivar'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
