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
import { after, before, test } from 'node:test';

process.env.DB_NAME = 'cafe_marfil_test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { borrarTodo, cerrarConexion, prepararBase } = await import('../src/db/conexion.js');
const { crearApp } = await import('../src/app.js');
const { PASSWORD_DEMO, sembrar } = await import('../src/db/semilla.js');
const { hoyLocal, sumarDias } = await import('../src/utils/fechas.js');

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
  servidor.closeAllConnections();
  servidor.close();
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
  const mala = await api('POST', '/auth/staff/login', { body: { email: 'admin@cafemarfil.mx', password: 'incorrecta' } });
  assert.equal(mala.status, 401);

  // Un cliente no puede entrar por el login del panel aunque su contraseña sea válida.
  const cruzada = await api('POST', '/auth/staff/login', { body: { email: 'sofia.navarro@gmail.com', password: PASSWORD_DEMO } });
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
  const nuevo = { nombre: 'Renata Ibarra', email: 'Renata@Example.com', password: 'cafeconleche', telefono: '618-000-1122' };
  const alta = await api('POST', '/auth/clientes/registro', { body: nuevo });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.cliente.email, 'renata@example.com', 'el correo se guarda en minúsculas');
  assert.match(alta.datos.cliente.codigoCliente, /^MF-CLUB-\d{5}$/);
  assert.equal(alta.datos.cliente.nivel, 'Explorador');

  const perfil = await api('GET', '/mi/perfil', { token: alta.datos.token });
  assert.equal(perfil.datos.nombre, 'Renata Ibarra');

  assert.equal((await api('POST', '/auth/clientes/registro', { body: nuevo })).status, 409, 'correo repetido');

  const corta = await api('POST', '/auth/clientes/registro', { body: { ...nuevo, email: 'otra@example.com', password: '123' } });
  assert.equal(corta.status, 400);
  assert.equal(corta.datos.detalles[0].campo, 'password');
});

// ---------------------------------------------------------------------------
// Reservaciones y mesas
// ---------------------------------------------------------------------------

