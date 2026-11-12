// Clientes y Club Marfil: cuentas de la PWA, pasaporte de sellos y beneficios.

import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { bloquearFila, db, enTransaccion } from '../db/conexion.js';
import { codigoUnico, generarCodigoBeneficio, generarCodigoClub, leerJSON } from '../utils/codigos.js';
import { conflicto, noAutenticado, noEncontrado } from '../utils/errores.js';
import { ahoraISO, fechaEnFrase, hoyLocal } from '../utils/fechas.js';
import { armarUpdate } from '../utils/sql.js';
import { crearNotificacion, registrarEscaneo } from './bitacora.js';
import { exigirSucursal } from './sucursales.js';

// recompensa_nombre: premio del pasaporte que el cliente ya ganó y aún no canjea.
const SQL_CLIENTES = `
  SELECT c.*, s.nombre AS sucursal_habitual,
    (SELECT b.titulo FROM beneficios b
      WHERE b.cliente_id = c.id AND b.origen = 'sellos' AND b.estado = 'disponible'
      ORDER BY b.id LIMIT 1) AS recompensa_nombre
  FROM clientes c LEFT JOIN sucursales s ON s.id = c.sucursal_habitual_id`;

function nivelPorVisitas(visitas) {
  if (visitas >= 20) return 'Marfil VIP';
  if (visitas >= 5) return 'Café Lover';
  return 'Explorador';
}

function aCliente(fila) {
  return {
    id: fila.id,
    codigoCliente: fila.codigo_club,
    nombre: fila.nombre,
    primerNombre: fila.nombre.split(' ')[0],
    email: fila.email,
    telefono: fila.telefono,
    ciudad: fila.ciudad,
    nivel: nivelPorVisitas(fila.visitas_totales),
    sellosActuales: fila.sellos_actuales,
    sellosMeta: fila.sellos_meta,
    puntos: fila.puntos,
    visitasTotales: fila.visitas_totales,
    recompensaDisponible: fila.recompensa_nombre !== null,
    recompensaNombre: fila.recompensa_nombre,
    ultimaVisita: fila.ultima_visita,
    sucursalHabitualId: fila.sucursal_habitual_id,
    sucursalHabitual: fila.sucursal_habitual,
    preferencias: leerJSON(fila.preferencias, {}),
    tieneCuenta: Boolean(fila.password_hash)
  };
}

// --------------------------------------------------------------------------
// Consulta y alta
// --------------------------------------------------------------------------

export async function listarClientes({ q } = {}) {
  const filas = q
    ? await db.todos(
        `${SQL_CLIENTES}
         WHERE c.nombre LIKE :patron OR c.telefono LIKE :patron OR c.email LIKE :patron OR c.codigo_club LIKE :patron
         ORDER BY c.nombre LIMIT 200`,
        { patron: `%${q}%` }
      )
    : await db.todos(`${SQL_CLIENTES} ORDER BY c.nombre LIMIT 200`);
  return filas.map(aCliente);
}

export async function obtenerCliente(id) {
  const fila = await db.uno(`${SQL_CLIENTES} WHERE c.id = ?`, [id]);
  if (!fila) throw noEncontrado('No existe ese cliente.');
  return aCliente(fila);
}

export async function buscarClientePorCodigo(codigo) {
  const fila = await db.uno(`${SQL_CLIENTES} WHERE c.codigo_club = ?`, [String(codigo).trim().toUpperCase()]);
  return fila ? aCliente(fila) : null;
}

export async function obtenerClientePorCodigo(codigo) {
  const cliente = await buscarClientePorCodigo(codigo);
  if (!cliente) throw noEncontrado(`No existe un pasaporte Club Marfil con el código ${codigo}.`);
  return cliente;
}

