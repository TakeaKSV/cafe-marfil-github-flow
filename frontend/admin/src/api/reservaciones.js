// El registro puede consultar cualquier fecha; la operación de hoy se carga
// aparte para que el escáner y los indicadores no mezclen otros días.
export async function cargarReservacionesPanel(consultar, { hoy, fecha = '', sucursalId }) {
  const registro = consultar('/reservaciones', {
    query: { sucursalId, fecha: fecha || undefined }
  });
  const delDia = fecha === hoy
    ? registro
    : consultar('/reservaciones', { query: { sucursalId, fecha: hoy } });
  const [reservaciones, reservacionesHoy] = await Promise.all([registro, delDia]);
  return { reservaciones, reservacionesHoy };
}