test('ciclo completo de una reservación registrada por el host', async () => {
  const m03 = mesaId['porras-matriz/M03'];
  const datos = { comensal: 'Prueba Host', telefono: '618-555-0000', sucursalId: 'porras-matriz', fecha: HOY, hora: '9:00 PM', personas: 3, mesaId: m03 };

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
  const editada = await api('PATCH', `/reservaciones/${folio}`, { token: sesion.host, body: { personas: 4, notas: 'Traen pastel' } });
  assert.equal(editada.datos.personas, 4);
  const excedida = await api('PATCH', `/reservaciones/${folio}`, { token: sesion.host, body: { personas: 5 } });
  assert.equal(excedida.status, 409, 'la mesa M03 es para 4');

  // Check-in: la reservación pasa a en_curso y la mesa a ocupada.
  const checkIn = await api('POST', `/reservaciones/${folio}/check-in`, { token: sesion.host, body: {} });
  assert.equal(checkIn.datos.estado, 'en_curso');
  mesa = (await api('GET', `/mesas/${m03}`, { token: sesion.host })).datos;
  assert.deepEqual([mesa.estado, mesa.comensal, mesa.personas, mesa.reservaFolio], ['ocupada', 'Prueba Host', 4, folio]);
  assert.equal(mesa.ticketAprox, 4 * 180, 'sin ticket se estima por persona');

  assert.equal((await api('POST', `/reservaciones/${folio}/check-in`, { token: sesion.host, body: {} })).status, 409);
  assert.equal((await api('PATCH', `/reservaciones/${folio}`, { token: sesion.host, body: { personas: 2 } })).status, 409);

  // Completar: se cierra el servicio con su ticket y la mesa pasa a limpieza.
  const completada = await api('POST', `/reservaciones/${folio}/completar`, { token: sesion.host, body: { ticketTotal: 890 } });
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

  const sentado = await api('POST', `/mesas/${m07}/walk-in`, { token: sesion.host, body: { comensal: 'Pareja sin reserva', personas: 2 } });
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
  const invalida = await api('POST', '/reservaciones', { body: { sucursalId: 'porras-matriz', fecha: '02/10/2026', hora: '25:00', personas: 0 } });
  assert.equal(invalida.status, 400);
  assert.deepEqual(invalida.datos.detalles.map((d) => d.campo).sort(), ['fecha', 'hora', 'personas']);

  const pasada = await api('POST', '/reservaciones', {
    body: { comensal: 'Ana', telefono: '618', sucursalId: 'calvario', fecha: sumarDias(HOY, -1), hora: '10:00', personas: 2 }
  });
  assert.equal(pasada.status, 400);

  const creada = await api('POST', '/reservaciones', {
    body: { tipo: 'juegos', comensal: 'Ana Invitada', telefono: '618-777-0001', sucursalId: 'calvario', fecha: MANANA, hora: '6:00 PM', personas: 4, mesaId: mesaId['calvario/M04'] }
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

test('reservar una actividad respeta su fecha, su sucursal y su cupo', async () => {
  const antes = (await api('GET', '/actividades/glow-paint')).datos;
  assert.equal(antes.lugaresDisponibles, 4);

  const creada = await api('POST', '/reservaciones', {
    body: { tipo: 'actividad', actividadId: 'glow-paint', comensal: 'Grupo Neón', telefono: '618-321-0000', personas: 3, fecha: MANANA, sucursalId: 'porras-matriz' }
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
  const anticipado = await api('POST', `/reservaciones/${creada.datos.folio}/check-in`, { token: sesion.host, body: {} });
  assert.equal(anticipado.status, 409);

  const faltaActividad = await api('POST', '/reservaciones', { body: { tipo: 'actividad', comensal: 'X', telefono: '1', personas: 1 } });
  assert.equal(faltaActividad.status, 400);
});

// ---------------------------------------------------------------------------
// Cuenta del cliente (PWA)
// ---------------------------------------------------------------------------

test('mi cuenta: perfil, reservaciones, beneficios y notificaciones', async () => {
  const token = sesion.cliente;

  const perfil = await api('GET', '/mi/perfil', { token });
  assert.deepEqual(
    [perfil.datos.primerNombre, perfil.datos.sellosActuales, perfil.datos.sellosMeta, perfil.datos.puntos, perfil.datos.nivel],
    ['Sofía', 6, 8, 380, 'Café Lover']
  );

  const editado = await api('PATCH', '/mi/perfil', { token, body: { telefono: '618-999-8888', preferencias: { lechePreferida: 'Leche de almendra' } } });
  assert.equal(editado.datos.telefono, '618-999-8888');
  assert.equal(editado.datos.preferencias.lechePreferida, 'Leche de almendra');
  assert.equal(editado.datos.preferencias.frappeFavorito, 'Frappé Kinder Bueno 16oz', 'las demás preferencias se conservan');

  const beneficios = (await api('GET', '/mi/beneficios', { token })).datos;
  assert.deepEqual(beneficios.map((b) => b.estado).sort(), ['bloqueado', 'disponible', 'disponible', 'usado']);
  assert.equal(beneficios.find((b) => b.estado === 'bloqueado').progreso, '6 de 8 sellos completados');

  const notificacionesAntes = (await api('GET', '/mi/notificaciones', { token })).datos;
  assert.equal(notificacionesAntes.filter((n) => !n.leida).length, 2);

  // Reservar con sesión: toma nombre y teléfono del perfil y queda ligada a la cuenta.
  const creada = await api('POST', '/reservaciones', { token, body: { sucursalId: 'calvario', fecha: MANANA, hora: '11:00', personas: 2 } });
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
  assert.deepEqual([sello.datos.cliente.sellosActuales, sello.datos.cliente.puntos, sello.datos.cliente.visitasTotales], [8, 470, 24]);
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

  const alta = await api('POST', '/club/clientes', { token, body: { nombre: 'Cliente de Caja', telefono: '618-101-0101' } });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.tieneCuenta, false);
  const busqueda = await api('GET', '/club/clientes?q=Caja', { token });
  assert.equal(busqueda.datos.length, 1);
});

test('cupones: canje, sucursal válida, límite diario y promociones pausadas', async () => {
  const ludoteca = (await api('GET', '/promociones/MF-PROMO-LUDOTECA', { token: sesion.host })).datos;
  assert.equal(ludoteca.canjesHoy, 6);

  const canje = await api('POST', `/promociones/${ludoteca.id}/canjear`, { token: sesion.host, body: { codigoCliente: 'MF-CLUB-33109' } });
  assert.equal(canje.datos.canjesHoy, 7);

  const otraSucursal = await api('POST', `/promociones/${ludoteca.id}/canjear`, { token: sesion.host, body: { sucursalId: 'calvario' } });
  assert.equal(otraSucursal.status, 409);

  // Solo gerencia edita promociones.
  assert.equal((await api('PATCH', `/promociones/${ludoteca.id}`, { token: sesion.host, body: { limiteDiario: 7 } })).status, 403);
  await api('PATCH', `/promociones/${ludoteca.id}`, { token: sesion.admin, body: { limiteDiario: 7 } });
  const agotado = await api('POST', `/promociones/${ludoteca.id}/canjear`, { token: sesion.host, body: {} });
  assert.equal(agotado.status, 409);
  assert.match(agotado.datos.error, /límite de 7 canjes/);

  const pausada = await api('PATCH', `/promociones/${ludoteca.id}`, { token: sesion.admin, body: { estado: 'pausado' } });
  assert.equal(pausada.datos.estado, 'pausado');
  assert.equal((await api('GET', '/promociones')).datos.length, 6, 'el cliente no ve las pausadas');
  assert.equal((await api('GET', '/promociones', { token: sesion.host })).datos.length, 7);
  assert.equal((await api('GET', '/promociones/MF-PROMO-LUDOTECA')).status, 404);

  const nueva = await api('POST', '/promociones', {
    token: sesion.admin,
    body: { codigo: 'mf-promo-test', titulo: 'Promo de prueba', categoria: 'Pruebas', descuentoBadge: '10% OFF', beneficio: '10% en todo', vigencia: 'Esta semana' }
  });
  assert.equal(nueva.status, 201);
  assert.equal(nueva.datos.codigo, 'MF-PROMO-TEST');
  assert.deepEqual(nueva.datos.sucursales.sort(), ['calvario', 'porras-matriz'], 'por defecto aplica en todas');
  const repetida = await api('POST', '/promociones', { token: sesion.admin, body: { codigo: 'MF-PROMO-TEST', titulo: 'x', categoria: 'x', descuentoBadge: 'x', beneficio: 'x', vigencia: 'x' } });
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

  const agotado = await api('PATCH', `/menu/productos/${kinder.id}`, { token: sesion.host, body: { disponibleEnCocina: false } });
  assert.equal(agotado.datos.disponibleEnCocina, false);
  assert.equal((await api('PATCH', `/menu/productos/${kinder.id}`, { token: sesion.host, body: { precio: 1 } })).status, 403);
  assert.equal((await api('PATCH', `/menu/productos/${kinder.id}`, { body: { disponibleEnCocina: true } })).status, 401);

  const precio = await api('PATCH', `/menu/productos/${kinder.id}`, { token: sesion.admin, body: { precio: 105, disponibleEnCocina: true } });
  assert.deepEqual([precio.datos.precio, precio.datos.precioStr, precio.datos.disponibleEnCocina], [105, '$105 MXN', true]);

  const nuevo = await api('POST', '/menu/productos', { token: sesion.admin, body: { nombre: 'Soda Italiana de Frutos Rojos', categoriaSlug: 'frappes', precio: 68 } });
  assert.equal(nuevo.status, 201);
  assert.equal(nuevo.datos.slug, 'soda-italiana-de-frutos-rojos');
  assert.deepEqual([nuevo.datos.stockDiario, nuevo.datos.vendidosHoy, nuevo.datos.badge], [30, 0, null]);

  const categoriaMala = await api('POST', '/menu/productos', { token: sesion.admin, body: { nombre: 'X', categoriaSlug: 'no-existe', precio: 1 } });
  assert.equal(categoriaMala.status, 400);

  assert.equal((await api('DELETE', `/menu/productos/${nuevo.datos.id}`, { token: sesion.admin })).status, 204);
  assert.equal((await api('GET', `/menu/productos/${nuevo.datos.id}`)).status, 404);
  assert.equal((await api('GET', '/menu/productos')).datos.length, 16);
});

test('ludoteca: préstamos, devoluciones y devolución automática al liberar la mesa', async () => {
  const token = sesion.host;
  const juegos = (await api('GET', '/juegos', { token })).datos;
  assert.equal(juegos.length, 8);
  assert.equal((await api('GET', '/juegos?estado=en_mesa', { token })).datos.length, 2);

  const carcassonne = juegos.find((j) => j.nombre === 'Carcassonne');
  assert.deepEqual([carcassonne.estado, carcassonne.vecesJugadoMes], ['disponible', 39]);

  const prestado = await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['porras-matriz/L03'] } });
  assert.deepEqual([prestado.datos.estado, prestado.datos.mesaActual, prestado.datos.vecesJugadoMes], ['en_mesa', 'L03', 40]);
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['porras-matriz/L03'] } })).status, 409);
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/devolver`, { token })).datos.estado, 'disponible');
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/devolver`, { token })).status, 409);

  // Un juego de Porras no se puede prestar a una mesa de Calvario.
  assert.equal((await api('POST', `/juegos/${carcassonne.id}/prestar`, { token, body: { mesaId: mesaId['calvario/M04'] } })).status, 409);

  // Catan está en L01 con la reservación MF-RES-66231: al completarla regresa solo.
  const catan = juegos.find((j) => j.nombre.startsWith('Catan'));
  assert.equal(catan.mesaActual, 'L01 (Javier Domínguez)');
  await api('POST', '/reservaciones/MF-RES-66231/completar', { token, body: {} });
  const catanDespues = (await api('GET', '/juegos?q=Catan', { token })).datos[0];
  assert.equal(catanDespues.estado, 'disponible');

  const marcado = await api('PATCH', `/juegos/${carcassonne.id}`, { token, body: { reposicionRequerida: true, piezasEstado: 'Faltan 3 losetas' } });
  assert.equal(marcado.datos.reposicionRequerida, true);
  assert.equal((await api('POST', '/juegos', { token, body: { nombre: 'Azul', categoria: 'Abstracto', jugadores: '2 - 4 jugadores', duracion: '40 min', dificultad: 'Fácil', sucursalId: 'porras-matriz' } })).status, 403);
  const azul = await api('POST', '/juegos', { token: sesion.admin, body: { nombre: 'Azul', categoria: 'Abstracto', jugadores: '2 - 4 jugadores', duracion: '40 min', dificultad: 'Fácil', sucursalId: 'porras-matriz' } });
  assert.equal(azul.status, 201);
  assert.equal(azul.datos.vecesJugadoMes, 0);
});

