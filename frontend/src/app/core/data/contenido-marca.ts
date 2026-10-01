import { normalizarTexto } from '../utils/texto';
import { DEPARTAMENTOS, Departamento } from './mapa-colombia';

/*
 * Contenido de marca de Altura que vive en el frontend.
 * Los PRODUCTOS y las VARIEDADES siempre vienen de la API; aquí solo está el texto editorial
 * y el color asociados a cada variedad por su nombre normalizado, más las fotos del sitio.
 * Si la API devuelve una variedad que no está aquí, se usa su descripción y un color neutro.
 */

export interface MarcaVariedad {
  /** Color de la variedad: texto sobre niebla/papel y fondo con texto blanco (AA en los dos casos). */
  readonly color: string;
  readonly texto: string;
  /** Notas de cata (también alimentan la cinta de notas del Inicio). */
  readonly notas: readonly string[];
}

const VARIEDADES: Readonly<Record<string, MarcaVariedad>> = {
  castillo: {
    color: '#8A5A2B',
    notas: ['Panela', 'Chocolate', 'Acidez amable'],
    texto:
      'Variedad colombiana creada para resistir la roya sin perder dulzura. En taza se siente a panela, chocolate y una acidez amable.',
  },
  geisha: {
    color: '#2D6A5E',
    notas: ['Jazmín', 'Bergamota', 'Fruta de hueso'],
    texto:
      'Llegó de Etiopía y se volvió leyenda por su perfil floral. Delicada y aromática, con notas de jazmín, bergamota y fruta de hueso.',
  },
  moka: {
    color: '#6E3150',
    notas: ['Cacao', 'Especias', 'Cuerpo denso'],
    texto:
      'Grano pequeño y redondo, de carácter intenso. Cuerpo denso, notas de cacao y especias y un final que se queda.',
  },
};

const VARIEDAD_NEUTRA: MarcaVariedad = { color: '#13281F', texto: '', notas: [] };

export function marcaVariedad(nombre: string | null | undefined): MarcaVariedad {
  return (nombre && VARIEDADES[normalizarTexto(nombre)]) || VARIEDAD_NEUTRA;
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
