import { bloquearFila, db, enTransaccion } from '../db/conexion.js';
import { leerJSON } from '../utils/codigos.js';
import { conflicto, noEncontrado } from '../utils/errores.js';
import { ahoraISO, rangoDia } from '../utils/fechas.js';
import { aJSON, armarUpdate } from '../utils/sql.js';
import { registrarEscaneo } from './bitacora.js';
import { buscarClientePorCodigo } from './clientes.js';
import { exigirSucursal } from './sucursales.js';

// canjes_hoy se cuenta de la bitácora de canjes, no se guarda como contador.
const SQL_PROMOCIONES = `
  SELECT p.*,
    (SELECT COUNT(*) FROM canjes_promocion c
      WHERE c.promocion_id = p.id AND c.creado_en >= :desde AND c.creado_en < :hasta) AS canjes_hoy
  FROM promociones p`;

async function sucursalesPorPromocion() {
  const mapa = new Map();
  const filas = await db.todos(
    `SELECT ps.promocion_id, s.id, s.nombre
     FROM promocion_sucursal ps JOIN sucursales s ON s.id = ps.sucursal_id ORDER BY s.nombre`
  );
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
export async function listarPromociones({ soloActivas = false, sucursalId } = {}) {
  const filtros = [];
  const valores = rangoDia();
  if (soloActivas) filtros.push("p.estado = 'activo'");
  if (sucursalId) {
    filtros.push('EXISTS (SELECT 1 FROM promocion_sucursal ps WHERE ps.promocion_id = p.id AND ps.sucursal_id = :sucursalId)');
    valores.sucursalId = sucursalId;
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const sucursales = await sucursalesPorPromocion();
  const filas = await db.todos(`${SQL_PROMOCIONES} ${where} ORDER BY p.id`, valores);
  return filas.map((fila) => aPromocion(fila, sucursales.get(fila.id)));
}

/** Busca por id numérico o por código de cupón. Devuelve null si no existe. */
export async function buscarPromocion(idOCodigo) {
  const esId = /^\d+$/.test(String(idOCodigo));
  const fila = await db.uno(`${SQL_PROMOCIONES} WHERE ${esId ? 'p.id' : 'p.codigo'} = :clave`, {
    ...rangoDia(),
    clave: esId ? Number(idOCodigo) : String(idOCodigo).trim().toUpperCase()
  });
  return fila ? aPromocion(fila, (await sucursalesPorPromocion()).get(fila.id)) : null;
}

export async function obtenerPromocion(idOCodigo) {
  const promocion = await buscarPromocion(idOCodigo);
  if (!promocion) throw noEncontrado('No existe esa promoción.');
  return promocion;
}

async function guardarSucursales(promocionId, sucursales) {
  await db.ejecutar('DELETE FROM promocion_sucursal WHERE promocion_id = ?', [promocionId]);
  for (const sucursalId of new Set(sucursales)) {
    await exigirSucursal(sucursalId);
    await db.ejecutar('INSERT INTO promocion_sucursal (promocion_id, sucursal_id) VALUES (?, ?)', [promocionId, sucursalId]);
  }
}

export function crearPromocion(datos) {
  return enTransaccion(async () => {
    if (await db.uno('SELECT 1 FROM promociones WHERE codigo = ?', [datos.codigo])) {
      throw conflicto(`Ya existe una promoción con el código ${datos.codigo}.`);
    }
    const { id } = await db.ejecutar(
      `INSERT INTO promociones
         (codigo, titulo, categoria, categoria_slug, descuento_badge, beneficio, descripcion, vigencia, imagen,
          condiciones, como_usar, limite_diario, estado, creado_en)
       VALUES
         (:codigo, :titulo, :categoria, :categoriaSlug, :descuentoBadge, :beneficio, :descripcion, :vigencia, :imagen,
          :condiciones, :comoUsar, :limiteDiario, :estado, :creadoEn)`,
      {
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
      }
    );
    // Sin lista explícita, la promoción aplica en todas las sucursales activas.
    const sucursales =
      datos.sucursales ?? (await db.todos('SELECT id FROM sucursales WHERE activa = 1')).map((s) => s.id);
    await guardarSucursales(id, sucursales);
    return obtenerPromocion(id);
  });
}

export function actualizarPromocion(id, cambios) {
  return enTransaccion(async () => {
    await obtenerPromocion(id);
    if (cambios.codigo && (await db.uno('SELECT 1 FROM promociones WHERE codigo = ? AND id <> ?', [cambios.codigo, id]))) {
      throw conflicto(`Ya existe una promoción con el código ${cambios.codigo}.`);
    }
    const update = armarUpdate(cambios, {
      codigo: 'codigo',
      titulo: 'titulo',
      categoria: 'categoria',
      categoriaSlug: 'categoria_slug',
      descuentoBadge: 'descuento_badge',
      beneficio: 'beneficio',
      descripcion: 'descripcion',
      vigencia: 'vigencia',
      imagen: 'imagen',
      condiciones: ['condiciones', aJSON],
      comoUsar: 'como_usar',
      limiteDiario: 'limite_diario',
      estado: 'estado'
    });
    if (update) await db.ejecutar(`UPDATE promociones SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
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
    if (codigoCliente && !cliente) throw noEncontrado(`No existe un pasaporte Club Marfil con el código ${codigoCliente}.`);

    await db.ejecutar(
      'INSERT INTO canjes_promocion (promocion_id, cliente_id, sucursal_id, personal_id, creado_en) VALUES (?, ?, ?, ?, ?)',
      [promocion.id, cliente?.id ?? null, sucursalId, personalId, ahoraISO()]
    );

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
