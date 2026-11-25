import { config } from '../config.js';
import { cerrarConexion, consulta } from './conexion.js';
import { borrarTodo, prepararBase } from './mantenimiento.js';
import { sembrar } from './semilla.js';

const opciones = new Set(process.argv.slice(2));
try {
  if ([...opciones].some((opcion) => !['--reset', '--seed'].includes(opcion))) throw new Error('Opción desconocida.');
  if (config.esProduccion && (opciones.has('--seed') || opciones.has('--reset'))) {
    throw new Error('Los datos demo y el reset están deshabilitados en producción.');
  }
  if (opciones.has('--reset')) await borrarTodo();
  await prepararBase();
  if (opciones.has('--seed')) {
    if (await consulta('sucursales').first('id')) throw new Error('La base ya tiene datos.');
    console.table(await sembrar());
  }
  console.log('Migraciones aplicadas correctamente.');
} catch (error) {
  console.error(error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await cerrarConexion();
}
