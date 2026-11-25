import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QRCodeImage({ value, size = 160, alt = 'Código QR Café Marfil', className = '' }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let activo = true;
    const texto = String(value || '').trim();
    if (!texto) {
      setDataUrl('');
      return undefined;
    }
    QRCode.toDataURL(texto, {
      width: size * 2,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1F1410', light: '#FFFFFF' }
    })
      .then((url) => {
        if (activo) setDataUrl(url);
      })
      .catch(() => {
        if (activo) setDataUrl('');
      });
    return () => {
      activo = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-md bg-[#FAF7F5] animate-pulse border border-[#1F1410]/10 ${className}`}
        aria-label="Generando código QR"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`block rounded-lg select-none ${className}`}
    />
  );
}
