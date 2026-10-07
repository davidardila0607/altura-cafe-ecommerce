import { Service, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'exito' | 'error';
  texto: string;
  /** Enlace opcional junto al texto (por ejemplo, "Ver carrito"). */
  enlace?: { texto: string; ruta: string };
}

/** Cuánto tiempo se ve cada aviso. */
const DURACION_MS = 5000;

/**
 * Avisos breves: en el panel ("Café creado.", "No tienes permiso…") y en la tienda
 * ("Agregado al carrito" con el enlace "Ver carrito").
 */
@Service()
export class Avisos {
  private siguienteId = 1;
  readonly lista = signal<Aviso[]>([]);

  exito(texto: string, enlace?: Aviso['enlace']): void {
    this.agregar('exito', texto, enlace);
  }

  error(texto: string): void {
    this.agregar('error', texto);
  }

  quitar(id: number): void {
    this.lista.update((avisos) => avisos.filter((a) => a.id !== id));
  }

  private agregar(tipo: Aviso['tipo'], texto: string, enlace?: Aviso['enlace']): void {
    const id = this.siguienteId++;
    this.lista.update((avisos) => [...avisos, { id, tipo, texto, enlace }]);
    setTimeout(() => this.quitar(id), DURACION_MS);
  }
}
