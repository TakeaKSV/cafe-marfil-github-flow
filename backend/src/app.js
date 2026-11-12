import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { identificar } from './middleware/auth.js';
import { manejarErrores, registrarPeticiones, rutaNoEncontrada } from './middleware/errores.js';
import rutasAuth from './rutas/auth.js';
import rutasCatalogo from './rutas/catalogo.js';
import rutasMi from './rutas/mi.js';
import rutasReservaciones from './rutas/reservaciones.js';
import rutasSala from './rutas/sala.js';

export function crearApp({ bitacora = !config.esProduccion } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.use(cors({ origin: config.origenesCors }));
  app.use(express.json({ limit: '100kb' }));
  if (bitacora) app.use(registrarPeticiones);

  app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'cafe-marfil-api' }));

  app.use('/api', identificar);
  app.use('/api/auth', rutasAuth);
  app.use('/api/reservaciones', rutasReservaciones);
  app.use('/api/mi', rutasMi);
  app.use('/api', rutasCatalogo); // sucursales, menu, actividades, promociones
  app.use('/api', rutasSala); // mesas, club, escaner, juegos, personal, metricas

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
