import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';

/**
 * Fondo vivo de Login y Registro: el amanecer sobre la montaña con bancos de niebla que
 * pasan despacio entre las crestas. Todo es CSS: la niebla se mueve con transform (barato
 * para el navegador) y con movimiento reducido queda quieta.
 */
@Component({
  selector: 'app-paisaje-acceso',
  imports: [RouterLink, Logo],
  template: `
    <div class="paisaje" aria-hidden="true">
      <span class="sol"></span>
      <img class="capa capa-1" src="paisaje/cresta-1.svg" alt="" width="1440" height="600" />
      <span class="niebla niebla-1"></span>
      <img class="capa capa-2" src="paisaje/cresta-2.svg" alt="" width="1440" height="600" />
      <span class="niebla niebla-2"></span>
      <img class="capa capa-3" src="paisaje/cresta-3.svg" alt="" width="1440" height="600" />
      <img class="capa capa-4" src="paisaje/cresta-4.svg" alt="" width="1440" height="600" />
    </div>

    <header>
      <a routerLink="/" class="enlace-logo" aria-label="Altura, ir al inicio">
        <app-logo />
      </a>
      <p class="frase">{{ frase() }}</p>
    </header>
  `,
  styleUrl: './paisaje-acceso.css',
})
export class PaisajeAcceso {
  readonly frase = input.required<string>();
}
