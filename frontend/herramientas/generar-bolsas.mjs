// Genera las 25 imágenes de producto (set 3, "Herbario Kraft") a partir del catálogo:
//   node herramientas/generar-bolsas.mjs            (todas)
//   node herramientas/generar-bolsas.mjs 09 10      (solo las que empiezan por esos números)
//
// 1. Lee backend/seed/catalogo.json.
// 2. Dibuja un SVG por café (bolsa kraft de frente, rama de café, sello del proceso, textos).
// 3. Lo abre en Chromium (Playwright) con las fuentes de @fontsource y lo exporta a PNG 1600×1600.
// 4. Comprime el PNG con sharp (paleta de colores) para que pese menos de 600 kB.
// La filosofía visual está en backend/seed/imagenes/DISENO.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const SEED = new URL('../../backend/seed/', import.meta.url);
const DESTINO = new URL('imagenes/', SEED);
const catalogo = JSON.parse(readFileSync(new URL('catalogo.json', SEED), 'utf8'));
const filtro = process.argv.slice(2);

// ---------- Colores ----------
const TINTA = '#2A1C12'; // impresión oscura sobre el kraft
const TINTA_SUAVE = '#5A4029';
const PROCESOS = {
  Lavado: { color: '#2E6A8A', claro: '#D6E6EE' },
  Honey: { color: '#B97A12', claro: '#F6E3B8' },
  Fermentado: { color: '#6E2E4A', claro: '#EBD3DE' },
};
// Color de cada variedad (el mismo del frontend: core/data/contenido-marca.ts).
const VARIEDADES = {
  Castillo: '#7A4A26',
  Caturra: '#3B6B34',
  Colombia: '#A2482A',
  Típica: '#8A6316',
  Tabi: '#4A5868',
  'Bourbon Rojo': '#9E2433',
  'Bourbon Amarillo': '#7A6400',
  'Bourbon Rosado': '#B03A6B',
  Geisha: '#2D6A5E',
};
// Cerezas: rojas en general; amarillas y rosadas según la variedad.
const CEREZAS = {
  rojo: ['#E2574A', '#B42A22', '#6E1410'],
  amarillo: ['#F5D66A', '#D9A521', '#8C6410'],
  rosado: ['#F4AABD', '#D9678A', '#8E3352'],
};
const colorCereza = (variedad) =>
  variedad === 'Bourbon Amarillo' ? CEREZAS.amarillo : variedad === 'Bourbon Rosado' ? CEREZAS.rosado : CEREZAS.rojo;

