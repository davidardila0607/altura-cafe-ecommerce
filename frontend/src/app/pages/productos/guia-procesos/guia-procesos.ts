import { Component, input, output } from '@angular/core';
import { marcaProceso } from '../../../core/data/contenido-marca';
import { Proceso } from '../../../core/models/proceso';
import { contarCafes, normalizarTexto } from '../../../core/utils/texto';

/**
 * Ficha editorial dentro de la grilla del catálogo: explica los procesos (Lavado, Honey,
 * Fermentado) y, al elegir uno, filtra el catálogo por ese proceso.
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
  /** Emite la clave normalizada del proceso elegido ("honey"). */
  readonly elegir = output<string>();

  protected readonly marca = marcaProceso;
  protected readonly normalizar = normalizarTexto;

  /** "11 cafés", "1 café"... */
  protected cantidad(nombre: string): string {
    return contarCafes(this.conteos()[normalizarTexto(nombre)] ?? 0);
  }
}
