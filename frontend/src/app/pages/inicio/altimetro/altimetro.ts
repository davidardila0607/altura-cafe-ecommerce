import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { ETAPAS_ASCENSO } from '../../../core/data/contenido-marca';
import { navegadorCompleto } from '../../../core/utils/medios';
import { cargarGsap } from '../../../core/utils/gsap';

type ClaveEtapa = keyof typeof ETAPAS_ASCENSO;

const ALTITUD_MINIMA = ETAPAS_ASCENSO.valle.altitud;
const ALTITUD_MAXIMA = ETAPAS_ASCENSO.cumbre.altitud;

/**
 * Altímetro del Inicio: marca a cuántos metros sobre el nivel del mar va el recorrido.
 *
 * Cómo funciona, paso a paso:
 * 1. Cada sección del Inicio tiene un atributo data-etapa="ladera", "finca"… (ver inicio.ts).
 * 2. Por cada sección se crea un ScrollTrigger que está "activo" mientras la sección cruza
 *    la mitad de la pantalla (start: 'top center', end: 'bottom center').
 * 3. Mientras está activo, su progreso va de 0 a 1. La altitud que se muestra es la de esa
 *    etapa más una parte de la diferencia con la siguiente:
 *        altitud = actual + (siguiente − actual) × progreso
 *    Así el número sube poco a poco con el scroll en lugar de saltar.
 * 4. El número y la marca de la regla se escriben directamente en el DOM (textContent y
 *    transform), sin pasar por Angular, porque cambian en cada fotograma del scroll.
 *
 * Es decorativo (aria-hidden): cada sección ya tiene su propio título. No es movimiento,
 * así que también funciona con movimiento reducido.
 */
@Component({
  selector: 'app-altimetro',
  template: `
    <div class="altimetro" aria-hidden="true">
      <span class="valor"><span #numero class="numero">1.200</span> <small>msnm</small></span>
      <span class="regla"><span #marca class="marca"></span></span>
      <span #etapa class="etapa">Valle</span>
    </div>
  `,
  styleUrl: './altimetro.css',
})
export class Altimetro {
  private readonly numero = viewChild.required<ElementRef<HTMLElement>>('numero');
  private readonly marca = viewChild.required<ElementRef<HTMLElement>>('marca');
  private readonly etapa = viewChild.required<ElementRef<HTMLElement>>('etapa');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(async () => {
      if (!navegadorCompleto()) {
        return;
      }
      const { ScrollTrigger } = await cargarGsap();
      const secciones = [...document.querySelectorAll<HTMLElement>('[data-etapa]')];

      const disparadores = secciones.map((seccion, i) => {
        const actual = ETAPAS_ASCENSO[seccion.dataset['etapa'] as ClaveEtapa];
        const siguiente = ETAPAS_ASCENSO[secciones[i + 1]?.dataset['etapa'] as ClaveEtapa] ?? actual;
        const mostrar = (progreso: number) =>
          this.mostrar(actual.altitud + (siguiente.altitud - actual.altitud) * progreso, actual.nombre);

        return ScrollTrigger.create({
          trigger: seccion,
          start: i === 0 ? 'top top' : 'top center',
          end: 'bottom center',
          onUpdate: (st) => mostrar(st.progress),
          onToggle: (st) => st.isActive && mostrar(st.progress),
        });
      });

      destroyRef.onDestroy(() => disparadores.forEach((d) => d.kill()));
    });
  }

  private mostrar(altitud: number, nombreEtapa: string): void {
    // Redondeo a decenas: el número cambia con calma, no en cada píxel.
    const redondeada = Math.round(altitud / 10) * 10;
    this.numero().nativeElement.textContent = redondeada.toLocaleString('es-CO');
    this.etapa().nativeElement.textContent = nombreEtapa;

    // 0 = valle (abajo de la regla), 1 = cumbre (arriba).
    const fraccion = (altitud - ALTITUD_MINIMA) / (ALTITUD_MAXIMA - ALTITUD_MINIMA);
    this.marca().nativeElement.style.transform = `translateY(calc(${-fraccion} * var(--alto-regla)))`;
  }
}
