import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EstadoPedido, FiltrosHistorial, PedidoAdminDto } from '../../../core/models/pedido';
import { Pedidos } from '../../../core/services/pedidos';
import { AtraparFoco } from '../../../shared/atrapar-foco/atrapar-foco';
import { EstadoError } from '../../../shared/estado-error/estado-error';
import { EstadoPedidoEtiqueta } from '../../../shared/estado-pedido/estado-pedido';
import { ResumenPedido } from '../../../shared/resumen-pedido/resumen-pedido';

type FiltroEstado = '' | EstadoPedido;

/**
 * Historial de compras (/admin/historial, solo Administrador). Arriba, los indicadores de las
 * compras pagadas (cantidad, unidades e ingresos); después, los filtros (estado, fechas y
 * búsqueda) y la tabla. Al pulsar una fila se abre un panel lateral con el resumen completo:
 * cliente, dirección, teléfono, notas, cafés, total, estado y transacción.
 * Los filtros viajan a la API (GET /api/Pedido/Historial); el rxResource vuelve a pedir el
 * historial cada vez que cambia uno.
 */
@Component({
  selector: 'app-historial-admin',
  imports: [CurrencyPipe, DatePipe, AtraparFoco, EstadoError, EstadoPedidoEtiqueta, ResumenPedido],
  templateUrl: './historial-admin.html',
  styleUrls: ['../lista-admin.css', '../formulario-admin.css', './historial-admin.css'],
})
export class HistorialAdmin {
  private readonly pedidosApi = inject(Pedidos);

  protected readonly estados: { valor: FiltroEstado; texto: string }[] = [
    { valor: '', texto: 'Todos' },
    { valor: 'Pagado', texto: 'Pagado' },
    { valor: 'Pendiente', texto: 'Pendiente' },
    { valor: 'Rechazado', texto: 'Rechazado' },
  ];

  protected readonly estado = signal<FiltroEstado>('');
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  protected readonly texto = signal('');

  private readonly filtros = computed<FiltrosHistorial>(() => ({
    estado: this.estado(),
    desde: this.desde(),
    hasta: this.hasta(),
    texto: this.texto(),
  }));

  protected readonly hayFiltros = computed(() => Object.values(this.filtros()).some((v) => v !== ''));

  protected readonly historial = rxResource({
    params: () => this.filtros(),
    stream: ({ params }) => this.pedidosApi.historial(params),
  });

  protected readonly filas = computed(() => (this.historial.hasValue() ? this.historial.value().pedidos : []));

  protected limpiar(): void {
    this.estado.set('');
    this.desde.set('');
    this.hasta.set('');
    this.texto.set('');
  }

  // ===== Panel lateral con el detalle =====
  private readonly panel = viewChild.required<ElementRef<HTMLDialogElement>>('panel');
  protected readonly seleccionado = signal<PedidoAdminDto | null>(null);

  protected abrir(pedido: PedidoAdminDto): void {
    this.seleccionado.set(pedido);
    this.panel().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.panel().nativeElement.close();
  }

  /** El <dialog> ocupa toda la ventana: un clic fuera del panel lo cierra. */
  protected clicFuera(evento: MouseEvent): void {
    if (evento.target === this.panel().nativeElement) {
      this.cerrar();
    }
  }
}
