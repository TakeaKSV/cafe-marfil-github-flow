import test from 'node:test';
import assert from 'node:assert/strict';
import { validarReserva } from '../src/reservaciones.mjs';

test('acepta 1 persona', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 1 }).ok, true);
});
test('acepta 4 personas', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 4 }).ok, true);
});
test('acepta el limite de 12', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 12 }).ok, true);
});
test('rechaza cero', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 0 }).ok, false);
});
test('rechaza negativos', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: -1 }).ok, false);
});
test('rechaza decimales', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 1.5 }).ok, false);
});
test('rechaza mas de 12', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: 13 }).ok, false);
});
test('rechaza NaN', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: NaN }).ok, false);
});
test('rechaza infinito', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: Infinity }).ok, false);
});
test('rechaza texto numerico', () => {
  assert.equal(validarReserva({ nombre: "Ana", personas: "4" }).ok, false);
});
test('rechaza nombre vacio', () => {
  assert.equal(validarReserva({ nombre: "   ", personas: 4 }).ok, false);
});
test('rechaza nombre no textual', () => {
  assert.equal(validarReserva({ nombre: 12, personas: 4 }).ok, false);
});
