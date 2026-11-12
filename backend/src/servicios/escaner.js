// Terminal de escáner: recibe un código (QR o tecleado) y averigua qué es.
// Solo identifica; la acción (check-in, canje, sello) la confirma el host con
// el endpoint que se indica en `accion`.

import { noEncontrado } from '../utils/errores.js';
import { registrarEscaneo } from './bitacora.js';
import { buscarBeneficioPorCodigo, buscarClientePorCodigo } from './clientes.js';
import { buscarPromocion } from './promociones.js';
import { buscarReservacionPorCodigo } from './reservaciones.js';

function comoReservacion(r) {
  const mensajes = {
    confirmada: r.mesaAsignada
      ? `Reserva válida. Mesa ${r.mesaAsignada} lista para check-in.`
      : 'Reserva válida. Asigna una mesa para hacer check-in.',
    en_curso: 'El comensal ya se encuentra en sala.',
    asistida: 'Esta reservación ya fue completada.',
    cancelada: 'Esta reservación fue cancelada.',
    no_show: 'Esta reservación se marcó como no-show.'
  };
  return {
    tipo: 'reservacion',
    titulo: `Reservación: ${r.folio}`,
    subtitulo: `${r.comensal} · ${r.personas} personas · ${r.fechaTexto} ${r.horaTexto}`,
    estado: r.estado,
    mensaje: mensajes[r.estado],
    accion: r.estado === 'confirmada' ? `POST /api/reservaciones/${r.folio}/check-in` : null,
    datos: r
  };
}

function comoPromocion(p) {
  const agotada = p.canjesHoy >= p.limiteDiario;
  const canjeable = p.estado === 'activo' && !agotada;
  return {
    tipo: 'promocion',
    titulo: `${canjeable ? 'Cupón válido' : 'Cupón no canjeable'}: ${p.descuentoBadge}`,
    subtitulo: p.titulo,
    estado: p.estado === 'activo' ? (agotada ? 'agotado' : 'activo') : 'pausado',
    mensaje: canjeable
      ? p.beneficio
      : agotada
        ? `Se alcanzó el límite de ${p.limiteDiario} canjes de hoy.`
        : 'La promoción está pausada.',
    accion: canjeable ? `POST /api/promociones/${p.id}/canjear` : null,
    datos: p
  };
}

function comoClub(c) {
  return {
    tipo: 'club',
    titulo: `Pasaporte Club Marfil: ${c.nombre}`,
    subtitulo: `Nivel: ${c.nivel} · ${c.sellosActuales} de ${c.sellosMeta} sellos`,
    estado: c.recompensaDisponible ? 'recompensa_lista' : 'valido',
    mensaje: c.recompensaDisponible
      ? `¡Tiene recompensa desbloqueada! ${c.recompensaNombre}`
      : `Le falta(n) ${c.sellosMeta - c.sellosActuales} sello(s) para su próxima recompensa.`,
    accion: c.recompensaDisponible
      ? `POST /api/club/clientes/${c.codigoCliente}/canjear-recompensa`
      : `POST /api/club/clientes/${c.codigoCliente}/sello`,
    datos: c
  };
}

function comoBeneficio(b) {
  const mensajes = {
    disponible: `Beneficio vigente de ${b.clienteNombre}. ${b.vigencia}.`,
    usado: 'Este beneficio ya fue canjeado.',
    vencido: 'Este beneficio está vencido.'
  };
  return {
    tipo: 'beneficio',
    titulo: `Beneficio: ${b.titulo}`,
    subtitulo: `${b.clienteNombre} · ${b.codigoCliente}`,
    estado: b.estado,
    mensaje: mensajes[b.estado],
    accion: b.estado === 'disponible' ? `POST /api/club/beneficios/${b.codigo}/canjear` : null,
    datos: b
  };
}

export async function resolverCodigo(codigoCrudo, personalId = null) {
  const codigo = String(codigoCrudo).trim().toUpperCase();

  const reservacion = await buscarReservacionPorCodigo(codigo);
  if (reservacion) return comoReservacion(reservacion);

  const promocion = /^\d+$/.test(codigo) ? null : await buscarPromocion(codigo); // un número sería un id, no un cupón
  if (promocion) return comoPromocion(promocion);

  const cliente = await buscarClientePorCodigo(codigo);
  if (cliente) return comoClub(cliente);

  const beneficio = await buscarBeneficioPorCodigo(codigo);
  if (beneficio) return comoBeneficio(beneficio);

  await registrarEscaneo({
    codigo,
    tipo: 'desconocido',
    descripcion: 'Código no reconocido',
    resultado: 'Rechazado',
    exito: false,
    personalId
  });
  throw noEncontrado(
    'El código no corresponde a ninguna reservación, cupón, pasaporte ni beneficio de Café Marfil.'
  );
}
