import { rateLimit } from 'express-rate-limit';
import { config } from '../config.js';

function limitador(limit, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
  });
}

// Un almacén por instancia de app; para múltiples procesos se requiere un almacén compartido.
export function crearLimites() {
  return {
    general: limitador(config.limitePeticiones),
    auth: limitador(config.limiteAuth),
    escritura: limitador(config.limiteEscrituras)
  };
}
