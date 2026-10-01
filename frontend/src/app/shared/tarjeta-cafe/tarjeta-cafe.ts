import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, computed, input } from '@angular/core';
import { Cafe } from '../../core/models/cafe';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';

// Formato de precios en pesos colombianos ("$ 42.000").
registerLocaleData(localeEsCo, 'es-CO');

@Component({
  selector: 'app-tarjeta-cafe',
  imports: [CurrencyPipe],
  templateUrl: './tarjeta-cafe.html',
  styleUrl: './tarjeta-cafe.css',
})
export class TarjetaCafe {
  readonly cafe = input.required<Cafe>();

  /** Imagen de Cloudinary con f_auto,q_auto,w_600. */
  protected readonly imagen = computed(() => optimizarImagenCloudinary(this.cafe().imagenUrl));

  protected readonly textoDisponibles = computed(() => {
    const stock = this.cafe().stock;
    return stock === 1 ? '1 disponible' : `${stock} disponibles`;
  });
}
