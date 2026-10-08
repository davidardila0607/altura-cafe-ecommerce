import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { PedidoDto, unidadesDe } from '../../core/models/pedido';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';

/**
 * Resumen de un pedido: cada café (foto, nombre, cantidad × precio guardado y subtotal), las
 * unidades, el total y, si se pide, la dirección de envío. Lo usan el detalle del pedido, la
 * pasarela de pruebas y la página de resultado del pago.
 */
@Component({
  selector: 'app-resumen-pedido',
  imports: [CurrencyPipe],
  templateUrl: './resumen-pedido.html',
  styleUrl: './resumen-pedido.css',
})
export class ResumenPedido {
  readonly pedido = input.required<PedidoDto>();
  readonly mostrarEnvio = input(true);

  protected readonly unidades = computed(() => unidadesDe(this.pedido()));
  /** Los pedidos anteriores a la dirección de envío quedaron con "No registrada". */
  protected readonly sinDireccion = computed(() => this.pedido().direccionEnvio === 'No registrada');

  protected imagen(url: string | null): string | null {
    return optimizarImagenCloudinary(url, 'f_auto,q_auto,w_160');
  }
}
