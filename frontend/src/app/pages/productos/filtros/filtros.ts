import { Component, computed, input, output, signal } from '@angular/core';
import { marcaProceso, marcaVariedad } from '../../../core/data/contenido-marca';
import { Presentacion } from '../../../core/models/presentacion';
import { Proceso } from '../../../core/models/proceso';
import { Variedad } from '../../../core/models/variedad';
import { normalizarTexto } from '../../../core/utils/texto';
import { Filtros as EstadoFiltros } from '../catalogo';

/** Cuántas variedades se ven antes de "Ver las N variedades". */
const VARIEDADES_VISIBLES = 5;

/** Panel de filtros del catálogo (barra lateral en escritorio, hoja en móvil). */
@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.html',
  styleUrl: './filtros.css',
})
export class Filtros {
  readonly filtros = input.required<EstadoFiltros>();
  readonly variedades = input<Variedad[]>([]);
  readonly procesos = input<Proceso[]>([]);
  readonly presentaciones = input<Presentacion[]>([]);
  readonly origenes = input<{ clave: string; nombre: string }[]>([]);
  /** Cafés por variedad y por proceso (clave normalizada), para el número de cada chip. */
  readonly conteoVariedades = input<Record<string, number>>({});
  readonly conteoProcesos = input<Record<string, number>>({});
  readonly activos = input(0);
  /** En móvil el panel incluye su propio buscador (el del navbar queda dentro del menú). */
  readonly conBuscador = input(false);
  /** Prefijo de ids para poder tener dos instancias en la página. */
  readonly prefijo = input('filtros');

  readonly cambiar = output<Partial<EstadoFiltros>>();
  readonly limpiar = output<void>();

  protected readonly normalizar = normalizarTexto;
  protected readonly colorVariedad = (nombre: string) => marcaVariedad(nombre).color;
  protected readonly marcaProceso = marcaProceso;

  /**
   * Con muchas variedades se muestran las primeras y un botón "Ver las N variedades".
   * Si la variedad elegida quedó escondida, se muestra igual para que se vea qué está activo.
   */
  protected readonly verTodas = signal(false);
  protected readonly hayOcultas = computed(() => this.variedades().length > VARIEDADES_VISIBLES + 1);
  protected readonly variedadesVisibles = computed(() => {
    const todas = this.variedades();
    if (this.verTodas() || !this.hayOcultas()) {
      return todas;
    }
    const primeras = todas.slice(0, VARIEDADES_VISIBLES);
    const elegida = todas.find((v) => normalizarTexto(v.nombre) === this.filtros().variedad);
    return elegida && !primeras.includes(elegida) ? [...primeras, elegida] : primeras;
  });

  protected conteo(conteos: Record<string, number>, nombre: string): number {
    return conteos[normalizarTexto(nombre)] ?? 0;
  }

  protected buscar(evento: Event): void {
    this.cambiar.emit({ q: (evento.target as HTMLInputElement).value });
  }

  protected alternarDisponibles(evento: Event): void {
    this.cambiar.emit({ disponibles: (evento.target as HTMLInputElement).checked });
  }
}
