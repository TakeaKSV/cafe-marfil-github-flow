import { useState, useCallback } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOMBRE_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'’.\-& ]+$/;
const IMAGEN_RE = /^(?:\/(?:images|uploads)\/[^\s<>"]+|https?:\/\/[^\s<>"]+)$/i;

export const reglas = {
  requerido: (valor, mensaje = 'Este campo es obligatorio.') => {
    const texto = valor === null || valor === undefined ? '' : String(valor).trim();
    return texto.length > 0 ? null : mensaje;
  },

  email: (valor, { opcional = false } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'Ingresa tu correo electrónico.';
    if (limpio.length > 190) return 'El correo es demasiado largo (máx. 190 caracteres).';
    if (!EMAIL_RE.test(limpio)) return 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).';
    return null;
  },

  telefonoMX: (valor, { opcional = false } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : 'Ingresa un teléfono de 10 dígitos.';
    const soloDigitos = limpio.replace(/\D/g, '');
    const normalizado = soloDigitos.length === 12 && soloDigitos.startsWith('52') ? soloDigitos.slice(2) : soloDigitos;
    if (normalizado.length !== 10) return 'Ingresa un teléfono válido de 10 dígitos (ej. 618 123 4567).';
    return null;
  },

  nombre: (valor, { min = 2, max = 120, opcional = false, etiqueta = 'El nombre' } = {}) => {
    const limpio = String(valor ?? '').trim();
    if (!limpio) return opcional ? null : `${etiqueta} es obligatorio.`;
    if (limpio.length < min) return `${etiqueta} debe tener al menos ${min} caracteres.`;
    if (limpio.length > max) return `${etiqueta} no puede superar ${max} caracteres.`;
    if (!NOMBRE_RE.test(limpio)) return `${etiqueta} contiene caracteres no permitidos.`;
    return null;
  },

  passwordSegura: (valor) => {
    const texto = String(valor ?? '');
    if (!texto) return 'Ingresa una contraseña.';
    if (texto.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (new TextEncoder().encode(texto).length > 72) return 'La contraseña no puede superar 72 caracteres.';
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(texto) || !/\d/.test(texto)) {
      return 'La contraseña debe incluir al menos una letra y un número.';
    }
    return null;
  },

  confirmarPassword: (valor, original) => {
    if (!valor) return 'Confirma tu contraseña.';
    if (valor !== original) return 'Las contraseñas no coinciden.';
    return null;
  },

  fechaNoPasada: (iso) => {
    const limpio = String(iso ?? '').trim();
    if (!limpio) return 'Selecciona una fecha.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return 'Formato de fecha inválido (AAAA-MM-DD).';
    const hoy = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date()
    );
    if (limpio < hoy) return 'La fecha no puede ser anterior a hoy.';
    return null;
  },

  entero: (valor, { min = 1, max = 100000, etiqueta = 'Este valor' } = {}) => {
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
    if (!limpio) return opcional ? null : 'Ingresa una ruta o sube una imagen.';
    if (limpio.length > 300) return 'La ruta de imagen es demasiado larga.';
    if (!IMAGEN_RE.test(limpio)) return 'Usa una ruta local (/images/..., /uploads/...) o una URL http(s):// válida.';
    return null;
  }
};

/**
 * Hook de formulario con validación por campo, estado `tocado`, foco al primer
 * error y mapeo automático de errores 400 del backend (`detalles[]`).
 */
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
          const nextErr = { ...prevErr };
          if (tocados[campo] || prevErr[campo]) {
            nextErr[campo] = validarCampo(campo, valor, siguiente);
          }
          // Re-validar confirmación si cambia la contraseña
          if (campo === 'password' && validarMapa.confirmarPassword && (tocados.confirmarPassword || prevErr.confirmarPassword)) {
            nextErr.confirmarPassword = validarCampo('confirmarPassword', siguiente.confirmarPassword, siguiente);
          }
          return nextErr;
        });
        return siguiente;
      });
    },
    [tocados, validarCampo, validarMapa]
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
