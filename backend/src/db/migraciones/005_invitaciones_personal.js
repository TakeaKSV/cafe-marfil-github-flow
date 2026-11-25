export async function up(knex) {
  if (!(await knex.schema.hasTable('invitaciones_personal'))) {
    await knex.schema.createTable('invitaciones_personal', (t) => {
      t.increments('id').unsigned().primary();
      t.string('email', 190).notNullable();
      t.enu('rol', ['admin', 'gerente', 'host', 'staff']).notNullable().defaultTo('host');
      t.string('puesto', 80).notNullable().defaultTo('Colaborador');
      t.string('sucursal_id', 60).nullable().references('id').inTable('sucursales').onDelete('SET NULL');
      t.string('token_hash', 64).notNullable().unique();
      t.integer('invitado_por').unsigned().nullable().references('id').inTable('personal').onDelete('SET NULL');
      t.dateTime('expira_en', { precision: 3 }).notNullable();
      t.dateTime('usado_en', { precision: 3 }).nullable();
      t.dateTime('creado_en', { precision: 3 }).notNullable();
      t.index(['email', 'usado_en'], 'idx_invitaciones_personal_email');
    });
  }
}

export async function down() {
  throw new Error('Las invitaciones de personal no se eliminan automáticamente.');
}

export const config = { transaction: false };
