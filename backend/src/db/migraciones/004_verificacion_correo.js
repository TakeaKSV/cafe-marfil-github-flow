export async function up(knex) {
  if (!(await knex.schema.hasColumn('clientes', 'email_verificado_en'))) {
    await knex.schema.alterTable('clientes', (t) => {
      t.dateTime('email_verificado_en', { precision: 3 }).nullable();
    });
  }

  if (!(await knex.schema.hasTable('tokens_correo'))) {
    await knex.schema.createTable('tokens_correo', (t) => {
      t.increments('id').unsigned().primary();
      t.integer('cliente_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('clientes')
        .onDelete('CASCADE');
      t.string('token_hash', 64).notNullable().unique();
      t.enu('tipo', ['verificacion', 'recuperacion']).notNullable();
      t.dateTime('expira_en', { precision: 3 }).notNullable();
      t.dateTime('usado_en', { precision: 3 }).nullable();
      t.dateTime('creado_en', { precision: 3 }).notNullable();
      t.index(['cliente_id', 'tipo'], 'idx_tokens_correo_cliente_tipo');
    });
  }
}

export async function down() {
  throw new Error('La verificación de correo no se elimina automáticamente.');
}

export const config = { transaction: false };
