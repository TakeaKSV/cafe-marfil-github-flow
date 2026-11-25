import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cargarConfig } from '../../src/config.js';
import {
  leer,
  zEntero,
  zId,
  zNombrePersona,
  zPassword,
  zPasswordLogin,
  zPrecio,
  zRutaImagen,
  zTelefonoMX
} from '../../src/utils/validar.js';
import { generarTokenQR } from '../../src/utils/codigos.js';

test('contraseñas UTF-8: rechaza truncamiento de bcrypt, conserva espacios', () => {
  assert.equal(leer(zPassword, ' espacios válidos '), ' espacios válidos ');
  assert.equal(leer(zPassword, 'é'.repeat(36)), 'é'.repeat(36));
  for (const esquema of [zPassword, zPasswordLogin]) {
    assert.throws(() => leer(esquema, 'é'.repeat(37)), { status: 400 });
    assert.throws(() => leer(esquema, 'a'.repeat(73)), { status: 400 });
  }
});

test('números HTTP: rechaza coacciones ambiguas, infinitos y desbordamientos', () => {
  for (const esquema of [zId, zEntero(), zPrecio]) {
    for (const valor of [null, true, false, '', [], {}, 'Infinity', Infinity, NaN]) {
      assert.throws(() => leer(esquema, valor), { status: 400 });
    }
  }
  assert.equal(leer(zId, '42'), 42);
  assert.equal(leer(zPrecio, '123.45'), 123.45);
  assert.throws(() => leer(zId, '4294967296'), { status: 400 });
});

test('configuración de producción falla cerrada sin revelar valores', () => {
  const segura = {
    NODE_ENV: 'production',
    DB_USER: 'marfil_api',
    DB_PASSWORD: 'clave-de-prueba',
    JWT_SECRET: 'a38f30a1b86bcdf62074efbd9cd2b15f4d57bb70',
    CORS_ORIGIN: 'https://cafemarfil.example'
  };
  assert.equal(cargarConfig(segura).esProduccion, true);
  for (const cambio of [
    { JWT_SECRET: undefined },
    { JWT_SECRET: 'cambia-este-secreto' },
    { DB_USER: 'root' },
    { DB_PASSWORD: '' },
    { CORS_ORIGIN: '*' },
    { CORS_ORIGIN: 'http://cafemarfil.example' },
    { TRUST_PROXY: 'true' },
    { PORT: 'abc' },
    { DB_PORT: '-1' },
    { DB_NAME: 'base`; DROP DATABASE x' },
    { ZONA_HORARIA: 'invalida' }
  ])
    assert.throws(() => cargarConfig({ ...segura, ...cambio }));
  assert.throws(
    () => cargarConfig({ ...segura, DB_NAME: 'dato-privado-invalido' }),
    (error) => !error.message.includes('dato-privado')
  );
});

test('los pases de invitado contienen 128 bits aleatorios', () => {
  const tokens = new Set(Array.from({ length: 100 }, generarTokenQR));
  assert.equal(tokens.size, 100);
  for (const token of tokens) assert.match(token, /^QR-[A-F0-9]{32}$/);
});

test('teléfonos MX, nombres y rutas de imagen validan formato seguro', () => {
  assert.equal(leer(zTelefonoMX, '(618) 123-4567'), '(618) 123-4567');
  assert.equal(leer(zTelefonoMX, '+52 618 123 4567'), '+52 618 123 4567');
  assert.throws(() => leer(zTelefonoMX, '12345'), { status: 400 });
  assert.throws(() => leer(zTelefonoMX, 'abcde'), { status: 400 });

  assert.equal(leer(zNombrePersona, 'Sofía Navarro'), 'Sofía Navarro');
  assert.throws(() => leer(zNombrePersona, 'A'), { status: 400 });
  assert.throws(() => leer(zNombrePersona, '<script>alert(1)</script>'), { status: 400 });

  assert.equal(leer(zRutaImagen, '/uploads/cafe.png'), '/uploads/cafe.png');
  assert.equal(leer(zRutaImagen, 'https://cafemarfil.mx/img/latte.jpg'), 'https://cafemarfil.mx/img/latte.jpg');
  assert.throws(() => leer(zRutaImagen, 'javascript:alert(1)'), { status: 400 });
});
