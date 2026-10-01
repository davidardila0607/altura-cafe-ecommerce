import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../shared/footer/footer';
import { Navbar } from '../../shared/navbar/navbar';

/** Marco común de Inicio y Productos: navbar, contenido y footer. */
@Component({
  selector: 'app-sitio',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <app-navbar />
    <main id="contenido" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }
    main {
      flex: 1;
      outline: none;
    }
    .saltar {
      position: absolute;
      left: var(--esp-4);
      top: -4rem;
      z-index: calc(var(--z-nav) + 1);
      padding: 0.6rem 1rem;
      border-radius: var(--radio-control);
      background: var(--alt-espresso);
      color: var(--alt-crema);
      font-weight: 600;
      text-decoration: none;
    }
    .saltar:focus {
      top: var(--esp-3);
    }
  `,
})
export class Sitio {}
