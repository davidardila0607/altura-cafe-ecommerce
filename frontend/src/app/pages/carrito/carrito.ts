import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListaCarrito } from '../../shared/carrito/lista-carrito';

/** Página /carrito (solo con sesión: guard requiereSesion). Muestra la misma lista que el panel. */
@Component({
  selector: 'app-pagina-carrito',
  imports: [ListaCarrito, RouterLink],
  template: `
    <section class="contenedor pagina" aria-labelledby="carrito-titulo">
      <a class="enlace-texto" routerLink="/productos">
        <i class="bi bi-arrow-left" aria-hidden="true"></i>
        Seguir comprando
      </a>
      <h1 id="carrito-titulo" class="titulo-seccion">Tu carrito</h1>
      <app-lista-carrito class="lista" />
    </section>
  `,
  styles: `
    .pagina {
      max-width: 60rem;
      padding-block: calc(4.5rem + var(--esp-6)) var(--esp-9);
    }
    h1 {
      margin-block: var(--esp-3) var(--esp-5);
    }
    .lista {
      padding: var(--esp-2) var(--esp-6) var(--esp-6);
      border-radius: 24px;
      background: var(--papel);
      box-shadow: var(--sombra-1);
    }
    @media (max-width: 575.98px) {
      .lista {
        padding-inline: var(--esp-4);
      }
    }
  `,
})
export class PaginaCarrito {}