test('equipo: solo el admin da de alta, y una baja corta la sesión al instante', async () => {
  const personal = (await api('GET', '/personal', { token: sesion.host })).datos;
  assert.equal(personal.length, 6);
  assert.equal(personal.find((p) => p.nombre === 'Erick Rentería').tieneAcceso, false);

  const nuevoHost = { nombre: 'Nuevo Host', puesto: 'Host de Fin de Semana', rol: 'host', sucursalId: 'calvario', turnoInicio: '4:00 PM', turnoFin: '23:00' };
  assert.equal((await api('POST', '/personal', { token: sesion.host, body: nuevoHost })).status, 403);
  assert.equal((await api('POST', '/personal', { token: sesion.admin, body: nuevoHost })).status, 400, 'un rol con acceso exige correo y contraseña');

  const alta = await api('POST', '/personal', { token: sesion.admin, body: { ...nuevoHost, email: 'finde@cafemarfil.mx', password: 'turno-de-finde' } });
  assert.equal(alta.status, 201);
  assert.equal(alta.datos.turno, '16:00 - 23:00');

  const acceso = await api('POST', '/auth/staff/login', { body: { email: 'finde@cafemarfil.mx', password: 'turno-de-finde' } });
  assert.equal(acceso.status, 200);
  assert.equal((await api('GET', '/mesas', { token: acceso.datos.token })).status, 200);

  await api('PATCH', `/personal/${alta.datos.id}`, { token: sesion.admin, body: { estado: 'inactivo' } });
  assert.equal((await api('GET', '/mesas', { token: acceso.datos.token })).status, 401);
  assert.equal((await api('POST', '/auth/staff/login', { body: { email: 'finde@cafemarfil.mx', password: 'turno-de-finde' } })).status, 401);
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
