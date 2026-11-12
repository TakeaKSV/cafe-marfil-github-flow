// Utilidad de línea de comandos para preparar la base de datos.
//
//   npm run db:init    crea la base y las tablas que falten (no toca los datos)
//   npm run db:seed    además carga los datos de ejemplo (solo si la base está vacía)
//   npm run db:reset   borra las tablas, las vuelve a crear y carga los datos de ejemplo

import { config } from '../config.js';
import { borrarTodo, cerrarConexion, db, prepararBase } from './conexion.js';
import { PASSWORD_DEMO, sembrar } from './semilla.js';

const opciones = new Set(process.argv.slice(2));
const destino = `${config.bd.nombre} (${config.bd.host}:${config.bd.puerto})`;

async function ejecutar() {
  await prepararBase();

  if (opciones.has('--reset')) {
    if (config.esProduccion) throw new Error('db:reset está deshabilitado con NODE_ENV=production.');
    await borrarTodo();
    await prepararBase();
    console.log(`Tablas de ${destino} borradas y recreadas.`);
  }

  if (!opciones.has('--seed')) {
    console.log(`Esquema al día en ${destino}`);
    return;
  }

  const { total } = await db.uno('SELECT COUNT(*) AS total FROM sucursales');
  if (total > 0) throw new Error('La base ya tiene datos. Para empezar de cero usa:  npm run db:reset');

  const resumen = await sembrar();
  console.log(`Datos de ejemplo cargados en ${destino}:`);
  console.table(resumen);
  console.log(`Panel admin:  admin@cafemarfil.mx / ${PASSWORD_DEMO}`);
  console.log(`PWA cliente:  sofia.navarro@gmail.com / ${PASSWORD_DEMO}`);
}

try {
  await ejecutar();
} catch (error) {
  console.error(error.code === 'ECONNREFUSED' ? `No hay conexión con MySQL en ${config.bd.host}:${config.bd.puerto}.` : error.message);
  process.exitCode = 1;
} finally {
  await cerrarConexion();
}
