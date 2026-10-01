import { Component, input } from '@angular/core';

/** Logotipo de Altura: marca de montaña + nombre. Decorativo; el texto accesible lo pone el enlace que lo contiene. */
@Component({
  selector: 'app-logo',
  template: `
    <svg class="marca" viewBox="0 0 44 28" aria-hidden="true" focusable="false">
      <path d="M2 25 L13 8 L20 18 L28 3 L42 25" class="trazo" />
      <path d="M17 14 L20 18 L23.5 12.5" class="acento" />
    </svg>
    <span class="nombre">Altura</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      color: var(--alt-espresso);
    }
    :host(.claro) {
      color: var(--alt-crema);
    }
    .marca {
      width: 2.1em;
      height: auto;
      overflow: visible;
    }
    .trazo,
    .acento {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .trazo {
      stroke: currentColor;
      stroke-width: 2.6;
    }
    .acento {
      stroke: var(--alt-terracota);
      stroke-width: 2.2;
    }
    .nombre {
      font-family: var(--alt-fuente-titulos);
      font-weight: 600;
      font-size: 1.45em;
      letter-spacing: 0.02em;
      line-height: 1;
    }
  `,
  host: {
    '[class.claro]': "tono() === 'claro'",
  },
})
export class Logo {
  /** 'oscuro' = tinta espresso (sobre fondos claros); 'claro' = crema (sobre fondos oscuros). */
  readonly tono = input<'oscuro' | 'claro'>('oscuro');
}
