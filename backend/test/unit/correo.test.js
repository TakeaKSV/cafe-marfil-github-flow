import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  construirPlantillaHtml,
  escaparHtml,
  verificarDominioCorreo
} from '../../src/servicios/correo.js';

test('correo: rechaza dominios desechables y dominios sin MX real', async () => {
  // Dominio desechable siempre bloqueado incluso sin DNS.
  await assert.rejects(
    () => verificarDominioCorreo('prueba@mailinator.com', { forzar: true }),
    (err) => err.status === 400 && /temporales o desechables/i.test(err.message)
  );
  await assert.rejects(
    () => verificarDominioCorreo('alguien@yopmail.com', { forzar: false }),
    (err) => err.status === 400
  );

  // Dominio inexistente (ENOTFOUND, típico error de dedo como gmial.con).
  await assert.rejects(
    () =>
      verificarDominioCorreo('juan@gmial.con', {
        forzar: true,
        resolverMx: async () => {
          const e = new Error('queryMx ENOTFOUND gmial.con');
          e.code = 'ENOTFOUND';
          throw e;
        }
      }),
    (err) => err.status === 400 && /no existe o no puede recibir/i.test(err.message)
  );

  // Registro Null MX (RFC 7505: exchange "." o vacío).
  await assert.rejects(
    () =>
      verificarDominioCorreo('nadie@example.com', {
        forzar: true,
        resolverMx: async () => [{ exchange: '.', priority: 0 }]
      }),
    (err) => err.status === 400
  );

  // Dominio con registro MX válido.
  const ok = await verificarDominioCorreo('cliente@gmail.com', {
    forzar: true,
    resolverMx: async () => [{ exchange: 'gmail-smtp-in.l.google.com', priority: 5 }]
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.registros, 1);
});

test('correo: la plantilla HTML aplica identidad Marfil y escapa HTML peligroso', () => {
  assert.equal(escaparHtml('<script>"hola"</script>'), '&lt;script&gt;&quot;hola&quot;&lt;/script&gt;');
  const html = construirPlantillaHtml({
    titulo: 'Hola <img src=x>',
    cuerpoHtml: '<p>Bienvenido</p>',
    botonTexto: 'Confirmar',
    botonUrl: 'http://localhost:5173/?verificar=abc'
  });
  assert.match(html, /#E12927/);
  assert.match(html, /#1F1410/);
  assert.match(html, /#FCEAE9/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.match(html, /http:\/\/localhost:5173\/\?verificar=abc/);
});
