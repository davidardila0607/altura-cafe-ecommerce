import { Service, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error';
  texto: string;
}

/** Cuánto tiempo se ve cada aviso. */
const DURACION_MS = 5000;

/** Avisos breves del panel de administración ("Café creado.", "No tienes permiso…"). */
@Service()
export class Avisos {
  private siguienteId = 1;
  readonly lista = signal<Aviso[]>([]);

  exito(texto: string): void {
    this.agregar('exito', texto);
  }

  error(texto: string): void {
    this.agregar('error', texto);
  }

  quitar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private agregar(tipo: Aviso['tipo'], texto: string): void {
    const id = this.siguienteId++;
    this.lista.update((avisos) => [...avisos, { id, tipo, texto }]);
    setTimeout(() => this.quitar(id), DURACION_MS);
  }
}
