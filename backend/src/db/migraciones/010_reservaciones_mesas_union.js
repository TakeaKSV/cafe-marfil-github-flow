export async function up(knex) {
  const tieneMesasSolicitadas = await knex.schema.hasColumn('reservaciones', 'mesas_solicitadas');
  if (!tieneMesasSolicitadas) {
    await knex.schema.alterTable('reservaciones', (t) => {
      t.json('mesas_solicitadas').nullable();
      t.tinyint('solicita_union_mesas').notNullable().defaultTo(0);
    });
  }
}

export async function down() {
  throw new Error('La migración 010 no se revierte automáticamente.');
}

export const config = { transaction: false };
