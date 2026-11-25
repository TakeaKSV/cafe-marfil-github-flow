import React, { useMemo, useState } from 'react';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  Gift,
  Sparkles,
  History,
  Tag
} from 'lucide-react';
import { api } from '../api/cliente';
import { playSound } from '../utils/audioFeedback';

const ETIQUETA_TIPO = {
  reservacion: 'RESERVACIÓN DE MESA',
  promocion: 'CUPÓN PROMOCIONAL',
  club: 'CLUB MARFIL FIDELIDAD',
  beneficio: 'BENEFICIO CLUB MARFIL'
};

export const ScannerModule = ({
  reservaciones = [],
  promociones = [],
  historial = [],
  selectedSucursal = 'todas',
  onUpdateReservacion,
  onCanjearPromocion,
  onCanjearBeneficio,
  onUpdateClienteClub,
  onRecargar,
  soundEnabled
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [codigoClienteCupon, setCodigoClienteCupon] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Accesos rápidos generados únicamente desde registros reales activos en la base de datos.
  const accesosActivos = useMemo(() => {
    const lista = [];
    for (const r of reservaciones.filter((x) => x.estado === 'confirmada').slice(0, 2)) {
      lista.push({ codigo: r.folio, label: `${r.comensal} (${r.personas}p)` });
    }
    for (const p of promociones.filter((x) => x.estado === 'activo').slice(0, 3)) {
      lista.push({ codigo: p.codigo, label: `${p.descuentoBadge} · ${p.titulo}` });
    }
    return lista;
  }, [reservaciones, promociones]);

  const handleProcessCode = async (codeToProcess) => {
    const raw = (codeToProcess ?? tokenInput).trim().toUpperCase();
    if (!raw || isScanning) return;

    setIsScanning(true);
    setCodigoClienteCupon('');
    try {
      const resp = await api(`/escaner/${encodeURIComponent(raw)}`);
      const { tipo, estado, datos } = resp;

      if (tipo === 'reservacion') {
        setScanResult({
          tipo,
          estado,
          datos,
          titulo: `Reservación ${datos.folio}`,
          subtitulo: `${datos.comensal} · ${datos.personas} personas · ${datos.sucursalNombre}`,
          mensaje:
            estado === 'confirmada'
              ? `Reserva confirmada para ${datos.fechaTexto} a las ${datos.horaTexto}. Lista para check-in.`
              : `Estado actual de la reservación: ${estado}.`
        });
        if (soundEnabled) playSound('checkin');
      } else if (tipo === 'promocion') {
        const agotado = datos.canjesHoy >= datos.limiteDiario;
        setScanResult({
          tipo,
          estado,
          datos,
          titulo: `Cupón ${datos.descuentoBadge} · ${datos.codigo}`,
          subtitulo: `${datos.titulo} (${datos.canjesHoy}/${datos.limiteDiario} canjes hoy)`,
          mensaje:
            estado !== 'activo'
              ? 'Esta promoción está pausada actualmente.'
              : agotado
                ? `Límite diario alcanzado (${datos.limiteDiario} canjes hoy).`
                : datos.beneficio
        });
        if (soundEnabled) playSound('coin');
      } else if (tipo === 'club') {
        setScanResult({
          tipo,
          estado,
          datos,
          titulo: `Club Marfil: ${datos.nombre}`,
          subtitulo: `${datos.nivel} · ${datos.sellosActuales} de ${datos.sellosMeta} sellos · ${datos.puntos} pts`,
          mensaje: datos.recompensaDisponible
            ? `Tiene recompensa desbloqueada: ${datos.recompensaNombre}.`
            : `Faltan ${Math.max(0, datos.sellosMeta - datos.sellosActuales)} sello(s) para su próxima recompensa.`
        });
        if (soundEnabled) playSound('stamp');
      } else if (tipo === 'beneficio') {
        setScanResult({
          tipo,
          estado,
          datos,
          titulo: `Beneficio: ${datos.titulo}`,
          subtitulo: `${datos.clienteNombre} (${datos.codigoCliente}) · Folio ${datos.codigo}`,
          mensaje:
            estado === 'disponible'
              ? datos.subtitulo || 'Beneficio disponible para entregar en barra.'
              : `Este beneficio ya no está disponible (estado: ${estado}).`
        });
        if (soundEnabled) playSound('coin');
      }

      if (onRecargar) onRecargar();
    } catch (err) {
      setScanResult({
        tipo: 'error',
        titulo: 'Código no reconocido',
        subtitulo: `Código: ${raw}`,
        mensaje: err.message || 'El folio no corresponde a ninguna reservación, cupón o beneficio activo.'
      });
      if (soundEnabled) playSound('alert');
      if (onRecargar) onRecargar();
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmReservationCheckin = async () => {
    if (!scanResult || scanResult.tipo !== 'reservacion' || procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const ok = await onUpdateReservacion({ ...scanResult.datos, estado: 'en_curso' });
      if (!ok) return;
      setScanResult({
        ...scanResult,
        estado: 'en_curso',
        mensaje: 'Check-in registrado correctamente.'
      });
      if (soundEnabled) playSound('success');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!scanResult || scanResult.tipo !== 'promocion' || procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const promo = scanResult.datos;
      const sucursalId = selectedSucursal === 'todas' ? undefined : selectedSucursal;
      const ok = await onCanjearPromocion(promo.id, {
        sucursalId,
        codigoCliente: codigoClienteCupon.trim().toUpperCase() || undefined
      });
      if (!ok) return;
      const nuevosCanjes = (promo.canjesHoy || 0) + 1;
      setScanResult({
        ...scanResult,
        datos: { ...promo, canjesHoy: nuevosCanjes },
        subtitulo: `${promo.titulo} (${nuevosCanjes}/${promo.limiteDiario} canjes hoy)`,
        mensaje: `Cupón ${promo.codigo} canjeado y aplicado al ticket correctamente.`
      });
      setCodigoClienteCupon('');
      if (soundEnabled) playSound('coin');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleRedeemPersonalBenefit = async () => {
    if (!scanResult || scanResult.tipo !== 'beneficio' || procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const ok = await onCanjearBeneficio(scanResult.datos.codigo);
      if (!ok) return;
      setScanResult({
        ...scanResult,
        estado: 'usado',
        mensaje: `Beneficio ${scanResult.datos.codigo} marcado como entregado.`
      });
      if (soundEnabled) playSound('success');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleAddLoyaltyStamp = async () => {
    if (!scanResult || scanResult.tipo !== 'club' || procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const cliente = scanResult.datos;
      const nuevoTotal = Math.min(cliente.sellosMeta, cliente.sellosActuales + 1);
      const completo = cliente.sellosActuales < cliente.sellosMeta && nuevoTotal >= cliente.sellosMeta;
      const actualizado = {
        ...cliente,
        sellosActuales: nuevoTotal,
        puntos: cliente.puntos + 50,
        recompensaDisponible: completo ? true : cliente.recompensaDisponible
      };
      const ok = await onUpdateClienteClub(actualizado);
      if (!ok) return;
      setScanResult({
        ...scanResult,
        datos: actualizado,
        subtitulo: `${actualizado.nivel} · ${actualizado.sellosActuales} de ${actualizado.sellosMeta} sellos · ${actualizado.puntos} pts`,
        mensaje: completo
          ? '¡Pasaporte completado! El cliente desbloqueó su recompensa.'
          : `Sello acreditado (${actualizado.sellosActuales}/${actualizado.sellosMeta}).`
      });
      if (soundEnabled) playSound(completo ? 'success' : 'stamp');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!scanResult || scanResult.tipo !== 'club' || procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const cliente = scanResult.datos;
      const reiniciado = {
        ...cliente,
        sellosActuales: 0,
        recompensaDisponible: false,
        recompensaNombre: null
      };
      const ok = await onUpdateClienteClub(reiniciado);
      if (!ok) return;
      setScanResult({
        ...scanResult,
        datos: reiniciado,
        subtitulo: `${reiniciado.nivel} · 0 de ${reiniciado.sellosMeta} sellos · ${reiniciado.puntos} pts`,
        mensaje: 'Recompensa entregada. Se inició un nuevo pasaporte en 0 sellos.'
      });
      if (soundEnabled) playSound('success');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const promoAgotada =
    scanResult?.tipo === 'promocion' &&
    (scanResult.estado !== 'activo' || scanResult.datos.canjesHoy >= scanResult.datos.limiteDiario);

  return (
    <div className="space-y-6 animate-menu-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-5 h-5 text-[#E12927]" />
            <h1 className="font-display font-bold text-2xl text-[#1F1410]">
              Terminal Scanner de Caja & Pases QR
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#1F1410]/60 font-body">
            Validación en tiempo real de reservaciones, cupones promocionales, beneficios y pasaportes Club Marfil
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FCEAE9] text-[#E12927] px-4 py-1.5 rounded-full border border-[#E12927]/20 text-xs font-mono font-bold">
          <Scan className="w-4 h-4 text-[#E12927]" />
          Conectado a la API en vivo
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Entrada de Código */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/8 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-[#1F1410]">
              Validar Folio, Cupón o Código QR
            </h2>

            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1.5">
                Escanea con lector o escribe el código:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. MF-RES-..., MF-PROMO-..., MF-CLUB-..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProcessCode();
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-mono uppercase bg-[#FAF7F5] border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927]"
                />
                <button
                  type="button"
                  onClick={() => handleProcessCode()}
                  disabled={isScanning || !tokenInput.trim()}
                  className="px-5 py-2.5 bg-[#E12927] hover:bg-[#b51c1a] disabled:opacity-50 text-white text-xs font-mono font-bold rounded-full cursor-pointer shadow-xs transition-colors"
                >
                  {isScanning ? 'Validando...' : 'Validar'}
                </button>
              </div>
            </div>

            {accesosActivos.length > 0 && (
              <div className="pt-3 border-t border-[#1F1410]/8">
                <span className="block text-xs font-mono font-bold text-[#1F1410]/60 mb-2">
                  Códigos activos hoy en sistema:
                </span>
                <div className="flex flex-wrap gap-2">
                  {accesosActivos.map((t) => (
                    <button
                      key={t.codigo}
                      type="button"
                      onClick={() => {
                        setTokenInput(t.codigo);
                        handleProcessCode(t.codigo);
                      }}
                      className="px-3 py-1.5 text-[11px] font-mono font-semibold bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] border border-[#1F1410]/10 rounded-full transition-colors cursor-pointer text-left"
                    >
                      <strong>[{t.codigo}]</strong> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resultado */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/10 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10 mb-4">
                <h2 className="font-display font-bold text-base text-[#1F1410]">
                  Comprobante Decodificado
                </h2>
                {scanResult && (
                  <button
                    type="button"
                    onClick={() => {
                      setScanResult(null);
                      setTokenInput('');
                      setCodigoClienteCupon('');
                    }}
                    className="text-xs text-[#1F1410]/50 hover:underline cursor-pointer font-mono"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {!scanResult ? (
                <div className="py-14 text-center text-[#1F1410]/50 font-mono text-xs">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-[#1F1410]/20" />
                  <p>Ingresa o escanea un código para validar su estado real en la base de datos.</p>
                </div>
              ) : scanResult.tipo === 'error' ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                  <h3 className="font-bold text-sm text-rose-900">{scanResult.titulo}</h3>
                  <p className="text-xs text-rose-700">{scanResult.mensaje}</p>
                </div>
              ) : (
                <div className="space-y-4 animate-menu-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#FAF7F5] border border-[#1F1410]/15 rounded-md text-[#1F1410]">
                      {ETIQUETA_TIPO[scanResult.tipo] || scanResult.tipo}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> VERIFICADO
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-xl text-[#1F1410]">{scanResult.titulo}</h3>
                    <p className="text-xs text-[#1F1410]/70 font-body mt-0.5">{scanResult.subtitulo}</p>
                  </div>

                  <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#1F1410]/10 text-xs text-[#1F1410] leading-relaxed">
                    {scanResult.mensaje}
                  </div>

                  {scanResult.tipo === 'club' && (
                    <div className="p-4 bg-[#FCEAE9]/60 border border-[#E12927]/30 rounded-xl">
                      <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                        <span>Pasaporte de Sellos:</span>
                        <span className="text-[#E12927]">
                          {scanResult.datos.sellosActuales} / {scanResult.datos.sellosMeta}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-3">
                        {Array.from({ length: scanResult.datos.sellosMeta || 8 }).map((_, i) => {
                          const isFilled = i < scanResult.datos.sellosActuales;
                          return (
                            <div
                              key={i}
                              className={`h-9 rounded-md border flex items-center justify-center font-mono text-[10px] font-bold ${
                                isFilled
                                  ? 'bg-[#E12927] border-[#E12927] text-white'
                                  : 'bg-white border-dashed border-[#1F1410]/30 text-[#1F1410]/30'
                              }`}
                            >
                              {isFilled ? '★' : i + 1}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[11px] text-[#1F1410]/70 font-mono">
                        Puntos acumulados: <strong>{scanResult.datos.puntos} pts</strong>
                      </div>
                    </div>
                  )}

                  {scanResult.tipo === 'promocion' && !promoAgotada && (
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-[#1F1410]/70 mb-1">
                        Código Club Marfil del cliente (opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. MF-CLUB-33109"
                        value={codigoClienteCupon}
                        onChange={(e) => setCodigoClienteCupon(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#FAF7F5] border border-[#1F1410]/15 rounded-lg focus:outline-hidden focus:border-[#E12927]"
                      />
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#1F1410]/10 space-y-2">
                    {scanResult.tipo === 'reservacion' && scanResult.estado === 'confirmada' && (
                      <button
                        type="button"
                        disabled={procesandoAccion}
                        onClick={handleConfirmReservationCheckin}
                        className="w-full py-2.5 bg-[#E12927] hover:bg-[#b51c1a] disabled:opacity-50 text-white font-mono font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        {procesandoAccion ? 'Procesando...' : 'Marcar Llegada & Check-In en Sala'}
                      </button>
                    )}

                    {scanResult.tipo === 'promocion' && (
                      <button
                        type="button"
                        disabled={procesandoAccion || promoAgotada}
                        onClick={handleRedeemCoupon}
                        className="w-full py-2.5 bg-[#1F1410] hover:bg-[#E12927] disabled:opacity-40 text-white font-mono font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        {procesandoAccion
                          ? 'Registrando canje...'
                          : promoAgotada
                            ? 'Cupón no disponible para canje'
                            : 'Canjear Cupón y Aplicar a Ticket'}
                      </button>
                    )}

                    {scanResult.tipo === 'beneficio' && scanResult.estado === 'disponible' && (
                      <button
                        type="button"
                        disabled={procesandoAccion}
                        onClick={handleRedeemPersonalBenefit}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Gift className="w-4 h-4" />
                        {procesandoAccion ? 'Canjeando...' : 'Entregar Beneficio al Cliente'}
                      </button>
                    )}

                    {scanResult.tipo === 'club' && (
                      <div className="space-y-2">
                        {scanResult.datos.recompensaDisponible ? (
                          <button
                            type="button"
                            disabled={procesandoAccion}
                            onClick={handleRedeemReward}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Gift className="w-4 h-4" /> Entregar Recompensa & Reiniciar Pasaporte
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={procesandoAccion}
                            onClick={handleAddLoyaltyStamp}
                            className="w-full py-2.5 bg-[#E12927] hover:bg-[#b51c1a] disabled:opacity-50 text-white font-mono font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" /> +1 Sello de Visita (+50 pts)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historial Reciente de Escaneos */}
      <div className="bg-white p-5 rounded-2xl border border-[#1F1410]/10 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#E12927]" />
          <h3 className="font-display font-bold text-base text-[#1F1410]">
            Bitácora Real de Validaciones
          </h3>
        </div>

        {historial.length === 0 ? (
          <p className="text-xs font-mono text-[#1F1410]/50 py-4 text-center">
            Aún no hay validaciones registradas en la bitácora.
          </p>
        ) : (
          <div className="divide-y divide-[#1F1410]/10">
            {historial.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#1F1410] bg-[#FAF7F5] border border-[#1F1410]/15 px-2 py-0.5 rounded-sm">
                    {item.codigo}
                  </span>
                  <div>
                    <div className="font-semibold text-[#1F1410]">{item.tipo}</div>
                    <div className="text-[11px] text-[#1F1410]/60">{item.descripcion}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className={`font-bold block ${item.exito === false ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {item.resultado}
                  </span>
                  <span className="text-[10px] text-[#1F1410]/50">{item.hora}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
