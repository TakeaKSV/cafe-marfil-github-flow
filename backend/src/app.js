import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
import rutasUploads, { DIR_UPLOADS } from './rutas/uploads.js';

const raizMonorepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR_LANDING_DIST = path.join(raizMonorepo, 'frontend', 'marfil', 'dist');
const DIR_ADMIN_DIST = path.join(raizMonorepo, 'frontend', 'admin', 'dist');

export function crearApp({ bitacora = !config.esProduccion } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https:'],
          connectSrc: ["'self'", 'https://res.cloudinary.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: null
        }
      }
    })
  );

  app.use(cors({ origin: config.origenesCors }));
  app.use('/uploads', express.static(DIR_UPLOADS, { fallthrough: true, index: false }));

  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const limites = crearLimites();
  app.use('/api', limites.general);
  app.use('/api/auth/verificacion/reenviar', limites.reenvioCorreo);
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
  app.use('/api/uploads', rutasUploads);
  app.use('/api', rutasCatalogo); // sucursales, menu, actividades, promociones
  app.use('/api', rutasSala); // mesas, club, escaner, juegos, personal, metricas
  app.use('/api', rutaNoEncontrada);

  const indexAdmin = path.join(DIR_ADMIN_DIST, 'index.html');
  if (fs.existsSync(indexAdmin)) {
    app.use('/admin', express.static(DIR_ADMIN_DIST, { index: false }));
    app.get(/^\/admin(\/.*)?$/, (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(indexAdmin);
    });
  }

  const indexLanding = path.join(DIR_LANDING_DIST, 'index.html');
  if (fs.existsSync(indexLanding)) {
    app.use(express.static(DIR_LANDING_DIST, { index: false }));
    app.get(/^(?!\/(?:api|uploads|admin)(?:\/|$)).*$/, (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(indexLanding);
    });
  }

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
