// Pruebas de integración: levantan la API real con los datos de ejemplo y
// recorren los flujos principales de las dos apps.
//
//   npm test
//
// Usan una base aparte (`cafe_marfil_test`) en el mismo servidor MySQL de
// backend/.env; se borra y se vuelve a sembrar en cada corrida, así que la base
// de desarrollo no se toca. Las pruebas comparten esa base y corren en orden,
// como una jornada del café.

import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';
import { cargarReservacionesPanel } from '../../frontend/admin/src/api/reservaciones.js';
import { aReservacion } from '../../frontend/admin/src/api/adaptadores.js';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'cafe_marfil_test';
process.env.DB_RESET_CONFIRM = process.env.DB_NAME;
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.PUBLIC_WRITE_RATE_LIMIT_MAX = '1000';
process.env.MAIL_RESEND_RATE_LIMIT_MAX = '1000';
process.env.MAIL_ENABLED = 'false';
process.env.MAIL_CHECK_MX = 'false';
process.env.RATE_LIMIT_MAX = '100000';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { cerrarConexion } = await import('../src/db/conexion.js');
const { borrarTodo, prepararBase } = await import('../src/db/mantenimiento.js');
const { crearApp } = await import('../src/app.js');
const { PASSWORD_DEMO, sembrar } = await import('../src/db/semilla.js');
const { establecerTransporteCorreo, restaurarTransporteCorreo } = await import('../src/servicios/correo.js');
const { otorgarBeneficio } = await import('../src/servicios/clientes.js');
const { hoyLocal, sumarDias } = await import('../src/utils/fechas.js');
const { config } = await import('../src/config.js');

const HOY = hoyLocal();
const MANANA = sumarDias(HOY, 1);

let servidor;
let base;
const sesion = {}; // tokens por rol
const mesaId = {}; // 'porras-matriz/M03' -> id

async function api(metodo, ruta, { token, body } = {}) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body && JSON.stringify(body)
  });
  const datos = respuesta.status === 204 ? null : await respuesta.json();
  return { status: respuesta.status, datos };
}

async function login(tipo, email) {
  const { status, datos } = await api('POST', `/auth/${tipo}/login`, { body: { email, password: PASSWORD_DEMO } });
  assert.equal(status, 200, `login de ${email}`);
  return datos.token;
}

before(async () => {
  await prepararBase();
  await borrarTodo();
  await prepararBase();
  await sembrar();
  servidor = crearApp({ bitacora: false }).listen(0);
  await once(servidor, 'listening');
  base = `http://127.0.0.1:${servidor.address().port}/api`;

  sesion.admin = await login('staff', 'admin@cafemarfil.mx');
  sesion.host = await login('staff', 'host@cafemarfil.mx');
  sesion.cliente = await login('clientes', 'sofia.navarro@gmail.com');

  const { datos: mesas } = await api('GET', '/mesas', { token: sesion.host });
  for (const mesa of mesas) mesaId[`${mesa.sucursalId}/${mesa.numero}`] = mesa.id;
});

after(async () => {
  servidor?.closeAllConnections();
  servidor?.close();
  await cerrarConexion();
});

// ---------------------------------------------------------------------------
// Catálogo público
// ---------------------------------------------------------------------------

test('el catálogo se puede leer sin iniciar sesión', async () => {
  const salud = await api('GET', '/health');
  assert.equal(salud.status, 200);

  const sucursales = await api('GET', '/sucursales');
  assert.equal(sucursales.datos.length, 2);
  const porras = sucursales.datos.find((s) => s.id === 'porras-matriz');
  assert.equal(porras.aforoMax, 85);
  assert.ok(porras.aforoActual > 0, 'hay comensales sentados en los datos de ejemplo');
  assert.equal(porras.zonas.length, 3);
  assert.match(porras.encargado, /Sofía Valenzuela/);

  const menu = await api('GET', '/menu/productos');
  assert.equal(menu.datos.length, 16);
  const frappes = await api('GET', '/menu/productos?categoria=frappes&disponibles=true');
  assert.equal(frappes.datos.length, 4, 'el de mazapán está agotado');
  const kinder = await api('GET', '/menu/productos/frappe-kinder-bueno');
  assert.equal(kinder.datos.precioStr, '$98 MXN');
  assert.ok(kinder.datos.ingredientes.length > 0);

  const actividades = await api('GET', '/actividades');
  assert.equal(actividades.datos.length, 8);
  const cine = actividades.datos.find((a) => a.slug === 'noche-cine');
  assert.deepEqual([cine.cupoTotal, cine.lugaresOcupados, cine.lugaresDisponibles], [40, 28, 12]);
  assert.equal(cine.horarioTexto, '8:00 PM – 11:00 PM');

  const promociones = await api('GET', '/promociones');
  assert.equal(promociones.datos.length, 7);
  assert.equal(promociones.datos.find((p) => p.codigo === 'MF-PROMO-2X1').canjesHoy, 19);
});

// ---------------------------------------------------------------------------
// Sesiones y permisos
// ---------------------------------------------------------------------------

test('autenticación: credenciales, sesión y permisos por tipo de usuario', async () => {
  const mala = await api('POST', '/auth/staff/login', {
    body: { email: 'admin@cafemarfil.mx', password: 'incorrecta' }
  });
  assert.equal(mala.status, 401);

  // Un cliente no puede entrar por el login del panel aunque su contraseña sea válida.
  const cruzada = await api('POST', '/auth/staff/login', {
    body: { email: 'sofia.navarro@gmail.com', password: PASSWORD_DEMO }
  });
  assert.equal(cruzada.status, 401);

  const yo = await api('GET', '/auth/me', { token: sesion.admin });
  assert.equal(yo.datos.tipo, 'staff');
  assert.equal(yo.datos.usuario.rol, 'admin');
  assert.equal(yo.datos.usuario.password_hash, undefined, 'nunca se expone el hash');

  assert.equal((await api('GET', '/mesas')).status, 401, 'anónimo');
  assert.equal((await api('GET', '/mesas', { token: sesion.cliente })).status, 403, 'cliente en ruta del panel');
  assert.equal((await api('GET', '/mesas', { token: 'token-falso' })).status, 401);
  assert.equal((await api('GET', '/mi/perfil', { token: sesion.host })).status, 403, 'staff en ruta de cliente');
  assert.equal((await api('GET', '/no-existe')).status, 404);
});

test('registro de clientes en la PWA', async () => {
  const nuevo = {
    nombre: 'Renata Ibarra',
    email: 'Renata@Example.com',
    password: 'cafeconleche',
    telefono: '618-000-1122'
  };
  const alta = await api('POST', '/auth/clientes/registro', { body: nuevo });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.requiereVerificacion, true);
  assert.equal(alta.datos.token, undefined, 'no entrega sesión hasta confirmar código de 6 dígitos');
  assert.equal(alta.datos.cliente.email, 'renata@example.com', 'el correo se guarda en minúsculas');
  assert.match(alta.datos.cliente.codigoCliente, /^MF-CLUB-\d{5}$/);
  assert.equal(alta.datos.cliente.nivel, 'Explorador');

  // No puede iniciar sesión antes de confirmar el código de 6 dígitos.
  const loginBloqueado = await api('POST', '/auth/clientes/login', {
    body: { email: 'renata@example.com', password: 'cafeconleche' }
  });
  assert.equal(loginBloqueado.status, 403);

  assert.equal((await api('POST', '/auth/clientes/registro', { body: nuevo })).status, 409, 'correo repetido');

  const corta = await api('POST', '/auth/clientes/registro', {
    body: { ...nuevo, email: 'otra@example.com', password: '123' }
  });
  assert.equal(corta.status, 400);
  assert.equal(corta.datos.detalles[0].campo, 'password');
});

