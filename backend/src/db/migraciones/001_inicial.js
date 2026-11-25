import fs from 'node:fs/promises';

// Snapshot de 1.1.0: permite adoptar bases existentes sin borrar sus datos.
export async function up(knex) {
  const esquema = await fs.readFile(new URL('./001_inicial.sql', import.meta.url), 'utf8');
  for (const sentencia of esquema
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    await knex.raw(sentencia);
  }
}
export async function down() {
  throw new Error('La migración inicial no admite rollback destructivo. Restaura un respaldo.');
}
export const config = { transaction: false };
