import assert from 'node:assert/strict';
import { after, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'cafe_marfil_migracion_test';
process.env.DB_RESET_CONFIRM = process.env.DB_NAME;
const { conexion, cerrarConexion } = await import('../src/db/conexion.js');
const { borrarTodo, prepararBase } = await import('../src/db/mantenimiento.js');
const inicial = await import('../src/db/migraciones/001_inicial.js');
const { sembrar } = await import('../src/db/semilla.js');
after(cerrarConexion);

test('migra una base 1.1.0 con datos sin perderlos y es idempotente', async () => {
  await prepararBase();
  await borrarTodo();
  await inicial.up(conexion);
  await sembrar();
  const antes = await conexion('clientes').orderBy('id');
  const reservas = await conexion('reservaciones').orderBy('id');
  assert.equal(await conexion.schema.hasColumn('clientes', 'session_version'), false);
  await prepararBase();
  await prepararBase();
  const despues = await conexion('clientes').orderBy('id');
  assert.deepEqual(
    despues.map(({ session_version, email_verificado_en, ...cliente }) => {
      assert.equal(session_version, 0);
      assert.equal(email_verificado_en, null);
      return cliente;
    }),
    antes
  );
  assert.deepEqual(await conexion('reservaciones').orderBy('id'), reservas);
  assert.equal(await conexion.schema.hasColumn('productos', 'estado'), true);
  assert.equal(await conexion.schema.hasTable('tokens_correo'), true);
  assert.equal(await conexion.schema.hasTable('invitaciones_personal'), true);
  assert.equal((await conexion('knex_migrations').count({ n: '*' }).first()).n, 5);
});

test('reset exige confirmación exacta y se niega a tocar tablas ajenas', async () => {
  delete process.env.DB_RESET_CONFIRM;
  await assert.rejects(borrarTodo, /Reset bloqueado/);
  process.env.DB_RESET_CONFIRM = process.env.DB_NAME;
  await conexion.schema.dropTableIfExists('tabla_ajena');
  await conexion.schema.createTable('tabla_ajena', (t) => t.integer('id'));
  try {
    await assert.rejects(borrarTodo, /tablas ajenas/);
    assert.ok(await conexion('clientes').first());
  } finally {
    await conexion.schema.dropTableIfExists('tabla_ajena');
  }
});
