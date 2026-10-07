import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoProductoDto } from '../../core/models/carrito';
import { Carrito } from '../../core/services/carrito';
import { mensajeDeError } from '../../core/utils/errores';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';
import { EstadoError } from '../estado-error/estado-error';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';

/**
 * Contenido del carrito: una fila por café (imagen, datos, precio unitario, cantidad, quitar
 * y subtotal), el resumen (unidades y total) y las acciones "Vaciar carrito" y
 * "Finalizar compra" (deshabilitado: los pagos no están en esta guía).
 * Se usa en el panel lateral (`compacta`) y en la página /carrito.
 */
@Component({
  selector: 'app-lista-carrito',
  imports: [CurrencyPipe, RouterLink, SelectorCantidad, EstadoError, AtraparFoco],
  templateUrl: './lista-carrito.html',
  styleUrl: './lista-carrito.css',
  host: { '[class.compacta]': 'compacta()' },
})
export class ListaCarrito {
  readonly compacta = input(false);

  protected readonly carrito = inject(Carrito);
  /** Prefijo de ids único: la lista puede estar a la vez en el panel y en /carrito. */
  protected readonly id = `carrito-${Math.random().toString(36).slice(2, 8)}`;
  /** Mensaje de la API si un cambio falla (por ejemplo, "Solo hay 5 unidades…"). */
  protected readonly error = signal<string | null>(null);

  protected imagen(url: string | null): string | null {
    return optimizarImagenCloudinary(url, 'f_auto,q_auto,w_160');
  }

  protected cambiarCantidad(producto: CarritoProductoDto, cantidad: number): Promise<void> {
    return this.ejecutar(() => this.carrito.actualizar(producto.productoId, cantidad));
  }

  protected quitar(producto: CarritoProductoDto): Promise<void> {
    return this.ejecutar(() => this.carrito.eliminar(producto.productoId));
  }

  // ===== Vaciar con confirmación =====
  private readonly confirmacion = viewChild.required<ElementRef<HTMLDialogElement>>('confirmacion');
  protected readonly vaciando = signal(false);

  protected pedirVaciar(): void {
    this.confirmacion().nativeElement.showModal();
  }

  protected cancelarVaciar(): void {
    this.confirmacion().nativeElement.close();
  }

  protected async confirmarVaciar(): Promise<void> {
    this.vaciando.set(true);
    await this.ejecutar(() => this.carrito.vaciar());
    this.vaciando.set(false);
    this.confirmacion().nativeElement.close();
  }

  /** Ejecuta un cambio y, si la API lo rechaza (404/409), muestra su mensaje. */
  private async ejecutar(cambio: () => Promise<string>): Promise<void> {
    this.error.set(null);
    try {
      await cambio();
    } catch (error) {
      this.error.set(mensajeDeError(error));
    }
  }
}
