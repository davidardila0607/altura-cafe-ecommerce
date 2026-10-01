import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PATRON_CORREO } from '../../core/utils/validadores';
import { PaisajeAcceso } from '../../shared/paisaje-acceso/paisaje-acceso';

/** Inicio de sesión (solo visual): valida el formulario pero NO llama a la API. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, PaisajeAcceso],
  templateUrl: './login.html',
  styleUrl: '../../shared/acceso/acceso.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
    contrasena: ['', [Validators.required]],
  });

  protected readonly mostrarContrasena = signal(false);
  protected readonly enviado = signal(false);
  protected readonly aviso = signal<string | null>(null);

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

  protected enviar(): void {
    this.enviado.set(true);
    this.aviso.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid')?.focus();
      return;
    }

    // Sin autenticación real en este taller.
    this.aviso.set('El inicio de sesión estará disponible próximamente.');
  }
}
