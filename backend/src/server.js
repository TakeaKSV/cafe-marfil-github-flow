import { crearApp } from './app.js';
import { config } from './config.js';
import { cerrarConexion } from './db/conexion.js';
import { verificarBase } from './db/mantenimiento.js';

try {
  await verificarBase();
} catch (error) {
  console.error('No se pudo verificar la base. Revisa DB_* y ejecuta npm run db:init.', {
    codigo: error.code ?? 'DB_NOT_READY'
  });
  await cerrarConexion();
  process.exit(1);
}

const servidor = crearApp().listen(config.puerto, () => {
  const base = `http://localhost:${config.puerto}`;
  console.log(`Café Marfil servidor unificado en ${base}`);
  console.log(`  Landing: ${base}/`);
  console.log(`  Admin:   ${base}/admin`);
  console.log(`  API:     ${base}/api`);
});
servidor.requestTimeout = 30000;
servidor.headersTimeout = 15000;

let cerrando = false;
async function cerrar(codigo = 0) {
  if (cerrando) return;
  cerrando = true;
  const plazo = setTimeout(() => {
    servidor.closeAllConnections();
    process.exit(1);
  }, 10000);
  plazo.unref();
  servidor.close(async () => {
    try {
      await cerrarConexion();
    } finally {
      clearTimeout(plazo);
      process.exit(codigo);
    }
  });
}
process.on('SIGTERM', () => cerrar());
process.on('SIGINT', () => cerrar());
servidor.on('error', (error) => {
  console.error('Error al escuchar.', { codigo: error.code ?? 'SERVER_ERROR' });
  cerrar(1);
});