// ---------------------------------------------------------------------------
// Reservaciones y mesas
// ---------------------------------------------------------------------------

test('ciclo completo de una reservación registrada por el host', async () => {
  const m03 = mesaId['porras-matriz/M03'];
  const datos = {
    comensal: 'Prueba Host',
    telefono: '618-555-0000',
    sucursalId: 'porras-matriz',
    fecha: HOY,
    hora: '9:00 PM',
    personas: 3,
    mesaId: m03
  };

  const creada = await api('POST', '/reservaciones', { token: sesion.host, body: datos });
  assert.equal(creada.status, 201);
  const { folio } = creada.datos;
  assert.match(folio, /^MF-RES-\d{5}$/);
  assert.equal(creada.datos.hora, '21:00', 'la hora se normaliza a 24 h');
  assert.equal(creada.datos.horaTexto, '9:00 PM');
  assert.equal(creada.datos.origen, 'host');
  assert.equal(creada.datos.mesaAsignada, 'M03');

  // La mesa libre con reservación confirmada para hoy se ve "reservada".
  let mesa = (await api('GET', `/mesas/${m03}`, { token: sesion.host })).datos;
  assert.equal(mesa.estado, 'reservada');
  assert.equal(mesa.reservaFolio, folio);

  // No se puede encimar otra reservación ni sentar un walk-in en esa mesa.
  const encimada = await api('POST', '/reservaciones', { token: sesion.host, body: { ...datos, hora: '20:00' } });
  assert.equal(encimada.status, 409);
  const walkIn = await api('POST', `/mesas/${m03}/walk-in`, { token: sesion.host, body: { personas: 2 } });
  assert.equal(walkIn.status, 409);

  // Editar mientras sigue confirmada.
  const editada = await api('PATCH', `/reservaciones/${folio}`, {
    token: sesion.host,
    body: { personas: 4, notas: 'Traen pastel' }
  });
  assert.equal(editada.datos.personas, 4);
  const excedida = await api('PATCH', `/reservaciones/${folio}`, { token: sesion.host, body: { personas: 5 } });
  assert.equal(excedida.status, 409, 'la mesa M03 es para 4');

  // Check-in: la reservación pasa a en_curso y la mesa a ocupada.
  const checkIn = await api('POST', `/reservaciones/${folio}/check-in`, { token: sesion.host, body: {} });
  assert.equal(checkIn.datos.estado, 'en_curso');
  mesa = (await api('GET', `/mesas/${m03}`, { token: sesion.host })).datos;
  assert.deepEqual(
    [mesa.estado, mesa.comensal, mesa.personas, mesa.reservaFolio],
    ['ocupada', 'Prueba Host', 4, folio]
  );
  assert.equal(mesa.ticketAprox, 4 * 180, 'sin ticket se estima por persona');

  assert.equal((await api('POST', `/reservaciones/${folio}/check-in`, { token: sesion.host, body: {} })).status, 409);
  assert.equal(
    (await api('PATCH', `/reservaciones/${folio}`, { token: sesion.host, body: { personas: 2 } })).status,
    409
  );

  // Completar: se cierra el servicio con su ticket y la mesa pasa a limpieza.
  const completada = await api('POST', `/reservaciones/${folio}/completar`, {
    token: sesion.host,
    body: { ticketTotal: 890 }
  });
  assert.equal(completada.datos.estado, 'asistida');
  assert.equal(completada.datos.totalEstimado, 890);
  mesa = (await api('GET', `/mesas/${m03}`, { token: sesion.host })).datos;
  assert.equal(mesa.estado, 'limpieza');

  const limpia = await api('POST', `/mesas/${m03}/limpia`, { token: sesion.host });
  assert.equal(limpia.datos.estado, 'libre');
  assert.equal((await api('POST', `/mesas/${m03}/limpia`, { token: sesion.host })).status, 409);
});

test('walk-in: sentar, cobrar y liberar una mesa', async () => {
  const m07 = mesaId['porras-matriz/M07'];
  const grande = await api('POST', `/mesas/${m07}/walk-in`, { token: sesion.host, body: { personas: 9 } });
  assert.equal(grande.status, 409, 'M07 es para 4 personas');

  const sentado = await api('POST', `/mesas/${m07}/walk-in`, {
    token: sesion.host,
    body: { comensal: 'Pareja sin reserva', personas: 2 }
  });
  assert.equal(sentado.status, 201);
  assert.equal(sentado.datos.estado, 'ocupada');
  assert.equal(sentado.datos.mesero, 'Valeria Siqueiros', 'queda registrado quién lo sentó');

  assert.equal((await api('POST', `/mesas/${m07}/walk-in`, { token: sesion.host, body: { personas: 2 } })).status, 409);

  const conCuenta = await api('PATCH', `/mesas/${m07}`, { token: sesion.host, body: { ticketTotal: 315 } });
  assert.equal(conCuenta.datos.ticketAprox, 315);

  const liberada = await api('POST', `/mesas/${m07}/liberar`, { token: sesion.host, body: {} });
  assert.equal(liberada.datos.estado, 'limpieza');
  assert.equal((await api('POST', `/mesas/${m07}/liberar`, { token: sesion.host, body: {} })).status, 409);
});

