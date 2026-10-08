import { Component, inject, input, signal } from '@angular/core';
import { Pagos } from '../../core/services/pagos';
import { mensajeDeError } from '../../core/utils/errores';

/**
 * "Pagar" un pedido Pendiente o Rechazado (guía 3): llama a PrepararPago y lleva a la pasarela
 * (de pruebas o de Wompi, según el modo). Mientras tanto dice "Preparando pago…"; si la API
 * responde 404 o 409 ("Este pedido ya fue pagado.", sin stock) muestra su mensaje.
 */
@Component({
  selector: 'app-boton-pagar',
  template: `
    <button
      type="button"
      class="boton boton-primario"
      [class.boton-ancho]="ancho()"
      [disabled]="preparando()"
      [attr.aria-describedby]="error() ? id + '-error' : null"
      data-testid="boton-pagar"
      (click)="pagar()"
    >
      @if (preparando()) {
        <span class="giro" aria-hidden="true"></span>
        Preparando pago…
      } @else {
        <i class="bi bi-credit-card" aria-hidden="true"></i>
        {{ etiqueta() }}
      }
    </button>
    @if (error(); as mensaje) {
      <p [id]="id + '-error'" class="mensaje-error" role="alert">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        {{ mensaje }}
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .giro {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgb(255 255 255 / 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: girar 700ms linear infinite;
    }
    @keyframes girar {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .giro {
        animation-duration: 1.6s;
      }
    }
  `,
})
export class BotonPagar {
  private readonly pagos = inject(Pagos);

  readonly pedidoId = input.required<number>();
  readonly etiqueta = input('Pagar');
  /** Ocupa todo el ancho (en el detalle del pedido). */
  readonly ancho = input(false);

  protected readonly id = `pagar-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly preparando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async pagar(): Promise<void> {
    this.error.set(null);
    this.preparando.set(true);
    try {
      await this.pagos.pagar(this.pedidoId());
    } catch (error) {
      this.error.set(mensajeDeError(error));
    } finally {
      this.preparando.set(false);
    }
  }
}
