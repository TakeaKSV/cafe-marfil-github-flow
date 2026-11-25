import { useState, useCallback } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOMBRE_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9'’.\-&() ]+$/;
const CODIGO_RE = /^[A-Z0-9][A-Z0-9-]{2,39}$/;
const IMAGEN_RE = /^(?:\/(?:images|uploads)\/[^\s<>"]+|https?:\/\/[^\s<>"]+)$/i;

export const reglas = {
  requerido: (valor, mensaje = 'Este campo es obligatorio.') => {
    const texto = valor === null || valor === undefined ? '' : String(valor).trim();
    return texto.length > 0 ? null : mensaje;
  },

  email: (valor, { opcional = false } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'Ingresa un correo electrónico.';
    if (limpio.length > 190) return 'El correo es demasiado largo (máx. 190 caracteres).';
    if (!EMAIL_RE.test(limpio)) return 'Ingresa un correo electrónico válido (ej. admin@cafemarfil.mx).';
    return null;
  },

  telefonoMX: (valor, { opcional = false } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'Ingresa un teléfono de 10 dígitos.';
    const soloDigitos = limpio.replace(/\D/g, '');
    const normalizado = soloDigitos.length === 12 && soloDigitos.startsWith('52') ? soloDigitos.slice(2) : soloDigitos;
    if (normalizado.length !== 10) return 'Ingresa un teléfono válido de 10 dígitos (ej. 618-123-4567).';
    return null;
  },

  nombrePersona: (valor, { min = 2, max = 120, opcional = false } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'El nombre es obligatorio.';
    if (limpio.length < min) return `El nombre debe tener al menos ${min} caracteres.`;
    if (limpio.length > max) return `El nombre no puede superar ${max} caracteres.`;
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'’.\-& ]+$/.test(limpio)) return 'El nombre solo puede contener letras y espacios.';
    return null;
  },

  nombreItem: (valor, { min = 2, max = 120, etiqueta = 'El nombre' } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return `${etiqueta} es obligatorio.`;
    if (limpio.length < min) return `${etiqueta} debe tener al menos ${min} caracteres.`;
    if (limpio.length > max) return `${etiqueta} no puede superar ${max} caracteres.`;
    if (!NOMBRE_RE.test(limpio)) return `${etiqueta} contiene caracteres no permitidos.`;
    return null;
  },

  codigoCupon: (valor) => {
    const limpio = String(valor ?? '').trim().toUpperCase();
    if (!limpio) return 'Ingresa el código del cupón.';
    if (!CODIGO_RE.test(limpio)) {
      return 'Usa de 3 a 40 caracteres en mayúsculas, números y guiones (ej. MF-PROMO-2X1).';
    }
    return null;
  },

  fechaNoPasada: (iso) => {
    const limpio = String(iso ?? '').trim();
    if (!limpio) return 'Selecciona una fecha.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return 'Usa el formato AAAA-MM-DD.';
    const hoy = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date()
    );
    if (limpio < hoy) return 'La fecha no puede ser anterior a hoy.';
    return null;
  },

  entero: (valor, { min = 1, max = 100000, etiqueta = 'Este campo' } = {}) => {
    const str = String(valor ?? '').trim();
    if (!str) return `${etiqueta} es obligatorio.`;
    if (!/^-?\d+$/.test(str)) return `${etiqueta} debe ser un número entero.`;
    const n = Number(str);
    if (n < min) return `${etiqueta} debe ser al menos ${min}.`;
    if (n > max) return `${etiqueta} no puede superar ${max}.`;
    return null;
  },

  precio: (valor, { min = 1, max = 100000 } = {}) => {
    const str = String(valor ?? '').trim();
    if (!str) return 'Ingresa un precio.';
    if (!/^\d+(?:\.\d{1,2})?$/.test(str)) return 'Ingresa un precio válido con hasta 2 decimales.';
    const n = Number(str);
    if (n < min) return `El precio debe ser mayor o igual a $${min}.`;
    if (n > max) return `El precio no puede superar $${max}.`;
    return null;
  },

  texto: (valor, { min = 1, max = 500, opcional = false, etiqueta = 'Este campo' } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : `${etiqueta} es obligatorio.`;
    if (limpio.length < min) return `${etiqueta} debe tener al menos ${min} caracteres.`;
    if (limpio.length > max) return `${etiqueta} no puede superar ${max} caracteres.`;
    return null;
  },

  rutaImagen: (valor, { opcional = true } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'Selecciona o sube una imagen.';
    if (limpio.length > 300) return 'La ruta de imagen es demasiado larga.';
    if (!IMAGEN_RE.test(limpio)) return 'Usa una ruta local (/images/..., /uploads/...) o URL http(s)://.';
    return null;
  }
};

