import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(raizBackend, '.env'), quiet: true });

const entero = (defecto, max) => z.coerce.number().int().min(1).max(max).default(defecto);
const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: entero(3000, 65535),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: entero(3306, 65535),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z
    .string()
    .regex(/^[A-Za-z0-9_]{1,64}$/)
    .default('cafe_marfil'),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174'),
  ZONA_HORARIA: z.string().default('America/Monterrey'),
  TRUST_PROXY: z.string().default(''),
  RATE_LIMIT_MAX: entero(600, 100000),
  AUTH_RATE_LIMIT_MAX: entero(20, 1000),
  PUBLIC_WRITE_RATE_LIMIT_MAX: entero(30, 1000)
});

export function cargarConfig(env) {
  const resultado = esquema.safeParse(env);
  if (!resultado.success)
    throw new Error('Configuración inválida: ' + resultado.error.issues.map((i) => i.path.join('.')).join(', '));
  const datos = resultado.data;
  const esProduccion = datos.NODE_ENV === 'production';
  const origenesCors = datos.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (
    !origenesCors.length ||
    origenesCors.some((o) => {
      try {
        const url = new URL(o);
        return (
          url.origin !== o || !['http:', 'https:'].includes(url.protocol) || (esProduccion && url.protocol !== 'https:')
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error('CORS_ORIGIN debe contener orígenes exactos; en producción, HTTPS.');
  try {
    new Intl.DateTimeFormat('es-MX', { timeZone: datos.ZONA_HORARIA }).format();
  } catch {
    throw new Error('ZONA_HORARIA inválida.');
  }
  if (
    esProduccion &&
    (!datos.JWT_SECRET ||
      Buffer.byteLength(datos.JWT_SECRET) < 32 ||
      /cambia|desarrollo|prueba|secret|example/i.test(datos.JWT_SECRET))
  ) {
    throw new Error('JWT_SECRET debe ser aleatorio, de al menos 32 bytes, sin valores de ejemplo.');
  }
  if (esProduccion && (datos.DB_USER === 'root' || !datos.DB_PASSWORD)) {
    throw new Error('Producción requiere DB_USER dedicado y DB_PASSWORD.');
  }
  if (['true', '1', '*'].includes(datos.TRUST_PROXY))
    throw new Error('TRUST_PROXY debe nombrar IPs o redes de proxies confiables.');
  return {
    esProduccion,
    entorno: datos.NODE_ENV,
    puerto: datos.PORT,
    bd: {
      host: datos.DB_HOST,
      puerto: datos.DB_PORT,
      usuario: datos.DB_USER,
      password: datos.DB_PASSWORD,
      nombre: datos.DB_NAME
    },
    jwtSecret: datos.JWT_SECRET || randomBytes(48).toString('hex'),
    jwtExpiraEn: datos.JWT_EXPIRES_IN,
    jwtEmisor: 'cafe-marfil-api',
    jwtAudiencia: 'cafe-marfil-apps',
    origenesCors,
    trustProxy: datos.TRUST_PROXY ? datos.TRUST_PROXY.split(',').map((s) => s.trim()) : false,
    limitePeticiones: datos.RATE_LIMIT_MAX,
    limiteAuth: datos.AUTH_RATE_LIMIT_MAX,
    limiteEscrituras: datos.PUBLIC_WRITE_RATE_LIMIT_MAX,
    zonaHoraria: datos.ZONA_HORARIA,
    ticketEstimadoPorPersona: 180,
    puntosPorSello: 50,
    recompensaSellos: 'Copa Doble de Fresas Estilo Dubái GRATIS',
    minutosEntreReservasMismaMesa: 120
  };
}

export const config = cargarConfig(process.env);