test('reservación de invitado desde la PWA y gestión con el token del QR', async () => {
  const invalida = await api('POST', '/reservaciones', {
    body: { sucursalId: 'porras-matriz', fecha: '02/10/2026', hora: '25:00', personas: 0 }
  });
  assert.equal(invalida.status, 400);
  assert.deepEqual(invalida.datos.detalles.map((d) => d.campo).sort(), ['fecha', 'hora', 'personas']);

  const pasada = await api('POST', '/reservaciones', {
    body: {
      comensal: 'Ana',
      telefono: '618',
      sucursalId: 'calvario',
      fecha: sumarDias(HOY, -1),
      hora: '10:00',
      personas: 2
    }
  });
  assert.equal(pasada.status, 400);

  const creada = await api('POST', '/reservaciones', {
    body: {
      tipo: 'juegos',
      comensal: 'Ana Invitada',
      telefono: '618-777-0001',
      sucursalId: 'calvario',
      fecha: MANANA,
      hora: '6:00 PM',
      personas: 4,
      mesaId: mesaId['calvario/M04']
    }
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.datos.mesaId, null, 'un invitado no puede asignarse mesa');
  assert.equal(creada.datos.origen, 'app');
  assert.equal(creada.datos.tipoNombre, 'Mesa con Juegos de Mesa');
  const { tokenQR, folio } = creada.datos;

  // El folio no basta para consultar desde fuera; se necesita el token secreto.
  assert.equal((await api('GET', `/reservaciones/${folio}`)).status, 401);
  assert.equal((await api('GET', `/reservaciones/publica/${folio}`)).status, 404);
  const consulta = await api('GET', `/reservaciones/publica/${tokenQR}`);
  assert.equal(consulta.datos.folio, folio);

  const cancelada = await api('POST', `/reservaciones/publica/${tokenQR}/cancelar`);
  assert.equal(cancelada.datos.estado, 'cancelada');
  assert.equal((await api('POST', `/reservaciones/publica/${tokenQR}/cancelar`)).status, 409);
});

test('el registro del admin muestra la reserva futura de la landing y mantiene separados los datos de hoy', async () => {
  const creada = await api('POST', '/reservaciones', {
    body: {
      comensal: 'Prueba registro admin',
      telefono: '618-555-0100',
      sucursalId: 'porras-matriz',
      fecha: MANANA,
      hora: '16:30',
      personas: 2
    }
  });
  assert.equal(creada.status, 201);
  const { folio } = creada.datos;

  // Usa la misma carga de datos que App.jsx, contra la API y MySQL reales.
  const consultar = async (ruta, { query }) => {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(query)) {
      if (valor !== undefined) params.set(clave, valor);
    }
    const respuesta = await api('GET', `${ruta}?${params}`, { token: sesion.admin });
    assert.equal(respuesta.status, 200);
    return respuesta.datos;
  };

  const todas = await cargarReservacionesPanel(consultar, { hoy: HOY });
  const visible = todas.reservaciones.map(aReservacion(HOY)).find((r) => r.folio === folio);
  assert.ok(visible, 'la reserva de mañana aparece sin tener que cambiar filtros');
  assert.equal(visible.fechaISO, MANANA);
  assert.equal(visible.estado, 'confirmada');
  assert.ok(todas.reservacionesHoy.length > 0, 'hay reservas de hoy en los datos de prueba');
  assert.ok(todas.reservacionesHoy.every((r) => r.fecha === HOY));
  assert.ok(!todas.reservacionesHoy.some((r) => r.folio === folio));

  const manana = await cargarReservacionesPanel(consultar, {
    hoy: HOY,
    fecha: MANANA,
    sucursalId: 'porras-matriz'
  });
  assert.ok(manana.reservaciones.some((r) => r.folio === folio));
  assert.ok(manana.reservaciones.every((r) => r.fecha === MANANA && r.sucursalId === 'porras-matriz'));
  assert.ok(manana.reservacionesHoy.every((r) => r.fecha === HOY && r.sucursalId === 'porras-matriz'));

  const hoy = await cargarReservacionesPanel(consultar, { hoy: HOY, fecha: HOY });
  assert.deepEqual(hoy.reservaciones, todas.reservacionesHoy);
  assert.deepEqual(hoy.reservacionesHoy, todas.reservacionesHoy);

  const otraSucursal = await cargarReservacionesPanel(consultar, {
    hoy: HOY,
    fecha: MANANA,
    sucursalId: 'calvario'
  });
  assert.ok(!otraSucursal.reservaciones.some((r) => r.folio === folio));
  assert.ok(otraSucursal.reservaciones.every((r) => r.sucursalId === 'calvario'));
});

test('reservar una actividad respeta su fecha, su sucursal y su cupo', async () => {
  const antes = (await api('GET', '/actividades/glow-paint')).datos;
  assert.equal(antes.lugaresDisponibles, 4);

  const creada = await api('POST', '/reservaciones', {
    body: {
      tipo: 'actividad',
      actividadId: 'glow-paint',
      comensal: 'Grupo Neón',
      telefono: '618-321-0000',
      personas: 3,
      fecha: MANANA,
      sucursalId: 'porras-matriz'
    }
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.datos.fecha, antes.fecha, 'manda la fecha de la actividad');
  assert.equal(creada.datos.sucursalId, 'calvario', 'manda la sucursal de la actividad');
  assert.equal(creada.datos.hora, '19:00');
  assert.equal(creada.datos.totalEstimado, 3 * 250);

  const sinCupo = await api('POST', '/reservaciones', {
    body: { tipo: 'actividad', actividadId: antes.id, comensal: 'Otro Grupo', telefono: '618-321-0001', personas: 2 }
  });
  assert.equal(sinCupo.status, 409);
  assert.match(sinCupo.datos.error, /Solo quedan 1 lugares/);

  assert.equal((await api('GET', '/actividades/glow-paint')).datos.lugaresDisponibles, 1);

  // No se puede hacer check-in hoy de algo que es para otro día.
  const anticipado = await api('POST', `/reservaciones/${creada.datos.folio}/check-in`, {
    token: sesion.host,
    body: {}
  });
  assert.equal(anticipado.status, 409);

  const faltaActividad = await api('POST', '/reservaciones', {
    body: { tipo: 'actividad', comensal: 'X', telefono: '1', personas: 1 }
  });
  assert.equal(faltaActividad.status, 400);
});

// ---------------------------------------------------------------------------
// Cuenta del cliente (PWA)
// ---------------------------------------------------------------------------

test('mi cuenta: perfil, reservaciones, beneficios y notificaciones', async () => {
  const token = sesion.cliente;

  const perfil = await api('GET', '/mi/perfil', { token });
  assert.deepEqual(
    [
      perfil.datos.primerNombre,
      perfil.datos.sellosActuales,
      perfil.datos.sellosMeta,
      perfil.datos.puntos,
      perfil.datos.nivel
    ],
    ['Sofía', 6, 8, 380, 'Café Lover']
  );

  const editado = await api('PATCH', '/mi/perfil', {
    token,
    body: { telefono: '618-999-8888', preferencias: { lechePreferida: 'Leche de almendra' } }
  });
  assert.equal(editado.datos.telefono, '618-999-8888');
  assert.equal(editado.datos.preferencias.lechePreferida, 'Leche de almendra');
  assert.equal(
    editado.datos.preferencias.frappeFavorito,
    'Frappé Kinder Bueno 16oz',
    'las demás preferencias se conservan'
  );

  const beneficios = (await api('GET', '/mi/beneficios', { token })).datos;
  assert.deepEqual(beneficios.map((b) => b.estado).sort(), ['bloqueado', 'disponible', 'disponible', 'usado']);
  assert.equal(beneficios.find((b) => b.estado === 'bloqueado').progreso, '6 de 8 sellos completados');

  const notificacionesAntes = (await api('GET', '/mi/notificaciones', { token })).datos;
  assert.equal(notificacionesAntes.filter((n) => !n.leida).length, 2);

  // Reservar con sesión: toma nombre y teléfono del perfil y queda ligada a la cuenta.
  const creada = await api('POST', '/reservaciones', {
    token,
    body: { sucursalId: 'calvario', fecha: MANANA, hora: '11:00', personas: 2 }
  });
  assert.equal(creada.status, 201);
  assert.equal(creada.datos.comensal, 'Sofía Navarro Morales');
  assert.equal(creada.datos.telefono, '618-999-8888');
  const { folio } = creada.datos;

  const mias = (await api('GET', '/mi/reservaciones', { token })).datos;
  assert.equal(mias.length, 3);
  assert.equal(mias.find((r) => r.folio === 'MF-RES-73190').esHistorica, true);
  assert.equal(mias.find((r) => r.folio === folio).esHistorica, false);

  const notificaciones = (await api('GET', '/mi/notificaciones', { token })).datos;
  assert.equal(notificaciones.length, notificacionesAntes.length + 1);
  assert.equal(notificaciones[0].titulo, '¡Reservación confirmada!');

  // Solo puede cancelar lo suyo.
  assert.equal((await api('POST', '/mi/reservaciones/MF-RES-90142/cancelar', { token })).status, 404);
  const cancelada = await api('POST', `/mi/reservaciones/${folio}/cancelar`, { token });
  assert.equal(cancelada.datos.estado, 'cancelada');

  const leidas = await api('POST', '/mi/notificaciones/leer-todas', { token });
  assert.ok(leidas.datos.every((n) => n.leida));
});

// ---------------------------------------------------------------------------
// Club Marfil, cupones y escáner
// ---------------------------------------------------------------------------

test('pasaporte de sellos: completar, canjear la recompensa y reiniciar', async () => {
  const token = sesion.host;
  const paola = 'MF-CLUB-77312'; // empieza con 7 de 8 sellos

  const sello = await api('POST', `/club/clientes/${paola}/sello`, { token, body: {} });
  assert.equal(sello.datos.pasaporteCompletado, true);
  assert.deepEqual(
    [sello.datos.cliente.sellosActuales, sello.datos.cliente.puntos, sello.datos.cliente.visitasTotales],
    [8, 470, 24]
  );
  assert.equal(sello.datos.cliente.recompensaDisponible, true);
  assert.equal(sello.datos.cliente.recompensaNombre, 'Copa Doble de Fresas Estilo Dubái GRATIS');

  // Con el pasaporte lleno la visita da puntos pero no más sellos.
  const extra = await api('POST', `/club/clientes/${paola}/sello`, { token, body: {} });
  assert.equal(extra.datos.pasaporteCompletado, false);
  assert.deepEqual([extra.datos.cliente.sellosActuales, extra.datos.cliente.puntos], [8, 520]);

  const canje = await api('POST', `/club/clientes/${paola}/canjear-recompensa`, { token });
  assert.equal(canje.datos.beneficio.estado, 'usado');
  assert.deepEqual([canje.datos.cliente.sellosActuales, canje.datos.cliente.recompensaDisponible], [0, false]);
  assert.equal((await api('POST', `/club/clientes/${paola}/canjear-recompensa`, { token })).status, 409);

  // Beneficio suelto de la cuenta demo: se canjea una sola vez.
  const beneficio = await api('POST', '/club/beneficios/mf-frappe-992/canjear', { token });
  assert.equal(beneficio.datos.beneficio.estado, 'usado');
  assert.equal((await api('POST', '/club/beneficios/MF-FRAPPE-992/canjear', { token })).status, 409);

  const alta = await api('POST', '/club/clientes', {
    token,
    body: { nombre: 'Cliente de Caja', telefono: '618-101-0101' }
  });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.tieneCuenta, false);
  const busqueda = await api('GET', '/club/clientes?q=Caja', { token });
  assert.equal(busqueda.datos.length, 1);
});

