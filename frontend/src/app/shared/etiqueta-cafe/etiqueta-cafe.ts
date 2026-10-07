import { Component, computed, input } from '@angular/core';
import { marcaProceso, marcaVariedad } from '../../core/data/contenido-marca';

/**
 * Etiqueta de un café: su variedad (muestra de color + nombre) o su proceso
 * (píldora con ícono y el color del proceso). Se usa en las cards y en la vista rápida.
 */
@Component({
  selector: 'app-etiqueta-cafe',
  template: `
    @if (tipo() === 'proceso') {
      <i [class]="'bi ' + icono()" aria-hidden="true"></i>
    } @else {
      <span class="muestra" aria-hidden="true"></span>
    }
    <span class="visually-hidden">{{ tipo() === 'proceso' ? 'Proceso:' : 'Variedad:' }}</span>
    {{ nombre() }}
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--color-etiqueta);
      font-size: var(--fs-200);
      font-weight: 650;
      line-height: 1.2;
      white-space: nowrap;
    }
    .muestra {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 3px;
      background: var(--color-etiqueta);
    }
    :host(.proceso) {
      padding: 0.2rem 0.6rem 0.2rem 0.5rem;
      border: 1px solid color-mix(in srgb, var(--color-etiqueta) 35%, transparent);
      border-radius: var(--radio-pildora);
      background: color-mix(in srgb, var(--color-etiqueta) 9%, var(--papel));
      font-size: var(--fs-100);
    }
  `,
  host: {
    '[class.proceso]': "tipo() === 'proceso'",
    '[style.--color-etiqueta]': 'color()',
  },
})
export class EtiquetaCafe {
  readonly tipo = input.required<'variedad' | 'proceso'>();
  readonly nombre = input.required<string>();

  protected readonly color = computed(() =>
    this.tipo() === 'proceso' ? marcaProceso(this.nombre()).color : marcaVariedad(this.nombre()).color,
  );
  protected readonly icono = computed(() => marcaProceso(this.nombre()).icono);
}
