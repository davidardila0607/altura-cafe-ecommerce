import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { camposCoinciden, PATRON_CORREO } from '../../core/utils/validadores';
import { PanelMarca } from '../../shared/panel-marca/panel-marca';

type CampoRegistro = 'nombre' | 'correo' | 'contrasena' | 'confirmacion';

/** Registro (solo visual): valida el formulario pero NO llama a la API. */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, PanelMarca],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly longitudMinima = 6;

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
      contrasena: ['', [Validators.required, Validators.minLength(this.longitudMinima)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: camposCoinciden('contrasena', 'confirmacion') },
  );

  protected readonly mostrarContrasena = signal(false);
  protected readonly mostrarConfirmacion = signal(false);
  protected readonly enviado = signal(false);
  protected readonly aviso = signal<string | null>(null);

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((visible) => !visible);
  }

  protected alternarConfirmacion(): void {
    this.mostrarConfirmacion.update((visible) => !visible);
  }

  protected mostrarError(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    const visitado = control.touched || this.enviado();

    if (campo === 'confirmacion') {
      return visitado && (control.invalid || this.formulario.hasError('noCoinciden'));
    }

    return visitado && control.invalid;
  }

  protected enviar(): void {
    this.enviado.set(true);
    this.aviso.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      const primerInvalido =
        this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid') ??
        this.host.nativeElement.querySelector<HTMLElement>('#registro-confirmacion');
      primerInvalido?.focus();
      return;
    }

    // Sin registro real en este taller.
    this.aviso.set('El registro estará disponible próximamente.');
  }
}
