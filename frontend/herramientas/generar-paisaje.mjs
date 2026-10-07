// Genera los SVG del concepto "Ascenso" (se ejecuta una sola vez; los SVG quedan en public/):
//   node herramientas/generar-paisaje.mjs
//
// - public/paisaje/cresta-1..4.svg: siluetas de montaña del hero y del acceso (de la más lejana
//   a la más cercana). Cada cresta es una suma de ondas seno con semilla fija: siempre sale igual.
// - public/texturas/curvas-nivel.svg: curvas de nivel (como en un mapa topográfico) para el fondo
//   de las cards. Se calcula una "altura" en cada punto de una grilla (suma de colinas) y se
//   trazan las líneas de igual altura con el algoritmo marching squares.
import { mkdirSync, writeFileSync } from 'node:fs';

const ANCHO = 1440;
const ALTO = 600;

/** Números pseudoaleatorios repetibles a partir de una semilla. */
function aleatorio(semilla) {
  let s = semilla;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// ---------- Crestas ----------
const CRESTAS = [
  // base: altura media de la cresta dentro de su capa (0 = arriba, 600 = abajo); amplitud: tamaño de los picos.
  { archivo: 'cresta-1', color: '#C9D3C6', base: 250, amplitud: 150, semilla: 7 },
  { archivo: 'cresta-2', color: '#8FA58F', base: 230, amplitud: 110, semilla: 21 },
  { archivo: 'cresta-3', color: '#4B6A52', base: 220, amplitud: 80, semilla: 3 },
  { archivo: 'cresta-4', color: '#13281F', base: 150, amplitud: 45, semilla: 11 },
];

function cresta({ color, base, amplitud, semilla }) {
  const r = aleatorio(semilla);
  // Tres ondas de distinta frecuencia: picos grandes, lomas medianas y detalle.
  const ondas = [1.3, 3.1, 7.4, 16].map((f, i) => ({ f: f + r(), fase: r() * Math.PI * 2, peso: [1, 0.5, 0.2, 0.06][i] }));
  const puntos = [];
  for (let x = 0; x <= ANCHO; x += 12) {
    const t = x / ANCHO;
    const y = base - amplitud * ondas.reduce((suma, o) => suma + o.peso * Math.sin(t * Math.PI * o.f + o.fase), 0) * 0.62;
    puntos.push(`${x} ${y.toFixed(1)}`);
  }
  const d = `M0 ${ALTO} L${puntos.join(' L')} L${ANCHO} ${ALTO} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" preserveAspectRatio="none"><path fill="${color}" d="${d}"/></svg>\n`;
}

mkdirSync('public/paisaje', { recursive: true });
for (const c of CRESTAS) {
  writeFileSync(`public/paisaje/${c.archivo}.svg`, cresta(c));
}

// ---------- Curvas de nivel ----------
const AN = 800;
const AL = 1000;
const PASO = 10; // tamaño de celda de la grilla
const r = aleatorio(42);
const colinas = Array.from({ length: 12 }, () => ({ x: r() * AN, y: r() * AL, alto: 0.5 + r(), radio: 90 + r() * 170 }));

function altura(x, y) {
  return colinas.reduce((h, c) => h + c.alto * Math.exp(-((x - c.x) ** 2 + (y - c.y) ** 2) / (2 * c.radio ** 2)), 0);
}

const columnas = AN / PASO;
const filas = AL / PASO;
const grilla = [];
for (let j = 0; j <= filas; j++) {
  grilla.push([]);
  for (let i = 0; i <= columnas; i++) grilla[j].push(altura(i * PASO, j * PASO));
}

/** Marching squares: segmentos donde el campo cruza el nivel. */
function segmentos(nivel) {
  const lista = [];
  const cruce = (a, b, va, vb) => a + ((nivel - va) / (vb - va)) * (b - a);
  for (let j = 0; j < filas; j++) {
    for (let i = 0; i < columnas; i++) {
      const x = i * PASO, y = j * PASO;
      const v = [grilla[j][i], grilla[j][i + 1], grilla[j + 1][i + 1], grilla[j + 1][i]];
      const bordes = [];
      if ((v[0] > nivel) !== (v[1] > nivel)) bordes.push([cruce(x, x + PASO, v[0], v[1]), y]);
      if ((v[1] > nivel) !== (v[2] > nivel)) bordes.push([x + PASO, cruce(y, y + PASO, v[1], v[2])]);
      if ((v[3] > nivel) !== (v[2] > nivel)) bordes.push([cruce(x, x + PASO, v[3], v[2]), y + PASO]);
      if ((v[0] > nivel) !== (v[3] > nivel)) bordes.push([x, cruce(y, y + PASO, v[0], v[3])]);
      if (bordes.length === 2) lista.push(bordes);
      if (bordes.length === 4) lista.push([bordes[0], bordes[1]], [bordes[2], bordes[3]]);
    }
  }
  return lista;
}

/** Une los segmentos que comparten extremos en líneas continuas (archivo más liviano). */
function unir(lista) {
  const clave = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const libres = new Set(lista.keys());
  const porPunto = new Map();
  lista.forEach(([a, b], k) => {
    for (const p of [a, b]) porPunto.set(clave(p), [...(porPunto.get(clave(p)) ?? []), k]);
  });
  const lineas = [];
  for (const inicio of lista.keys()) {
    if (!libres.has(inicio)) continue;
    libres.delete(inicio);
    const linea = [...lista[inicio]];
    let extendida = true;
    while (extendida) {
      extendida = false;
      const ultimo = linea[linea.length - 1];
      for (const k of porPunto.get(clave(ultimo)) ?? []) {
        if (!libres.has(k)) continue;
        libres.delete(k);
        const [a, b] = lista[k];
        linea.push(clave(a) === clave(ultimo) ? b : a);
        extendida = true;
        break;
      }
    }
    lineas.push(linea);
  }
  return lineas;
}

const maximo = Math.max(...grilla.flat());
let trazos = '';
for (let n = 1; n <= 14; n++) {
  for (const linea of unir(segmentos((maximo * n) / 15))) {
    trazos += `M${linea.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join('L')}`;
  }
}

mkdirSync('public/texturas', { recursive: true });
writeFileSync(
  'public/texturas/curvas-nivel.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${AN} ${AL}" preserveAspectRatio="xMidYMid slice"><path fill="none" stroke="#13281F" stroke-width="1.2" stroke-linejoin="round" d="${trazos}"/></svg>\n`,
);

console.log('Listo: public/paisaje/cresta-1..4.svg y public/texturas/curvas-nivel.svg');