export function useFormulario(valoresIniciales, validarMapa) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});

  const validarCampo = useCallback(
    (campo, valor, estadoActual) => {
      const fn = validarMapa[campo];
      return fn ? fn(valor, estadoActual) : null;
    },
    [validarMapa]
  );

  const setCampo = useCallback(
    (campo, valor) => {
      setValores((prev) => {
        const siguiente = { ...prev, [campo]: valor };
        setErrores((prevErr) => {
          if (tocados[campo] || prevErr[campo]) {
            return { ...prevErr, [campo]: validarCampo(campo, valor, siguiente) };
          }
          return prevErr;
        });
        return siguiente;
      });
    },
    [tocados, validarCampo]
  );

  const onBlur = useCallback(
    (campo) => {
      setTocados((prev) => ({ ...prev, [campo]: true }));
      setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, valores[campo], valores) }));
    },
    [valores, validarCampo]
  );

  const validarTodo = useCallback(
    (camposFiltro) => {
      const campos = camposFiltro || Object.keys(validarMapa);
      const nuevosErrores = {};
      const nuevosTocados = {};
      let primerInvalido = null;

      for (const campo of campos) {
        nuevosTocados[campo] = true;
        const err = validarCampo(campo, valores[campo], valores);
        if (err) {
          nuevosErrores[campo] = err;
          if (!primerInvalido) primerInvalido = campo;
        }
      }

      setTocados((prev) => ({ ...prev, ...nuevosTocados }));
      setErrores((prev) => ({ ...prev, ...nuevosErrores }));

      if (primerInvalido && typeof document !== 'undefined') {
        const el = document.querySelector(`[data-campo="${primerInvalido}"]`);
        if (el && typeof el.focus === 'function') el.focus();
      }

      return { valido: !primerInvalido, errores: nuevosErrores, primerInvalido };
    },
    [valores, validarCampo, validarMapa]
  );

  const aplicarErroresApi = useCallback((error, mapaNombres = {}) => {
    const detalles = error?.detalles;
    if (!Array.isArray(detalles) || detalles.length === 0) return false;
    const nuevos = {};
    let primero = null;
    for (const d of detalles) {
      const clave = mapaNombres[d.campo] || d.campo;
      if (clave && !nuevos[clave]) {
        nuevos[clave] = d.mensaje;
        if (!primero) primero = clave;
      }
    }
    if (Object.keys(nuevos).length === 0) return false;
    setErrores((prev) => ({ ...prev, ...nuevos }));
    if (primero && typeof document !== 'undefined') {
      const el = document.querySelector(`[data-campo="${primero}"]`);
      if (el && typeof el.focus === 'function') el.focus();
    }
    return true;
  }, []);

  const resetear = useCallback((nuevosValores) => {
    setValores(nuevosValores ?? valoresIniciales);
    setErrores({});
    setTocados({});
  }, [valoresIniciales]);

  const propsCampo = (campo) => ({
    'data-campo': campo,
    'aria-invalid': Boolean(errores[campo]),
    'aria-describedby': errores[campo] ? `error-${campo}` : undefined,
    onBlur: () => onBlur(campo)
  });

  return {
    valores,
    setValores,
    errores,
    setErrores,
    setCampo,
    onBlur,
    validarTodo,
    aplicarErroresApi,
    resetear,
    propsCampo
  };
}
