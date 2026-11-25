export async function up(knex) {
  const tieneAlertas = await knex.schema.hasTable('alertas_sala');
  if (!tieneAlertas) {
    await knex.schema.createTable('alertas_sala', (t) => {
      t.increments('id').primary();
      t.string('mensaje', 280).notNullable();
      t.string('sucursal_id', 60).nullable();
      t.integer('creado_por_id').unsigned().nullable();
      t.string('creado_por_nombre', 120).notNullable();
      t.tinyint('activa').notNullable().defaultTo(1);
      t.string('creado_en', 40).notNullable();
      t.index(['activa', 'creado_en']);
    });
  }

  const tieneJuego = await knex.schema.hasColumn('reservaciones', 'juego_id');
  if (!tieneJuego) {
    await knex.schema.alterTable('reservaciones', (t) => {
      t.integer('juego_id').unsigned().nullable();
      t.index('juego_id');
    });
  }
}

export async function down() {
  throw new Error('La migración 008 no se revierte automáticamente.');
}

export const config = { transaction: false };
