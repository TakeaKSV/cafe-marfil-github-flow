// Ludoteca: catálogo de juegos de mesa y préstamos a mesas.

import { bloquearFila, enTransaccion } from '../db/conexion.js';
import * as repo from '../repositorios/juegos.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO } from '../utils/fechas.js';

import { exigirSucursal } from './sucursales.js';

const DIAS_VENTANA = 30; // "veces jugado en el mes" = préstamos de los últimos 30 días

// Un juego está "en_mesa" cuando tiene un préstamo sin devolver.

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
    imagen: fila.imagen ?? null,
    reposicionRequerida: fila.reposicion_requerida === 1,
    sucursalId: fila.sucursal_id,
    estado: enMesa ? 'en_mesa' : 'disponible',
    mesaId: enMesa ? fila.mesa_id : null,
    mesaActual: enMesa ? (fila.comensal ? `${fila.mesa_numero} (${fila.comensal})` : fila.mesa_numero) : null,
    prestadoEn: fila.prestado_en,
    vecesJugadoMes: fila.veces_jugado_mes
  };
}

export async function listarJuegos(filtros = {}) {
  return (await repo.listar(filtros, inicioVentana())).map(aJuego);
}

export async function obtenerJuego(id) {
  const fila = await repo.porId({ desde: inicioVentana(), id });
  if (!fila) throw noEncontrado('No existe ese juego en la ludoteca.');
  return aJuego(fila);
}

export async function crearJuego(datos) {
  await exigirSucursal(datos.sucursalId);
  const { id } = await repo.insertarJuego({ ...datos, creadoEn: ahoraISO() });
  return obtenerJuego(id);
}

export async function actualizarJuego(id, cambios) {
  await obtenerJuego(id);
  await repo.actualizarJuegos(id, cambios);

  return obtenerJuego(id);
}

export async function eliminarJuego(id) {
  return enTransaccion(async () => {
    await bloquearFila('juegos', id);

    const juego = await obtenerJuego(id);
    if (juego.estado === 'en_mesa') {
      throw conflicto(`"${juego.nombre}" está en la mesa ${juego.mesaActual}. Regístralo como devuelto primero.`);
    }
    await repo.desactivar(id);
  });
}

export function prestarJuego(id, mesaId, personalId = null) {
  return enTransaccion(async () => {
    await bloquearFila('mesas', mesaId);
    await bloquearFila('juegos', id);
    const juego = await obtenerJuego(id);
    if (juego.estado === 'en_mesa')
      throw conflicto(`"${juego.nombre}" ya está prestado en la mesa ${juego.mesaActual}.`);

    const mesa = await repo.mesa(mesaId);
    if (!mesa) throw noEncontrado('No existe esa mesa.');
    if (mesa.estado !== 'ocupada') throw conflicto('Solo se prestan juegos a mesas ocupadas.');
    if (juego.reposicionRequerida) throw conflicto('El juego requiere reposición antes de prestarse.');
    if (mesa.sucursal_id !== juego.sucursalId) {
      throw conflicto(`"${juego.nombre}" pertenece a otra sucursal que la mesa ${mesa.numero}.`);
    }

    await repo.insertarPrestamo({ juegoId: id, mesaId: mesaId, personalId: personalId, prestadoEn: ahoraISO() });
    return obtenerJuego(id);
  });
}

export async function devolverJuego(id) {
  return enTransaccion(async () => {
    await bloquearFila('juegos', id);

    const juego = await obtenerJuego(id);
    const { afectadas } = await repo.devolver(ahoraISO(), id);
    if (!afectadas) throw conflicto(`"${juego.nombre}" no está prestado.`);
    return obtenerJuego(id);
  });
}