test('cupones: canje, sucursal válida, límite diario y promociones pausadas', async () => {
  const ludoteca = (await api('GET', '/promociones/MF-PROMO-LUDOTECA', { token: sesion.host })).datos;
  assert.equal(ludoteca.canjesHoy, 6);

  const canje = await api('POST', `/promociones/${ludoteca.id}/canjear`, {
    token: sesion.host,
    body: { codigoCliente: 'MF-CLUB-33109' }
  });
  assert.equal(canje.datos.canjesHoy, 7);

  const otraSucursal = await api('POST', `/promociones/${ludoteca.id}/canjear`, {
    token: sesion.host,
    body: { sucursalId: 'calvario' }
  });
  assert.equal(otraSucursal.status, 409);

  // Solo gerencia edita promociones.
  assert.equal(
    (await api('PATCH', `/promociones/${ludoteca.id}`, { token: sesion.host, body: { limiteDiario: 7 } })).status,
    403
  );
  await api('PATCH', `/promociones/${ludoteca.id}`, { token: sesion.admin, body: { limiteDiario: 7 } });
  const agotado = await api('POST', `/promociones/${ludoteca.id}/canjear`, { token: sesion.host, body: {} });
  assert.equal(agotado.status, 409);
  assert.match(agotado.datos.error, /límite de 7 canjes/);

  const pausada = await api('PATCH', `/promociones/${ludoteca.id}`, {
    token: sesion.admin,
    body: { estado: 'pausado' }
  });
  assert.equal(pausada.datos.estado, 'pausado');
  assert.equal((await api('GET', '/promociones')).datos.length, 6, 'el cliente no ve las pausadas');
  assert.equal((await api('GET', '/promociones', { token: sesion.host })).datos.length, 7);
  assert.equal((await api('GET', '/promociones/MF-PROMO-LUDOTECA')).status, 404);

  const nueva = await api('POST', '/promociones', {
    token: sesion.admin,
    body: {
      codigo: 'mf-promo-test',
      titulo: 'Promo de prueba',
      categoria: 'Pruebas',
      descuentoBadge: '10% OFF',
      beneficio: '10% en todo',
      vigencia: 'Esta semana'
    }
  });
  assert.equal(nueva.status, 201);
  assert.equal(nueva.datos.codigo, 'MF-PROMO-TEST');
  assert.deepEqual(nueva.datos.sucursales.sort(), ['calvario', 'porras-matriz'], 'por defecto aplica en todas');
  const repetida = await api('POST', '/promociones', {
    token: sesion.admin,
    body: { codigo: 'MF-PROMO-TEST', titulo: 'x', categoria: 'x', descuentoBadge: 'x', beneficio: 'x', vigencia: 'x' }
  });
  assert.equal(repetida.status, 409);
});

test('escáner: identifica el tipo de código y lleva bitácora', async () => {
  const token = sesion.host;

  const reserva = await api('GET', '/escaner/MF-RES-90142', { token });
  assert.deepEqual([reserva.datos.tipo, reserva.datos.estado], ['reservacion', 'confirmada']);
  assert.equal(reserva.datos.accion, 'POST /api/reservaciones/MF-RES-90142/check-in');

  // También funciona con el token secreto del QR.
  const porToken = await api('GET', `/escaner/${reserva.datos.datos.tokenQR}`, { token });
  assert.equal(porToken.datos.datos.folio, 'MF-RES-90142');

  const cupon = await api('GET', '/escaner/mf-promo-2x1', { token });
  assert.deepEqual([cupon.datos.tipo, cupon.datos.estado], ['promocion', 'activo']);

  const club = await api('GET', '/escaner/MF-CLUB-88410', { token });
  assert.deepEqual([club.datos.tipo, club.datos.estado], ['club', 'recompensa_lista']);

  const beneficio = await api('GET', '/escaner/MF-MAMUT-418', { token });
  assert.deepEqual([beneficio.datos.tipo, beneficio.datos.estado], ['beneficio', 'disponible']);

  assert.equal((await api('GET', '/escaner/CODIGO-INVENTADO', { token })).status, 404);

  const historial = (await api('GET', '/escaner/historial?limite=5', { token })).datos;
  assert.equal(historial.length, 5);
  assert.deepEqual([historial[0].codigo, historial[0].exito], ['CODIGO-INVENTADO', false]);
  assert.ok(historial.some((e) => e.tipo === 'promocion' && e.exito));
});

// ---------------------------------------------------------------------------
// Menú, ludoteca, equipo y métricas
// ---------------------------------------------------------------------------

