/**
 * Café del catálogo.
 * Coincide exactamente con `CafeResponseDto` del backend (JSON en camelCase).
 */
export interface Cafe {
  id: number;
  nombre: string;
  variedadId: number;
  variedadNombre: string;
  /** 340 o 500. */
  presentacionGramos: number;
  origen: string;
  stock: number;
  /** Pesos colombianos, sin decimales. */
  precio: number;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  disponible: boolean;
  /** "Agotado" | "Pocas unidades" | "Disponible" | "Alta disponibilidad". */
  estadoStock: string;
}

/** Datos para crear o actualizar un café (`CreateCafeDto` / `UpdateCafeDto`). */
export interface CafeGuardar {
  nombre: string;
  variedadId: number;
  presentacionGramos: number;
  origen: string;
  stock: number;
  precio: number;
  imagenUrl: string | null;
  imagenPublicId: string | null;
}
