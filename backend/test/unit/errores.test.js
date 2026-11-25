import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { manejarErrores, registrarPeticiones, rutaNoEncontrada } from '../../src/middleware/errores.js';

test('los errores internos no exponen consultas, parámetros ni credenciales', (t) => {
  const logs = t.mock.method(console, 'error', () => {});
  const respuesta = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  const error = Object.assign(new Error('SELECT password_hash FROM clientes -- secreto'), {
    code: 'ER_PARSE_ERROR',
    sql: 'SQL PRIVADO',
    parameters: ['password-privada']
  });
  manejarErrores(error, {}, respuesta, () => {});
  assert.equal(respuesta.code, 500);
  assert.deepEqual(respuesta.body, { error: 'Error interno del servidor.' });
  assert.doesNotMatch(JSON.stringify(logs.mock.calls.map((c) => c.arguments)), /secreto|password|SQL PRIVADO|SELECT/);
});

test('los logs HTTP y los 404 omiten el token secreto y los parámetros de URL', (t) => {
  const logs = t.mock.method(console, 'log', () => {});
  const respuesta = new EventEmitter();
  respuesta.statusCode = 200;
  const peticion = {
    method: 'GET',
    originalUrl: '/api/reservaciones/publica/QR-SECRETO?email=privado',
    route: { path: '/publica/:token' }
  };
  registrarPeticiones(peticion, respuesta, () => {});
  respuesta.emit('finish');
  assert.match(logs.mock.calls[0].arguments[0], /\/publica\/:token/);
  assert.doesNotMatch(logs.mock.calls[0].arguments[0], /QR-SECRETO|privado/);
  const res404 = {
    status() {
      return this;
    },
    json(body) {
      this.body = body;
    }
  };
  rutaNoEncontrada(peticion, res404);
  assert.doesNotMatch(JSON.stringify(res404.body), /QR-SECRETO|privado/);
});
