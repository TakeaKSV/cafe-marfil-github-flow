import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Evita reintroducir confirmaciones ficticias o acceso demo en los bundles publicados.
for (const app of ['admin', 'marfil']) {
  const directorio = new URL(`../frontend/${app}/dist/assets/`, import.meta.url);
  const archivos = (await readdir(directorio)).filter((nombre) => nombre.endsWith('.js'));
  assert.ok(archivos.length, `No hay build de ${app}.`);
  for (const archivo of archivos) {
    const fuente = await readFile(new URL(archivo, directorio), 'utf8');
    assert.doesNotMatch(fuente, /DEMO-QR-|iniciando en modo demostración\/offline/, `${app}: el build contiene acceso o reservaciones demo.`);
  }
}
console.log('Builds de producción sin acceso ni confirmaciones demo.');
