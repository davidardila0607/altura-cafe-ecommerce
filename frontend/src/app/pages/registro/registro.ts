import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { camposCoinciden, PATRON_CORREO } from '../../core/utils/validadores';
import { PaisajeAcceso } from '../../shared/paisaje-acceso/paisaje-acceso';

type CampoRegistro = 'nombre' | 'correo' | 'contrasena' | 'confirmacion';

/** Niveles del medidor de seguridad (0 = vacío). Solo las barras usan color; el texto es oscuro. */
const NIVELES = [
  { texto: '', color: 'var(--liquen)' },
  { texto: 'débil', color: 'var(--cereza)' },
  { texto: 'aceptable', color: 'var(--ambar)' },
  { texto: 'buena', color: 'var(--musgo)' },
  { texto: 'fuerte', color: 'var(--musgo)' },
];

/** Registro (solo visual): valida el formulario pero NO llama a la API. */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, PaisajeAcceso],
  templateUrl: './registro.html',
  styleUrl: '../../shared/acceso/acceso.css',
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

  /** La contraseña como signal, para recalcular el medidor mientras se escribe. */
  private readonly contrasena = toSignal(this.formulario.controls.contrasena.valueChanges, { initialValue: '' });

  /**
   * Seguridad de la contraseña: un punto por cada criterio que cumple
   * (6 o más caracteres, 10 o más, un número, una mayúscula o un símbolo).
   */
  protected readonly nivel = computed(() => {
    const valor = this.contrasena();
    const puntos = valor
      ? [valor.length >= 6, valor.length >= 10, /\d/.test(valor), /[A-ZÁÉÍÓÚÑ]|[^\wáéíóúñ]/.test(valor)].filter(Boolean).length
      : 0;
    return { valor: puntos, ...NIVELES[puntos] };
  });

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

  /** Visto verde: el campo ya tiene un valor válido escrito por el usuario. */
  protected esValido(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    return control.valid && control.dirty && (campo !== 'confirmacion' || !this.formulario.hasError('noCoinciden'));
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
