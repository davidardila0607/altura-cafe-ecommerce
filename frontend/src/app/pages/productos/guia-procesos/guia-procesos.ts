import { Component, input, output } from '@angular/core';
import { marcaProceso } from '../../../core/data/contenido-marca';
import { Proceso } from '../../../core/models/proceso';
import { contarCafes, normalizarTexto } from '../../../core/utils/texto';

/**
 * Bloque "Tres procesos, tres tazas" arriba de la grilla del catálogo: explica Lavado,
 * Honey y Fermentado y filtra por el proceso elegido (el mismo filtro de la barra lateral).
 */
@Component({
  selector: 'app-guia-procesos',
  templateUrl: './guia-procesos.html',
  styleUrl: './guia-procesos.css',
})
export class GuiaProcesos {
  readonly procesos = input<Proceso[]>([]);
  /** Cafés por proceso (clave normalizada). */
  readonly conteos = input<Record<string, number>>({});
  /** Proceso del filtro actual (clave normalizada) o null. */
  readonly activo = input<string | null>(null);
  /** Emite la clave del proceso elegido, o null para quitar el filtro. */
  readonly elegir = output<string | null>();

  protected readonly marca = marcaProceso;

  protected esActivo(nombre: string): boolean {
    return this.activo() === normalizarTexto(nombre);
  }

  protected alternar(nombre: string): void {
    this.elegir.emit(this.esActivo(nombre) ? null : normalizarTexto(nombre));
  }

  /** "11 cafés", "1 café"... */
  protected cantidad(nombre: string): string {
    return contarCafes(this.conteos()[normalizarTexto(nombre)] ?? 0);
  }
}