/** Alta de cliente. Con `password` crea cuenta para la PWA; sin ella es un alta en caja. */
export async function registrarCliente(datos) {
  if (datos.sucursalHabitualId) await exigirSucursal(datos.sucursalHabitualId);
  if (datos.email && (await db.uno('SELECT 1 FROM clientes WHERE email = ?', [datos.email]))) {
    throw conflicto('Ya existe una cuenta con ese correo.');
  }

  const codigo = await codigoUnico(generarCodigoClub, (c) => db.uno('SELECT 1 FROM clientes WHERE codigo_club = ?', [c]));
  const { id } = await db.ejecutar(
    `INSERT INTO clientes (codigo_club, nombre, email, telefono, password_hash, ciudad, sucursal_habitual_id, creado_en)
     VALUES (:codigo, :nombre, :email, :telefono, :passwordHash, :ciudad, :sucursalHabitualId, :creadoEn)`,
    {
      codigo,
      nombre: datos.nombre,
      email: datos.email ?? null,
      telefono: datos.telefono ?? null,
      passwordHash: datos.password ? await bcrypt.hash(datos.password, 10) : null,
      ciudad: datos.ciudad ?? null,
      sucursalHabitualId: datos.sucursalHabitualId ?? null,
      creadoEn: ahoraISO()
    }
  );
  return obtenerCliente(id);
}

export async function autenticarCliente(email, password) {
  const fila = await db.uno(`${SQL_CLIENTES} WHERE c.email = ?`, [email]);
  const valido = fila?.password_hash && (await bcrypt.compare(password, fila.password_hash));
  if (!valido) throw noAutenticado('Correo o contraseña incorrectos.');
  return aCliente(fila);
}

export async function actualizarPerfil(id, cambios) {
  const actual = await obtenerCliente(id);
  if (cambios.email && cambios.email !== actual.email) {
    if (await db.uno('SELECT 1 FROM clientes WHERE email = ? AND id <> ?', [cambios.email, id])) {
      throw conflicto('Ese correo ya está en uso por otra cuenta.');
    }
  }
  if (cambios.sucursalHabitualId) await exigirSucursal(cambios.sucursalHabitualId);

  // Las preferencias se mezclan con las existentes en lugar de reemplazarlas.
  const preferencias = cambios.preferencias
    ? JSON.stringify({ ...actual.preferencias, ...cambios.preferencias })
    : undefined;

  const update = armarUpdate(
    { ...cambios, preferencias },
    {
      nombre: 'nombre',
      email: 'email',
      telefono: 'telefono',
      ciudad: 'ciudad',
      sucursalHabitualId: 'sucursal_habitual_id',
      preferencias: 'preferencias'
    }
  );
  if (update) await db.ejecutar(`UPDATE clientes SET ${update.sets} WHERE id = :id`, { ...update.valores, id });
  return obtenerCliente(id);
}

// --------------------------------------------------------------------------
// Pasaporte de sellos
// --------------------------------------------------------------------------

/**
 * Suma un sello por visita. Al llegar a la meta se genera el beneficio de
 * recompensa; mientras no lo canjee, las visitas siguen dando puntos pero el
 * pasaporte se queda lleno (igual que en el panel).
 */
export function sumarSello(codigo, { sucursalId = null, personalId = null } = {}) {
  return enTransaccion(async () => {
    const { id } = await obtenerClientePorCodigo(codigo);
    await bloquearFila('clientes', id);
    const cliente = await obtenerCliente(id); // se vuelve a leer ya con la fila bloqueada
    if (sucursalId) await exigirSucursal(sucursalId);

    const yaEstabaLleno = cliente.sellosActuales >= cliente.sellosMeta;
    const sellos = yaEstabaLleno ? cliente.sellosMeta : cliente.sellosActuales + 1;
    const completoAhora = !yaEstabaLleno && sellos >= cliente.sellosMeta;
    const ahora = ahoraISO();

    await db.ejecutar(
      `UPDATE clientes
          SET sellos_actuales = ?, puntos = puntos + ?, visitas_totales = visitas_totales + 1, ultima_visita = ?
        WHERE id = ?`,
      [sellos, config.puntosPorSello, ahora, cliente.id]
    );

    await db.ejecutar(
      `INSERT INTO movimientos_club (cliente_id, tipo, sellos, puntos, descripcion, sucursal_id, personal_id, creado_en)
       VALUES (?, 'sello', ?, ?, ?, ?, ?, ?)`,
      [
        cliente.id,
        yaEstabaLleno ? 0 : 1,
        config.puntosPorSello,
        `Sello por visita (${sellos}/${cliente.sellosMeta})`,
        sucursalId,
        personalId,
        ahora
      ]
    );

    if (completoAhora) {
      await otorgarBeneficio(cliente.id, {
        titulo: config.recompensaSellos,
        subtitulo: `Premio por completar tus ${cliente.sellosMeta} sellos de visita`,
        origen: 'sellos'
      });
    }

    await registrarEscaneo({
      codigo: cliente.codigoCliente,
      tipo: 'club',
      descripcion: `${cliente.nombre} · ${sellos}/${cliente.sellosMeta} sellos`,
      resultado: completoAhora ? '¡Pasaporte completado!' : `Sello acreditado (+${config.puntosPorSello} pts)`,
      personalId
    });

    return { cliente: await obtenerCliente(cliente.id), pasaporteCompletado: completoAhora };
  });
}

