import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Auth } from '../../core/auth/auth';

/**
 * Cuenta en el navbar.
 * - Sin sesión: ícono de persona que lleva a /login (con ?volver= para regresar a esta página).
 * - Con sesión: botón con la inicial del nombre que abre un menú con el nombre, el correo,
 *   "Panel de administración" (solo Administrador) y "Cerrar sesión".
 * El menú es un "disclosure" (botón con aria-expanded): se cierra con Escape, al hacer clic
 * fuera o al navegar.
 */
@Component({
  selector: 'app-menu-usuario',
  imports: [RouterLink],
  templateUrl: './menu-usuario.html',
  styleUrl: './menu-usuario.css',
  host: {
    '(document:click)': 'clicFuera($event)',
    '(keydown.escape)': 'cerrar(true)',
  },
})
export class MenuUsuario {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly abierto = signal(false);
  protected readonly inicial = computed(() => (this.auth.sesion()?.nombre.trim()[0] ?? '?').toUpperCase());

  /** Página actual, para volver a ella después de iniciar sesión. */
  protected readonly volver = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.abierto.set(false));
  }

  protected alternar(): void {
    this.abierto.update((abierto) => !abierto);
  }

  /** Cierra el menú; con Escape devuelve el foco al botón para no perderlo. */
  protected cerrar(devolverFoco = false): void {
    if (!this.abierto()) {
      return;
    }
    this.abierto.set(false);
    if (devolverFoco) {
      this.host.nativeElement.querySelector<HTMLElement>('.avatar')?.focus();
    }
  }

  protected clicFuera(evento: MouseEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) {
      this.cerrar();
    }
  }

  protected salir(): void {
    this.abierto.set(false);
    this.auth.cerrarSesion();
  }
}
