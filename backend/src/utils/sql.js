// Conversores para columnas TINYINT(1) y JSON.
export const aBit = (valor) => (valor ? 1 : 0);
export const aJSON = (valor) => JSON.stringify(valor);

/**
 * Arma la parte SET de un UPDATE parcial a partir de los campos que sí llegaron.
 *
 *   armarUpdate({ precio: 90 }, { precio: 'precio', disponibleEnCocina: ['disponible', aBit] })
 *   -> { sets: 'precio = :precio', valores: { precio: 90 } }
 *
 * `columnas` mapea campo de la API -> columna, o -> [columna, conversor].
 * Devuelve null si no hay nada que actualizar.
 */
export function armarUpdate(cambios, columnas) {
  const sets = [];
  const valores = {};
  for (const [campo, definicion] of Object.entries(columnas)) {
    if (cambios[campo] === undefined) continue;
    const [columna, convertir] = Array.isArray(definicion) ? definicion : [definicion];
    sets.push(`${columna} = :${columna}`);
    valores[columna] = convertir && cambios[campo] !== null ? convertir(cambios[campo]) : cambios[campo];
  }
  return sets.length ? { sets: sets.join(', '), valores } : null;
}
