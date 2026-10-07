import { normalizarTexto } from '../utils/texto';
import { DEPARTAMENTOS, Departamento } from './mapa-colombia';

/*
 * Contenido de marca de Altura que vive en el frontend.
 * Los PRODUCTOS, las VARIEDADES y los PROCESOS siempre vienen de la API; aquí solo está el
 * texto editorial, el color y las notas asociados a cada uno por su nombre normalizado.
 * Si la API devuelve una variedad o un proceso que no está aquí, se usa su descripción
 * de la API y un color neutro.
 */

export interface MarcaVariedad {
  /** Color de la variedad: texto sobre niebla/papel y fondo con texto blanco (AA en los dos casos). */
  readonly color: string;
  readonly texto: string;
  /** Notas de cata (también alimentan la cinta de notas del Inicio). */
  readonly notas: readonly string[];
}

/** Claves = nombre normalizado (minúsculas, sin tildes): "Bourbon Rosado" → "bourbon rosado". */
const VARIEDADES: Readonly<Record<string, MarcaVariedad>> = {
  castillo: {
    color: '#7A4A26', // café
    notas: ['Panela', 'Chocolate', 'Acidez amable'],
    texto: 'La más sembrada de Colombia. Cenicafé la creó para resistir la roya sin perder dulzura.',
  },
  caturra: {
    color: '#3B6B34', // verde hoja
    notas: ['Cítricos', 'Caramelo', 'Taza brillante'],
    texto: 'Tradicional y de porte bajo. Su taza es brillante, limpia y de acidez viva.',
  },
  colombia: {
    color: '#A2482A', // terracota
    notas: ['Nuez', 'Cacao suave', 'Cuerpo medio'],
    texto: 'Cruce de Caturra e Híbrido de Timor hecho por Cenicafé. Equilibrada y resistente a la roya.',
  },
  tipica: {
    color: '#7E5A10', // ocre
    notas: ['Miel', 'Flores', 'Dulzor limpio'],
    texto: 'Una de las primeras variedades que llegaron a América. Taza limpia, dulce y delicada.',
  },
  tabi: {
    color: '#4A5868', // gris pizarra
    notas: ['Frutos rojos', 'Panela', 'Buen cuerpo'],
    texto: 'De Cenicafé, de porte alto, con herencia de Típica y Bourbon. Dulce y con cuerpo.',
  },
  'bourbon rojo': {
    color: '#9E2433', // rojo cereza
    notas: ['Ciruela', 'Chocolate', 'Cuerpo redondo'],
    texto: 'Un clásico de frutos rojos, querido por su dulzor y su cuerpo redondo.',
  },
  'bourbon amarillo': {
    color: '#7A6400', // mostaza
    notas: ['Miel', 'Durazno', 'Acidez suave'],
    texto: 'Sus cerezas maduran amarillas y dejan en la taza un dulzor que recuerda a la miel.',
  },
  'bourbon rosado': {
    color: '#B03A6B', // rosa
    notas: ['Hibisco', 'Frutos rojos', 'Floral'],
    texto: 'Rara y muy apreciada en el Huila. Cerezas rosadas y una taza floral y frutal.',
  },
  geisha: {
    color: '#2D6A5E', // jade
    notas: ['Jazmín', 'Bergamota', 'Fruta de hueso'],
    texto: 'Exótica y floral: llegó de Etiopía y es de las más valoradas del café de especialidad.',
  },
};

const VARIEDAD_NEUTRA: MarcaVariedad = { color: '#13281F', texto: '', notas: [] };

export function marcaVariedad(nombre: string | null | undefined): MarcaVariedad {
  return (nombre && VARIEDADES[normalizarTexto(nombre)]) || VARIEDAD_NEUTRA;
}

export interface MarcaProceso {
  /** Color del proceso (texto sobre papel y fondo con texto blanco, AA). */
  readonly color: string;
  /** Ícono de Bootstrap Icons. */
  readonly icono: string;
  /** Qué le pasa a la cereza, en una frase. */
  readonly texto: string;
  /** Qué se siente en la taza, en pocas palabras. */
  readonly enTaza: string;
}

const PROCESOS: Readonly<Record<string, MarcaProceso>> = {
  lavado: {
    color: '#2E6A8A', // azul de agua
    icono: 'bi-droplet',
    texto: 'Se lava toda la pulpa y el mucílago antes de secar el grano.',
    enTaza: 'Taza limpia y brillante',
  },
  honey: {
    color: '#875700', // ámbar de miel
    icono: 'bi-hexagon',
    texto: 'Se seca con parte del mucílago, dulce y pegajoso como la miel.',
    enTaza: 'Más dulzor y cuerpo',
  },
  fermentado: {
    color: '#6E2E4A', // vino
    icono: 'bi-hourglass-split',
    texto: 'La cereza reposa en tanques controlados antes del secado.',
    enTaza: 'Notas frutales e intensas',
  },
};

