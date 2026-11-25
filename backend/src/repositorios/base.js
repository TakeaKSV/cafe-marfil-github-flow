import { consulta } from '../db/conexion.js';

/** Traduce fechas UTC sin construir instrucciones SQL. */
export function valoresBD(datos) {
  return Object.fromEntries(
    Object.entries(datos)
      .filter(([, valor]) => valor !== undefined)
      .map(([clave, valor]) => [
        clave,
        typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(valor)
          ? valor.slice(0, -1).replace('T', ' ')
          : valor
      ])
  );
}

export const fechaBD = (fecha) => valoresBD({ fecha }).fecha;

export async function insertar(tabla, datos) {
  const [id] = await consulta(tabla).insert(valoresBD(datos));
  return { id };
}

export async function actualizar(tabla, id, cambios) {
  if (!Object.keys(cambios).length) return { afectadas: 0 };
  const afectadas = await consulta(tabla).where({ id }).update(valoresBD(cambios));
  return { afectadas };
}

export const aBit = (valor) => (valor ? 1 : 0);
export const aJSON = JSON.stringify;

/** Solo admite campos de un mapa estático, nunca nombres del cliente HTTP. */
export function mapearCampos(cambios, columnas) {
  const valores = {};
  for (const [campo, definicion] of Object.entries(columnas)) {
    if (cambios[campo] === undefined) continue;
    const [columna, convertir] = Array.isArray(definicion) ? definicion : [definicion];
    valores[columna] = convertir && cambios[campo] !== null ? convertir(cambios[campo]) : cambios[campo];
  }
  return valores;
}
