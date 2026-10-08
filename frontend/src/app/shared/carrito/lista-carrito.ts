import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CarritoProductoDto } from '../../core/models/carrito';
import { Avisos } from '../../core/services/avisos';
import { Carrito } from '../../core/services/carrito';
import { Pedidos } from '../../core/services/pedidos';
import { mensajeDeError } from '../../core/utils/errores';
import { optimizarImagenCloudinary } from '../../core/utils/imagenes';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';
import { EstadoError } from '../estado-error/estado-error';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';

/**
 * Contenido del carrito: una fila por café (imagen, datos, precio unitario, cantidad, quitar
 * y subtotal), el resumen (unidades y total) y las acciones "Confirmar pedido" (guía de pedidos)
 * y "Vaciar carrito", las dos con confirmación.
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
  private readonly pedidos = inject(Pedidos);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);
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

  // ===== Confirmar pedido (guía de pedidos) =====
  private readonly confirmacionPedido = viewChild.required<ElementRef<HTMLDialogElement>>('confirmacionPedido');
  protected readonly creandoPedido = signal(false);
  /** "3 productos" (suma de unidades), para el texto de la confirmación. */
  protected readonly productosTexto = computed(() => {
    const unidades = this.carrito.totalUnidades();
    return unidades === 1 ? '1 producto' : `${unidades} productos`;
  });

  protected pedirPedido(): void {
    this.error.set(null);
    this.confirmacionPedido().nativeElement.showModal();
  }

  protected cancelarPedido(): void {
    this.confirmacionPedido().nativeElement.close();
  }

  /**
   * Crea el pedido y lleva a su detalle con el aviso "Pedido creado". Si la API lo rechaza
   * (400 carrito vacío, 409 café propio o sin stock), se muestra su mensaje y el carrito
   * queda como estaba.
   */
  protected async confirmarPedido(): Promise<void> {
    this.creandoPedido.set(true);
    try {
      const { pedidoId } = await this.pedidos.crear();
      this.confirmacionPedido().nativeElement.close();
      this.avisos.exito('Pedido creado');
      await this.router.navigate(['/mis-pedidos', pedidoId]);
    } catch (error) {
      this.confirmacionPedido().nativeElement.close();
      this.error.set(mensajeDeError(error));
    } finally {
      this.creandoPedido.set(false);
    }
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
