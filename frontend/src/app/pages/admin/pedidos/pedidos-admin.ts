import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstadoPedido, unidadesDe } from '../../../core/models/pedido';
import { Pedidos } from '../../../core/services/pedidos';
import { EstadoError } from '../../../shared/estado-error/estado-error';
import { EstadoPedidoEtiqueta } from '../../../shared/estado-pedido/estado-pedido';

type Filtro = 'Todos' | EstadoPedido;

/**
 * Pedidos (/admin/pedidos): todos los pedidos de la tienda, los más recientes primero, con el
 * cliente, un filtro por estado y el detalle de cada uno desplegable. Solo lectura: cambiar el
 * estado lo hará la guía de Wompi cuando llegue el resultado del pago.
 */
@Component({
  selector: 'app-pedidos-admin',
  imports: [CurrencyPipe, DatePipe, EstadoError, EstadoPedidoEtiqueta],
  templateUrl: './pedidos-admin.html',
  styleUrls: ['../lista-admin.css', './pedidos-admin.css'],
})
export class PedidosAdmin {
  private readonly pedidosApi = inject(Pedidos);

  protected readonly pedidos = rxResource({ stream: () => this.pedidosApi.todos() });
  protected readonly filtros: Filtro[] = ['Todos', 'Pendiente', 'Pagado', 'Rechazado'];
  protected readonly filtro = signal<Filtro>('Todos');
  /** Id del pedido cuyo detalle está abierto (uno a la vez). */
  protected readonly abierto = signal<number | null>(null);
  protected readonly unidadesDe = unidadesDe;

  private readonly lista = computed(() => (this.pedidos.hasValue() ? this.pedidos.value() : []));

  protected readonly filas = computed(() => {
    const filtro = this.filtro();
    return filtro === 'Todos' ? this.lista() : this.lista().filter((p) => p.estado === filtro);
  });

  /** Cuántos pedidos hay de cada estado (el número de cada botón del filtro). */
  protected cuantos(filtro: Filtro): number {
    return filtro === 'Todos' ? this.lista().length : this.lista().filter((p) => p.estado === filtro).length;
  }

  protected alternar(id: number): void {
    this.abierto.update((actual) => (actual === id ? null : id));
  }
}
