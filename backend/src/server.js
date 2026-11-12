import { crearApp } from './app.js';
import { config } from './config.js';
import { db, prepararBase } from './db/conexion.js';

try {
  await prepararBase(); // crea la base y las tablas si aún no existen
} catch (error) {
  console.error(
    `No se pudo conectar a MySQL en ${config.bd.host}:${config.bd.puerto} con el usuario "${config.bd.usuario}" (${error.code ?? error.message}).\n` +
      'Revisa que MySQL esté encendido y los datos DB_* de backend/.env.'
  );
  process.exit(1);
}

const { total } = await db.uno('SELECT COUNT(*) AS total FROM sucursales');
if (total === 0) {
  console.warn('La base de datos está vacía. Carga los datos de ejemplo con:  npm run db:seed');
}
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET no está definido: se usa un secreto de desarrollo. Copia .env.example a .env.');
}

const servidor = crearApp().listen(config.puerto, () => {
  console.log(`API de Café Marfil en http://localhost:${config.puerto}/api  (MySQL: ${config.bd.nombre})`);
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${config.puerto} ya está en uso. Cambia PORT en backend/.env.`);
    process.exit(1);
  }
  throw error;
});
