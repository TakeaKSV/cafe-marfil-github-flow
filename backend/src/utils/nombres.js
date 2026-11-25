export function dividirNombreCompleto(nombreCompleto) {
  const partes = String(nombreCompleto ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return { nombres: '', apellidoPaterno: '', apellidoMaterno: '' };
  if (partes.length === 1) return { nombres: partes[0], apellidoPaterno: '', apellidoMaterno: '' };
  if (partes.length === 2) return { nombres: partes[0], apellidoPaterno: partes[1], apellidoMaterno: '' };
  return {
    nombres: partes.slice(0, -2).join(' '),
    apellidoPaterno: partes[partes.length - 2],
    apellidoMaterno: partes[partes.length - 1]
  };
}

export function componerNombreCompleto({ nombres = '', apellidoPaterno = '', apellidoMaterno = '' }) {
  return [nombres, apellidoPaterno, apellidoMaterno]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

export function resolverNombrePartes(datos, actual = null) {
  const tienePartes =
    datos.nombres !== undefined || datos.apellidoPaterno !== undefined || datos.apellidoMaterno !== undefined;
  if (tienePartes) {
    const nombres = String(datos.nombres ?? actual?.nombres ?? '').trim();
    const apellidoPaterno = String(
      datos.apellidoPaterno ?? actual?.apellidoPaterno ?? actual?.apellido_paterno ?? ''
    ).trim();
    const apellidoMaterno = String(
      datos.apellidoMaterno ?? actual?.apellidoMaterno ?? actual?.apellido_materno ?? ''
    ).trim();
    return {
      nombre: componerNombreCompleto({ nombres, apellidoPaterno, apellidoMaterno }),
      nombres,
      apellidoPaterno,
      apellidoMaterno
    };
  }
  if (datos.nombre !== undefined) {
    const limpio = String(datos.nombre).trim();
    return { nombre: limpio, ...dividirNombreCompleto(limpio) };
  }
  return {};
}
