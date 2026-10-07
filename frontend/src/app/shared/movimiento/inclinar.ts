import { Directive, ElementRef, inject, input } from '@angular/core';
import { punteroFino } from '../../core/utils/medios';

/**
 * Inclina un elemento en 3D hacia el mouse y mueve un brillo con él (cards de café).
 * Solo con mouse o trackpad: en pantallas táctiles y con movimiento reducido no hace nada.
 *
 * Cómo funciona: la posición del puntero dentro del elemento (de 0 a 1 en cada eje) se
 * convierte en un giro de pocos grados. El CSS del componente pone la transición, que suaviza
 * el movimiento, y usa --luz-x / --luz-y para dibujar el brillo.
 */
@Directive({
  selector: '[appInclinar]',
  host: {
    '(pointermove)': 'mover($event)',
    '(pointerleave)': 'soltar()',
  },
})
export class Inclinar {
  /** Grados máximos de giro. */
  readonly appInclinar = input(6, { transform: (v: number | '') => (v === '' ? 6 : v) });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected mover(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse' || !punteroFino()) {
      return;
    }
    const caja = this.el.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width; // 0 (izquierda) a 1 (derecha)
    const y = (evento.clientY - caja.top) / caja.height; // 0 (arriba) a 1 (abajo)
    const grados = this.appInclinar();

    this.el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * grados}deg) rotateY(${(x - 0.5) * grados}deg)`;
    this.el.style.setProperty('--luz-x', `${x * 100}%`);
    this.el.style.setProperty('--luz-y', `${y * 100}%`);
    this.el.dataset['inclinado'] = '';
  }

  protected soltar(): void {
    this.el.style.transform = '';
    delete this.el.dataset['inclinado'];
  }
}
