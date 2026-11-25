export async function up(knex) {
  for (const tabla of ['personal', 'clientes']) {
    if (!(await knex.schema.hasColumn(tabla, 'session_version'))) {
      await knex.schema.alterTable(tabla, (t) => t.integer('session_version').unsigned().notNullable().defaultTo(0));
    }
  }
}
export async function down() {
  throw new Error('La versión de sesiones no se elimina automáticamente.');
}
export const config = { transaction: false };
