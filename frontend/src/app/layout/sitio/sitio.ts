import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../shared/footer/footer';
import { Navbar } from '../../shared/navbar/navbar';
import { ZonaAvisos } from '../../shared/zona-avisos/zona-avisos';

/**
 * Marco común de Inicio, Productos y Carrito: navbar fijo, contenido, footer y avisos
 * ("Agregado al carrito").
 * Un "sensor" invisible al principio de la página avisa si el usuario ya bajó: entonces el
 * navbar pasa de transparente a sólido. Se usa IntersectionObserver (no un listener de scroll),
 * así el navegador solo avisa cuando el sensor entra o sale de la pantalla.
 */
@Component({
  selector: 'app-sitio',
  imports: [RouterOutlet, Navbar, Footer, ZonaAvisos],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <span #sensor class="sensor" aria-hidden="true"></span>
    <app-navbar [solido]="!arriba()" />
    <main id="contenido" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-zona-avisos />
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
    .sensor {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 24px;
    }
    .saltar {
      position: absolute;
      left: var(--esp-4);
      top: -4rem;
      z-index: calc(var(--z-nav) + 1);
      padding: 0.6rem 1rem;
      border-radius: var(--radio-pildora);
      background: var(--bosque);
      color: var(--texto-claro);
      font-weight: 650;
      text-decoration: none;
    }
    .saltar:focus {
      top: var(--esp-3);
    }
  `,
})
export class Sitio {
  /** true mientras se ve el principio de la página. */
  protected readonly arriba = signal(true);
  private readonly sensor = viewChild.required<ElementRef<HTMLElement>>('sensor');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!('IntersectionObserver' in window)) {
        return;
      }
      const observador = new IntersectionObserver(([entrada]) => this.arriba.set(entrada.isIntersecting));
      observador.observe(this.sensor().nativeElement);
      destroyRef.onDestroy(() => observador.disconnect());
    });
  }
}
