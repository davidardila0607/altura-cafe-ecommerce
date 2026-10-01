/**
 * Presentación disponible (GET /api/presentaciones).
 * Coincide con `PresentacionResponseDto` del backend.
 */
export interface Presentacion {
  /** Gramos: 340 o 500. */
  value: number;
  /** Texto visible, por ejemplo "340 g". */
  label: string;
}
