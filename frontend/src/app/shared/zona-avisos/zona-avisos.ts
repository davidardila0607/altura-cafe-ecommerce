import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avisos } from '../../core/services/avisos';

/**
 * Avisos breves de la tienda (abajo a la derecha): "Agregado al carrito · Ver carrito"
 * o el mensaje de error de la API. aria-live hace que los lectores de pantalla los anuncien.
 */
@Component({
  selector: 'app-zona-avisos',
  imports: [RouterLink],
  template: `
    <div class="avisos" aria-live="polite">
      @for (aviso of avisos.lista(); track aviso.id) {
        <p class="aviso" [class.error]="aviso.tipo === 'error'" data-testid="aviso">
          <i class="bi" [class.bi-bag-check]="aviso.tipo === 'exito'" [class.bi-exclamation-triangle]="aviso.tipo === 'error'" aria-hidden="true"></i>
          <span class="texto">{{ aviso.texto }}</span>
          @if (aviso.enlace; as enlace) {
            <a [routerLink]="enlace.ruta" (click)="avisos.quitar(aviso.id)">{{ enlace.texto }}</a>
          }
          <button type="button" class="cerrar" aria-label="Cerrar aviso" (click)="avisos.quitar(aviso.id)">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </p>
      }
    </div>
  `,
  styles: `
    .avisos {
      position: fixed;
      right: var(--esp-4);
      bottom: var(--esp-4);
      z-index: calc(var(--z-nav) + 2);
      display: grid;
      gap: var(--esp-2);
      width: min(26rem, calc(100vw - 2rem));
    }
    .aviso {
      display: flex;
      align-items: center;
      gap: var(--esp-3);
      padding: 0.4rem 0.4rem 0.4rem 1rem;
      border-radius: var(--radio-campo);
      background: var(--bosque);
      color: var(--texto-claro);
      box-shadow: var(--sombra-2);
      font-weight: 600;
      transition:
        opacity 200ms ease,
        translate 260ms var(--ease-salida);

      @starting-style {
        opacity: 0;
        translate: 0 8px;
      }
    }
    .aviso.error {
      background: var(--error);
    }
    .texto {
      flex: 1;
    }
    a {
      color: inherit;
      font-weight: 700;
      text-underline-offset: 0.2em;
      white-space: nowrap;
    }
    a:focus-visible,
    .cerrar:focus-visible {
      outline: 2px solid var(--texto-claro);
      outline-offset: 2px;
    }
    .cerrar {
      display: grid;
      flex: none;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: var(--radio-pildora);
      background: transparent;
      color: inherit;
    }
    .cerrar:hover {
      background: rgb(255 255 255 / 0.14);
    }
    @media (prefers-reduced-motion: reduce) {
      .aviso {
        @starting-style {
          translate: none;
        }
      }
    }
  `,
})
export class ZonaAvisos {
  protected readonly avisos = inject(Avisos);
}
