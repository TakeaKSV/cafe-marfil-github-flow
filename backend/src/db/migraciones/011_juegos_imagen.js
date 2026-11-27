export async function up(knex) {
  const tieneImagen = await knex.schema.hasColumn('juegos', 'imagen');
  if (!tieneImagen) {
    await knex.schema.alterTable('juegos', (t) => {
      t.string('imagen', 255).nullable();
    });
  }
}

export async function down() {
  throw new Error('La migración 011 no se revierte automáticamente.');
}

export const config = { transaction: false };