const PROCESO_NEUTRO: MarcaProceso = { color: '#13281F', icono: 'bi-circle', texto: '', enTaza: '' };

export function marcaProceso(nombre: string | null | undefined): MarcaProceso {
  return (nombre && PROCESOS[normalizarTexto(nombre)]) || PROCESO_NEUTRO;
}

/** Departamento del mapa para el origen de un café ("Nariño", "Huila, Colombia"...). */
export function departamentoDeOrigen(origen: string): Departamento | undefined {
  const clave = normalizarTexto(origen.split(',')[0]);
  return DEPARTAMENTOS.find((d) => d.clave === clave);
}

/** Fotografías del sitio (Unsplash License), subidas a Cloudinary en la carpeta "sitio". */
export interface FotoSitio {
  readonly publicId: string;
  readonly alt: string;
  readonly autor: string;
  /** Relación ancho / alto del original. */
  readonly proporcion: number;
}

export const FOTOS_SITIO = {
  hero: {
    publicId: 'sitio/hero',
    alt: 'Mano abierta con cerezas de café maduras sobre un canasto lleno de granos rojos y amarillos',
    autor: 'George Dagerotip',
    proporcion: 2 / 3,
  },
  origen: {
    publicId: 'sitio/origen',
    alt: 'Ladera cubierta de cafetales y bosque con niebla, y un caminante en el sendero',
    autor: 'Phạm Trọng Họ',
    proporcion: 2 / 3,
  },
  cosecha: {
    publicId: 'sitio/cosecha',
    alt: 'Manos recogiendo cerezas de café maduras de la rama hacia un canasto',
    autor: 'Gerson Cifuentes',
    proporcion: 2 / 3,
  },
  tueste: {
    publicId: 'sitio/tueste',
    alt: 'Granos recién tostados girando en la bandeja de enfriamiento de un tostador',
    autor: 'Tim Mossholder',
    proporcion: 3 / 2,
  },
  taza: {
    publicId: 'sitio/taza',
    alt: 'Café filtrado cayendo desde el cono a la jarra de vidrio',
    autor: 'Beau Carpenter',
    proporcion: 2 / 3,
  },
  acceso: {
    publicId: 'sitio/acceso',
    alt: 'Granos de café tostado de cerca sobre una superficie oscura',
    autor: 'Łukasz Rawa',
    proporcion: 2 / 3,
  },
} as const satisfies Record<string, FotoSitio>;

export interface PasoProceso {
  readonly titulo: string;
  readonly texto: string;
  readonly foto: FotoSitio;
}

/** "De la montaña a tu taza": el orden es el del proceso real. */
export const PASOS_PROCESO: readonly PasoProceso[] = [
  {
    titulo: 'Origen',
    texto: 'Fincas de ladera entre la niebla y el sol. La altura hace que el grano madure despacio y gane dulzura.',
    foto: FOTOS_SITIO.origen,
  },
  {
    titulo: 'Cosecha',
    texto: 'Se recoge a mano, cereza por cereza, solo cuando está madura. Por eso cada pasada por el cafetal es distinta.',
    foto: FOTOS_SITIO.cosecha,
  },
  {
    titulo: 'Tueste',
    texto: 'Tostamos en tandas pequeñas y enfriamos rápido para que cada origen conserve su carácter.',
    foto: FOTOS_SITIO.tueste,
  },
  {
    titulo: 'Taza',
    texto: 'El último paso es tuyo: muele justo antes de preparar y deja que el agua haga el resto.',
    foto: FOTOS_SITIO.taza,
  },
];

/**
 * Etapas del ascenso del Inicio: cada sección es un punto más alto de la montaña y el
 * altímetro muestra estos metros. Son narrativos: el café colombiano se cultiva más o menos
 * entre 1.200 y 2.100 m sobre el nivel del mar, y el recorrido va de un extremo al otro.
 */
export const ETAPAS_ASCENSO = {
  valle: { nombre: 'Valle', altitud: 1200 },
  ladera: { nombre: 'Ladera', altitud: 1450 },
  finca: { nombre: 'Finca', altitud: 1700 },
  cordillera: { nombre: 'Cordillera', altitud: 1900 },
  cafetal: { nombre: 'Cafetal', altitud: 2000 },
  cumbre: { nombre: 'Cumbre', altitud: 2100 },
} as const;
