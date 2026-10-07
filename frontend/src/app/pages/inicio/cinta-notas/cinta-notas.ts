import { Component, computed, input } from '@angular/core';
import { marcaVariedad } from '../../../core/data/contenido-marca';
import { Cafe } from '../../../core/models/cafe';

/**
 * Cinta que corre sin fin con los orígenes y las notas de cata de los cafés que hay en la API.
 * Es el único marquee de la página. Decorativa (aria-hidden): repite información que ya está
 * en Orígenes y en Variedades. El truco del bucle: el texto va dos veces seguidas y la
 * animación lo corre exactamente la mitad (-50 %), así el final empalma con el principio.
 */
@Component({
  selector: 'app-cinta-notas',
  template: `
    @if (palabras().length) {
      <div class="cinta" aria-hidden="true">
        <div class="pista">
          @for (vuelta of [1, 2]; track vuelta) {
            @for (palabra of palabras(); track $index) {
              <span class="palabra">{{ palabra }}</span>
              <svg class="separador" viewBox="0 0 20 14" focusable="false"><path d="M1 13 L7 4 L11 9 L15 2 L19 13" /></svg>
            }
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .cinta {
      overflow: hidden;
      padding-block: var(--esp-5);
      background: var(--bosque);
      color: var(--texto-claro);
    }
    .pista {
      display: flex;
      align-items: center;
      width: max-content;
      animation: correr 60s linear infinite;
    }
    .cinta:hover .pista {
      animation-play-state: paused;
    }
    /* Margen a la derecha (no gap) para que las dos vueltas midan exactamente lo mismo. */
    .palabra,
    .separador {
      margin-right: var(--esp-5);
    }
    .palabra {
      font-size: var(--fs-700);
      font-weight: 800;
      font-stretch: 75%;
      letter-spacing: -0.04em;
      line-height: 1;
      white-space: nowrap;
    }
    .separador {
      width: 1.6rem;
      fill: none;
      stroke: var(--cereza);
      stroke-width: 2;
      stroke-linejoin: round;
    }
    @keyframes correr {
      to {
        transform: translateX(-50%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .pista {
        animation: none;
      }
    }
  `,
})
export class CintaNotas {
  readonly cafes = input<Cafe[]>([]);

  /** Orígenes y notas de las variedades presentes, sin repetir. */
  protected readonly palabras = computed(() => {
    const unicas = new Set<string>();
    for (const cafe of this.cafes()) {
      unicas.add(cafe.origen.split(',')[0].trim());
      marcaVariedad(cafe.variedadNombre).notas.forEach((nota) => unicas.add(nota));
    }
    return [...unicas];
  });
}
