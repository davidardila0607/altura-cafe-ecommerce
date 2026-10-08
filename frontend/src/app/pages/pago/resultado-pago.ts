import { Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PedidoDto } from '../../core/models/pedido';
import { CLAVE_PEDIDO_EN_PAGO, Pagos } from '../../core/services/pagos';
import { Pedidos } from '../../core/services/pedidos';
import { BotonPagar } from '../../shared/boton-pagar/boton-pagar';
import { ResumenPedido } from '../../shared/resumen-pedido/resumen-pedido';

/** Número del pedido: de la URL (?pedido=) o, al volver de Wompi real, del sessionStorage. */
function pedidoGuardado(): number {
  try {
    return Number(sessionStorage.getItem(CLAVE_PEDIDO_EN_PAGO));
  } catch {
    return 0;
  }
}

/**
 * Resultado del pago (/pago/resultado?id=<transacción>&pedido=<id>, solo con sesión).
 * - Pasarela de pruebas (id "SIM-…"): el pago ya se procesó; solo se lee el pedido.
 * - Wompi real: Wompi vuelve con ?id=; primero se pide a la API que confirme esa transacción
 *   (ConfirmarPago la consulta a Wompi) y después se lee el pedido.
 * Muestra el estado final: aprobado, rechazado (con "Intentar de nuevo") o en proceso.
 */
@Component({
  selector: 'app-resultado-pago',
  imports: [RouterLink, ResumenPedido, BotonPagar],
  templateUrl: './resultado-pago.html',
  styleUrl: './resultado-pago.css',
})
export class ResultadoPago {
  private readonly pagos = inject(Pagos);
  private readonly pedidosApi = inject(Pedidos);

  // Query params (withComponentInputBinding).
  readonly id = input<string>();
  readonly pedido = input<string>();

  protected readonly resultado = resource({
    params: () => ({ transaccion: this.id() ?? '', pedidoId: Number(this.pedido()) || pedidoGuardado() }),
    loader: async ({ params }): Promise<PedidoDto | null> => {
      if (!params.pedidoId) {
        return null;
      }
      if (params.transaccion && !params.transaccion.startsWith('SIM-')) {
        try {
          await this.pagos.confirmar(params.pedidoId, params.transaccion);
        } catch {
          // Si la confirmación falla, el pedido se lee igual: el webhook pudo haberlo actualizado.
        }
      }
      return firstValueFrom(this.pedidosApi.pedido(params.pedidoId));
    },
  });
}
