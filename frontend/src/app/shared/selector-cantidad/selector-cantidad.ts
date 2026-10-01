import { Component, input, model } from '@angular/core';

/** Selector visual de cantidad (−  n  +), acotado entre 1 y `maximo`. */
@Component({
  selector: 'app-selector-cantidad',
  template: `
    <div class="cantidad" role="group" [attr.aria-labelledby]="idEtiqueta">
      <span [id]="idEtiqueta" class="etiqueta">Cantidad</span>
      <div class="selector">
        <button type="button" aria-label="Disminuir cantidad" [disabled]="deshabilitado() || valor() <= 1" (click)="cambiar(-1)">
          <i class="bi bi-dash-lg" aria-hidden="true"></i>
        </button>
        <output aria-live="polite" [attr.aria-label]="'Cantidad: ' + valorVisible()">{{ valorVisible() }}</output>
        <button
          type="button"
          aria-label="Aumentar cantidad"
          [disabled]="deshabilitado() || valor() >= maximo()"
          (click)="cambiar(1)"
        >
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: `
    .etiqueta {
      display: block;
      margin-bottom: var(--esp-2);
      font-size: var(--fs-200);
      font-weight: 560;
    }
    .selector {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--alt-linea-fuerte);
      border-radius: var(--radio-control);
      background: var(--alt-blanco-calido);
    }
    button {
      display: grid;
      place-items: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 0;
      border-radius: var(--radio-control);
      background: transparent;
      color: var(--alt-espresso);
      transition: transform var(--dur-presion) var(--ease-salida), background-color var(--dur-rapida) ease;
    }
    button:hover:not(:disabled) {
      background: var(--alt-crema-hondo);
    }
    button:active:not(:disabled) {
      transform: scale(0.92);
    }
    button:disabled {
      color: rgb(43 29 20 / 0.32);
    }
    output {
      min-width: 2.25rem;
      text-align: center;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class SelectorCantidad {
  readonly valor = model(1);
  readonly maximo = input(10);
  readonly deshabilitado = input(false);

  protected readonly idEtiqueta = `cantidad-${Math.random().toString(36).slice(2, 8)}`;

  protected valorVisible(): number {
    return this.deshabilitado() ? 0 : this.valor();
  }

  protected cambiar(delta: number): void {
    this.valor.update((actual) => Math.min(Math.max(1, actual + delta), Math.max(1, this.maximo())));
  }
}
