export async function up(knex) {
  const tienePosX = await knex.schema.hasColumn('mesas', 'pos_x');
  if (!tienePosX) {
    await knex.schema.alterTable('mesas', (t) => {
      t.decimal('pos_x', 5, 2).nullable();
      t.decimal('pos_y', 5, 2).nullable();
      t.string('piso', 40).nullable();
    });
  }
}

export async function down() {
  throw new Error('La migración 009 no se revierte automáticamente.');
}

export const config = { transaction: false };
