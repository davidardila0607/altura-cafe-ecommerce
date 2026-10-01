import { Directive, ElementRef, inject } from '@angular/core';

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mantiene el foco dentro de un <dialog> modal: Tab en el último elemento vuelve al primero
 * y Shift+Tab en el primero va al último (el modal nativo deja salir el foco a la interfaz
 * del navegador al final del recorrido).
 */
@Directive({
  selector: 'dialog[appAtraparFoco]',
  host: {
    '(keydown.tab)': 'ciclar($event, false)',
    '(keydown.shift.tab)': 'ciclar($event, true)',
  },
})
export class AtraparFoco {
  private readonly dialogo = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;

  protected ciclar(evento: Event, haciaAtras: boolean): void {
    const enfocables = [...this.dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (enfocables.length === 0) {
      return;
    }

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const activo = document.activeElement;

    if (haciaAtras && (activo === primero || !this.dialogo.contains(activo))) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!haciaAtras && (activo === ultimo || !this.dialogo.contains(activo))) {
      evento.preventDefault();
      primero.focus();
    }
  }
}
