import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { movimientoReducido } from '../../core/utils/medios';

/**
 * Revela un bloque cuando entra en la pantalla (una sola vez).
 * El contenido es visible por defecto: solo se marca como "pendiente" si el navegador
 * soporta IntersectionObserver y el usuario no pidió movimiento reducido.
 * El estilo vive en CSS: [data-revelar='pendiente'] / [data-revelar='visible'].
 */
@Directive({
  selector: '[appRevelar]',
})
export class Revelar {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (movimientoReducido() || !('IntersectionObserver' in window)) {
        return;
      }

      this.elemento.dataset['revelar'] = 'pendiente';

      const observador = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting)) {
            this.elemento.dataset['revelar'] = 'visible';
            observador.disconnect();
          }
        },
        { rootMargin: '0px 0px -12% 0px' },
      );

      observador.observe(this.elemento);
      destroyRef.onDestroy(() => observador.disconnect());
    });
  }
}
