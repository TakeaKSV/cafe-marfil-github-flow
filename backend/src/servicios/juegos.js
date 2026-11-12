// Ludoteca: catálogo de juegos de mesa y préstamos a mesas.

import { bloquearFila, db, enTransaccion } from '../db/conexion.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';
import { aBit, armarUpdate } from '../utils/sql.js';
import { exigirSucursal } from './sucursales.js';

const DIAS_VENTANA = 30; // "veces jugado en el mes" = préstamos de los últimos 30 días

// Un juego está "en_mesa" cuando tiene un préstamo sin devolver.
const SQL_JUEGOS = `
  SELECT j.*, pr.id AS prestamo_id, pr.prestado_en, m.id AS mesa_id, m.numero AS mesa_numero, sv.comensal,
    (SELECT COUNT(*) FROM prestamos_juego x
      WHERE x.juego_id = j.id AND x.prestado_en >= :desde) AS veces_jugado_mes
  FROM juegos j
  LEFT JOIN prestamos_juego pr ON pr.juego_id = j.id AND pr.devuelto_en IS NULL
  LEFT JOIN mesas m ON m.id = pr.mesa_id
  LEFT JOIN servicios_mesa sv ON sv.mesa_id = m.id AND sv.fin IS NULL
  WHERE j.activo = 1`;

const inicioVentana = () => new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000).toISOString();

function aJuego(fila) {
  const enMesa = fila.prestamo_id !== null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    jugadores: fila.jugadores,
    duracion: fila.duracion,
    dificultad: fila.dificultad,
    piezasEstado: fila.piezas_estado,
    reposicionRequerida: fila.reposicion_requerida === 1,
    sucursalId: fila.sucursal_id,
    estado: enMesa ? 'en_mesa' : 'disponible',
    mesaId: enMesa ? fila.mesa_id : null,
    mesaActual: enMesa ? (fila.comensal ? `${fila.mesa_numero} (${fila.comensal})` : fila.mesa_numero) : null,
    prestadoEn: fila.prestado_en,
    vecesJugadoMes: fila.veces_jugado_mes
  };
}

export async function listarJuegos({ sucursalId, q, estado } = {}) {
  const filtros = [];
  const valores = { desde: inicioVentana() };
  if (sucursalId) {
    filtros.push('j.sucursal_id = :sucursalId');
    valores.sucursalId = sucursalId;
  }
  if (q) {
    filtros.push('(j.nombre LIKE :q OR j.categoria LIKE :q)');
    valores.q = `%${q}%`;
  }
  if (estado === 'en_mesa') filtros.push('pr.id IS NOT NULL');
  if (estado === 'disponible') filtros.push('pr.id IS NULL');
  if (estado === 'reposicion') filtros.push('j.reposicion_requerida = 1');
  const extra = filtros.length ? `AND ${filtros.join(' AND ')}` : '';
  const filas = await db.todos(`${SQL_JUEGOS} ${extra} ORDER BY j.nombre`, valores);
  return filas.map(aJuego);
}

export async function obtenerJuego(id) {
  const fila = await db.uno(`${SQL_JUEGOS} AND j.id = :id`, { desde: inicioVentana(), id });
  if (!fila) throw noEncontrado('No existe ese juego en la ludoteca.');
  return aJuego(fila);
}

export async function crearJuego(datos) {
  await exigirSucursal(datos.sucursalId);
  const { id } = await db.ejecutar(
    `INSERT INTO juegos (nombre, categoria, jugadores, duracion, dificultad, piezas_estado, sucursal_id, creado_en)
     VALUES (:nombre, :categoria, :jugadores, :duracion, :dificultad, :piezasEstado, :sucursalId, :creadoEn)`,
    { ...datos, creadoEn: ahoraISO() }
  );
  return obtenerJuego(id);
}

export async function actualizarJuego(id, cambios) {
  await obtenerJuego(id);
  const update = armarUpdate(cambios, {
    nombre: 'nombre',
    categoria: 'categoria',
    jugadores: 'jugadores',
    duracion: 'duracion',
    dificultad: 'dificultad',
    piezasEstado: 'piezas_estado',
    reposicionRequerida: ['reposicion_requerida', aBit]
  });
  if (update) await db.ejecutar(`UPDATE juegos SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  return obtenerJuego(id);
}

export async function eliminarJuego(id) {
  const juego = await obtenerJuego(id);
  if (juego.estado === 'en_mesa') {
    throw conflicto(`"${juego.nombre}" está en la mesa ${juego.mesaActual}. Regístralo como devuelto primero.`);
  }
  await db.ejecutar('UPDATE juegos SET activo = 0 WHERE id = ?', [id]);
}

export function prestarJuego(id, mesaId, personalId = null) {
  return enTransaccion(async () => {
    await bloquearFila('juegos', id);
    const juego = await obtenerJuego(id);
    if (juego.estado === 'en_mesa') throw conflicto(`"${juego.nombre}" ya está prestado en la mesa ${juego.mesaActual}.`);

    const mesa = await db.uno('SELECT numero, sucursal_id FROM mesas WHERE id = ? AND activa = 1', [mesaId]);
    if (!mesa) throw noEncontrado('No existe esa mesa.');
    if (mesa.sucursal_id !== juego.sucursalId) {
      throw conflicto(`"${juego.nombre}" pertenece a otra sucursal que la mesa ${mesa.numero}.`);
    }

    await db.ejecutar('INSERT INTO prestamos_juego (juego_id, mesa_id, personal_id, prestado_en) VALUES (?, ?, ?, ?)', [
      id,
      mesaId,
      personalId,
      ahoraISO()
    ]);
    return obtenerJuego(id);
  });
}

export async function devolverJuego(id) {
  const juego = await obtenerJuego(id);
  const { afectadas } = await db.ejecutar(
    'UPDATE prestamos_juego SET devuelto_en = ? WHERE juego_id = ? AND devuelto_en IS NULL',
    [ahoraISO(), id]
  );
  if (!afectadas) throw conflicto(`"${juego.nombre}" no está prestado.`);
  return obtenerJuego(id);
}
