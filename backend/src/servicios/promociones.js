import { bloquearFila, enTransaccion } from '../db/conexion.js';
import * as repo from '../repositorios/promociones.js';
import { leerJSON } from '../utils/codigos.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO, rangoDia } from '../utils/fechas.js';
import { aJSON } from '../repositorios/base.js';
import { registrarEscaneo } from './bitacora.js';
import { buscarClientePorCodigo } from './clientes.js';
import { exigirSucursal } from './sucursales.js';

// canjes_hoy se cuenta de la bitácora de canjes, no se guarda como contador.

async function sucursalesPorPromocion() {
  const mapa = new Map();
  const filas = await repo.sucursales();
  for (const fila of filas) {
    if (!mapa.has(fila.promocion_id)) mapa.set(fila.promocion_id, []);
    mapa.get(fila.promocion_id).push(fila);
  }
  return mapa;
}

function aPromocion(fila, sucursales = []) {
  return {
    id: fila.id,
    codigo: fila.codigo,
    titulo: fila.titulo,
    categoria: fila.categoria,
    categoriaSlug: fila.categoria_slug,
    descuentoBadge: fila.descuento_badge,
    beneficio: fila.beneficio,
    descripcion: fila.descripcion,
    vigencia: fila.vigencia,
    imagen: fila.imagen,
    condiciones: leerJSON(fila.condiciones, []),
    comoUsar: fila.como_usar,
    canjesHoy: fila.canjes_hoy,
    limiteDiario: fila.limite_diario,
    estado: fila.estado,
    sucursales: sucursales.map((s) => s.id),
    sucursalesNombres: sucursales.map((s) => s.nombre)
  };
}

/** `soloActivas` es lo que ve el cliente en la PWA; el panel las ve todas. */
export async function listarPromociones(filtros = {}) {
  const sucursales = await sucursalesPorPromocion();
  return (await repo.listar(filtros, rangoDia())).map((fila) => aPromocion(fila, sucursales.get(fila.id)));
}

/** Busca por id numérico o por código de cupón. Devuelve null si no existe. */
export async function buscarPromocion(idOCodigo) {
  const fila = await repo.buscar(idOCodigo, rangoDia());
  return fila ? aPromocion(fila, (await sucursalesPorPromocion()).get(fila.id)) : null;
}

export async function obtenerPromocion(idOCodigo) {
  const promocion = await buscarPromocion(idOCodigo);
  if (!promocion) throw noEncontrado('No existe esa promoción.');
  return promocion;
}

async function guardarSucursales(promocionId, sucursales) {
  await repo.borrarSucursales(promocionId);
  for (const sucursalId of new Set(sucursales)) {
    await exigirSucursal(sucursalId);
    await repo.insertarSucursal({ promocionId: promocionId, sucursalId: sucursalId });
  }
}

export function crearPromocion(datos) {
  return enTransaccion(async () => {
    if (await repo.codigoExiste(datos.codigo)) {
      throw conflicto(`Ya existe una promoción con el código ${datos.codigo}.`);
    }
    const { id } = await repo.insertarPromocion({
      codigo: datos.codigo,
      titulo: datos.titulo,
      categoria: datos.categoria,
      categoriaSlug: datos.categoriaSlug ?? null,
      descuentoBadge: datos.descuentoBadge,
      beneficio: datos.beneficio,
      descripcion: datos.descripcion ?? null,
      vigencia: datos.vigencia,
      imagen: datos.imagen ?? null,
      condiciones: aJSON(datos.condiciones),
      comoUsar: datos.comoUsar ?? null,
      limiteDiario: datos.limiteDiario,
      estado: datos.estado,
      creadoEn: ahoraISO()
    });
    // Sin lista explícita, la promoción aplica en todas las sucursales activas.
    const sucursales = datos.sucursales ?? (await repo.sucursalesActivas()).map((s) => s.id);
    await guardarSucursales(id, sucursales);
    return obtenerPromocion(id);
  });
}

export function actualizarPromocion(id, cambios) {
  return enTransaccion(async () => {
    await bloquearFila('promociones', id);
    await obtenerPromocion(id);
    if (cambios.codigo && (await repo.codigoEnUso(cambios.codigo, id))) {
      throw conflicto(`Ya existe una promoción con el código ${cambios.codigo}.`);
    }
    await repo.actualizarPromociones(id, cambios);

    if (cambios.sucursales) await guardarSucursales(id, cambios.sucursales);
    return obtenerPromocion(id);
  });
}

/**
 * Registra el canje de un cupón en caja. Valida que la promoción esté activa,
 * que aplique en la sucursal y que no se haya agotado el límite del día.
 */
export function canjearPromocion(idOCodigo, { sucursalId = null, codigoCliente = null } = {}, personalId = null) {
  return enTransaccion(async () => {
    const { id } = await obtenerPromocion(idOCodigo);
    await bloquearFila('promociones', id); // dos cajas no pueden rebasar juntas el límite diario
    const promocion = await obtenerPromocion(id);
    const rechazar = (motivo) => {
      throw conflicto(`No se puede canjear ${promocion.codigo}: ${motivo}`);
    };

    if (promocion.estado !== 'activo') rechazar('la promoción está pausada.');
    if (sucursalId && !promocion.sucursales.includes(sucursalId)) rechazar('no aplica en esta sucursal.');
    if (promocion.canjesHoy >= promocion.limiteDiario) {
      rechazar(`se alcanzó el límite de ${promocion.limiteDiario} canjes de hoy.`);
    }

    const cliente = codigoCliente ? await buscarClientePorCodigo(codigoCliente) : null;
    if (codigoCliente && !cliente)
      throw noEncontrado(`No existe un pasaporte Club Marfil con el código ${codigoCliente}.`);

    await repo.insertarCanje({
      promocionId: promocion.id,
      clienteId: cliente?.id ?? null,
      sucursalId: sucursalId,
      personalId: personalId,
      creadoEn: ahoraISO()
    });

    await registrarEscaneo({
      codigo: promocion.codigo,
      tipo: 'promocion',
      descripcion: promocion.titulo,
      resultado: 'Descuento aplicado al ticket',
      personalId
    });
    return obtenerPromocion(promocion.id);
  });
}
