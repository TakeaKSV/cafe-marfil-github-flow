import assert from 'node:assert/strict';
import fs from 'node:fs';
import { once } from 'node:events';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';
process.env.AUTH_RATE_LIMIT_MAX = '2';
process.env.RATE_LIMIT_MAX = '6';
process.env.PUBLIC_WRITE_RATE_LIMIT_MAX = '2';
process.env.TRUST_PROXY = '';
const { crearApp } = await import('../../src/app.js');
const { cerrarConexion } = await import('../../src/db/conexion.js');
after(cerrarConexion);

async function conServidor(fn) {
  const servidor = crearApp({ bitacora: false }).listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  try {
    await fn(`http://127.0.0.1:${servidor.address().port}/api`);
  } finally {
    servidor.closeAllConnections();
    await new Promise((resolve) => servidor.close(resolve));
  }
}

test('cabeceras de seguridad, no-store y CORS exacto', () =>
  conServidor(async (url) => {
    const respuesta = await fetch(url + '/health', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(respuesta.headers.get('x-powered-by'), null);
    assert.equal(respuesta.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(respuesta.headers.get('cache-control'), 'no-store');
    assert.equal(respuesta.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(respuesta.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const ajeno = await fetch(url + '/health', { headers: { Origin: 'https://ajeno.example' } });
    assert.equal(ajeno.headers.get('access-control-allow-origin'), null);
  }));

test('JSON inválido y cuerpos demasiado grandes producen errores 400/413', () =>
  conServidor(async (url) => {
    const enviar = (body) =>
      fetch(url + '/auth/clientes/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal((await enviar('{')).status, 400);
    const enorme = await enviar(JSON.stringify({ texto: 'x'.repeat(110000) }));
    assert.equal(enorme.status, 413);
    assert.deepEqual(Object.keys(await enorme.json()), ['error']);
  }));

test('el login limita intentos antes de acceder a datos y devuelve Retry-After', () =>
  conServidor(async (url) => {
    const enviar = () => fetch(url + '/auth/staff/login', { method: 'POST' });
    assert.equal((await enviar()).status, 400);
    assert.equal((await enviar()).status, 400);
    const bloqueada = await enviar();
    assert.equal(bloqueada.status, 429);
    assert.ok(Number(bloqueada.headers.get('retry-after')) > 0);
    assert.equal(typeof (await bloqueada.json()).error, 'string');
  }));

test('las escrituras públicas tienen límite propio', () =>
  conServidor(async (url) => {
    const enviar = () => fetch(url + '/reservaciones', { method: 'POST' });
    assert.equal((await enviar()).status, 401);
    assert.equal((await enviar()).status, 401);
    assert.equal((await enviar()).status, 429);
    assert.equal((await fetch(url + '/health')).status, 200);
  }));

test('el límite general también protege lecturas', () =>
  conServidor(async (url) => {
    for (let n = 0; n < 6; n += 1) assert.equal((await fetch(url + '/health')).status, 200);
    assert.equal((await fetch(url + '/health')).status, 429);
  }));

test('sirve landing en / y admin en /admin sin afectar el 404 JSON de /api', () =>
  conServidor(async (url) => {
    const origen = new URL(url).origin;
    const raizMonorepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const tieneLanding = fs.existsSync(path.join(raizMonorepo, 'frontend', 'marfil', 'dist', 'index.html'));
    const tieneAdmin = fs.existsSync(path.join(raizMonorepo, 'frontend', 'admin', 'dist', 'index.html'));

    if (tieneLanding) {
      const landing = await fetch(origen + '/');
      assert.equal(landing.status, 200);
      assert.match(landing.headers.get('content-type') || '', /text\/html/);
      assert.match(await landing.text(), /Café Marfil/);
    }

    if (tieneAdmin) {
      const admin = await fetch(origen + '/admin');
      assert.equal(admin.status, 200);
      assert.match(admin.headers.get('content-type') || '', /text\/html/);
      assert.match(await admin.text(), /Panel de Administración/);
    }

    const api404 = await fetch(url + '/ruta-inexistente');
    assert.equal(api404.status, 404);
    assert.match(api404.headers.get('content-type') || '', /application\/json/);
  }));
