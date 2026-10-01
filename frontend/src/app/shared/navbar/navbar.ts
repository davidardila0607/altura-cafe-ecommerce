import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Busqueda } from '../../core/services/busqueda';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly busqueda = inject(Busqueda);
  protected readonly menuAbierto = signal(false);

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  /** Desplaza a una sección del Home (#inicio, #productos) y cierra el menú móvil. */
  protected irA(evento: Event, id: string): void {
    evento.preventDefault();
    this.menuAbierto.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: this.desplazamiento(), block: 'start' });
  }

  protected buscar(evento: Event): void {
    this.busqueda.texto.set((evento.target as HTMLInputElement).value);
  }

  protected enviarBusqueda(evento: Event): void {
    evento.preventDefault();
    this.menuAbierto.set(false);
    document.getElementById('productos')?.scrollIntoView({ behavior: this.desplazamiento(), block: 'start' });
  }

  private desplazamiento(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
}
