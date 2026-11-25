import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cloudinaryConfigurado,
  firmarParametrosCloudinary,
  normalizarCarpeta,
  subirACloudinary
} from '../../src/servicios/cloudinary.js';

test('cloudinary: normaliza carpetas y valida configuración', () => {
  assert.equal(normalizarCarpeta('actividades'), 'actividades');
  assert.equal(normalizarCarpeta('PROMOCIONES'), 'promociones');
  assert.equal(normalizarCarpeta('../otro'), 'menu');
  assert.equal(cloudinaryConfigurado({ cloudName: '', apiKey: '123', apiSecret: 'abc' }), false);
  assert.equal(cloudinaryConfigurado({ cloudName: 'marfil', apiKey: '123', apiSecret: 'abc' }), true);
});

test('cloudinary: firma parámetros y procesa respuesta HTTPS', async () => {
  const firma = firmarParametrosCloudinary({ timestamp: 1700000000, folder: 'cafe-marfil/menu' }, 'secreto');
  assert.equal(firma.length, 40);

  let llamada = null;
  const resultado = await subirACloudinary(
    {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 1]),
      mimetype: 'image/png',
      nombreArchivo: 'frappe.png',
      carpeta: 'actividades'
    },
    {
      cfg: { cloudName: 'marfil-demo', apiKey: '946589185728814', apiSecret: 'secreto', folder: 'cafe-marfil' },
      timestamp: 1700000000,
      fetchFn: async (url, init) => {
        llamada = { url, method: init.method };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            secure_url: 'https://res.cloudinary.com/marfil-demo/image/upload/v1/cafe-marfil/actividades/frappe.png',
            public_id: 'cafe-marfil/actividades/frappe',
            width: 800,
            height: 600
          })
        };
      }
    }
  );

  assert.equal(llamada.url, 'https://api.cloudinary.com/v1_1/marfil-demo/image/upload');
  assert.equal(llamada.method, 'POST');
  assert.equal(resultado.proveedor, 'cloudinary');
  assert.match(resultado.url, /^https:\/\/res\.cloudinary\.com\//);
});
