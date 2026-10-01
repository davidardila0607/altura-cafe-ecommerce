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

/**
 * true en un navegador real. En las pruebas unitarias (jsdom) no hay matchMedia y GSAP
 * fallaría al iniciar: ahí las animaciones de scroll simplemente no se crean.
 */
export function navegadorCompleto(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/** true si el usuario pidió movimiento reducido. */
export function movimientoReducido(): boolean {
  return coincideMedia('(prefers-reduced-motion: reduce)');
}

/**
 * true si hay un mouse o trackpad (puntero fino que puede "pasar por encima").
 * En pantallas táctiles es false: ahí no existen la inclinación ni el efecto magnético.
 */
export function punteroFino(): boolean {
  return coincideMedia('(hover: hover) and (pointer: fine)') && !movimientoReducido();
}
