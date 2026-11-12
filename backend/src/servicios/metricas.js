// Indicadores del día para el dashboard. Todo se calcula al vuelo desde las
// tablas operativas (reservaciones, servicios de mesa, sellos, canjes, escaneos).

import { db } from '../db/conexion.js';
import { horaLocal, hoyLocal, rangoDia } from '../utils/fechas.js';

const HORA_APERTURA = 8;
const HORA_CIERRE = 22;

export async function metricasDelDia({ sucursalId, fecha = hoyLocal() } = {}) {
  const { desde, hasta } = rangoDia(fecha);
  const valores = { desde, hasta, fecha, sucursalId: sucursalId ?? null };
  // Con sucursalId = NULL el filtro no aplica y se suman todas las sucursales.
  const porSucursal = (columna) => `(:sucursalId IS NULL OR ${columna} = :sucursalId)`;

  // Reservaciones del día por estado
  const reservas = { confirmada: 0, en_curso: 0, asistida: 0, cancelada: 0, no_show: 0 };
  const porEstado = await db.todos(
    `SELECT estado, COUNT(*) AS total FROM reservaciones r
     WHERE r.fecha = :fecha AND ${porSucursal('r.sucursal_id')} GROUP BY estado`,
    valores
  );
  for (const fila of porEstado) reservas[fila.estado] = fila.total;

  // Servicios de mesa iniciados en el día
  const servicios = await db.todos(
    `SELECT sv.personas, sv.ticket_total, sv.inicio, sv.fin
     FROM servicios_mesa sv JOIN mesas m ON m.id = sv.mesa_id
     WHERE sv.inicio >= :desde AND sv.inicio < :hasta AND ${porSucursal('m.sucursal_id')}`,
    valores
  );

  const horas = new Map();
  for (let h = HORA_APERTURA; h <= HORA_CIERRE; h += 1) {
    const etiqueta = `${String(h).padStart(2, '0')}:00`;
    horas.set(etiqueta, { hora: etiqueta, comensales: 0, ventas: 0 });
  }

  let comensales = 0;
  let ventas = 0;
  let tickets = 0;
  let minutosCerrados = 0;
  let serviciosCerrados = 0;
  for (const servicio of servicios) {
    comensales += servicio.personas;
    if (servicio.ticket_total !== null) {
      ventas += servicio.ticket_total;
      tickets += 1;
    }
    if (servicio.fin) {
      minutosCerrados += (new Date(servicio.fin) - new Date(servicio.inicio)) / 60000;
      serviciosCerrados += 1;
    }
    const franja = horas.get(`${horaLocal(new Date(servicio.inicio)).slice(0, 2)}:00`);
    if (franja) {
      franja.comensales += servicio.personas;
      franja.ventas += servicio.ticket_total ?? 0;
    }
  }

  // Aforo en este momento (servicios abiertos) contra la capacidad de las sucursales
  const aforo = await db.uno(
    `SELECT
       (SELECT COALESCE(SUM(aforo_max), 0) FROM sucursales s
         WHERE s.activa = 1 AND ${porSucursal('s.id')}) AS maximo,
       (SELECT COALESCE(SUM(sv.personas), 0) FROM servicios_mesa sv JOIN mesas m ON m.id = sv.mesa_id
         WHERE sv.fin IS NULL AND ${porSucursal('m.sucursal_id')}) AS actual`,
    valores
  );

  const contar = async (sql, parametros = valores) => (await db.uno(sql, parametros)).total;
  const sellos = await contar(
    `SELECT COUNT(*) AS total FROM movimientos_club mc
     WHERE mc.tipo = 'sello' AND mc.creado_en >= :desde AND mc.creado_en < :hasta AND ${porSucursal('mc.sucursal_id')}`
  );
  const cupones = await contar(
    `SELECT COUNT(*) AS total FROM canjes_promocion c
     WHERE c.creado_en >= :desde AND c.creado_en < :hasta AND ${porSucursal('c.sucursal_id')}`
  );
  // La bitácora del escáner no guarda sucursal: este dato siempre es global.
  const escaneos = await contar('SELECT COUNT(*) AS total FROM escaneos WHERE creado_en >= ? AND creado_en < ?', [desde, hasta]);

  return {
    fecha,
    sucursalId: sucursalId ?? 'todas',
    ventasHoy: Math.round(ventas),
    ticketPromedio: tickets ? Math.round(ventas / tickets) : 0,
    comensalesHoy: comensales,
    aforoActual: aforo.actual,
    aforoMax: aforo.maximo,
    aforoPorcentaje: aforo.maximo ? Math.round((aforo.actual / aforo.maximo) * 100) : 0,
    reservasHoy: Object.values(reservas).reduce((suma, n) => suma + n, 0),
    reservasConfirmadas: reservas.confirmada,
    reservasEnCurso: reservas.en_curso,
    reservasAsistidas: reservas.asistida,
    reservasNoShow: reservas.no_show,
    reservasCanceladas: reservas.cancelada,
    sellosEmitidosHoy: sellos,
    cuponesRedimidosHoy: cupones,
    codigosEscaneadosHoy: escaneos,
    tiempoPromedioMesaMin: serviciosCerrados ? Math.round(minutosCerrados / serviciosCerrados) : 0,
    distribucionHoraria: [...horas.values()]
  };
}
