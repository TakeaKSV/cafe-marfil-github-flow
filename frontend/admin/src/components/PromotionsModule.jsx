import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag,
  Plus,
  CheckCircle2,
  PauseCircle,
  X,
  Copy,
  Check,
  Edit3,
  Ticket,
  ArrowLeft,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { resolverUrlImagen, subirImagen } from '../api/cliente';
import { playSound } from '../utils/audioFeedback';
import { reglas } from '../utils/validacion';

const CATEGORIAS_PROMO = [
  { slug: 'mes', nombre: 'Promociones del mes' },
  { slug: 'temporada', nombre: 'Frappés & Indulgencia' },
  { slug: 'sucursal', nombre: 'Postres & Especialidad' },
  { slug: 'frecuentes', nombre: 'Clientes frecuentes' }
];

function estadoInicialPromo(base = null, sucursales = []) {
  return {
    id: base?.id ?? null,
    codigo: base?.codigo ?? '',
    titulo: base?.titulo ?? '',
    categoriaSlug: base?.categoriaSlug ?? 'mes',
    descuentoBadge: base?.descuentoBadge ?? '2x1',
    beneficio: base?.beneficio ?? '',
    vigencia: base?.vigencia ?? 'Válido esta semana',
    limiteDiario: base?.limiteDiario ?? 40,
    imagen: base?.imagen ?? '/images/dubai_frappes.jpg',
    sucursales:
      Array.isArray(base?.sucursales) && base.sucursales.length > 0
        ? base.sucursales
        : sucursales.map((s) => s.id)
  };
}

