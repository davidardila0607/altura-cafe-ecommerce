import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { mensajeDeError } from '../../core/utils/errores';
import { PATRON_CORREO } from '../../core/utils/validadores';
import { PaisajeAcceso } from '../../shared/paisaje-acceso/paisaje-acceso';

/**
 * Inicio de sesión (Guía 1): POST /api/auth/Login.
 * Al entrar vuelve a la página indicada en ?volver= (la pone el guard del panel o el navbar)
 * o al Inicio. Un 401 muestra "Usuario o contraseña incorrectos.".
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, PaisajeAcceso],
  templateUrl: './login.html',
  styleUrl: '../../shared/acceso/acceso.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly parametros = toSignal(inject(ActivatedRoute).queryParamMap);

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
    contrasena: ['', [Validators.required]],
  });

  protected readonly mostrarContrasena = signal(false);
  protected readonly enviado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Aviso según cómo se llegó aquí: cuenta recién creada, sin permiso o sesión vencida. */
  protected readonly aviso = computed(() => {
    const parametros = this.parametros();
    if (parametros?.get('cuenta') === 'creada') {
      return 'Cuenta creada. Ahora inicia sesión.';
    }
    if (parametros?.get('permiso') === 'denegado') {
      return 'No tienes permiso para entrar al panel de administración. Inicia sesión con una cuenta de administrador.';
    }
    if (this.auth.motivoCierre() === 'expirada') {
      return 'Tu sesión terminó. Vuelve a iniciar sesión.';
    }
    return null;
  });

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((visible) => !visible);
  }

  /** Muestra el error de un campo cuando el usuario ya pasó por él o intentó enviar. */
  protected mostrarError(campo: 'correo' | 'contrasena'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  /** Visto verde: el campo ya tiene un valor válido escrito por el usuario. */
  protected esValido(campo: 'correo' | 'contrasena'): boolean {
    const control = this.formulario.controls[campo];
    return control.valid && control.dirty;
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
      await this.router.navigateByUrl(this.destino());
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : mensajeDeError(error),
      );
    } finally {
      this.enviando.set(false);
    }
  }

  /** Solo rutas internas ("/admin"), nunca otro sitio ("//otro.com" o "https://…"). */
  private destino(): string {
    const volver = this.parametros()?.get('volver') ?? '';
    return volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
  }
}
