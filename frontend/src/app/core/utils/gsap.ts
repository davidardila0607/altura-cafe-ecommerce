/*
 * GSAP + ScrollTrigger cargados bajo demanda.
 *
 * Con `import()` el bundler pone GSAP en un archivo aparte que solo se descarga cuando
 * una vista lo pide (el Inicio). Así no pesa en la carga inicial ni en Productos o Login.
 *
 * ScrollTrigger conecta una animación con la posición del scroll:
 *   - `scrub: true`  → la animación avanza y retrocede exactamente con el scroll.
 *   - `start`/`end`  → "top bottom" significa "cuando el borde superior del elemento toca
 *                       el borde inferior de la pantalla".
 */
import type { gsap as Gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerTipo } from 'gsap/ScrollTrigger';

export interface Gsaps {
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerTipo;
}

let cargado: Promise<Gsaps> | null = null;

export function cargarGsap(): Promise<Gsaps> {
  // Se carga una sola vez; las demás llamadas reciben la misma promesa.
  cargado ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });
  return cargado;
}

/**
 * Recalcula las posiciones de todos los ScrollTrigger. Hace falta cuando cambia la altura de
 * la página después de crearlos (por ejemplo, cuando llegan los cafés de la API).
 */
export function refrescarScroll(): void {
  void cargado?.then(({ ScrollTrigger }) => ScrollTrigger.refresh());
}
