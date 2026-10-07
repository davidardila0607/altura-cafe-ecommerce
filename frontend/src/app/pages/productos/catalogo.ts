import { ParamMap, Params } from '@angular/router';
import { Cafe } from '../../core/models/cafe';
import { normalizarTexto } from '../../core/utils/texto';

/** Órdenes disponibles en el catálogo (valor de ?orden=). */
export const ORDENES = [
  { valor: 'destacados', etiqueta: 'Destacados' },
  { valor: 'precio-asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio-desc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'nombre', etiqueta: 'Nombre' },
] as const;

export type Orden = (typeof ORDENES)[number]['valor'];

/** Estado del catálogo. Vive en la URL: ?q=&variedad=&proceso=&presentacion=&origen=&disponibles=1&orden= */
export interface Filtros {
  readonly q: string;
  /** Nombre normalizado de la variedad ("bourbon rosado"). */
  readonly variedad: string | null;
  /** Nombre normalizado del proceso ("honey"). */
  readonly proceso: string | null;
  /** Gramos (340, 500). */
  readonly presentacion: number | null;
  /** Origen normalizado ("narino"). */
  readonly origen: string | null;
  readonly disponibles: boolean;
  readonly orden: Orden;
}

export const FILTROS_VACIOS: Filtros = {
  q: '',
  variedad: null,
  proceso: null,
  presentacion: null,
  origen: null,
  disponibles: false,
  orden: 'destacados',
};

export function filtrosDesdeUrl(params: ParamMap): Filtros {
  const presentacion = Number(params.get('presentacion'));
  const orden = params.get('orden');
  return {
    q: params.get('q')?.trim() ?? '',
    variedad: params.get('variedad') ? normalizarTexto(params.get('variedad')!) : null,
    proceso: params.get('proceso') ? normalizarTexto(params.get('proceso')!) : null,
    presentacion: Number.isFinite(presentacion) && presentacion > 0 ? presentacion : null,
    origen: params.get('origen') ? normalizarTexto(params.get('origen')!) : null,
    disponibles: params.get('disponibles') === '1',
    orden: ORDENES.some((o) => o.valor === orden) ? (orden as Orden) : 'destacados',
  };
}

/** Solo se escriben en la URL los valores distintos del predeterminado. */
export function filtrosAUrl(f: Filtros): Params {
  return {
    q: f.q || null,
    variedad: f.variedad,
    proceso: f.proceso,
    presentacion: f.presentacion,
    origen: f.origen,
    disponibles: f.disponibles ? 1 : null,
    orden: f.orden === 'destacados' ? null : f.orden,
  };
}

export function mismosFiltros(a: Filtros, b: Filtros): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Filtros del panel que están activos (sin contar la búsqueda ni el orden). */
export function contarFiltrosActivos(f: Filtros): number {
  return [f.variedad, f.proceso, f.presentacion, f.origen].filter((v) => v !== null).length + (f.disponibles ? 1 : 0);
}

/** Clave de origen de un café ("Nariño" → "narino"; "Huila, Colombia" → "huila"). */
export function claveOrigen(cafe: Cafe): string {
  return normalizarTexto(cafe.origen.split(',')[0]);
}

/** Destacados: primero los que tienen stock, por precio descendente; luego los agotados. */
export function compararDestacados(a: Cafe, b: Cafe): number {
  const stockA = a.stock > 0 ? 0 : 1;
  const stockB = b.stock > 0 ? 0 : 1;
  return stockA - stockB || b.precio - a.precio || a.nombre.localeCompare(b.nombre, 'es');
}

const COMPARADORES: Record<Orden, (a: Cafe, b: Cafe) => number> = {
  destacados: compararDestacados,
  'precio-asc': (a, b) => a.precio - b.precio || a.nombre.localeCompare(b.nombre, 'es'),
  'precio-desc': (a, b) => b.precio - a.precio || a.nombre.localeCompare(b.nombre, 'es'),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.presentacionGramos - b.presentacionGramos,
};

/** Aplica búsqueda (nombre, origen, variedad o proceso; sin tildes ni mayúsculas), filtros y orden. */
export function aplicarFiltros(cafes: readonly Cafe[], f: Filtros): Cafe[] {
  const texto = normalizarTexto(f.q);

  return cafes
    .filter((c) => !f.variedad || normalizarTexto(c.variedadNombre) === f.variedad)
    .filter((c) => !f.proceso || normalizarTexto(c.procesoNombre) === f.proceso)
    .filter((c) => !f.presentacion || c.presentacionGramos === f.presentacion)
    .filter((c) => !f.origen || claveOrigen(c) === f.origen)
    .filter((c) => !f.disponibles || c.stock > 0)
    .filter((c) => !texto || [c.nombre, c.origen, c.variedadNombre, c.procesoNombre].some((campo) => normalizarTexto(campo).includes(texto)))
    .sort(COMPARADORES[f.orden]);
}

/** Orígenes presentes en los datos, para las opciones del filtro. */
export function opcionesDeOrigen(cafes: readonly Cafe[]): { clave: string; nombre: string }[] {
  const mapa = new Map<string, string>();
  for (const c of cafes) {
    mapa.set(claveOrigen(c), c.origen.split(',')[0].trim());
  }
  return [...mapa].map(([clave, nombre]) => ({ clave, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Cuántos cafés hay por variedad o por proceso, con la clave normalizada
 * ({ "caturra": 6, "honey": 8, ... }). Lo usan los chips de los filtros.
 */
export function contarPor(cafes: readonly Cafe[], campo: 'variedadNombre' | 'procesoNombre'): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const cafe of cafes) {
    const clave = normalizarTexto(cafe[campo]);
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
}
