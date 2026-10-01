import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Logo } from '../logo/logo';

/** Espera tras la última tecla antes de actualizar la búsqueda en /productos. */
const ESPERA_BUSQUEDA_MS = 250;

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  /** Fondo sólido (el usuario ya bajó por la página). Lo decide el layout Sitio. */
  readonly solido = input(false);

  private readonly router = inject(Router);
  protected readonly menuAbierto = signal(false);
  private espera: ReturnType<typeof setTimeout> | undefined;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly enProductos = computed(() => this.url().startsWith('/productos'));

  /** En /productos el buscador refleja ?q=; en las demás vistas empieza vacío. */
  protected readonly textoBusqueda = computed(() =>
    this.enProductos() ? (this.router.parseUrl(this.url()).queryParams['q'] ?? '') : '',
  );

  constructor() {
    // Cierra el menú móvil al navegar.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.menuAbierto.set(false));
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** En /productos filtra mientras se escribe (sin crear entradas de historial). */
  protected escribir(evento: Event): void {
    if (!this.enProductos()) {
      return;
    }
    const texto = (evento.target as HTMLInputElement).value;
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.buscar(texto, true), ESPERA_BUSQUEDA_MS);
  }

  /** Enviar el buscador lleva a /productos?q=texto desde cualquier vista. */
  protected enviar(evento: Event, campo: HTMLInputElement): void {
    evento.preventDefault();
    clearTimeout(this.espera);
    this.buscar(campo.value, this.enProductos());
    this.menuAbierto.set(false);
  }

  private buscar(texto: string, reemplazar: boolean): void {
    const q = texto.trim() || null;
    void this.router.navigate(['/productos'], {
      queryParams: { q },
      queryParamsHandling: this.enProductos() ? 'merge' : '',
      replaceUrl: reemplazar,
    });
  }
}