test('menú: cocina cambia disponibilidad, solo gerencia edita la ficha', async () => {
  const kinder = (await api('GET', '/menu/productos/frappe-kinder-bueno')).datos;

  const agotado = await api('PATCH', `/menu/productos/${kinder.id}`, {
    token: sesion.host,
    body: { disponibleEnCocina: false }
  });
  assert.equal(agotado.datos.disponibleEnCocina, false);
  assert.equal(
    (await api('PATCH', `/menu/productos/${kinder.id}`, { token: sesion.host, body: { precio: 1 } })).status,
    403
  );
  assert.equal(
    (await api('PATCH', `/menu/productos/${kinder.id}`, { body: { disponibleEnCocina: true } })).status,
    401
  );

  const precio = await api('PATCH', `/menu/productos/${kinder.id}`, {
    token: sesion.admin,
    body: { precio: 105, disponibleEnCocina: true }
  });
  assert.deepEqual(
    [precio.datos.precio, precio.datos.precioStr, precio.datos.disponibleEnCocina],
    [105, '$105 MXN', true]
  );

  const nuevo = await api('POST', '/menu/productos', {
    token: sesion.admin,
    body: { nombre: 'Soda Italiana de Frutos Rojos', categoriaSlug: 'frappes', precio: 68 }
  });
  assert.equal(nuevo.status, 201);
  assert.equal(nuevo.datos.slug, 'soda-italiana-de-frutos-rojos');
  assert.deepEqual([nuevo.datos.stockDiario, nuevo.datos.vendidosHoy, nuevo.datos.badge], [30, 0, null]);

  const categoriaMala = await api('POST', '/menu/productos', {
    token: sesion.admin,
    body: { nombre: 'X', categoriaSlug: 'no-existe', precio: 1 }
  });
  assert.equal(categoriaMala.status, 400);

  assert.equal((await api('DELETE', `/menu/productos/${nuevo.datos.id}`, { token: sesion.admin })).status, 204);
  assert.equal((await api('GET', `/menu/productos/${nuevo.datos.id}`)).status, 404);
  assert.equal((await api('GET', '/menu/productos')).datos.length, 16);
});

test('menú: borradores ocultos al público, publicación, reorden y subida de imagen', async () => {
  const borrador = await api('POST', '/menu/productos', {
    token: sesion.admin,
    body: {
      nombre: 'Waffle Pistache Secreto',
      categoriaSlug: 'postres',
      precio: 145,
      estado: 'borrador',
      destacado: true
    }
  });
  assert.equal(borrador.status, 201);
  assert.equal(borrador.datos.estado, 'borrador');

  // El público no puede ver borradores ni pedir incluirBorradores=1.
  assert.equal((await api('GET', '/menu/productos?incluirBorradores=1')).status, 403);
  assert.equal((await api('GET', `/menu/productos/${borrador.datos.id}`)).status, 404);
  const publicoAntes = (await api('GET', '/menu/productos')).datos;
  assert.equal(publicoAntes.some((p) => p.id === borrador.datos.id), false);

  // El personal sí ve borradores cuando lo solicita.
  const conBorradores = (await api('GET', '/menu/productos?incluirBorradores=1', { token: sesion.host })).datos;
  assert.equal(conBorradores.some((p) => p.id === borrador.datos.id && p.estado === 'borrador'), true);

  // Host no puede publicar; admin sí.
  assert.equal(
    (await api('POST', `/menu/productos/${borrador.datos.id}/publicar`, { token: sesion.host })).status,
    403
  );
  const publicado = await api('POST', `/menu/productos/${borrador.datos.id}/publicar`, { token: sesion.admin });
  assert.equal(publicado.status, 200);
  assert.equal(publicado.datos.estado, 'publicado');
  assert.equal((await api('GET', `/menu/productos/${borrador.datos.id}`)).status, 200);

  // Despublicar lo regresa a borrador.
  const despublicado = await api('POST', `/menu/productos/${borrador.datos.id}/despublicar`, { token: sesion.admin });
  assert.equal(despublicado.status, 200);
  assert.equal(despublicado.datos.estado, 'borrador');
  assert.equal((await api('GET', `/menu/productos/${borrador.datos.id}`)).status, 404);

  // Reordenamiento de productos.
  const kinder = publicoAntes.find((p) => p.slug === 'frappe-kinder-bueno');
  const reordenado = await api('PATCH', '/menu/orden', {
    token: sesion.admin,
    body: { items: [{ id: kinder.id, orden: 5 }, { id: borrador.datos.id, orden: 1 }] }
  });
  assert.equal(reordenado.status, 200);
  assert.equal(reordenado.datos.find((p) => p.id === kinder.id).orden, 5);

  // Limpieza del borrador para mantener el catálogo base.
  assert.equal((await api('DELETE', `/menu/productos/${borrador.datos.id}`, { token: sesion.admin })).status, 204);

  // Subida de imágenes: validación de permisos, magic bytes y descarga estática.
  const origen = base.replace(/\/api$/, '');
  const pngValido = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52
  ]);

  const formFalso = new FormData();
  formFalso.append('imagen', new Blob(['no-es-png-real'], { type: 'image/png' }), 'falso.png');
  const respFalso = await fetch(`${base}/uploads/imagen`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sesion.admin}` },
    body: formFalso
  });
  assert.equal(respFalso.status, 400);

  // El menú solo acepta PNG (rechaza JPG válido en carpeta=menu).
  const jpgValido = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const formJpgMenu = new FormData();
  formJpgMenu.append('imagen', new Blob([jpgValido], { type: 'image/jpeg' }), 'foto.jpg');
  const respJpgMenu = await fetch(`${base}/uploads/imagen?carpeta=menu`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sesion.admin}` },
    body: formJpgMenu
  });
  assert.equal(respJpgMenu.status, 400);

  const formHost = new FormData();
  formHost.append('imagen', new Blob([pngValido], { type: 'image/png' }), 'host.png');
  const respHost = await fetch(`${base}/uploads/imagen`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sesion.host}` },
    body: formHost
  });
  assert.equal(respHost.status, 403);

  const formOk = new FormData();
  formOk.append('imagen', new Blob([pngValido], { type: 'image/png' }), 'ok.png');
  const respOk = await fetch(`${base}/uploads/imagen`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sesion.admin}` },
    body: formOk
  });
  assert.equal(respOk.status, 201);
  const subida = await respOk.json();
  assert.match(subida.url, /^\/uploads\/.+\.png$/);

  const descargada = await fetch(`${origen}${subida.url}`);
  assert.equal(descargada.status, 200);
  await fs.rm(path.resolve(process.cwd(), 'uploads', subida.archivo), { force: true });
});

test('ludoteca: préstamos, devoluciones y devolución automática al liberar la mesa', async () => {
  const token = sesion.host;
  const juegos = (await api('GET', '/juegos', { token })).datos;
  assert.equal(juegos.length, 8);
  assert.equal((await api('GET', '/juegos?estado=en_mesa', { token })).datos.length, 2);

  const carcassonne = juegos.find((j) => j.nombre === 'Carcassonne');
  assert.deepEqual([carcassonne.estado, carcassonne.vecesJugadoMes], ['disponible', 39]);

  // Un préstamo requiere un servicio de mesa abierto.
  assert.equal(
    (await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['porras-matriz/L03'] } }))
      .status,
    409
  );
  assert.equal(
    (
      await api('POST', `/mesas/${mesaId['porras-matriz/L03']}/walk-in`, {
        token,
        body: { personas: 2, comensal: 'Grupo Ludoteca' }
      })
    ).status,
    201
  );

  const prestado = await api('POST', `/juegos/${carcassonne.id}/prestar`, {
    token,
    body: { mesaId: mesaId['porras-matriz/L03'] }
  });
  assert.deepEqual(
    [prestado.datos.estado, prestado.datos.mesaActual, prestado.datos.vecesJugadoMes],
    ['en_mesa', 'L03 (Grupo Ludoteca)', 40]
  );
  assert.equal(
    (await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['porras-matriz/L03'] } }))
      .status,
    409
  );
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/devolver`, { token })).datos.estado, 'disponible');
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/devolver`, { token })).status, 409);

  // Un juego de Porras no se puede prestar a una mesa de Calvario.
  assert.equal(
    (await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['calvario/M04'] } }))
      .status,
    409
  );

  // Catan está en L01 con la reservación MF-RES-66231: al completarla regresa solo.
  const catan = juegos.find((j) => j.nombre.startsWith('Catan'));
  assert.equal(catan.mesaActual, 'L01 (Javier Domínguez)');
  await api('POST', '/reservaciones/MF-RES-66231/completar', { token, body: {} });
  const catanDespues = (await api('GET', '/juegos?q=Catan', { token })).datos[0];
  assert.equal(catanDespues.estado, 'disponible');

  const marcado = await api('PATCH', `/juegos/${carcassonne.id}`, {
    token,
    body: { reposicionRequerida: true, piezasEstado: 'Faltan 3 losetas' }
  });
  assert.equal(marcado.datos.reposicionRequerida, true);
  assert.equal(
    (
      await api('POST', '/juegos', {
        token,
        body: {
          nombre: 'Azul',
          categoria: 'Abstracto',
          jugadores: '2 - 4 jugadores',
          duracion: '40 min',
          dificultad: 'Fácil',
          sucursalId: 'porras-matriz'
        }
      })
    ).status,
    403
  );
  const azul = await api('POST', '/juegos', {
    token: sesion.admin,
    body: {
      nombre: 'Azul',
      categoria: 'Abstracto',
      jugadores: '2 - 4 jugadores',
      duracion: '40 min',
      dificultad: 'Fácil',
      sucursalId: 'porras-matriz'
    }
  });
  assert.equal(azul.status, 201);
  assert.equal(azul.datos.vecesJugadoMes, 0);
});

