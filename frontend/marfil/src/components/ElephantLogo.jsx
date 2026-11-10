import React from 'react';

/**
 * Isotipo oficial de Café Marfil:
 * Elefante trazado con líneas continuas geométricas dentro de un marco circular concéntrico.
 * Adaptado a la paleta oficial:
 * - Rojo Marfil (#E12927)
 * - Negro Café (#1F1410)
 * - Blanco (#FFFFFF)
 * - Rosa Muy Claro (#FCEAE9)
 */
export default function ElephantLogo({
  size = 40,
  color = 'auto', // 'negro' | 'rojo' | 'blanco' | 'badge-rosa' | 'auto' o color CSS (ej: 'var(--rojo-marfil)')
  className = '',
  style = {}
}) {
  // Mapeo directo para modos conocidos
  let imgSrc = null;
  if (color === 'rojo' || color === '#E12927') {
    imgSrc = '/images/logo_rojo_marfil.png';
  } else if (color === 'negro' || color === '#1F1410') {
    imgSrc = '/images/logo_negro_cafe.png';
  } else if (color === 'blanco' || color === '#FFFFFF' || color === '#FFF') {
    imgSrc = '/images/logo_blanco.png';
  } else if (color === 'badge-rosa') {
    imgSrc = '/images/logo_badge_rosa.png';
  }

  // Si es auto o no coincide con los predefinidos, usamos la máscara CSS para aplicar cualquier color
  const isCustomColor = !imgSrc && color !== 'auto';

  if (isCustomColor) {
    return (
      <span
        className={`elephant-logo-mask ${className}`}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url('/images/logo_blanco.png')`,
          maskImage: `url('/images/logo_blanco.png')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style
        }}
        role="img"
        aria-label="Café Marfil Elefante"
      />
    );
  }

  return (
    <div
      className={`elephant-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style
      }}
    >
      <img
        src={imgSrc || '/images/logo_negro_cafe.png'}
        alt="Café Marfil Elefante Geométrico"
        width={size}
        height={size}
        className="elephant-logo-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
