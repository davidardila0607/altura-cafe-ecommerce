import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { mensajeDeError } from '../../core/utils/errores';
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

/**
 * Registro (Guía 1): POST /api/auth/Register con las mismas reglas que UsuarioDto
 * (nombre obligatorio de hasta 100 caracteres, correo válido, contraseña de 6 o más).
 * Al terminar lleva a /login?cuenta=creada; un 400 muestra el mensaje del backend.
 */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, PaisajeAcceso],
  templateUrl: './registro.html',
  styleUrl: '../../shared/acceso/acceso.css',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly longitudMinima = 6;

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
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
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

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

  protected async enviar(): Promise<void> {
    this.enviado.set(true);
    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      const primerInvalido =
        this.host.nativeElement.querySelector<HTMLElement>('input.ng-invalid') ??
        this.host.nativeElement.querySelector<HTMLElement>('#registro-confirmacion');
      primerInvalido?.focus();
      return;
    }

    this.enviando.set(true);
    try {
      const { nombre, correo, contrasena } = this.formulario.getRawValue();
      await this.auth.registrar(nombre.trim(), correo.trim(), contrasena);
      await this.router.navigate(['/login'], { queryParams: { cuenta: 'creada' } });
    } catch (error) {
      // 400: "El usuario ya existe." o los mensajes de validación de la API.
      this.error.set(mensajeDeError(error));
    } finally {
      this.enviando.set(false);
    }
  }
}
