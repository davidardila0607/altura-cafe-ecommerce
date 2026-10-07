import { Component, input, output } from '@angular/core';

/** Error de carga de una sección que depende de la API, con botón "Reintentar". */
@Component({
  selector: 'app-estado-error',
  template: `
    <div class="error" role="alert">
      <!-- Una cumbre tapada por la niebla: no se alcanza a ver lo que hay arriba. -->
      <svg class="dibujo" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
        <path d="M4 66 L40 20 L56 38 L76 10 L116 66 Z" class="montana" />
        <path d="M10 40 h44 M30 48 h64 M60 32 h40" class="niebla" />
      </svg>
      <div class="texto-error">
        <p class="titulo-error">{{ titulo() }}</p>
        <p class="texto">{{ texto() }}</p>
        <button type="button" class="boton boton-primario" (click)="reintentar.emit()">
          <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          Reintentar
        </button>
      </div>
    </div>
  `,
  styles: `
    .error {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--esp-5) var(--esp-6);
      max-width: 40rem;
      padding: var(--esp-6);
      border: 1px solid var(--linea);
      border-radius: var(--radio-tarjeta);
      background: var(--papel);
    }
    .dibujo {
      width: 7.5rem;
      flex: none;
    }
    .montana {
      fill: var(--niebla-honda);
      stroke: var(--bosque);
      stroke-width: 2;
      stroke-linejoin: round;
    }
    .niebla {
      stroke: var(--papel);
      stroke-width: 6;
      stroke-linecap: round;
    }
    .texto-error {
      flex: 1 1 16rem;
    }
    .titulo-error {
      font-size: var(--fs-500);
      font-weight: 750;
      font-stretch: 85%;
      letter-spacing: -0.02em;
    }
    .texto {
      margin: var(--esp-1) 0 var(--esp-5);
      color: var(--texto-suave);
    }
  `,
})
export class EstadoError {
  readonly titulo = input('No pudimos cargar los cafés');
  readonly texto = input('Revisa tu conexión e inténtalo de nuevo.');
  readonly reintentar = output<void>();
}