// --------------------------------------------------------------------------
// Beneficios
// --------------------------------------------------------------------------

function aBeneficio(fila) {
  const vencido = fila.estado === 'disponible' && fila.vence_en !== null && fila.vence_en < hoyLocal();
  return {
    id: fila.id,
    codigo: fila.codigo,
    titulo: fila.titulo,
    subtitulo: fila.subtitulo,
    icono: fila.icono,
    origen: fila.origen,
    estado: vencido ? 'vencido' : fila.estado, // disponible | usado | vencido
    venceEn: fila.vence_en,
    vigencia: fila.vence_en ? `Vence el ${fechaEnFrase(fila.vence_en)}` : 'Sin fecha de vencimiento',
    usadoEn: fila.usado_en
  };
}

export async function otorgarBeneficio(
  clienteId,
  { titulo, subtitulo = null, icono = 'Gift', origen = 'manual', venceEn = null }
) {
  const codigo = await codigoUnico(generarCodigoBeneficio, (c) => db.uno('SELECT 1 FROM beneficios WHERE codigo = ?', [c]));
  const { id } = await db.ejecutar(
    `INSERT INTO beneficios (cliente_id, codigo, titulo, subtitulo, icono, origen, vence_en, creado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [clienteId, codigo, titulo, subtitulo, icono, origen, venceEn, ahoraISO()]
  );

  await crearNotificacion(clienteId, {
    titulo: '¡Nuevo beneficio disponible!',
    mensaje: `Desbloqueaste "${titulo}". Muestra el código ${codigo} en caja para canjearlo.`,
    tipo: 'beneficio',
    screenDestino: 'beneficios'
  });
  return aBeneficio(await db.uno('SELECT * FROM beneficios WHERE id = ?', [id]));
}

/**
 * Beneficios del cliente para la PWA. Si todavía no completa su pasaporte se
 * agrega al final la recompensa "bloqueada" con su avance.
 */
export async function listarBeneficios(clienteId) {
  const cliente = await obtenerCliente(clienteId);
  const filas = await db.todos('SELECT * FROM beneficios WHERE cliente_id = ? ORDER BY estado, id DESC', [clienteId]);
  const beneficios = filas.map(aBeneficio);

  if (!cliente.recompensaDisponible) {
    beneficios.push({
      id: null,
      codigo: null,
      titulo: config.recompensaSellos,
      subtitulo: `Se desbloquea al completar tus ${cliente.sellosMeta} sellos de visita`,
      icono: 'Gift',
      origen: 'sellos',
      estado: 'bloqueado',
      progreso: `${cliente.sellosActuales} de ${cliente.sellosMeta} sellos completados`
    });
  }
  return beneficios;
}

export async function buscarBeneficioPorCodigo(codigo) {
  const fila = await db.uno(
    `SELECT b.*, c.nombre AS cliente_nombre, c.codigo_club
     FROM beneficios b JOIN clientes c ON c.id = b.cliente_id WHERE b.codigo = ?`,
    [String(codigo).trim().toUpperCase()]
  );
  return fila
    ? { ...aBeneficio(fila), clienteNombre: fila.cliente_nombre, codigoCliente: fila.codigo_club, clienteId: fila.cliente_id }
    : null;
}

/** Canjea un beneficio en caja. Si es la recompensa del pasaporte, lo reinicia a 0 sellos. */
export function canjearBeneficio(codigo, { personalId = null } = {}) {
  return enTransaccion(async () => {
    const encontrado = await buscarBeneficioPorCodigo(codigo);
    if (!encontrado) throw noEncontrado(`No existe un beneficio con el código ${codigo}.`);
    await bloquearFila('beneficios', encontrado.id);
    const beneficio = await buscarBeneficioPorCodigo(codigo); // estado real, ya con la fila bloqueada

    if (beneficio.estado === 'usado') throw conflicto('Este beneficio ya fue canjeado.');
    if (beneficio.estado === 'vencido') throw conflicto(`Este beneficio venció el ${fechaEnFrase(beneficio.venceEn)}.`);

    const ahora = ahoraISO();
    await db.ejecutar("UPDATE beneficios SET estado = 'usado', usado_en = ? WHERE id = ?", [ahora, beneficio.id]);

    if (beneficio.origen === 'sellos') {
      await db.ejecutar('UPDATE clientes SET sellos_actuales = 0 WHERE id = ?', [beneficio.clienteId]);
      await db.ejecutar(
        `INSERT INTO movimientos_club (cliente_id, tipo, descripcion, personal_id, creado_en)
         VALUES (?, 'recompensa_canjeada', ?, ?, ?)`,
        [beneficio.clienteId, `Canjeó: ${beneficio.titulo}. Nuevo pasaporte en 0 sellos.`, personalId, ahora]
      );
    }

    await registrarEscaneo({
      codigo: beneficio.codigo,
      tipo: 'beneficio',
      descripcion: `${beneficio.clienteNombre} canjeó ${beneficio.titulo}`,
      resultado: beneficio.origen === 'sellos' ? 'Premio entregado · Nuevo pasaporte' : 'Beneficio entregado',
      personalId
    });

    return { beneficio: await buscarBeneficioPorCodigo(codigo), cliente: await obtenerCliente(beneficio.clienteId) };
  });
}

/** Atajo del panel: canjea la recompensa de pasaporte pendiente de un cliente. */
export async function canjearRecompensa(codigoCliente, opciones) {
  const cliente = await obtenerClientePorCodigo(codigoCliente);
  const pendiente = await db.uno(
    "SELECT codigo FROM beneficios WHERE cliente_id = ? AND origen = 'sellos' AND estado = 'disponible' ORDER BY id LIMIT 1",
    [cliente.id]
  );
  if (!pendiente) throw conflicto(`${cliente.nombre} no tiene una recompensa de pasaporte por canjear.`);
  return canjearBeneficio(pendiente.codigo, opciones);
}

// --------------------------------------------------------------------------
// Notificaciones de la PWA
// --------------------------------------------------------------------------

export async function listarNotificaciones(clienteId) {
  const filas = await db.todos('SELECT * FROM notificaciones WHERE cliente_id = ? ORDER BY id DESC LIMIT 50', [clienteId]);
  return filas.map((fila) => ({
    id: fila.id,
    titulo: fila.titulo,
    mensaje: fila.mensaje,
    tipo: fila.tipo,
    leida: fila.leida === 1,
    screenDestino: fila.screen_destino,
    fechaHora: fila.creado_en
  }));
}

/** Marca como leída una notificación, o todas si no se pasa id. */
export async function marcarNotificacionesLeidas(clienteId, notificacionId) {
  if (notificacionId === undefined) {
    await db.ejecutar('UPDATE notificaciones SET leida = 1 WHERE cliente_id = ?', [clienteId]);
  } else {
    const { afectadas } = await db.ejecutar('UPDATE notificaciones SET leida = 1 WHERE id = ? AND cliente_id = ?', [
      notificacionId,
      clienteId
    ]);
    if (!afectadas) throw noEncontrado('No existe esa notificación.');
  }
  return listarNotificaciones(clienteId);
}