/** Números pseudoaleatorios repetibles (cada café tiene su semilla: su rama es única pero estable). */
function aleatorio(semilla) {
  let s = semilla;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const f = (n) => Number(n.toFixed(1));

// ---------- Piezas de la ilustración (coordenadas locales de la bolsa: x -300..300, y -900..0) ----------

/** Banda de granos tostados (ancho completo de la bolsa). */
function bandaDeGranos(r, y0, alto) {
  const tonos = ['#3B2414', '#4A2C17', '#2E1B0F', '#563319', '#41271A'];
  let granos = '';
  for (let fila = -1; fila * 30 < alto + 30; fila++) {
    for (let col = -1; col * 44 < 640; col++) {
      const cx = -320 + col * 44 + (fila % 2) * 22 + (r() - 0.5) * 14;
      const cy = y0 + fila * 30 + (r() - 0.5) * 10;
      const giro = (r() - 0.5) * 120;
      const rx = 22 + r() * 5;
      const ry = 15 + r() * 3;
      const tono = tonos[Math.floor(r() * tonos.length)];
      granos +=
        `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(giro)})">` +
        `<ellipse rx="${f(rx)}" ry="${f(ry)}" fill="${tono}"/>` +
        `<ellipse cx="${f(-rx * 0.3)}" cy="${f(-ry * 0.35)}" rx="${f(rx * 0.5)}" ry="${f(ry * 0.3)}" fill="#fff" opacity=".08"/>` +
        `<path d="M${f(-rx * 0.82)} 0 Q0 ${f(ry * 0.4)} ${f(rx * 0.82)} 0" fill="none" stroke="#160C06" stroke-width="3" stroke-linecap="round"/>` +
        `</g>`;
    }
  }
  return (
    `<clipPath id="recorte-granos"><rect x="-310" y="${y0}" width="620" height="${alto}"/></clipPath>` +
    `<g clip-path="url(#recorte-banda)"><g clip-path="url(#recorte-granos)">` +
    `<rect x="-310" y="${y0}" width="620" height="${alto}" fill="#24150C"/>${granos}` +
    // Sombra interior arriba y abajo: la banda parece impresa con volumen.
    `<rect x="-310" y="${y0}" width="620" height="${alto}" fill="url(#sombra-banda)"/>` +
    `</g></g>`
  );
}

/** Hoja de café: forma de lanza con nervadura central y laterales. */
function hoja(x, y, angulo, largo, r, fondo = false) {
  const ancho = largo * (0.3 + r() * 0.06);
  const venas = [0.22, 0.38, 0.54, 0.7, 0.84]
    .map((t) => {
      const vx = largo * t;
      const dx = largo * 0.12;
      const dy = ancho * 0.55 * (1 - Math.abs(t - 0.45));
      return `M${f(vx)} 0 Q${f(vx + dx * 0.5)} ${f(-dy * 0.6)} ${f(vx + dx)} ${f(-dy)}M${f(vx)} 0 Q${f(vx + dx * 0.5)} ${f(dy * 0.6)} ${f(vx + dx)} ${f(dy)}`;
    })
    .join('');
  const tono = fondo ? 'url(#hoja-c)' : r() > 0.5 ? 'url(#hoja-a)' : 'url(#hoja-b)';
  return (
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angulo)})">` +
    `<path d="M0 0 C${f(largo * 0.22)} ${f(-ancho)} ${f(largo * 0.72)} ${f(-ancho * 0.85)} ${f(largo)} 0 C${f(largo * 0.72)} ${f(ancho * 0.85)} ${f(largo * 0.22)} ${f(ancho)} 0 0Z" fill="${tono}" stroke="#20351F" stroke-width="1.2"/>` +
    `<path d="M2 0 Q${f(largo * 0.5)} ${f(ancho * 0.06)} ${f(largo * 0.96)} 0" fill="none" stroke="#9DBB86" stroke-width="2"/>` +
    `<path d="${venas}" fill="none" stroke="#86A673" stroke-width="1.1" opacity=".8"/>` +
    `</g>`
  );
}

/** Flor blanca de cinco pétalos con estambres. */
function flor(x, y, escala, giro) {
  let petalos = '';
  for (let i = 0; i < 5; i++) {
    petalos += `<ellipse cx="0" cy="-13" rx="7.5" ry="14" transform="rotate(${i * 72})" fill="#FCFAF3" stroke="#D8D0BC" stroke-width=".9"/>`;
  }
  let estambres = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 + 36) * (Math.PI / 180);
    estambres += `<line x1="0" y1="0" x2="${f(Math.sin(a) * 9)}" y2="${f(-Math.cos(a) * 9)}" stroke="#C9B57A" stroke-width="1.2"/><circle cx="${f(Math.sin(a) * 9)}" cy="${f(-Math.cos(a) * 9)}" r="1.8" fill="#B8963E"/>`;
  }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(giro)}) scale(${f(escala)})">${petalos}<circle r="4.5" fill="#EADBA4"/>${estambres}</g>`;
}

