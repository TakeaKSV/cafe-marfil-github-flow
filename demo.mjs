import { validarReserva } from './src/reservaciones.mjs';
import { mensajeExito } from './src/mensajes.mjs';
for (const personas of [4, 13, 1.5]) {
  const resultado = validarReserva({ nombre: 'Cliente de prueba', personas });
  console.log({ personas, ...resultado, mensaje: resultado.ok ? mensajeExito : resultado.error });
}
