/**
 * Variedad de café.
 * Coincide exactamente con `VariedadResponseDto` del backend (JSON en camelCase).
 */
export interface Variedad {
  id: number;
  nombre: string;
  descripcion: string | null;
}
