import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { Rol, UsuarioAdmin } from '../../../core/models/usuario';
import { Avisos } from '../../../core/services/avisos';
import { Usuarios } from '../../../core/services/usuarios';
import { mensajeDeError } from '../../../core/utils/errores';
import { contarCafes, normalizarTexto } from '../../../core/utils/texto';
import { AtraparFoco } from '../../../shared/atrapar-foco/atrapar-foco';
import { EstadoError } from '../../../shared/estado-error/estado-error';

/**
 * Usuarios (/admin/usuarios): lista con búsqueda por nombre o correo y cambio de rol con
 * confirmación. Nadie puede quitarse su propio rol de administrador: el botón de la propia
 * fila está deshabilitado y, si aun así llega un 409 de la API, se muestra su mensaje.
 */
@Component({
  selector: 'app-usuarios-admin',
  imports: [AtraparFoco, EstadoError],
  templateUrl: './usuarios-admin.html',
  styleUrls: ['../lista-admin.css', '../formulario-admin.css', './usuarios-admin.css'],
})
export class UsuariosAdmin {
  private readonly usuariosApi = inject(Usuarios);
  private readonly avisos = inject(Avisos);
  private readonly auth = inject(Auth);

  protected readonly usuarios = rxResource({ stream: () => this.usuariosApi.listar() });
  protected readonly busqueda = signal('');
  protected readonly contarCafes = contarCafes;

  /** Id del administrador que usa el panel (sale del token). */
  protected readonly miId = computed(() => this.auth.sesion()?.id);

  protected readonly filas = computed(() => {
    const texto = normalizarTexto(this.busqueda());
    const lista = this.usuarios.hasValue() ? this.usuarios.value() : [];
    return texto
      ? lista.filter((u) => normalizarTexto(u.nombre).includes(texto) || normalizarTexto(u.email).includes(texto))
      : lista;
  });

  protected rolContrario(usuario: UsuarioAdmin): Rol {
    return usuario.rol === 'Administrador' ? 'Cliente' : 'Administrador';
  }

  // ===== Cambiar rol con confirmación =====
  private readonly confirmacion = viewChild.required<ElementRef<HTMLDialogElement>>('confirmacion');
  protected readonly aCambiar = signal<UsuarioAdmin | null>(null);
  protected readonly cambiando = signal(false);

  protected pedirCambio(usuario: UsuarioAdmin): void {
    this.aCambiar.set(usuario);
    this.confirmacion().nativeElement.showModal();
  }

  protected cancelarCambio(): void {
    this.confirmacion().nativeElement.close();
  }

  protected async confirmarCambio(): Promise<void> {
    const usuario = this.aCambiar();
    if (!usuario) {
      return;
    }
    const rol = this.rolContrario(usuario);
    this.cambiando.set(true);
    try {
      await firstValueFrom(this.usuariosApi.cambiarRol(usuario.id, rol));
      this.avisos.exito(`${usuario.nombre} ahora es ${rol}.`);
    } catch (error) {
      // 404 (ya no existe) o 409 ("No puedes quitarte tu propio rol de administrador.").
      this.avisos.error(mensajeDeError(error));
    } finally {
      this.cambiando.set(false);
      this.confirmacion().nativeElement.close();
      this.usuarios.reload();
    }
  }
}
