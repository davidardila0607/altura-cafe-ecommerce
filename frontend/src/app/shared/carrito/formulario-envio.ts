import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DEPARTAMENTOS_COLOMBIA } from '../../core/data/departamentos';
import { DatosEnvioDto } from '../../core/models/pedido';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';

type CampoEnvio = 'direccionEnvio' | 'ciudad' | 'departamento' | 'telefono' | 'notasEntrega';

/** Sufijo del id de cada campo en la plantilla, en el orden en que aparecen. */
const SUFIJOS: Record<CampoEnvio, string> = {
  direccionEnvio: '-direccion',
  ciudad: '-ciudad',
  departamento: '-departamento',
  telefono: '-telefono',
  notasEntrega: '-notas',
};

/** Teléfono de 7 a 15 dígitos; se aceptan espacios al escribir ("300 123 4567"). */
function telefonoValido(control: AbstractControl): ValidationErrors | null {
  const digitos = String(control.value ?? '').replace(/\s+/g, '');
  return digitos === '' || /^\d{7,15}$/.test(digitos) ? null : { telefono: true };
}

/**
 * "Datos de envío" (adaptación a la guía de pedidos): se pide al pulsar "Confirmar pedido" en el
 * carrito. Valida igual que DatosEnvioDto del backend y emite los datos; el carrito crea el pedido.
 * Es un <dialog> modal; los datos escritos se conservan si se cierra y se vuelve a abrir.
 */
@Component({
  selector: 'app-formulario-envio',
  imports: [ReactiveFormsModule, CurrencyPipe, AtraparFoco],
  templateUrl: './formulario-envio.html',
  styleUrl: './formulario-envio.css',
})
export class FormularioEnvio {
  private readonly fb = inject(FormBuilder);

  /** Unidades y total del carrito, para el resumen del pedido. */
  readonly unidades = input(0);
  readonly total = input(0);
  readonly enviando = input(false);
  /** Mensaje de la API si el pedido no se pudo crear (400 o 409). */
  readonly error = input<string | null>(null);

  readonly enviar = output<DatosEnvioDto>();

  protected readonly departamentos = DEPARTAMENTOS_COLOMBIA;
  protected readonly id = `envio-${Math.random().toString(36).slice(2, 8)}`;
  protected readonly enviado = signal(false);

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly formulario = this.fb.nonNullable.group({
    direccionEnvio: ['', [Validators.required, Validators.maxLength(200)]],
    ciudad: ['', [Validators.required, Validators.maxLength(80)]],
    departamento: ['', [Validators.required]],
    telefono: ['', [Validators.required, telefonoValido]],
    notasEntrega: ['', [Validators.maxLength(300)]],
  });

  abrir(): void {
    this.dialogo().nativeElement.showModal();
  }

  cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected mostrarError(campo: CampoEnvio): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || this.enviado());
  }

  protected productosTexto(): string {
    return this.unidades() === 1 ? '1 producto' : `${this.unidades()} productos`;
  }

  protected confirmar(): void {
    this.enviado.set(true);
    if (this.formulario.invalid) {
      // El foco va al primer campo con error para que el lector de pantalla lo anuncie.
      // (Se busca por el control y no por aria-invalid, que Angular pinta un instante después.)
      const primero = (Object.keys(SUFIJOS) as CampoEnvio[]).find((c) => this.formulario.controls[c].invalid);
      if (primero) {
        document.getElementById(this.id + SUFIJOS[primero])?.focus();
      }
      return;
    }
    const datos = this.formulario.getRawValue();
    this.enviar.emit({
      direccionEnvio: datos.direccionEnvio.trim(),
      ciudad: datos.ciudad.trim(),
      departamento: datos.departamento,
      telefono: datos.telefono.replace(/\s+/g, ''),
      notasEntrega: datos.notasEntrega.trim() || null,
    });
  }
}
