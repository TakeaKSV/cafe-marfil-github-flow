import React, { useCallback, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ESTILOS_VARIANTE = {
  exito: {
    Icono: CheckCircle2,
    fondo: 'bg-white',
    borde: 'border-emerald-200',
    acento: 'border-l-emerald-600',
    iconoBg: 'bg-emerald-50 text-emerald-700',
    barra: 'bg-emerald-600',
    etiqueta: 'Éxito'
  },
  error: {
    Icono: AlertCircle,
    fondo: 'bg-white',
    borde: 'border-[#E12927]/30',
    acento: 'border-l-[#E12927]',
    iconoBg: 'bg-[#FCEAE9] text-[#E12927]',
    barra: 'bg-[#E12927]',
    etiqueta: 'Error'
  },
  advertencia: {
    Icono: AlertTriangle,
    fondo: 'bg-white',
    borde: 'border-amber-300',
    acento: 'border-l-amber-500',
    iconoBg: 'bg-amber-50 text-amber-700',
    barra: 'bg-amber-500',
    etiqueta: 'Aviso'
  },
  info: {
    Icono: Info,
    fondo: 'bg-white',
    borde: 'border-[#1F1410]/15',
    acento: 'border-l-[#1F1410]',
    iconoBg: 'bg-[#FAF7F5] text-[#1F1410]',
    barra: 'bg-[#1F1410]',
    etiqueta: 'Información'
  }
};

/**
 * Tarjeta de alerta en línea para estados de éxito, error, advertencia o información.
 */
export function AlertCard({
  variante = 'info',
  titulo,
  mensaje,
  accionTexto,
  onAccion,
  onClose,
  className = ''
}) {
  const cfg = ESTILOS_VARIANTE[variante] || ESTILOS_VARIANTE.info;
  const Icono = cfg.Icono;
  const esUrgente = variante === 'error' || variante === 'advertencia';

  return (
    <div
      role={esUrgente ? 'alert' : 'status'}
      className={`rounded-2xl border border-l-4 ${cfg.fondo} ${cfg.borde} ${cfg.acento} p-4 sm:p-5 shadow-xs flex items-start gap-3.5 ${className}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconoBg}`}>
        <Icono className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {titulo && (
          <h3 className="font-display font-bold text-sm sm:text-base text-[#1F1410] leading-snug m-0">
            {titulo}
          </h3>
        )}
        {mensaje && (
          <p className="font-body text-xs sm:text-sm text-[#1F1410]/75 leading-relaxed m-0">
            {mensaje}
          </p>
        )}
        {accionTexto && onAccion && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onAccion}
              className="px-4 py-1.5 rounded-full bg-[#E12927] hover:bg-[#c9201f] text-white font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              {accionTexto}
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar alerta"
          className="w-7 h-7 rounded-full hover:bg-[#FAF7F5] text-[#1F1410]/45 hover:text-[#1F1410] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Pila de tarjetas flotantes de alerta (toast) con autocierre y barra de progreso.
 */
export function AlertToastStack({ alertas = [], onDismiss }) {
  if (!alertas.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2.5 w-[min(92vw,24rem)] pointer-events-none"
    >
      {alertas.map((alerta) => {
        const cfg = ESTILOS_VARIANTE[alerta.variante] || ESTILOS_VARIANTE.info;
        const Icono = cfg.Icono;
        const duracion = alerta.duracion || 4500;

        return (
          <div
            key={alerta.id}
            role={alerta.variante === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-l-4 ${cfg.fondo} ${cfg.borde} ${cfg.acento} shadow-xl animate-menu-in`}
          >
            <div className="p-3.5 pr-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconoBg}`}>
                <Icono className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1F1410]/50">
                  {alerta.titulo || cfg.etiqueta}
                </div>
                <p className="font-body text-xs font-semibold text-[#1F1410] leading-snug mt-0.5 m-0">
                  {alerta.mensaje}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(alerta.id)}
                aria-label="Cerrar notificación"
                className="w-6 h-6 rounded-full hover:bg-[#FAF7F5] text-[#1F1410]/45 hover:text-[#1F1410] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-1 w-full bg-[#FAF7F5]">
              <div
                className={`h-full ${cfg.barra} marfil-toast-progress`}
                style={{ animationDuration: `${duracion}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook para gestionar alertas flotantes con autocierre limpio.
 */
export function useAlertas() {
  const [alertas, setAlertas] = useState([]);
  const timers = useRef(new Map());

  const cerrarAlerta = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const mostrarAlerta = useCallback(
    ({ variante = 'info', titulo, mensaje, duracion = 4500 }) => {
      if (!mensaje) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setAlertas((prev) => [...prev.slice(-3), { id, variante, titulo, mensaje, duracion }]);
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setAlertas((prev) => prev.filter((a) => a.id !== id));
      }, duracion);
      timers.current.set(id, timer);
    },
    []
  );

  const exito = useCallback(
    (mensaje, titulo = 'Acción completada') => mostrarAlerta({ variante: 'exito', titulo, mensaje }),
    [mostrarAlerta]
  );

  const error = useCallback(
    (mensaje, titulo = 'Ocurrió un error') => mostrarAlerta({ variante: 'error', titulo, mensaje, duracion: 6000 }),
    [mostrarAlerta]
  );

  const advertencia = useCallback(
    (mensaje, titulo = 'Atención') => mostrarAlerta({ variante: 'advertencia', titulo, mensaje }),
    [mostrarAlerta]
  );

  const info = useCallback(
    (mensaje, titulo = 'Información') => mostrarAlerta({ variante: 'info', titulo, mensaje }),
    [mostrarAlerta]
  );

  return { alertas, mostrarAlerta, cerrarAlerta, exito, error, advertencia, info };
}