/** Cereza de café: esfera con brillo, ombligo y cáliz. */
function cereza(x, y, radio) {
  return (
    `<g transform="translate(${f(x)} ${f(y)})">` +
    `<circle r="${f(radio)}" fill="url(#cereza)"/>` +
    `<ellipse cx="${f(-radio * 0.35)}" cy="${f(-radio * 0.38)}" rx="${f(radio * 0.32)}" ry="${f(radio * 0.2)}" fill="#fff" opacity=".55" transform="rotate(-30 ${f(-radio * 0.35)} ${f(-radio * 0.38)})"/>` +
    `<path d="M${f(radio * 0.55)} ${f(-radio * 0.62)} l3 -3 m-3 3 l4 1 m-4 -1 l1 4" stroke="#3A2A12" stroke-width="1.4" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** Rama completa: tallo, hojas, flores y racimos de cerezas. Cambia un poco con cada semilla. */
function rama(r) {
  const inclinacion = -7 + r() * 6;
  let svg = `<g clip-path="url(#recorte-banda)"><g transform="rotate(${f(inclinacion)} 0 -300)">`;
  // Tallo que cruza la banda de izquierda a derecha.
  svg += `<path d="M-340 -270 C-180 -300 -40 -318 120 -310 S300 -296 360 -316" fill="none" stroke="#4B3A23" stroke-width="7" stroke-linecap="round"/>`;
  svg += `<path d="M-340 -270 C-180 -300 -40 -318 120 -310 S300 -296 360 -316" fill="none" stroke="#7A6440" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
  // Hojas de fondo, oscuras y entre las demás: dan la sensación de una rama con volumen.
  [-300, -100, 110, 300].forEach((x) => {
    svg += hoja(x, -300 + (r() - 0.5) * 30, (r() > 0.5 ? -1 : 1) * (150 + r() * 25), 90 + r() * 20, r, true);
  });
  // Hojas en pares alternos (arriba y abajo del tallo).
  const nudos = [-250, -150, -50, 60, 170, 270];
  nudos.forEach((x, i) => {
    const yTallo = -280 - Math.sin((x + 340) / 700 * Math.PI) * 30;
    const arriba = i % 2 === 0;
    const largo = 104 + r() * 30;
    // Hojas inclinadas entre 30° y 55°: crecen a lo largo de la banda sin tapar los textos.
    svg += hoja(x, yTallo, arriba ? -(30 + r() * 25) : 30 + r() * 25, largo, r);
    if (r() > 0.4) {
      svg += hoja(x + 10, yTallo, arriba ? 150 + r() * 20 : -150 - r() * 20, largo * 0.75, r);
    }
  });
  // Racimos de cerezas en las axilas y flores entre ellos.
  const racimos = [-195, -5, 205];
  racimos.forEach((x, i) => {
    const yTallo = -280 - Math.sin((x + 340) / 700 * Math.PI) * 30;
    const cantidad = 4 + Math.floor(r() * 3);
    for (let c = 0; c < cantidad; c++) {
      const a = (c / cantidad) * Math.PI * 2 + r();
      const d = 8 + r() * 16;
      svg += cereza(x + Math.cos(a) * d * 1.4, yTallo + 6 + Math.sin(a) * d, 16 + r() * 5);
    }
    const fx = x + 80 + r() * 20;
    const fy = -288 - Math.sin((fx + 340) / 700 * Math.PI) * 30;
    for (let k = 0; k < 3; k++) {
      svg += flor(fx + k * 20 - 20 + r() * 6, fy - 16 - r() * 18 + (k === 1 ? -14 : 0), 0.85 + r() * 0.3, r() * 60);
    }
  });
  return svg + '</g></g>';
}

/** Emblema hexagonal de marca con "Café Altura". */
function emblema(cy) {
  const radio = 82;
  const puntos = (rr) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${f(Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`;
    }).join(' ');
  return (
    `<polygon points="${puntos(radio)}" fill="${TINTA}"/>` +
    `<polygon points="${puntos(radio - 7)}" fill="none" stroke="#C9A271" stroke-width="1.6"/>` +
    // Montaña con la cereza en la cumbre (el logo de Altura).
    `<path d="M-30 ${cy - 6} L-12 ${cy - 30} L-2 ${cy - 17} L10 ${cy - 38} L30 ${cy - 6}" fill="none" stroke="#E9D3AC" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="10" cy="${cy - 47}" r="4.6" fill="#D9473A"/>` +
    `<text x="0" y="${cy + 18}" text-anchor="middle" font-family="Geist Mono" font-size="13" letter-spacing="4" fill="#E9D3AC">CAFÉ</text>` +
    `<text x="0" y="${cy + 46}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-stretch="80%" font-size="30" letter-spacing="1" fill="#F4E6CC">Altura</text>`
  );
}

/** Sello circular del proceso. */
function sello(cx, cy, proceso) {
  const { color, claro } = PROCESOS[proceso];
  const tamano = proceso.length > 7 ? 19 : 23;
  return (
    `<g transform="translate(${cx} ${cy}) rotate(-8)">` +
    `<circle r="64" fill="${color}"/>` +
    `<circle r="56" fill="none" stroke="${claro}" stroke-width="1.6" stroke-dasharray="3 4"/>` +
    `<text y="-14" text-anchor="middle" font-family="Geist Mono" font-size="12" letter-spacing="3" fill="${claro}">PROCESO</text>` +
    `<text y="16" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-stretch="85%" font-size="${tamano}" fill="#fff">${proceso}</text>` +
    `<path d="M-22 30 h44" stroke="${claro}" stroke-width="1.4"/>` +
    `</g>`
  );
}

/** Tamaño del nombre según su largo (siempre cabe en el frente de la bolsa). */
const tamanoNombre = (nombre) => Math.min(74, Math.floor(1020 / Math.max(nombre.length, 8)));

function svgDeCafe(cafe, indice) {
  const r = aleatorio(1000 + indice * 37);
  // 340 g ocupa ~63 % del alto del encuadre; 500 g es un 17 % más grande y apoya en el mismo suelo.
  const escala = cafe.presentacion === 500 ? 1.12 * 1.17 : 1.12;
  const colorVariedad = VARIEDADES[cafe.variedad];
  const [c1, c2, c3] = colorCereza(cafe.variedad);
  const anchoSombra = 300 * escala;

  const cuerpo =
    'M-300 -878 L300 -878 L300 -44 Q300 -6 262 -3 Q0 9 -262 -3 Q-300 -6 -300 -44 Z';
  // Sello superior engarzado: borde con pequeños dientes.
  let dientes = 'M-300 -872 ';
  for (let x = -300; x <= 300; x += 10) {
    dientes += `L${x} ${x % 20 === 0 ? -900 : -896} `;
  }
  dientes += 'L300 -872 Z';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
<defs>
  <radialGradient id="fondo" cx="50%" cy="34%" r="75%">
    <stop offset="0" stop-color="#F3F3F1"/><stop offset=".6" stop-color="#ECECEA"/><stop offset="1" stop-color="#E1E1DE"/>
  </radialGradient>
  <linearGradient id="kraft" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#D2AB7B"/><stop offset=".45" stop-color="#C49A68"/><stop offset="1" stop-color="#A97F50"/>
  </linearGradient>
  <linearGradient id="volumen" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#3B2412" stop-opacity=".34"/><stop offset=".12" stop-color="#3B2412" stop-opacity=".08"/>
    <stop offset=".45" stop-color="#fff" stop-opacity=".07"/><stop offset=".85" stop-color="#3B2412" stop-opacity=".08"/>
    <stop offset="1" stop-color="#3B2412" stop-opacity=".38"/>
  </linearGradient>
  <linearGradient id="luz-cenital" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".9" stop-color="#2A1608" stop-opacity="0"/><stop offset="1" stop-color="#2A1608" stop-opacity=".22"/>
  </linearGradient>
  <linearGradient id="sombra-banda" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".12" stop-color="#000" stop-opacity="0"/>
    <stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
  </linearGradient>
  <linearGradient id="hoja-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5E8B52"/><stop offset="1" stop-color="#2F4E33"/></linearGradient>
  <linearGradient id="hoja-b" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4F7A47"/><stop offset="1" stop-color="#26402A"/></linearGradient>
  <linearGradient id="hoja-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2E4A30"/><stop offset="1" stop-color="#1C2F1E"/></linearGradient>
  <radialGradient id="cereza" cx="38%" cy="34%" r="70%">
    <stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
  </radialGradient>
  <filter id="papel" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${indice + 3}" result="ruido"/>
    <feColorMatrix in="ruido" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .05  0 0 0 .55 -.18"/>
  </filter>
  <filter id="fibras" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="4" seed="${indice + 11}"/>
    <feColorMatrix values="0 0 0 0 .25  0 0 0 0 .15  0 0 0 0 .06  0 0 0 .38 -.14"/>
  </filter>
  <filter id="desenfoque-sombra" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="desenfoque-contacto" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="desenfoque-pliegue" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="relieve" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1A0E06" flood-opacity=".35"/>
  </filter>
  <clipPath id="recorte-bolsa"><path d="${cuerpo}"/><path d="${dientes}"/></clipPath>
  <clipPath id="recorte-banda"><path d="${cuerpo}"/></clipPath>
</defs>

<rect width="1600" height="1600" fill="url(#fondo)"/>

<!-- Sombra suave, apenas desplazada: la luz viene de arriba y un poco a la izquierda. -->
<ellipse cx="826" cy="1424" rx="${f(anchoSombra + 60)}" ry="${f(46 * escala)}" fill="#3A3A34" opacity=".26" filter="url(#desenfoque-sombra)"/>
<ellipse cx="808" cy="1413" rx="${f(anchoSombra - 20)}" ry="12" fill="#2A2A25" opacity=".42" filter="url(#desenfoque-contacto)"/>

<g transform="translate(800 1410) scale(${escala})">
  <!-- Bolsa: kraft, sello superior, volumen, luz y textura. -->
  <g clip-path="url(#recorte-bolsa)">
    <rect x="-310" y="-910" width="620" height="930" fill="url(#kraft)"/>
    <path d="${dientes}" fill="#C7A06F"/>
    <g opacity=".55">${Array.from({ length: 60 }, (_, i) => `<line x1="${-298 + i * 10}" y1="-894" x2="${-298 + i * 10}" y2="-874" stroke="#8C6640" stroke-width="1.4"/>`).join('')}</g>
    <rect x="-310" y="-874" width="620" height="3" fill="#7E5C38" opacity=".55"/>
    <rect x="-310" y="-802" width="620" height="2" fill="#7E5C38" opacity=".45"/>
    <rect x="-310" y="-797" width="620" height="2" fill="#F1D9B4" opacity=".35"/>
    <!-- Pliegues sutiles. -->
    <path d="M-250 -860 Q-230 -600 -262 -300" stroke="#fff" stroke-width="10" opacity=".14" fill="none" filter="url(#desenfoque-pliegue)"/>
    <path d="M-236 -860 Q-216 -600 -248 -300" stroke="#3B2412" stroke-width="6" opacity=".12" fill="none" filter="url(#desenfoque-pliegue)"/>
    <path d="M240 -840 Q262 -520 230 -140" stroke="#3B2412" stroke-width="9" opacity=".12" fill="none" filter="url(#desenfoque-pliegue)"/>
    <path d="M-300 -70 Q0 -110 300 -70" stroke="#3B2412" stroke-width="12" opacity=".16" fill="none" filter="url(#desenfoque-pliegue)"/>
  </g>

  <!-- Muescas de apertura y válvula. -->
  <path d="M-300 -818 l10 6 l-10 6 Z" fill="#E6E6E2"/>
  <path d="M300 -818 l-10 6 l10 6 Z" fill="#E6E6E2"/>
  <g transform="translate(206 -742)">
    <circle r="24" fill="#E9E2D3" opacity=".9"/><circle r="24" fill="none" stroke="#9C8462" stroke-width="1.5"/>
    <circle r="15" fill="none" stroke="#A89270" stroke-width="1.2"/><circle r="6" fill="#B8A584"/>
  </g>

  <!-- Impresión sobre el kraft. -->
  ${emblema(-706)}

  <text x="0" y="-556" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-stretch="78%" font-size="${tamanoNombre(cafe.nombre)}" letter-spacing="-.5" fill="${TINTA}">${cafe.nombre}</text>
  <rect x="-40" y="-536" width="80" height="4" rx="2" fill="${colorVariedad}"/>

  <text x="-150" y="-494" text-anchor="middle" font-family="Geist Mono" font-size="13" letter-spacing="3" fill="${TINTA_SUAVE}">VARIEDAD</text>
  <text x="-150" y="-464" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="700" font-stretch="88%" font-size="${cafe.variedad.length > 13 ? 25 : 28}" fill="${TINTA}">${cafe.variedad}</text>
  <text x="150" y="-494" text-anchor="middle" font-family="Geist Mono" font-size="13" letter-spacing="3" fill="${TINTA_SUAVE}">ORIGEN</text>
  <text x="150" y="-464" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="700" font-stretch="88%" font-size="28" fill="${TINTA}">${cafe.origen}, Colombia</text>
  <line x1="0" y1="-500" x2="0" y2="-456" stroke="${TINTA_SUAVE}" stroke-width="1" opacity=".5"/>

  ${bandaDeGranos(r, -404, 210)}
  ${rama(r)}
  ${sello(212, -206, cafe.proceso)}

  <text x="-262" y="-124" font-family="Geist Mono" font-size="13" letter-spacing="3" fill="${TINTA_SUAVE}">PESO NETO</text>
  <text x="-262" y="-72" font-family="Bricolage Grotesque" font-weight="800" font-stretch="80%" font-size="54" fill="${TINTA}">${cafe.presentacion} g</text>
  <line x1="-262" y1="-52" x2="262" y2="-52" stroke="${TINTA_SUAVE}" stroke-width="1" opacity=".45"/>
  <text x="0" y="-28" text-anchor="middle" font-family="Geist Mono" font-size="14" letter-spacing="4" fill="${TINTA}">100% CAFÉ COLOMBIANO PREMIUM</text>

  <!-- Luz, volumen y fibra del papel por encima de todo: la tinta parece impresa en el kraft. -->
  <g clip-path="url(#recorte-bolsa)">
    <rect x="-310" y="-910" width="620" height="930" fill="url(#volumen)"/>
    <rect x="-310" y="-910" width="620" height="930" fill="url(#luz-cenital)"/>
    <rect x="-310" y="-910" width="620" height="930" filter="url(#fibras)"/>
    <rect x="-310" y="-910" width="620" height="930" filter="url(#papel)"/>
  </g>
</g>
</svg>
`;
}

// ---------- Exportación ----------
const fuentes = new URL('../node_modules/@fontsource-variable/', import.meta.url);
const enBase64 = (ruta) => `data:font/woff2;base64,${readFileSync(new URL(ruta, fuentes)).toString('base64')}`;
const bricolage = enBase64('bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2');
const geist = enBase64('geist-mono/files/geist-mono-latin-wght-normal.woff2');
const pagina = (svg) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Bricolage Grotesque'; src: url('${bricolage}') format('woff2'); font-weight: 200 800; font-stretch: 75% 100%; }
@font-face { font-family: 'Geist Mono'; src: url('${geist}') format('woff2'); font-weight: 100 900; }
html, body { margin: 0; } svg { display: block; }
</style></head><body>${svg}</body></html>`;

const navegador = await chromium.launch();
const tab = await navegador.newPage({ viewport: { width: 1600, height: 1600 } });
for (const [indice, cafe] of catalogo.entries()) {
  if (filtro.length && !filtro.some((n) => cafe.imagen.startsWith(n))) continue;
  const svg = svgDeCafe(cafe, indice);
  writeFileSync(new URL(`${cafe.imagen}.svg`, DESTINO), svg);
  await tab.setContent(pagina(svg));
  await tab.evaluate(() => document.fonts.ready);
  const png = await tab.screenshot({ clip: { x: 0, y: 0, width: 1600, height: 1600 } });
  const comprimido = await sharp(png).png({ palette: true, colors: 192, quality: 90, effort: 10, dither: 0.6 }).toBuffer();
  writeFileSync(new URL(`${cafe.imagen}.png`, DESTINO), comprimido);
  console.log(`${cafe.imagen}.png  ${Math.round(comprimido.length / 1024)} kB`);
}
await navegador.close();