test('equipo: solo el admin da de alta, y una baja corta la sesión al instante', async () => {
  const personal = (await api('GET', '/personal', { token: sesion.host })).datos;
  assert.equal(personal.length, 6);
  assert.equal(personal.find((p) => p.nombre === 'Erick Rentería').tieneAcceso, false);

  const nuevoHost = {
    nombre: 'Nuevo Host',
    puesto: 'Host de Fin de Semana',
    rol: 'host',
    sucursalId: 'calvario',
    turnoInicio: '4:00 PM',
    turnoFin: '23:00'
  };
  assert.equal((await api('POST', '/personal', { token: sesion.host, body: nuevoHost })).status, 403);
  assert.equal(
    (await api('POST', '/personal', { token: sesion.admin, body: nuevoHost })).status,
    400,
    'un rol con acceso exige correo y contraseña'
  );

  const alta = await api('POST', '/personal', {
    token: sesion.admin,
    body: { ...nuevoHost, email: 'finde@cafemarfil.mx', password: 'turno-de-finde' }
  });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.turno, '16:00 - 23:00');

  const acceso = await api('POST', '/auth/staff/login', {
    body: { email: 'finde@cafemarfil.mx', password: 'turno-de-finde' }
  });
  assert.equal(acceso.status, 200);
  assert.equal((await api('GET', '/mesas', { token: acceso.datos.token })).status, 200);

  await api('PATCH', `/personal/${alta.datos.id}`, { token: sesion.admin, body: { estado: 'inactivo' } });
  assert.equal((await api('GET', '/mesas', { token: acceso.datos.token })).status, 401);
  assert.equal(
    (await api('POST', '/auth/staff/login', { body: { email: 'finde@cafemarfil.mx', password: 'turno-de-finde' } }))
      .status,
    401
  );
});

test('métricas del día para el dashboard', async () => {
  // Un servicio cerrado hoy en Calvario, para no depender de la hora a la que corre la prueba.
  const m04 = mesaId['calvario/M04'];
  await api('POST', `/mesas/${m04}/walk-in`, { token: sesion.admin, body: { personas: 5 } });
  await api('POST', `/mesas/${m04}/liberar`, { token: sesion.admin, body: { ticketTotal: 950 } });

  const todas = (await api('GET', '/metricas/hoy', { token: sesion.host })).datos;
  const calvario = (await api('GET', '/metricas/hoy?sucursalId=calvario', { token: sesion.host })).datos;

  assert.equal(todas.fecha, HOY);
  assert.equal(todas.distribucionHoraria.length, 15, 'una franja por hora de 08:00 a 22:00');
  assert.ok(todas.comensalesHoy > 0 && todas.ventasHoy > 0 && todas.ticketPromedio > 0);
  assert.ok(todas.reservasHoy >= todas.reservasAsistidas + todas.reservasNoShow);
  assert.ok(todas.sellosEmitidosHoy >= 2, 'los dos sellos de la prueba del pasaporte');
  assert.ok(todas.aforoPorcentaje > 0 && todas.aforoPorcentaje <= 100);
  assert.equal(todas.aforoMax, 85 + 48);

  assert.equal(calvario.aforoMax, 48);
  assert.ok(calvario.comensalesHoy > 0 && calvario.comensalesHoy < todas.comensalesHoy);
  assert.ok(calvario.ventasHoy < todas.ventasHoy);
});

test('JWT: rechaza algoritmo, emisor, audiencia y claims incorrectos', async () => {
  const opciones = { subject: '1', issuer: config.jwtEmisor, audience: config.jwtAudiencia, expiresIn: '1h' };
  const payload = { tipo: 'staff', version: 0 };
  const variantes = [
    jwt.sign(payload, config.jwtSecret, { ...opciones, algorithm: 'HS384' }),
    jwt.sign(payload, config.jwtSecret, { ...opciones, issuer: 'ajeno' }),
    jwt.sign(payload, config.jwtSecret, { ...opciones, audience: 'ajena' }),
    jwt.sign(payload, config.jwtSecret, { ...opciones, subject: 'NaN' }),
    jwt.sign(payload, config.jwtSecret, { ...opciones, expiresIn: -1 }),
    jwt.sign({ tipo: 'staff' }, config.jwtSecret, opciones),
    jwt.sign(payload, config.jwtSecret, { subject: '1', issuer: config.jwtEmisor, audience: config.jwtAudiencia })
  ];
  for (const token of variantes) assert.equal((await api('GET', '/mesas', { token })).status, 401);
  const malformada = await fetch(base + '/mesas', { headers: { Authorization: `Bearer ${sesion.admin} sobrante` } });
  assert.equal(malformada.status, 401);
});

test('cambios de contraseña y rol revocan todas las sesiones anteriores', async () => {
  const datos = {
    nombre: 'Seguridad Sesiones',
    puesto: 'Host',
    rol: 'host',
    email: 'sesiones@example.com',
    password: 'original-segura'
  };
  const alta = await api('POST', '/personal', { token: sesion.admin, body: datos });
  assert.equal(alta.status, 201);
  const entrar = (password) => api('POST', '/auth/staff/login', { body: { email: datos.email, password } });
  const anterior = (await entrar(datos.password)).datos.token;
  assert.equal(
    (await api('PATCH', `/personal/${alta.datos.id}`, { token: sesion.admin, body: { password: 'nueva-segura-2026' } }))
      .status,
    200
  );
  assert.equal((await api('GET', '/mesas', { token: anterior })).status, 401);
  assert.equal((await entrar(datos.password)).status, 401);
  const vigente = (await entrar('nueva-segura-2026')).datos.token;
  assert.equal((await api('GET', '/mesas', { token: vigente })).status, 200);
  assert.equal(
    (await api('PATCH', `/personal/${alta.datos.id}`, { token: sesion.admin, body: { rol: 'staff' } })).status,
    200
  );
  assert.equal((await api('GET', '/mesas', { token: vigente })).status, 401);
  assert.equal((await entrar('nueva-segura-2026')).status, 401);
  assert.equal(
    (await api('PATCH', `/personal/${alta.datos.id}`, { token: sesion.admin, body: { rol: 'host' } })).status,
    200
  );
  assert.equal((await api('GET', '/mesas', { token: vigente })).status, 401, 'restaurar el rol no revive un token');
});

