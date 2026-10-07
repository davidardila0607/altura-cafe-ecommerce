import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, computed, input, output } from '@angular/core';
import { Cafe } from '../../core/models/cafe';
import { optimizarImagenCloudinary, srcsetCloudinary } from '../../core/utils/imagenes';
import { AgregarCarrito } from '../agregar-carrito/agregar-carrito';
import { EtiquetaCafe } from '../etiqueta-cafe/etiqueta-cafe';
import { Inclinar } from '../movimiento/inclinar';

// Formato de precios en pesos colombianos ("$ 42.000").
registerLocaleData(localeEsCo, 'es-CO');

/** Umbral de "Quedan N": a partir de aquí la disponibilidad se muestra en tono de alerta. */
const STOCK_BAJO = 5;

@Component({
  selector: 'app-tarjeta-cafe',
  imports: [CurrencyPipe, Inclinar, EtiquetaCafe, AgregarCarrito],
  templateUrl: './tarjeta-cafe.html',
  styleUrl: './tarjeta-cafe.css',
  host: {
    '[class.destacada]': "variante() === 'destacada'",
    '[class.horizontal]': "variante() === 'horizontal'",
    '[style.view-transition-name]': "nombreTransicion() ? 'cafe-' + cafe().id : null",
    '[style.view-transition-class]': "nombreTransicion() ? 'tarjeta' : null",
  },
})
export class TarjetaCafe {
  readonly cafe = input.required<Cafe>();
  /**
   * 'destacada': ocupa más espacio (primer café del catálogo o de la selección de la casa).
   * 'horizontal': imagen al lado del texto en escritorio (en móvil se ve como 'normal').
   */
  readonly variante = input<'normal' | 'destacada' | 'horizontal'>('normal');
  /** Activa el nombre de View Transition para animar el reordenamiento en el catálogo. */
  readonly nombreTransicion = input(false);
  /** Prioriza la carga de la imagen (primeras cards visibles). */
  readonly prioridad = input(false);

  /** "Ver producto": el padre abre la vista rápida con este café. */
  readonly ver = output<Cafe>();

  /** Imagen de Cloudinary con f_auto,q_auto,w_600. */
  protected readonly imagen = computed(() => optimizarImagenCloudinary(this.cafe().imagenUrl));
  protected readonly srcset = computed(() => srcsetCloudinary(this.cafe().imagenUrl, [400, 600, 900, 1200]));
  protected readonly sizes = computed(() =>
    this.variante() === 'destacada'
      ? '(min-width: 1200px) 640px, (min-width: 576px) 66vw, 100vw'
      : '(min-width: 1200px) 320px, (min-width: 576px) 45vw, 100vw',
  );


  protected readonly disponibilidad = computed(() => {
    const stock = this.cafe().stock;
    if (stock <= 0) {
      return { tipo: 'agotado', texto: 'Agotado' } as const;
    }
    if (stock <= STOCK_BAJO) {
      return { tipo: 'bajo', texto: `Quedan ${stock}` } as const;
    }
    return { tipo: 'normal', texto: `${stock} disponibles` } as const;
  });
}
