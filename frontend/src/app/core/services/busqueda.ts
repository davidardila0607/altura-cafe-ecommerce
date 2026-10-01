import { Service, signal } from '@angular/core';

/** Texto del buscador del navbar, compartido con el catálogo del Home. */
@Service()
export class Busqueda {
  readonly texto = signal('');

  limpiar(): void {
    this.texto.set('');
  }
}