export const PromotionsModule = ({
  promociones = [],
  sucursales = [],
  selectedSucursal = 'todas',
  usuario,
  onUpdatePromocion,
  onAddPromocion,
  onCanjearPromocion,
  soundEnabled
}) => {
  const esGerencia = usuario?.rol === 'admin' || usuario?.rol === 'gerente';

  const [editorAbierto, setEditorAbierto] = useState(false);
  const [esNueva, setEsNueva] = useState(true);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
  const [form, setForm] = useState(() => estadoInicialPromo(null, sucursales));
  const [promoErrors, setPromoErrors] = useState({});
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal rápido de canje en caja
  const [promoACanjear, setPromoACanjear] = useState(null);
  const [sucursalCanje, setSucursalCanje] = useState('');
  const [codigoClienteCanje, setCodigoClienteCanje] = useState('');
  const [canjeando, setCanjeando] = useState(false);

  const abrirNueva = () => {
    if (!esGerencia) return;
    setEsNueva(true);
    setForm(estadoInicialPromo(null, sucursales));
    setPromoErrors({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const abrirEditar = (promo) => {
    if (!esGerencia) return;
    setEsNueva(false);
    setForm(estadoInicialPromo(promo, sucursales));
    setPromoErrors({});
    setMostrarAvanzado(false);
    setEditorAbierto(true);
    if (soundEnabled) playSound('toggle');
  };

  const handleToggleEstado = (promo) => {
    const nuevoEstado = promo.estado === 'activo' ? 'pausado' : 'activo';
    onUpdatePromocion({ ...promo, estado: nuevoEstado });
    if (soundEnabled) playSound('toggle');
  };

  const handleCopyCode = (codigo) => {
    navigator.clipboard?.writeText(codigo);
    setCopiedCode(codigo);
    if (soundEnabled) playSound('success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleSucursal = (id) => {
    setForm((prev) => {
      const existe = prev.sucursales.includes(id);
      const siguientes = existe ? prev.sucursales.filter((s) => s !== id) : [...prev.sucursales, id];
      return { ...prev, sucursales: siguientes };
    });
    setPromoErrors((p) => ({ ...p, sucursales: null }));
  };

  const handleSubirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendo(true);
    try {
      const resp = await subirImagen(archivo, 'promociones');
      setForm((prev) => ({ ...prev, imagen: resp.url }));
      if (soundEnabled) playSound('success');
    } catch (err) {
      setPromoErrors((p) => ({ ...p, imagen: err.message }));
    } finally {
      setSubiendo(false);
    }
  };

  const handleGuardarPromo = async (e) => {
    e.preventDefault();
    const errs = {
      codigo: reglas.codigoCupon(form.codigo),
      titulo: reglas.texto(form.titulo, { min: 3, max: 140, etiqueta: 'El título' }),
      descuentoBadge: reglas.texto(form.descuentoBadge, { min: 2, max: 30, etiqueta: 'El badge' }),
      limiteDiario: reglas.entero(form.limiteDiario, { min: 1, max: 5000, etiqueta: 'El límite diario' }),
      beneficio: reglas.texto(form.beneficio, { min: 5, max: 300, etiqueta: 'El beneficio' }),
      vigencia: reglas.texto(form.vigencia, { min: 3, max: 140, etiqueta: 'La vigencia' }),
      sucursales: form.sucursales.length === 0 ? 'Selecciona al menos una sucursal.' : null
    };
    setPromoErrors(errs);
    if (Object.values(errs).some(Boolean) || guardando) {
      if (soundEnabled) playSound('alert');
      return;
    }

    setGuardando(true);
    try {
      const cat = CATEGORIAS_PROMO.find((c) => c.slug === form.categoriaSlug) || CATEGORIAS_PROMO[0];
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        codigo: form.codigo.toUpperCase().trim(),
        titulo: form.titulo.trim(),
        categoria: cat.nombre,
        categoriaSlug: cat.slug,
        descuentoBadge: form.descuentoBadge.toUpperCase().trim(),
        beneficio: form.beneficio.trim(),
        vigencia: form.vigencia.trim(),
        limiteDiario: Number(form.limiteDiario),
        imagen: form.imagen?.trim() || null,
        sucursales: form.sucursales
      };

      const ok = esNueva ? await onAddPromocion(payload) : await onUpdatePromocion(payload);
      if (ok) {
        if (soundEnabled) playSound('success');
        setEditorAbierto(false);
      }
    } finally {
      setGuardando(false);
    }
  };

  const abrirCanje = (promo) => {
    setPromoACanjear(promo);
    const defaultSuc =
      selectedSucursal !== 'todas' && promo.sucursales?.includes(selectedSucursal)
        ? selectedSucursal
        : promo.sucursales?.[0] || sucursales[0]?.id || '';
    setSucursalCanje(defaultSuc);
    setCodigoClienteCanje('');
    if (soundEnabled) playSound('toggle');
  };

  const confirmarCanje = async (e) => {
    e.preventDefault();
    if (!promoACanjear || canjeando) return;
    setCanjeando(true);
    try {
      const ok = await onCanjearPromocion(promoACanjear.id, {
        sucursalId: sucursalCanje || undefined,
        codigoCliente: codigoClienteCanje.trim().toUpperCase() || undefined
      });
      if (ok) {
        if (soundEnabled) playSound('coin');
        setPromoACanjear(null);
      }
    } finally {
      setCanjeando(false);
    }
  };

  // --- EDITOR A PANTALLA COMPLETA ---
  if (editorAbierto) {
    return (
      <div className="space-y-5 animate-menu-in pb-10">
        <div className="sticky top-0 z-40 -mt-6 -mx-4 sm:-mx-6 lg:-mx-9 px-4 sm:px-6 lg:px-9 py-4 bg-white border-b border-[#1F1410]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditorAbierto(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] text-xs font-mono font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Cupones
            </button>
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#1F1410]">
                {esNueva ? 'Nuevo Cupón o Promoción' : `Editando: ${form.codigo}`}
              </h1>
              <p className="text-xs text-[#1F1410]/60 font-body">
                Los cambios se sincronizan al instante con la app de clientes y el escáner de caja.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={guardando}
            onClick={handleGuardarPromo}
            className="px-6 py-2.5 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm cursor-pointer"
          >
            {guardando ? 'Guardando...' : esNueva ? 'Lanzar Cupón' : 'Guardar Cambios'}
          </button>
        </div>

        <form
          onSubmit={handleGuardarPromo}
          noValidate
          className="max-w-3xl bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Código del cupón *</label>
              <input
                type="text"
                placeholder="Ej. MF-PROMO-WAFFLE"
                value={form.codigo}
                onChange={(e) => {
                  setForm({ ...form, codigo: e.target.value });
                  setPromoErrors((p) => ({ ...p, codigo: null }));
                }}
                className={`w-full px-4 py-2.5 text-sm font-mono uppercase border rounded-xl focus:outline-hidden ${
                  promoErrors.codigo ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {promoErrors.codigo && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.codigo}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Badge de descuento *</label>
              <input
                type="text"
                placeholder="Ej. 2x1, 20% OFF"
                value={form.descuentoBadge}
                onChange={(e) => {
                  setForm({ ...form, descuentoBadge: e.target.value });
                  setPromoErrors((p) => ({ ...p, descuentoBadge: null }));
                }}
                className={`w-full px-4 py-2.5 text-sm font-mono uppercase border rounded-xl focus:outline-hidden ${
                  promoErrors.descuentoBadge ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
                }`}
              />
              {promoErrors.descuentoBadge && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.descuentoBadge}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Título de la promoción *</label>
            <input
              type="text"
              placeholder="Ej. Miércoles de Waffles al 50%"
              value={form.titulo}
              onChange={(e) => {
                setForm({ ...form, titulo: e.target.value });
                setPromoErrors((p) => ({ ...p, titulo: null }));
              }}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                promoErrors.titulo ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
              }`}
            />
            {promoErrors.titulo && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.titulo}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Beneficio para el cliente *</label>
            <textarea
              rows="2"
              placeholder="Ej. Segundo frappé de igual o menor precio gratis"
              value={form.beneficio}
              onChange={(e) => {
                setForm({ ...form, beneficio: e.target.value });
                setPromoErrors((p) => ({ ...p, beneficio: null }));
              }}
              className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-hidden ${
                promoErrors.beneficio ? 'border-[#E12927]' : 'border-[#1F1410]/15 focus:border-[#E12927]'
              }`}
            />
            {promoErrors.beneficio && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.beneficio}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Vigencia *</label>
              <input
                type="text"
                placeholder="Ej. Jueves de 4:00 PM a 8:00 PM"
                value={form.vigencia}
                onChange={(e) => {
                  setForm({ ...form, vigencia: e.target.value });
                  setPromoErrors((p) => ({ ...p, vigencia: null }));
                }}
                className="w-full px-4 py-2.5 text-sm border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927]"
              />
              {promoErrors.vigencia && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.vigencia}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">Límite de canjes / día *</label>
              <input
                type="number"
                min="1"
                max="5000"
                value={form.limiteDiario}
                onChange={(e) => {
                  setForm({ ...form, limiteDiario: e.target.value });
                  setPromoErrors((p) => ({ ...p, limiteDiario: null }));
                }}
                className="w-full px-4 py-2.5 text-sm font-mono border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927]"
              />
              {promoErrors.limiteDiario && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.limiteDiario}</p>}
            </div>
          </div>

          <div>
            <span className="block text-xs font-mono font-bold text-[#1F1410] mb-2">Sucursales participantes *</span>
            <div className="flex flex-wrap gap-2">
              {sucursales.map((s) => {
                const activa = form.sucursales.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSucursal(s.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                      activa
                        ? 'bg-[#FCEAE9] border-[#E12927] text-[#E12927]'
                        : 'bg-white border-[#1F1410]/15 text-[#1F1410]/70'
                    }`}
                  >
                    {activa ? '✓ ' : ''}{s.nombre}
                  </button>
                );
              })}
            </div>
            {promoErrors.sucursales && <p className="text-xs font-semibold text-[#E12927] mt-1">{promoErrors.sucursales}</p>}
          </div>

          <div className="border border-[#1F1410]/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarAvanzado((v) => !v)}
              className="w-full px-4 py-3 bg-[#FAF7F5] hover:bg-[#FCEAE9]/50 flex items-center justify-between text-xs font-mono font-bold text-[#1F1410] cursor-pointer"
            >
              <span>Foto y categoría de filtro (opcional)</span>
              {mostrarAvanzado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {mostrarAvanzado && (
              <div className="p-4 space-y-4 border-t border-[#1F1410]/10">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">Categoría en la app</label>
                  <select
                    value={form.categoriaSlug}
                    onChange={(e) => setForm({ ...form, categoriaSlug: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1F1410]/15 rounded-lg bg-white"
                  >
                    {CATEGORIAS_PROMO.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolverUrlImagen(form.imagen)}
                      alt="Vista previa"
                      className="w-14 h-14 rounded-lg object-cover border border-[#1F1410]/10"
                    />
                    <span className="text-xs text-[#1F1410]/70">Imagen de portada del cupón</span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1F1410] hover:bg-[#E12927] text-white text-xs font-mono font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {subiendo ? 'Subiendo...' : 'Subir foto'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSubirFoto} className="hidden" disabled={subiendo} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    );
  }

  // --- LISTADO DE PROMOCIONES Y CUPONES ---
  return (
    <div className="space-y-6 animate-menu-in">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#1F1410]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Promociones Semanales & Cuponera Digital
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Crea, edita, pausa y canjea cupones en caja con control de límite diario por sucursal
          </p>
        </div>

        {esGerencia && (
          <button
            type="button"
            onClick={abrirNueva}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E12927] hover:bg-[#c9201f] text-white text-xs sm:text-sm font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nuevo Cupón
          </button>
        )}
      </div>

      {/* Grid de Campañas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promociones.map((promo, idx) => {
          const isActiva = promo.estado === 'activo';
          const agotado = promo.canjesHoy >= promo.limiteDiario;
          const porcentajeUso = promo.limiteDiario ? Math.round((promo.canjesHoy / promo.limiteDiario) * 100) : 0;

          return (
            <div
              key={promo.id}
              style={{ animationDelay: `${(idx % 4) * 50}ms` }}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between ${
                isActiva
                  ? 'border-[#1F1410]/10 hover:border-[#E12927]/40'
                  : 'border-gray-200 bg-gray-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-[#E12927] text-white px-2.5 py-0.5 rounded-sm">
                      {promo.descuentoBadge}
                    </span>
                    <span className="text-xs text-[#1F1410]/60 font-mono">{promo.categoria}</span>
                  </div>

                  {esGerencia ? (
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(promo)}
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 ${
                        isActiva
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isActiva ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      {isActiva ? 'Activa' : 'Pausada'}
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-[#1F1410]/70">
                      {isActiva ? 'Activa' : 'Pausada'}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg text-[#1F1410] mb-1">{promo.titulo}</h3>
                <p className="text-xs text-[#1F1410]/80 leading-relaxed mb-4">{promo.beneficio}</p>

                {/* Código de Cupón */}
                <div className="flex items-center justify-between p-2.5 bg-[#FAF7F5] border border-dashed border-[#1F1410]/20 rounded-xl mb-4">
                  <div className="font-mono text-xs">
                    <span className="text-[#1F1410]/50 block text-[10px]">CÓDIGO DIGITAL:</span>
                    <strong className="text-sm text-[#1F1410] tracking-wider">{promo.codigo}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(promo.codigo)}
                      className="px-2.5 py-1.5 bg-white border border-[#1F1410]/15 hover:border-[#E12927] text-[#1F1410] rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === promo.codigo ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </>
                      )}
                    </button>
                    {esGerencia && (
                      <button
                        type="button"
                        onClick={() => abrirEditar(promo)}
                        className="px-2.5 py-1.5 bg-white border border-[#1F1410]/15 hover:border-[#E12927] text-[#1F1410] hover:text-[#E12927] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progreso + Botón Canjear */}
              <div className="pt-3 border-t border-[#1F1410]/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#1F1410]/60">Canjes hoy:</span>
                  <span className={`font-bold ${agotado ? 'text-[#E12927]' : 'text-[#1F1410]'}`}>
                    {promo.canjesHoy} / {promo.limiteDiario} ({porcentajeUso}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FAF7F5] rounded-full overflow-hidden border border-[#1F1410]/10">
                  <div
                    className="h-full bg-[#E12927] transition-all duration-300"
                    style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[#1F1410]/55 font-mono truncate">
                    {promo.vigencia}
                  </span>
                  <button
                    type="button"
                    disabled={!isActiva || agotado}
                    onClick={() => abrirCanje(promo)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1F1410] hover:bg-[#E12927] disabled:opacity-40 text-white text-xs font-mono font-bold cursor-pointer transition-colors shrink-0"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    {agotado ? 'Agotado hoy' : 'Canjear en caja'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Rápido de Canje de Cupón */}
      {promoACanjear &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-[#1F1410]/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPromoACanjear(null)}
          >
            <div
              className="bg-white rounded-2xl border border-[#1F1410]/10 max-w-md w-full p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase text-[#E12927]">
                    {promoACanjear.codigo}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#1F1410]">
                    Canjear cupón en caja
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPromoACanjear(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF7F5] flex items-center justify-center text-[#1F1410]/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#1F1410]/75 bg-[#FCEAE9]/60 border border-[#E12927]/20 rounded-xl p-3">
                <strong>{promoACanjear.titulo}:</strong> {promoACanjear.beneficio}
              </p>

              <form onSubmit={confirmarCanje} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">Sucursal</label>
                  <select
                    value={sucursalCanje}
                    onChange={(e) => setSucursalCanje(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#1F1410]/15 rounded-xl bg-white"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                    Código Club Marfil del cliente (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. MF-CLUB-33109"
                    value={codigoClienteCanje}
                    onChange={(e) => setCodigoClienteCanje(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase border border-[#1F1410]/15 rounded-xl focus:outline-hidden focus:border-[#E12927]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoACanjear(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#1F1410]/70 hover:bg-[#FAF7F5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={canjeando}
                    className="px-5 py-2 rounded-full bg-[#E12927] hover:bg-[#c9201f] disabled:opacity-50 text-white text-xs font-mono font-bold cursor-pointer"
                  >
                    {canjeando ? 'Registrando...' : 'Confirmar Canje'}
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
