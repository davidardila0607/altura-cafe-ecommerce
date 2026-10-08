import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, throwError } from 'rxjs';
import { unidadesDe } from '../../core/models/pedido';
import { Pedidos } from '../../core/services/pedidos';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';
import { EstadoError } from '../../shared/estado-error/estado-error';
import { EstadoPedidoEtiqueta } from '../../shared/estado-pedido/estado-pedido';

/**
 * Detalle de un pedido (/mis-pedidos/:id, solo con sesión): fecha, estado, cada café con el
 * precio guardado al comprar y el total. Si el pedido no existe o es de otra persona, la API
 * responde 404 y se muestra "Pedido no encontrado".
 */
@Component({
  selector: 'app-detalle-pedido',
  imports: [CurrencyPipe, DatePipe, RouterLink, EstadoError, EstadoPedidoEtiqueta],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css',
})
export class DetallePedido {
  private readonly pedidosApi = inject(Pedidos);

  /** :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  /** null = no encontrado (404 o un id que no es un número). Los demás errores van a error(). */
  protected readonly pedido = rxResource({
    params: () => Number(this.id()),
    stream: ({ params: id }) =>
      Number.isInteger(id) && id > 0
        ? this.pedidosApi.pedido(id).pipe(
            catchError((error: unknown) =>
              error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
            ),
          )
        : of(null),
  });

  protected readonly unidadesDe = unidadesDe;

  protected imagen(url: string | null): string | null {
    return optimizarImagenCloudinary(url, 'f_auto,q_auto,w_160');
  }
}
