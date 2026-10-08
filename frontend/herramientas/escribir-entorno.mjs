// Escribe la URL de la API de producción en src/environments/environment.ts antes de "ng build".
//
// Uso:  API_URL=https://altura-api.up.railway.app/api node herramientas/escribir-entorno.mjs
//
// Railway: el servicio del frontend tiene la variable API_URL y el Dockerfile la recibe con
// "ARG API_URL" (Railway solo pasa variables al build si el Dockerfile las declara con ARG).
// Así la URL no queda escrita a mano en el código: si cambia, se cambia la variable y Railway
// vuelve a construir. Sin API_URL el script se detiene con un mensaje, para no publicar el
// marcador "https://TU-API.up.railway.app/api".
import { readFileSync, writeFileSync } from 'node:fs';

const ARCHIVO = new URL('../src/environments/environment.ts', import.meta.url);

const url = (process.env.API_URL ?? '').trim().replace(/\/+$/, '');

if (!url) {
  console.error('Falta la variable API_URL (por ejemplo https://altura-api.up.railway.app/api).');
  process.exit(1);
}

if (!/^https?:\/\/[^\s'"]+\/api$/.test(url)) {
  console.error(`API_URL debe ser una URL que termine en /api (llegó "${url}").`);
  process.exit(1);
}

const texto = readFileSync(ARCHIVO, 'utf8');
const patron = /apiBaseUrl: '[^']*'/;

if (!patron.test(texto)) {
  console.error('No se encontró "apiBaseUrl" en src/environments/environment.ts.');
  process.exit(1);
}

writeFileSync(ARCHIVO, texto.replace(patron, `apiBaseUrl: '${url}'`));
console.log(`environment.ts: apiBaseUrl = ${url}`);
