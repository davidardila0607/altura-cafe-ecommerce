import { afterRenderEffect, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../../core/auth/auth';
import { Carrito } from '../../core/services/carrito';
import { movimientoReducido } from '../../core/utils/medios';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';
import { ListaCarrito } from './lista-carrito';

/**
 * Ícono del carrito en el navbar, con el número de unidades (TotalUnidades de la API).
 * - Sin sesión: lleva a /login (y después vuelve a la página actual).
 * - Con sesión: abre el panel lateral del carrito (<dialog> modal, como la hoja de filtros).
 * Cuando el número cambia, el contador hace un pequeño "pulso" (Web Animations API);
 * con movimiento reducido no se anima.
 */
@Component({
  selector: 'app-boton-carrito',
  imports: [RouterLink, AtraparFoco, ListaCarrito],
  templateUrl: './boton-carrito.html',
  styleUrl: './boton-carrito.css',
})
export class BotonCarrito {
  protected readonly auth = inject(Auth);
  protected readonly carrito = inject(Carrito);
  protected readonly router = inject(Router);

  private readonly panel = viewChild<ElementRef<HTMLDialogElement>>('panel');
  private readonly contador = viewChild<ElementRef<HTMLElement>>('contador');
  /** El contenido del panel solo se dibuja mientras está abierto. */
  protected readonly abierto = signal(false);

  protected readonly etiqueta = computed(() => {
    const unidades = this.carrito.totalUnidades();
    return unidades === 0 ? 'Carrito, vacío' : unidades === 1 ? 'Carrito, 1 unidad' : `Carrito, ${unidades} unidades`;
  });

  private unidadesAnteriores: number | null = null;

  constructor() {
    // Pulso del contador cuando cambia el número (no en la primera pintura).
    afterRenderEffect(() => {
      const unidades = this.carrito.totalUnidades();
      const elemento = this.contador()?.nativeElement;
      if (elemento && this.unidadesAnteriores !== null && unidades !== this.unidadesAnteriores && !movimientoReducido()) {
        elemento.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], {
          duration: 320,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        });
      }
      this.unidadesAnteriores = unidades;
    });

    // Al navegar (por ejemplo, "Ver carrito completo" o "Ver cafés") el panel se cierra.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.cerrar());
  }

  protected abrir(): void {
    this.abierto.set(true);
    this.panel()?.nativeElement.showModal();
    void this.carrito.cargar(); // datos frescos (el stock pudo cambiar)
  }

  protected cerrar(): void {
    this.panel()?.nativeElement.close();
  }

  protected alCerrar(): void {
    this.abierto.set(false);
  }

  /** El <dialog> ocupa toda la ventana: un clic fuera del panel lo cierra. */
  protected clicFuera(evento: MouseEvent): void {
    if (evento.target === this.panel()?.nativeElement) {
      this.cerrar();
    }
  }
}
