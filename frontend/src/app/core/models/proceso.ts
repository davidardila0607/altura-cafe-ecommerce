/**
 * Proceso de beneficio del café (GET /api/procesos).
 * Coincide con `ProcesoResponseDto` del backend.
 */
export interface Proceso {
  id: number;
  nombre: string;
  descripcion: string | null;
}
