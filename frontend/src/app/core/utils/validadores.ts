import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Correo con usuario, @, dominio y extensión (más estricto que Validators.email, que acepta "a@b"). */
export const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validador de grupo: los campos `campo` y `confirmacion` deben ser iguales. */
export function camposCoinciden(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value;
    const repetido = grupo.get(confirmacion)?.value;

    if (!repetido) {
      return null;
    }

    return valor === repetido ? null : { noCoinciden: true };
  };
}

/** Número entero (stock y precio en pesos colombianos no llevan decimales). */
export const entero: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value === null || control.value === '' || Number.isInteger(Number(control.value)) ? null : { entero: true };