test('rechaza habilitar acceso a personal sin credenciales', async () => {
  const equipo = (await api('GET', '/personal', { token: sesion.admin })).datos;
  const sinAcceso = equipo.find((p) => !p.tieneAcceso);
  assert.ok(sinAcceso);
  const respuesta = await api('PATCH', `/personal/${sinAcceso.id}`, { token: sesion.admin, body: { rol: 'admin' } });
  assert.equal(respuesta.status, 400);
});

test('inyección SQL: búsquedas y slugs se tratan como datos', async () => {
  const ataque = "' OR 1=1; DROP TABLE clientes; --";
  for (const ruta of ['/menu/productos', '/club/clientes', '/juegos', '/reservaciones']) {
    const respuesta = await api('GET', `${ruta}?q=${encodeURIComponent(ataque)}`, { token: sesion.admin });
    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.datos, []);
  }
  assert.equal((await api('GET', '/menu/productos/' + encodeURIComponent(ataque))).status, 404);
  assert.equal((await api('GET', '/mi/perfil', { token: sesion.cliente })).status, 200);
});

test('dos clientes no acceden a reservaciones ni notificaciones ajenas', async () => {
  let codigoCapturado = null;
  establecerTransporteCorreo({
    async sendMail(msg) {
      const m = /\b(\d{6})\b/.exec(msg.text || '');
      if (m) codigoCapturado = m[1];
      return { messageId: '<test-aislamiento@marfil.local>' };
    }
  });
  let token;
  try {
    const alta = await api('POST', '/auth/clientes/registro', {
      body: { nombre: 'Otro Cliente', email: 'otro-seguridad@example.com', password: 'segura-de-prueba' }
    });
    assert.equal(alta.status, 201);
    assert.ok(codigoCapturado);
    const verif = await api('POST', '/auth/verificar-codigo', {
      body: { email: 'otro-seguridad@example.com', codigo: codigoCapturado }
    });
    assert.equal(verif.status, 200);
    token = verif.datos.token;
  } finally {
    restaurarTransporteCorreo();
  }
  const propia = await api('POST', '/reservaciones', {
    token: sesion.cliente,
    body: { sucursalId: 'calvario', fecha: MANANA, hora: '10:00', personas: 2 }
  });
  assert.equal(propia.status, 201);
  assert.equal((await api('POST', `/mi/reservaciones/${propia.datos.folio}/cancelar`, { token })).status, 404);
  const avisos = (await api('GET', '/mi/notificaciones', { token: sesion.cliente })).datos;
  assert.equal((await api('POST', `/mi/notificaciones/${avisos[0].id}/leer`, { token })).status, 404);
  const listado = await api('GET', '/mi/reservaciones', { token });
  assert.deepEqual(listado.datos, []);
  assert.equal(
    (await api('GET', `/reservaciones/${propia.datos.folio}`, { token: sesion.admin })).datos.estado,
    'confirmada'
  );
});

test('último cupo: solo una de dos reservaciones simultáneas se confirma', async () => {
  const actividad = await api('POST', '/actividades', {
    token: sesion.admin,
    body: {
      nombre: 'Cupo concurrente',
      categoria: 'Taller',
      categoriaSlug: 'taller',
      sucursalId: 'calvario',
      resumen: 'Prueba de concurrencia',
      fecha: MANANA,
      horaInicio: '12:00',
      cupoTotal: 1
    }
  });
  assert.equal(actividad.status, 201);
  const reservar = (nombre) =>
    api('POST', '/reservaciones', {
      body: {
        tipo: 'actividad',
        actividadId: actividad.datos.id,
        personas: 1,
        comensal: nombre,
        telefono: '6180000000'
      }
    });
  const resultados = await Promise.all([reservar('Primero'), reservar('Segundo')]);
  assert.deepEqual(resultados.map((r) => r.status).sort(), [201, 409]);
  const actual = (await api('GET', `/actividades/${actividad.datos.id}`)).datos;
  assert.equal(actual.lugaresOcupados, 1);
  assert.equal(actual.lugaresDisponibles, 0);
  assert.equal(
    (
      await api('PATCH', `/actividades/${actividad.datos.id}`, {
        token: sesion.admin,
        body: { fecha: sumarDias(MANANA, 1) }
      })
    ).status,
    409
  );
});

test('el cupo de una actividad no se reduce por debajo de las reservas', async () => {
  const actividad = (await api('GET', '/actividades/glow-paint')).datos;
  assert.equal(
    (await api('PATCH', `/actividades/${actividad.id}`, { token: sesion.admin, body: { cupoTotal: 1 } })).status,
    409
  );
});

test('último cupón: dos cajas no rebasan el límite diario', async () => {
  const alta = await api('POST', '/promociones', {
    token: sesion.admin,
    body: {
      codigo: 'MF-PROMO-RACE',
      titulo: 'Concurrente',
      categoria: 'Prueba',
      descuentoBadge: '10%',
      beneficio: '10%',
      vigencia: 'Hoy',
      limiteDiario: 1
    }
  });
  assert.equal(alta.status, 201);
  const canjear = () => api('POST', `/promociones/${alta.datos.id}/canjear`, { token: sesion.host, body: {} });
  const resultados = await Promise.all([canjear(), canjear()]);
  assert.deepEqual(resultados.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await api('GET', `/promociones/${alta.datos.id}`, { token: sesion.admin })).datos.canjesHoy, 1);
});

test('los beneficios se canjean una sola vez bajo concurrencia', async () => {
  const beneficios = (await api('GET', '/mi/beneficios', { token: sesion.cliente })).datos;
  const beneficio = beneficios.find((b) => b.estado === 'disponible');
  assert.ok(beneficio);
  const canjear = () => api('POST', `/club/beneficios/${beneficio.codigo}/canjear`, { token: sesion.host });
  assert.deepEqual((await Promise.all([canjear(), canjear()])).map((r) => r.status).sort(), [200, 409]);
});

test('dos sellos simultáneos no pierden puntos ni duplican la recompensa', async () => {
  const equipo = await api('POST', '/club/clientes', { token: sesion.host, body: { nombre: 'Sellos concurrentes' } });
  const codigo = equipo.datos.codigoCliente;
  const sumar = () => api('POST', `/club/clientes/${codigo}/sello`, { token: sesion.host, body: {} });
  for (let n = 0; n < 7; n += 1) assert.equal((await sumar()).status, 200);
  const respuestas = await Promise.all([sumar(), sumar()]);
  assert.ok(respuestas.every((r) => r.status === 200));
  assert.equal(respuestas.filter((r) => r.datos.pasaporteCompletado).length, 1);
  const actual = (await api('GET', `/club/clientes/${codigo}`, { token: sesion.host })).datos;
  assert.deepEqual([actual.sellosActuales, actual.puntos, actual.visitasTotales], [8, 450, 9]);
});

test('dos walk-in simultáneos no ocupan dos veces una mesa', async () => {
  const mesas = (await api('GET', '/mesas', { token: sesion.host })).datos;
  const mesa = mesas.find((m) => m.estado === 'libre');
  assert.ok(mesa);
  const ocupar = () => api('POST', `/mesas/${mesa.id}/walk-in`, { token: sesion.host, body: { personas: 1 } });
  assert.deepEqual((await Promise.all([ocupar(), ocupar()])).map((r) => r.status).sort(), [201, 409]);
  assert.equal((await api('GET', `/mesas/${mesa.id}`, { token: sesion.host })).datos.estado, 'ocupada');
});

