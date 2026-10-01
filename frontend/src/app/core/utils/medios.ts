import { EMPTY, fromEvent, map, Observable } from 'rxjs';

/** matchMedia seguro: en entornos sin él (pruebas con jsdom, servidor) devuelve false. */
export function coincideMedia(consulta: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(consulta).matches
    : false;
}

/** Cambios de una media query como observable (vacío si no hay matchMedia). */
export function cambiosDeMedia(consulta: string): Observable<boolean> {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return EMPTY;
  }
  return fromEvent<MediaQueryListEvent>(window.matchMedia(consulta), 'change').pipe(map((e) => e.matches));
}

/** true si el usuario pidió movimiento reducido. */
export function movimientoReducido(): boolean {
  return coincideMedia('(prefers-reduced-motion: reduce)');
}
