import { Directive, ElementRef, inject } from '@angular/core';
import { punteroFino } from '../../core/utils/medios';

/** Distancia máxima (px) que el botón se acerca al cursor. */
const ATRACCION_MAXIMA = 10;

/**
 * Botón "magnético": mientras el mouse está encima, el botón se corre unos píxeles hacia él
 * y al salir vuelve a su lugar con una transición. Solo en los botones principales del Inicio.
 * Sin efecto en pantallas táctiles ni con movimiento reducido.
 */
@Directive({
  selector: '[appMagnetico]',
  host: {
    class: 'magnetico',
    '(pointermove)': 'mover($event)',
    '(pointerleave)': 'soltar()',
  },
})
export class Magnetico {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected mover(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse' || !punteroFino()) {
      return;
    }
    const caja = this.el.getBoundingClientRect();
    // Distancia del cursor al centro, de -1 a 1 en cada eje.
    const dx = (evento.clientX - (caja.left + caja.width / 2)) / (caja.width / 2);
    const dy = (evento.clientY - (caja.top + caja.height / 2)) / (caja.height / 2);
    this.el.style.translate = `${dx * ATRACCION_MAXIMA}px ${dy * ATRACCION_MAXIMA * 0.6}px`;
  }

  protected soltar(): void {
    this.el.style.translate = '';
  }
}
