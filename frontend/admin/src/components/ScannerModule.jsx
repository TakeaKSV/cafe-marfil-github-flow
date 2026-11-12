import React, { useState } from 'react';
import { 
  QrCode, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  Gift, 
  Sparkles, 
  CalendarCheck, 
  ArrowRight, 
  History, 
  RefreshCw, 
  Check, 
  Tag, 
  UserCheck
} from 'lucide-react';
import { playSound } from '../utils/audioFeedback';

export const ScannerModule = ({ 
  reservaciones, 
  promociones, 
  clientesClub,
  historial,
  onUpdateReservacion,
  onUpdatePromocion,
  onUpdateClienteClub,
  soundEnabled 
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  // La bitácora viene de la API (prop `historial`); cada validación la registra el servidor.
  const [historialLocal, setHistorialEscaneos] = useState([]);
  const historialEscaneos = historial ?? historialLocal;

  const quickTokens = [
    { codigo: 'MF-RES-90142', label: 'Reserva Familia Rivas (5 personas)', tipo: 'reserva' },
    { codigo: 'MF-PROMO-2X1', label: 'Cupón 2x1 Frappés Jueves', tipo: 'promo' },
    { codigo: 'MF-PROMO-DUBAI', label: 'Combo Fresas Dubái + Cold Brew', tipo: 'promo' },
    { codigo: 'MF-CLUB-77312', label: 'Club Marfil: Paola (7/8 Sellos)', tipo: 'club' },
    { codigo: 'MF-CLUB-88410', label: 'Club Marfil: Fernando (¡Premio Listo!)', tipo: 'club' }
  ];

  const handleProcessCode = (codeToProcess) => {
    const raw = (codeToProcess || tokenInput).trim().toUpperCase();
    if (!raw) return;

    setIsScanning(true);

    // Simulación de lectura óptica (300ms)
    setTimeout(() => {
      setIsScanning(false);

      // 1. Buscar en Reservaciones
      const foundRes = reservaciones.find(r => r.folio.toUpperCase() === raw || r.tokenQR === raw);
      if (foundRes) {
        setScanResult({
          tipo: 'reserva',
          datos: foundRes,
          titulo: `Reservación: ${foundRes.folio}`,
          subtitulo: `${foundRes.comensal} · ${foundRes.personas} personas`,
          estado: foundRes.estado,
          mensaje: foundRes.estado === 'confirmada' 
            ? 'Reserva válida para hoy. Lista para asignar mesa.' 
            : foundRes.estado === 'en_curso'
            ? 'Comensal ya se encuentra en sala.'
            : `Reserva en estado: ${foundRes.estado}`
        });
        if (soundEnabled) playSound('checkin');
        return;
      }

      // 2. Buscar en Promociones / Cupones
      const foundPromo = promociones.find(p => p.codigo.toUpperCase() === raw);
      if (foundPromo) {
        setScanResult({
          tipo: 'promo',
          datos: foundPromo,
          titulo: `Cupón Válido: ${foundPromo.descuentoBadge}`,
          subtitulo: foundPromo.titulo,
          estado: foundPromo.estado,
          mensaje: foundPromo.beneficio
        });
        if (soundEnabled) playSound('coin');
        return;
      }

      // 3. Buscar en Clientes Club Marfil
      const foundClub = clientesClub.find(c => c.codigoCliente.toUpperCase() === raw);
      if (foundClub) {
        setScanResult({
          tipo: 'club',
          datos: foundClub,
          titulo: `Pasaporte Club Marfil: ${foundClub.nombre}`,
          subtitulo: `Nivel: ${foundClub.nivel} · ${foundClub.sellosActuales} de ${foundClub.sellosMeta} sellos`,
          estado: 'valido',
          mensaje: foundClub.recompensaDisponible 
            ? `¡TIENE RECOMPENSA DESBLOQUEADA! ${foundClub.recompensaNombre}` 
            : `Le falta(n) ${foundClub.sellosMeta - foundClub.sellosActuales} sello(s) para su próxima recompensa.`
        });
        if (soundEnabled) playSound('stamp');
        return;
      }

      // 4. Código inválido
      setScanResult({
        tipo: 'error',
        titulo: 'Código no reconocido',
        subtitulo: `Token: ${raw}`,
        mensaje: 'El folio escaneado no corresponde a ninguna reservación activa, cupón vigente ni membresía de Café Marfil.'
      });
      if (soundEnabled) playSound('alert');

    }, 350);
  };

  // Las tres acciones esperan a la API: si la rechaza (onUpdate... devuelve false)
  // el panel ya mostró el motivo y aquí no se anuncia un éxito que no ocurrió.
  const handleConfirmReservationCheckin = async () => {
    if (!scanResult || scanResult.tipo !== 'reserva') return;
    const res = scanResult.datos;
    if ((await onUpdateReservacion({ ...res, estado: 'en_curso' })) === false) return;

    setHistorialEscaneos([
      {
        id: Date.now(),
        codigo: res.folio,
        tipo: 'Pase de Reservación',
        descripcion: `${res.comensal} (${res.personas} personas)`,
        resultado: 'Check-in Realizado (En Sala)',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        exito: true
      },
      ...historialEscaneos
    ]);

    setScanResult({
      ...scanResult,
      estado: 'en_curso',
      mensaje: '¡Check-in registrado exitosamente! Mesa asignada.'
    });
    if (soundEnabled) playSound('success');
  };

  const handleRedeemCoupon = async () => {
    if (!scanResult || scanResult.tipo !== 'promo') return;
    const promo = scanResult.datos;
    if ((await onUpdatePromocion({ ...promo, canjesHoy: promo.canjesHoy + 1 })) === false) return;

    setHistorialEscaneos([
      {
        id: Date.now(),
        codigo: promo.codigo,
        tipo: 'Cupón de Promoción',
        descripcion: promo.titulo,
        resultado: 'Descuento Aplicado a Ticket',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        exito: true
      },
      ...historialEscaneos
    ]);

    setScanResult({
      ...scanResult,
      mensaje: `¡Cupón ${promo.codigo} canjeado con éxito! Se aplicó el beneficio.`
    });
    if (soundEnabled) playSound('coin');
  };

  const handleAddLoyaltyStamp = async () => {
    if (!scanResult || scanResult.tipo !== 'club') return;
    const cliente = scanResult.datos;
    const nuevoTotal = cliente.sellosActuales + 1;
    const completo = nuevoTotal >= cliente.sellosMeta;

    const actualizado = {
      ...cliente,
      sellosActuales: completo ? cliente.sellosMeta : nuevoTotal,
      puntos: cliente.puntos + 50,
      recompensaDisponible: completo ? true : cliente.recompensaDisponible,
      recompensaNombre: completo ? 'Copa Doble de Fresas Estilo Dubái GRATIS' : cliente.recompensaNombre
    };

    if ((await onUpdateClienteClub(actualizado)) === false) return;

    setHistorialEscaneos([
      {
        id: Date.now(),
        codigo: cliente.codigoCliente,
        tipo: 'Sello Club Marfil',
        descripcion: `${cliente.nombre} · Ahora tiene ${actualizado.sellosActuales}/8 sellos`,
        resultado: completo ? '¡PASAPORTE COMPLETADO!' : 'Sello Sumado (+50 pts)',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        exito: true
      },
      ...historialEscaneos
    ]);

    setScanResult({
      ...scanResult,
      datos: actualizado,
      subtitulo: `Nivel: ${actualizado.nivel} · ${actualizado.sellosActuales} de ${actualizado.sellosMeta} sellos`,
      mensaje: completo 
        ? '🎉 ¡Felicidades! Ha completado sus 8 sellos. Desbloqueó Copa Doble de Fresas Estilo Dubái GRATIS.' 
        : `¡Sello acreditado! Ahora tiene ${actualizado.sellosActuales} de 8 sellos.`
    });

    if (soundEnabled) playSound(completo ? 'success' : 'stamp');
  };

  const handleRedeemReward = async () => {
    if (!scanResult || scanResult.tipo !== 'club') return;
    const cliente = scanResult.datos;

    const reiniciado = {
      ...cliente,
      sellosActuales: 0,
      recompensaDisponible: false,
      recompensaNombre: null
    };

    if ((await onUpdateClienteClub(reiniciado)) === false) return;

    setHistorialEscaneos([
      {
        id: Date.now(),
        codigo: cliente.codigoCliente,
        tipo: 'Recompensa Canjeada',
        descripcion: `${cliente.nombre} canjeó Copa Dubái Gratis`,
        resultado: 'Premio Entregado · Nuevo Pasaporte 0/8',
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        exito: true
      },
      ...historialEscaneos
    ]);

    setScanResult({
      ...scanResult,
      datos: reiniciado,
      subtitulo: `Nivel: ${reiniciado.nivel} · 0 de 8 sellos`,
      mensaje: '¡Premio canjeado con éxito! Se ha iniciado un nuevo pasaporte de 8 sellos para el cliente.'
    });

    if (soundEnabled) playSound('success');
  };

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
          <p className="text-xs sm:text-sm text-[#1F1410]/50 font-body">
            Validación de folios de reservación, cupones promocionales y pasaportes de sellos Club Marfil
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FCEAE9] text-[#E12927] px-4 py-1.5 rounded-full border border-[#E12927]/20 text-xs font-mono font-bold">
          <Scan className="w-4 h-4 animate-spin text-[#E12927]" />
          Lector de Barra Óptica Activo
        </div>
      </div>

      {/* Grid Principal: Cámara / Input y Resultado de Validación */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Escáner y Tokens de Prueba */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-white p-6 rounded-2xl border border-[#1F1410]/8 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-[#1F1410]">
              Lectura de Código QR / Token Digital
            </h2>

            {/* Simulación visual de visor óptico de cámara */}
            <div className="relative w-full h-48 bg-[#1F1410] rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-[#1F1410]">
              {/* Línea láser de escaneo animada */}
              <div className="absolute inset-x-8 h-0.5 bg-[#E12927] shadow-[0_0_12px_#E12927] animate-bounce z-10" />

              {/* Guías de esquinas */}
              <div className="w-40 h-40 border-2 border-dashed border-white/40 rounded-xl flex items-center justify-center p-4">
                <Scan className="w-12 h-12 text-white/50" />
              </div>

              <span className="absolute bottom-2 text-[10px] font-mono text-white/60">
                Apunta el código del comensal o usa los botones de prueba
              </span>
            </div>

            {/* Input Manual de Token */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1F1410] mb-1">
                Ingresar Folio Manualmente o Simular Pistola Láser:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. MF-RES-90142, MF-PROMO-2X1..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProcessCode();
                  }}
                  className="flex-1 px-4 py-2 text-xs font-mono uppercase bg-[#FAF7F5] border border-[#1F1410]/15 rounded-full focus:outline-hidden focus:border-[#E12927]"
                />
                <button
                  onClick={() => handleProcessCode()}
                  disabled={isScanning}
                  className="px-5 py-2 bg-[#E12927] hover:bg-[#b51c1a] text-white text-xs font-mono font-bold rounded-full cursor-pointer shadow-xs transition-all hover:scale-102"
                >
                  {isScanning ? 'Leyendo...' : 'Escanear'}
                </button>
              </div>
            </div>

            {/* Botones de Prueba Rápida de Códigos */}
            <div className="pt-3 border-t border-[#1F1410]/8">
              <span className="block text-xs font-mono font-bold text-[#1F1410]/60 mb-2">
                ⚡ Folios de Prueba para Demostración:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickTokens.map(t => (
                  <button
                    key={t.codigo}
                    onClick={() => {
                      setTokenInput(t.codigo);
                      handleProcessCode(t.codigo);
                    }}
                    className="px-3 py-1.5 text-[11px] font-mono font-semibold bg-[#FAF7F5] hover:bg-[#FCEAE9] text-[#1F1410] hover:text-[#E12927] border border-[#1F1410]/10 rounded-full transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <strong>[{t.codigo}]</strong> {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>


        {/* Columna Derecha: Tarjeta de Resultado y Acciones de Caja */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-white p-6 rounded-md border border-[#1F1410]/10 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1410]/10 mb-4">
                <h2 className="font-display font-bold text-base text-[#1F1410]">
                  Comprobante Decodificado
                </h2>
                {scanResult && (
                  <button 
                    onClick={() => {
                      setScanResult(null);
                      setTokenInput('');
                    }}
                    className="text-xs text-[#1F1410]/50 hover:underline cursor-pointer font-mono"
                  >
                    Limpiar Pantalla
                  </button>
                )}
              </div>

              {!scanResult ? (
                <div className="py-16 text-center text-[#1F1410]/50 font-mono text-xs">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-[#1F1410]/20" />
                  <p>Escanea un código para validar su vigencia y aplicar promociones en caja.</p>
                </div>
              ) : scanResult.tipo === 'error' ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                  <h3 className="font-bold text-sm text-rose-900">{scanResult.titulo}</h3>
                  <p className="text-xs text-rose-700">{scanResult.mensaje}</p>
                </div>
              ) : (
                <div className="space-y-4 animate-menu-in">
                  
                  {/* Badge de Tipo */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF7F5] border border-[#1F1410]/15 rounded-xs text-[#1F1410]">
                      {scanResult.tipo === 'reserva' ? '📅 RESERVACIÓN DE MESA' : scanResult.tipo === 'promo' ? '🏷️ CUPÓN PROMOCIONAL' : '👑 CLUB MARFIL FIDELIDAD'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> VÁLIDO EN SISTEMA
                    </span>
                  </div>

                  {/* Título y detalles */}
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#1F1410]">
                      {scanResult.titulo}
                    </h3>
                    <p className="text-xs text-[#1F1410]/70 font-body mt-0.5">
                      {scanResult.subtitulo}
                    </p>
                  </div>

                  {/* Mensaje descriptivo */}
                  <div className="p-3 bg-[#FAF7F5] rounded-sm border border-[#1F1410]/10 text-xs text-[#1F1410] leading-relaxed">
                    {scanResult.mensaje}
                  </div>

                  {/* Render Especial para Pasaporte de Sellos Club Marfil */}
                  {scanResult.tipo === 'club' && (
                    <div className="p-4 bg-[#FCEAE9]/60 border border-[#E12927]/30 rounded-sm">
                      <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                        <span>Progreso Pasaporte de Sellos:</span>
                        <span className="text-[#E12927]">{scanResult.datos.sellosActuales} / {scanResult.datos.sellosMeta}</span>
                      </div>
                      
                      {/* Grid de 8 sellos visuales */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-3">
                        {Array.from({ length: 8 }).map((_, i) => {
                          const isFilled = i < scanResult.datos.sellosActuales;
                          return (
                            <div 
                              key={i} 
                              className={`h-10 rounded-xs border flex items-center justify-center font-mono text-[10px] font-bold ${
                                isFilled 
                                  ? 'bg-[#E12927] border-[#E12927] text-white shadow-xs' 
                                  : 'bg-white border-dashed border-[#1F1410]/30 text-[#1F1410]/30'
                              }`}
                            >
                              {isFilled ? '★' : `${i + 1}`}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-[#1F1410]/70 font-mono">
                        Puntos Marfil acumulados: <strong>{scanResult.datos.puntos} pts</strong>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción Inmediata de Caja */}
                  <div className="pt-3 border-t border-[#1F1410]/10 space-y-2">
                    
                    {scanResult.tipo === 'reserva' && (
                      <button
                        onClick={handleConfirmReservationCheckin}
                        className="w-full py-2.5 bg-[#E12927] hover:bg-[#b51c1a] text-white font-mono font-bold text-xs rounded-xs shadow-xs transition-colors cursor-pointer"
                      >
                        ✔ Marcar Llegada & Check-In en Sala
                      </button>
                    )}

                    {scanResult.tipo === 'promo' && (
                      <button
                        onClick={handleRedeemCoupon}
                        className="w-full py-2.5 bg-[#1F1410] hover:bg-[#E12927] text-white font-mono font-bold text-xs rounded-xs shadow-xs transition-colors cursor-pointer"
                      >
                        🏷️ Aplicar Descuento a Cuenta / Ticket
                      </button>
                    )}

                    {scanResult.tipo === 'club' && (
                      <div className="space-y-2">
                        {scanResult.datos.recompensaDisponible ? (
                          <button
                            onClick={handleRedeemReward}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Gift className="w-4 h-4" /> Entregar Copa Dubái Gratis & Iniciar Nuevo Pasaporte
                          </button>
                        ) : (
                          <button
                            onClick={handleAddLoyaltyStamp}
                            className="w-full py-2.5 bg-[#E12927] hover:bg-[#b51c1a] text-white font-mono font-bold text-xs rounded-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" /> +1 Sello de Visita (Consumo en Ticket)
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#1F1410]/10 text-center">
              <span className="text-[11px] font-mono text-[#1F1410]/50">
                Impresión térmica sincronizada con comandera POS
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Historial Reciente de Escaneos en el Turno */}
      <div className="bg-white p-5 rounded-md border border-[#1F1410]/10 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-[#E12927]" />
          <h3 className="font-display font-bold text-base text-[#1F1410]">
            Bitácora de Validaciones de Turno
          </h3>
        </div>

        <div className="divide-y divide-[#1F1410]/10">
          {historialEscaneos.map(item => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-[#1F1410] bg-[#FAF7F5] border border-[#1F1410]/15 px-2 py-0.5 rounded-xs">
                  {item.codigo}
                </span>
                <div>
                  <div className="font-semibold text-[#1F1410]">{item.tipo}</div>
                  <div className="text-[11px] text-[#1F1410]/60">{item.descripcion}</div>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="font-bold text-emerald-700 block">{item.resultado}</span>
                <span className="text-[10px] text-[#1F1410]/50">{item.hora}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
