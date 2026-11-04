import test from 'node:test';
import assert from 'node:assert/strict';
import { validarReserva } from '../src/reservaciones.mjs';

test('acepta 1 persona', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 1 }).ok, true);
});
test('acepta 4 personas', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 4 }).ok, true);
});
test('rechaza cero', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 0 }).ok, false);
});
test('rechaza nombre vacio', () => {
  assert.equal(validarReserva({ nombre: "   ", personas: 4 }).ok, false);
});