test('una edición inválida de mesa revierte también el ticket', async () => {
  const mesas = (await api('GET', '/mesas', { token: sesion.host })).datos;
  const mesa = mesas.find((m) => m.estado === 'ocupada');
  const otraZona = mesas.find((m) => m.sucursalId !== mesa.sucursalId && m.zonaId).zonaId;
  const respuesta = await api('PATCH', `/mesas/${mesa.id}`, {
    token: sesion.host,
    body: { ticketTotal: 9999, zonaId: otraZona }
  });
  assert.equal(respuesta.status, 409);
  const despues = (await api('GET', `/mesas/${mesa.id}`, { token: sesion.host })).datos;
  assert.equal(despues.ticketAprox, mesa.ticketAprox);
  assert.equal(despues.zonaId, mesa.zonaId);
});

test('una promoción con sucursal inválida revierte toda su creación', async () => {
  const alta = await api('POST', '/promociones', {
    token: sesion.admin,
    body: {
      codigo: 'MF-PROMO-ROLLBACK',
      titulo: 'Rollback',
      categoria: 'Prueba',
      descuentoBadge: '10%',
      beneficio: '10%',
      vigencia: 'Hoy',
      sucursales: ['porras-matriz', 'inexistente']
    }
  });
  assert.equal(alta.status, 404);
  assert.equal((await api('GET', '/promociones/MF-PROMO-ROLLBACK', { token: sesion.admin })).status, 404);
});

test('correos: verificación de registro, bloqueo de canje sin verificar, recuperación y reservaciones', async () => {
  const bandeja = [];
  establecerTransporteCorreo({
    async sendMail(msg) {
      bandeja.push(msg);
      return { messageId: `<test-${bandeja.length}@marfil.local>` };
    }
  });

  try {
    // 1. Correo temporal rechazado en registro.
    const temporal = await api('POST', '/auth/clientes/registro', {
      body: { nombre: 'Temporal', email: 'uno@mailinator.com', password: 'password123' }
    });
    assert.equal(temporal.status, 400);

    // 2. Registro válido envía código de 6 dígitos y NO entrega sesión hasta confirmar.
    const registro = await api('POST', '/auth/clientes/registro', {
      body: {
        nombre: 'Camila Verificada',
        email: 'camila.verif@example.com',
        password: 'password123',
        telefono: '618-222-3344'
      }
    });
    assert.equal(registro.status, 201);
    assert.equal(registro.datos.requiereVerificacion, true);
    assert.equal(registro.datos.token, undefined);
    assert.equal(registro.datos.cliente.emailVerificado, false);
    assert.equal(registro.datos.verificacionEnviada, true);
    assert.equal(bandeja.length, 1);
    assert.match(bandeja[0].subject, /código de verificación/i);
    const codigo6 = /\b(\d{6})\b/.exec(bandeja[0].text)?.[1];
    assert.ok(codigo6, 'el correo debe incluir el código de 6 dígitos');

    // Login bloqueado antes de confirmar el código.
    const loginAntes = await api('POST', '/auth/clientes/login', {
      body: { email: 'camila.verif@example.com', password: 'password123' }
    });
    assert.equal(loginAntes.status, 403);

    // 3. Cuenta no verificada no puede canjear beneficios en caja.
    const beneficio = await otorgarBeneficio(registro.datos.cliente.id, {
      titulo: 'Café Americano Gratis',
      origen: 'manual'
    });
    const canjeBloqueado = await api('POST', `/club/beneficios/${beneficio.codigo}/canjear`, {
      token: sesion.host
    });
    assert.equal(canjeBloqueado.status, 403);

    // 4. Código incorrecto falla con 400; código válido verifica, entrega JWT, envía bienvenida y no puede reusarse.
    assert.equal(
      (await api('POST', '/auth/verificar-codigo', { body: { email: 'camila.verif@example.com', codigo: '000000' } })).status,
      400
    );

    const verificado = await api('POST', '/auth/verificar-codigo', {
      body: { email: 'camila.verif@example.com', codigo: codigo6 }
    });
    assert.equal(verificado.status, 200);
    assert.ok(verificado.datos.token);
    assert.equal(verificado.datos.cliente.emailVerificado, true);
    assert.equal(bandeja.length, 2);
    assert.match(bandeja[1].subject, /activa/);

    // Reutilizar el mismo código falla.
    assert.equal(
      (await api('POST', '/auth/verificar-codigo', { body: { email: 'camila.verif@example.com', codigo: codigo6 } })).status,
      400
    );

    // Ya verificada, sí puede canjear su beneficio.
    const canjeOk = await api('POST', `/club/beneficios/${beneficio.codigo}/canjear`, {
      token: sesion.host
    });
    assert.equal(canjeOk.status, 200);

    // Reenviar en cuenta ya verificada responde yaVerificado: true sin enviar nuevo correo.
    const reenvioYa = await api('POST', '/auth/verificacion/reenviar', { token: verificado.datos.token });
    assert.equal(reenvioYa.status, 200);
    assert.equal(reenvioYa.datos.yaVerificado, true);

    // 5. Olvidé contraseña: no revela correos inexistentes, envía enlace a existentes y revoca sesiones.
    const inexistente = await api('POST', '/auth/password/olvide', {
      body: { email: 'no.existe@example.com' }
    });
    assert.equal(inexistente.status, 200);
    assert.equal(bandeja.length, 2);

    const olvide = await api('POST', '/auth/password/olvide', {
      body: { email: 'camila.verif@example.com' }
    });
    assert.equal(olvide.status, 200);
    assert.equal(bandeja.length, 3);
    const tokenReset = /\?restablecer=([a-f0-9]{64})/.exec(bandeja[2].text)?.[1];
    assert.ok(tokenReset);

    const reset = await api('POST', '/auth/password/restablecer', {
      body: { token: tokenReset, password: 'nuevaPassword99' }
    });
    assert.equal(reset.status, 200);

    // El token JWT anterior quedó revocado por session_version++.
    assert.equal((await api('GET', '/auth/me', { token: verificado.datos.token })).status, 401);
    // El enlace de recuperación no se puede reutilizar.
    assert.equal(
      (await api('POST', '/auth/password/restablecer', { body: { token: tokenReset, password: 'otraPassword88' } })).status,
      400
    );
    // Inicia sesión con la nueva contraseña.
    const nuevoLogin = await api('POST', '/auth/clientes/login', {
      body: { email: 'camila.verif@example.com', password: 'nuevaPassword99' }
    });
    assert.equal(nuevoLogin.status, 200);

    // 6. Reservación + cancelación envían correos transaccionales.
    const resCreada = await api('POST', '/reservaciones', {
      token: nuevoLogin.datos.token,
      body: { sucursalId: 'calvario', fecha: MANANA, hora: '10:30', personas: 2 }
    });
    assert.equal(resCreada.status, 201);
    assert.equal(bandeja.length, 4);
    assert.match(bandeja[3].subject, new RegExp(resCreada.datos.folio));

    const resCancelada = await api('POST', `/mi/reservaciones/${resCreada.datos.folio}/cancelar`, {
      token: nuevoLogin.datos.token
    });
    assert.equal(resCancelada.status, 200);
    assert.equal(bandeja.length, 5);
    assert.match(bandeja[4].subject, /cancelada/i);
  } finally {
    restaurarTransporteCorreo();
  }
});
