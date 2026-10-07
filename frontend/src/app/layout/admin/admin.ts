import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { Avisos } from '../../core/services/avisos';
import { Logo } from '../../shared/logo/logo';

/**
 * Marco del panel de administración: encabezado con el nombre del usuario, "Ver tienda" y
 * "Cerrar sesión", navegación (Inventario / Variedades / Usuarios) y la zona de avisos.
 * Prioriza la claridad: sin animaciones decorativas.
 */
@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  template: `
    <a class="saltar" href="#contenido-admin">Saltar al contenido</a>
    <header class="cabecera sobre-oscuro">
      <div class="fila">
        <a routerLink="/admin/inventario" class="marca" aria-label="Altura, panel de administración">
          <app-logo tono="claro" />
          <span class="etiqueta-panel">Panel</span>
        </a>
        <nav aria-label="Administración">
          <ul class="secciones">
            <li><a routerLink="/admin/inventario" routerLinkActive="activo" ariaCurrentWhenActive="page">Inventario</a></li>
            <li><a routerLink="/admin/variedades" routerLinkActive="activo" ariaCurrentWhenActive="page">Variedades</a></li>
            @if (auth.tienePermiso('usuarios.gestionar')) {
              <li><a routerLink="/admin/usuarios" routerLinkActive="activo" ariaCurrentWhenActive="page">Usuarios</a></li>
            }
          </ul>
        </nav>
        <div class="usuario">
          <span class="nombre" data-testid="usuario-admin">
            <i class="bi bi-person-circle" aria-hidden="true"></i>
            {{ auth.sesion()?.nombre }}
          </span>
          <a class="boton boton-claro pequeno" routerLink="/">Ver tienda</a>
          <button type="button" class="boton boton-claro pequeno" (click)="salir()">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <main id="contenido-admin" class="contenido" tabindex="-1">
      <router-outlet />
    </main>

    <!-- Avisos de éxito y error (los lectores de pantalla los anuncian). -->
    <div class="avisos" aria-live="polite">
      @for (aviso of avisos.lista(); track aviso.id) {
        <p class="aviso" [class.error]="aviso.tipo === 'error'">
          <i class="bi" [class.bi-check-circle]="aviso.tipo === 'exito'" [class.bi-exclamation-triangle]="aviso.tipo === 'error'" aria-hidden="true"></i>
          <span>{{ aviso.texto }}</span>
          <button type="button" class="boton-icono" aria-label="Cerrar aviso" (click)="avisos.quitar(aviso.id)">
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </p>
      }
    </div>
  `,
  styleUrl: './admin.css',
})
export class Admin {
  protected readonly auth = inject(Auth);
  protected readonly avisos = inject(Avisos);

  protected salir(): void {
    // Desde el panel, cerrarSesion() ya lleva a /login.
    this.auth.cerrarSesion();
  }
}
