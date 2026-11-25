export async function up(knex) {
  const tieneInicio = await knex.schema.hasColumn('invitaciones_personal', 'turno_inicio');
  const tieneFin = await knex.schema.hasColumn('invitaciones_personal', 'turno_fin');
  if (!tieneInicio || !tieneFin) {
    await knex.schema.alterTable('invitaciones_personal', (t) => {
      if (!tieneInicio) t.string('turno_inicio', 10).nullable();
      if (!tieneFin) t.string('turno_fin', 10).nullable();
    });
  }
}

export async function down() {
  throw new Error('Las columnas de turno en invitaciones no se eliminan automáticamente.');
}

export const config = { transaction: false };
