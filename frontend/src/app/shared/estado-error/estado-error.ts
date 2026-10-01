import { Component, input, output } from '@angular/core';

/** Error de carga de una sección que depende de la API, con botón "Reintentar". */
@Component({
  selector: 'app-estado-error',
  template: `
    <div class="error" role="alert">
      <i class="bi bi-wifi-off icono" aria-hidden="true"></i>
      <div>
        <p class="titulo-error">{{ titulo() }}</p>
        <p class="texto">{{ texto() }}</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="reintentar.emit()">Reintentar</button>
    </div>
  `,
  styles: `
    .error {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--esp-3) var(--esp-4);
      align-items: start;
      max-width: 34rem;
      padding: var(--esp-5) var(--esp-6);
      border-radius: var(--radio-tarjeta);
      background: var(--alt-papel);
      box-shadow: var(--sombra-1);
    }
    .icono {
      font-size: 1.5rem;
      color: var(--alt-terracota-texto);
      line-height: 1.2;
    }
    .titulo-error {
      margin: 0 0 var(--esp-1);
      font-family: var(--alt-fuente-titulos);
      font-size: var(--fs-500);
      font-weight: 500;
    }
    .texto {
      margin: 0;
      color: var(--alt-texto-suave);
    }
    .btn {
      grid-column: 2;
      justify-self: start;
    }
  `,
})
export class EstadoError {
  readonly titulo = input('No pudimos cargar los cafés');
  readonly texto = input('Revisa tu conexión e inténtalo de nuevo.');
  readonly reintentar = output<void>();
}
