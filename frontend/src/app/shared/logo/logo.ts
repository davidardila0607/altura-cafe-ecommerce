import { Component, input } from '@angular/core';

/**
 * Logotipo de Altura: la línea de la montaña con la cereza en la cumbre + el nombre.
 * Decorativo; el texto accesible lo pone el enlace que lo contiene.
 */
@Component({
  selector: 'app-logo',
  template: `
    <svg class="marca" viewBox="0 0 46 30" aria-hidden="true" focusable="false">
      <path d="M2 28 L14 11 L21 20 L30 6 L44 28" class="trazo" />
      <circle cx="30" cy="2.6" r="2.6" class="cereza" />
    </svg>
    <span class="nombre">Altura</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--bosque);
    }
    :host(.claro) {
      color: var(--texto-claro);
    }
    .marca {
      width: 2.1em;
      height: auto;
      overflow: visible;
    }
    .trazo {
      fill: none;
      stroke: currentColor;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .cereza {
      fill: var(--cereza);
    }
    .nombre {
      font-weight: 800;
      font-stretch: 80%;
      font-size: 1.55em;
      letter-spacing: -0.035em;
      line-height: 1;
    }
  `,
  host: {
    '[class.claro]': "tono() === 'claro'",
  },
})
export class Logo {
  /** 'oscuro' = tinta bosque (sobre fondos claros); 'claro' = niebla (sobre fondos oscuros). */
  readonly tono = input<'oscuro' | 'claro'>('oscuro');
}
