import { Component, computed, input } from '@angular/core';
import { EstadoPedido } from '../../core/models/pedido';

/** Ícono de cada estado: así no se distinguen solo por el color (WCAG 1.4.1). */
const ICONOS: Record<EstadoPedido, string> = {
  Pendiente: 'bi-hourglass-split',
  Pagado: 'bi-check-circle',
  Rechazado: 'bi-x-circle',
};

/**
 * Etiqueta del estado de un pedido: píldora con ícono, texto en su color y fondo tenue.
 * Pendiente en miel, Pagado en musgo y Rechazado en el rojo de error (todos AA como texto).
 */
@Component({
  selector: 'app-estado-pedido',
  template: `<i class="bi" [class]="icono()" aria-hidden="true"></i>{{ estado() }}`,
  host: { '[attr.data-estado]': 'estado()', 'data-testid': 'estado-pedido' },
  styles: `
    :host {
      --color: var(--estado-pendiente);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.15rem 0.65rem;
      border: 1px solid color-mix(in srgb, var(--color) 45%, transparent);
      border-radius: var(--radio-pildora);
      /* Fondo opaco (papel teñido): con un tinte transparente, sobre la niebla de la página
         "Pendiente" bajaba a 4,4:1. Así queda en 5,1:1 o más en cualquier fondo de la tienda. */
      background: color-mix(in srgb, var(--color) 8%, var(--papel));
      color: var(--color);
      font-size: var(--fs-200);
      font-weight: 650;
      white-space: nowrap;
    }
    :host([data-estado='Pagado']) {
      --color: var(--estado-pagado);
    }
    :host([data-estado='Rechazado']) {
      --color: var(--estado-rechazado);
    }
  `,
})
export class EstadoPedidoEtiqueta {
  readonly estado = input.required<EstadoPedido>();
  protected readonly icono = computed(() => `bi ${ICONOS[this.estado()] ?? 'bi-circle'}`);
}
