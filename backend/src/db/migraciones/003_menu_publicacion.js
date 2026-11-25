export async function up(knex) {
  const tieneEstado = await knex.schema.hasColumn('productos', 'estado');
  const tieneOrden = await knex.schema.hasColumn('productos', 'orden');
  const tieneActualizadoPor = await knex.schema.hasColumn('productos', 'actualizado_por');
  const tieneActualizadoEn = await knex.schema.hasColumn('productos', 'actualizado_en');

  if (!tieneEstado || !tieneOrden || !tieneActualizadoPor || !tieneActualizadoEn) {
    await knex.schema.alterTable('productos', (t) => {
      if (!tieneEstado) t.enu('estado', ['borrador', 'publicado']).notNullable().defaultTo('publicado');
      if (!tieneOrden) t.integer('orden').unsigned().notNullable().defaultTo(0);
      if (!tieneActualizadoPor) t.integer('actualizado_por').unsigned().nullable();
      if (!tieneActualizadoEn) t.dateTime('actualizado_en', { precision: 3 }).nullable();
    });
  }
}

export async function down() {
  throw new Error('Las columnas de publicación del menú no se eliminan automáticamente.');
}

export const config = { transaction: false };
