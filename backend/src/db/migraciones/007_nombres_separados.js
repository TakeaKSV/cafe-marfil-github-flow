import { dividirNombreCompleto } from '../../utils/nombres.js';

async function agregarColumnasNombre(knex, tabla) {
  const tieneNombres = await knex.schema.hasColumn(tabla, 'nombres');
  const tienePaterno = await knex.schema.hasColumn(tabla, 'apellido_paterno');
  const tieneMaterno = await knex.schema.hasColumn(tabla, 'apellido_materno');

  if (!tieneNombres || !tienePaterno || !tieneMaterno) {
    await knex.schema.alterTable(tabla, (t) => {
      if (!tieneNombres) t.string('nombres', 80).nullable();
      if (!tienePaterno) t.string('apellido_paterno', 60).nullable();
      if (!tieneMaterno) t.string('apellido_materno', 60).nullable();
    });
  }

  const filas = await knex(tabla).select('id', 'nombre', 'nombres');
  for (const fila of filas) {
    if (fila.nombres) continue;
    const partes = dividirNombreCompleto(fila.nombre);
    await knex(tabla)
      .where({ id: fila.id })
      .update({
        nombres: partes.nombres || null,
        apellido_paterno: partes.apellidoPaterno || null,
        apellido_materno: partes.apellidoMaterno || null
      });
  }
}

export async function up(knex) {
  await agregarColumnasNombre(knex, 'personal');
  await agregarColumnasNombre(knex, 'clientes');
}

export async function down() {
  throw new Error('Las columnas de nombre separado no se eliminan automáticamente.');
}

export const config = { transaction: false };
