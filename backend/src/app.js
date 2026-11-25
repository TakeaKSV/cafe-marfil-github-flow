import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { crearLimites } from './middleware/limites.js';
import { verificarBase } from './db/mantenimiento.js';
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
  app.disable('etag');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(cors({ origin: config.origenesCors }));
  const limites = crearLimites();
  app.use('/api', limites.general);
  app.use('/api/auth', limites.auth);
  app.use('/api/reservaciones', (req, res, next) =>
    req.method === 'POST' ? limites.escritura(req, res, next) : next()
  );
  app.use(express.json({ limit: '100kb' }));
  if (bitacora) app.use(registrarPeticiones);

  app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'cafe-marfil-api' }));
  app.get('/api/ready', async (_req, res) => {
    await verificarBase();
    res.json({ ok: true });
  });

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
