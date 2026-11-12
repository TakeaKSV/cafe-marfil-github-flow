import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(raizBackend, '.env'), quiet: true });

const esProduccion = process.env.NODE_ENV === 'production';

if (esProduccion && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción. Defínelo en backend/.env');
}

const nombreBD = process.env.DB_NAME || 'cafe_marfil';
if (!/^[A-Za-z0-9_]+$/.test(nombreBD)) {
  throw new Error(`DB_NAME inválido ("${nombreBD}"): usa solo letras, números y guion bajo.`);
}

export const config = {
  esProduccion,
  puerto: Number(process.env.PORT) || 3000,
  bd: {
    host: process.env.DB_HOST || '127.0.0.1',
    puerto: Number(process.env.DB_PORT) || 3306,
    usuario: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    nombre: nombreBD
  },
  jwtSecret: process.env.JWT_SECRET || 'solo-para-desarrollo-cambia-esto',
  jwtExpiraEn: process.env.JWT_EXPIRES_IN || '8h',
  origenesCors: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),

  // Reglas del negocio
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Monterrey', // Durango usa hora del centro
  ticketEstimadoPorPersona: 180, // MXN, para estimar consumo cuando aún no hay ticket
  puntosPorSello: 50,
  recompensaSellos: 'Copa Doble de Fresas Estilo Dubái GRATIS',
  minutosEntreReservasMismaMesa: 120
};
