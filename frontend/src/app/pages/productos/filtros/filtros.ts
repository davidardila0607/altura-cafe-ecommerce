import { Component, input, output } from '@angular/core';
import { marcaVariedad } from '../../../core/data/contenido-marca';
import { Presentacion } from '../../../core/models/presentacion';
import { Variedad } from '../../../core/models/variedad';
import { normalizarTexto } from '../../../core/utils/texto';
import { Filtros as EstadoFiltros } from '../catalogo';

/** Panel de filtros del catálogo (barra lateral en escritorio, hoja en móvil). */
@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.html',
  styleUrl: './filtros.css',
})
export class Filtros {
  readonly filtros = input.required<EstadoFiltros>();
  readonly variedades = input<Variedad[]>([]);
  readonly presentaciones = input<Presentacion[]>([]);
  readonly origenes = input<{ clave: string; nombre: string }[]>([]);
  readonly activos = input(0);
  /** En móvil el panel incluye su propio buscador (el del navbar queda dentro del menú). */
  readonly conBuscador = input(false);
  /** Prefijo de ids para poder tener dos instancias en la página. */
  readonly prefijo = input('filtros');

  readonly cambiar = output<Partial<EstadoFiltros>>();
  readonly limpiar = output<void>();

  protected readonly normalizar = normalizarTexto;
  protected readonly colorVariedad = (nombre: string) => marcaVariedad(nombre).color;

  protected buscar(evento: Event): void {
    this.cambiar.emit({ q: (evento.target as HTMLInputElement).value });
  }

  protected alternarDisponibles(evento: Event): void {
    this.cambiar.emit({ disponibles: (evento.target as HTMLInputElement).checked });
  }
}
