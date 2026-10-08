import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PedidoDto, sePuedePagar, unidadesDe } from '../../core/models/pedido';
import { Pedidos } from '../../core/services/pedidos';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';
import { BotonPagar } from '../../shared/boton-pagar/boton-pagar';
import { EstadoError } from '../../shared/estado-error/estado-error';
import { EstadoPedidoEtiqueta } from '../../shared/estado-pedido/estado-pedido';

/**
 * Mis pedidos (/mis-pedidos, solo con sesión): los pedidos del usuario, el más reciente primero
 * (así los entrega la API). Cada fila es un enlace a su detalle; los pedidos Pendiente o Rechazado
 * tienen además el botón "Pagar" (guía 3), fuera del enlace.
 */
@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink, EstadoError, EstadoPedidoEtiqueta, BotonPagar],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidos {
  private readonly pedidosApi = inject(Pedidos);

  protected readonly pedidos = rxResource({ stream: () => this.pedidosApi.misPedidos() });
  protected readonly sePuedePagar = sePuedePagar;

  protected unidadesTexto(pedido: PedidoDto): string {
    const unidades = unidadesDe(pedido);
    return unidades === 1 ? '1 producto' : `${unidades} productos`;
  }

  /** Hasta 3 fotos pequeñas de los cafés del pedido (decorativas: el texto ya dice qué es). */
  protected miniaturas(pedido: PedidoDto): string[] {
    return pedido.productos
      .map((p) => optimizarImagenCloudinary(p.imagenUrl, 'f_auto,q_auto,w_96'))
      .filter((url): url is string => !!url)
      .slice(0, 3);
  }
}
