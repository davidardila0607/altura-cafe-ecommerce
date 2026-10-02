import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { mensajeDeError } from '../../../core/utils/errores';
import { PATRON_CORREO } from '../../../core/utils/validadores';
import { PaisajeAcceso } from '../../../shared/paisaje-acceso/paisaje-acceso';

/**
 * Acceso real al panel de administración (/admin/ingresar).
 * Solo entran las cuentas con el permiso "inventario.gestionar"; las demás ven un error claro.
 */
@Component({
  selector: 'app-ingresar',
  imports: [ReactiveFormsModule, RouterLink, PaisajeAcceso],
  templateUrl: './ingresar.html',
  styleUrl: '../../../shared/acceso/acceso.css',
})
export class Ingresar {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
    contrasena: ['', [Validators.required]],
  });

  protected readonly mostrarContrasena = signal(false);
  protected readonly enviado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sesionExpirada = this.auth.motivoCierre;

  constructor() {
    // Si ya hay una sesión con permiso, no tiene sentido volver a ingresar.
    if (this.auth.tienePermiso('inventario.gestionar')) {
      void this.router.navigate(['/admin/inventario']);
    }
  }

  protected mostrarError(campo: 'correo' | 'contrasena'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected async enviar(): Promise<void> {
    this.enviado.set(true);
    this.error.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid')?.focus();
      return;
    }

    this.enviando.set(true);
    try {
      const { correo, contrasena } = this.formulario.getRawValue();
      await this.auth.iniciarSesion(correo.trim(), contrasena);
      if (!this.auth.tienePermiso('inventario.gestionar')) {
        // La cuenta existe pero no puede administrar: se cierra esa sesión enseguida.
        this.auth.cerrarSesion();
        this.error.set('Esta cuenta no tiene permiso para administrar el inventario.');
        return;
      }
      await this.router.navigate(['/admin/inventario']);
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? 'Correo o contraseña incorrectos.'
          : mensajeDeError(error),
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
