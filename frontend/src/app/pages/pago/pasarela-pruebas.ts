import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { Pagos } from '../../core/services/pagos';
import { Pedidos } from '../../core/services/pedidos';
import { mensajeDeError } from '../../core/utils/errores';
import { EstadoError } from '../../shared/estado-error/estado-error';
import { ResumenPedido } from '../../shared/resumen-pedido/resumen-pedido';

/**
 * Pasarela de pruebas (/pago/simulador, solo con sesión). Adaptación 1 de la guía 3: sin llaves
 * de Sandbox no se puede abrir el checkout de Wompi, así que esta página propia de Altura muestra
 * los mismos datos firmados de PrepararPago (referencia, monto y firma de integridad, que llegan
 * en la URL) y deja simular el resultado. "Simular pago aprobado/rechazado" llama a SimularPago:
 * el backend arma el evento de Wompi, lo firma y lo procesa por el mismo camino del webhook.
 */
@Component({
  selector: 'app-pasarela-pruebas',
  imports: [CurrencyPipe, RouterLink, EstadoError, ResumenPedido],
  templateUrl: './pasarela-pruebas.html',
  styleUrl: './pasarela-pruebas.css',
})
export class PasarelaPruebas {
  private readonly pagos = inject(Pagos);
  private readonly pedidosApi = inject(Pedidos);
  private readonly router = inject(Router);

  // Query params (withComponentInputBinding): ?pedido=&referencia=&monto=&firma=
  readonly pedido = input<string>();
  readonly referencia = input<string>();
  readonly monto = input<string>();
  readonly firma = input<string>();

  protected readonly pedidoId = computed(() => Number(this.pedido()));
  /** El monto viaja en centavos, como lo pide Wompi. */
  protected readonly totalPesos = computed(() => Number(this.monto()) / 100);
  protected readonly datosCompletos = computed(
    () => Number.isInteger(this.pedidoId()) && this.pedidoId() > 0 && !!this.referencia() && !!this.firma() && this.totalPesos() > 0,
  );

  /** El pedido (cafés y dirección) para el resumen. */
  protected readonly detalle = rxResource({
    params: () => (this.datosCompletos() ? this.pedidoId() : undefined),
    stream: ({ params: id }) => (id ? this.pedidosApi.pedido(id) : of(null)),
  });

  /** Qué botón se pulsó (para el texto "Procesando…"). */
  protected readonly procesando = signal<'aprobado' | 'rechazado' | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async simular(aprobado: boolean): Promise<void> {
    this.error.set(null);
    this.procesando.set(aprobado ? 'aprobado' : 'rechazado');
    try {
      const resultado = await this.pagos.simular(this.pedidoId(), aprobado);
      await this.router.navigate(['/pago/resultado'], {
        queryParams: { id: resultado.transactionId, pedido: this.pedidoId() },
      });
    } catch (error) {
      this.error.set(mensajeDeError(error));
      this.procesando.set(null);
    }
  }
}
