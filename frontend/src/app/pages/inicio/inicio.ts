import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Cafe } from '../../core/models/cafe';
import { Variedad } from '../../core/models/variedad';
import { Cafes } from '../../core/services/cafes';
import { Variedades as VariedadesApi } from '../../core/services/variedades';
import { VistaRapida } from '../../shared/vista-rapida/vista-rapida';
import { Cierre } from './cierre/cierre';
import { Destacados } from './destacados/destacados';
import { Hero } from './hero/hero';
import { Origenes } from './origenes/origenes';
import { Proceso } from './proceso/proceso';
import { Variedades } from './variedades/variedades';

@Component({
  selector: 'app-inicio',
  imports: [Hero, Destacados, Proceso, Origenes, Variedades, Cierre, VistaRapida],
  template: `
    <app-hero />

    <app-destacados
      [cafes]="listaCafes()"
      [cargando]="cafes.isLoading()"
      [error]="!!cafes.error()"
      (reintentar)="cafes.reload()"
      (ver)="idVistaRapida.set($event)"
    />

    <app-proceso />

    <app-origenes
      [cafes]="listaCafes()"
      [cargando]="cafes.isLoading()"
      [error]="!!cafes.error()"
      (reintentar)="cafes.reload()"
    />

    <app-variedades
      [variedades]="listaVariedades()"
      [cafes]="listaCafes()"
      [cargando]="variedades.isLoading()"
      [error]="!!variedades.error()"
      (reintentar)="variedades.reload()"
    />

    <app-cierre />

    <app-vista-rapida [cafeId]="idVistaRapida()" (cerrar)="idVistaRapida.set(null)" />
  `,
})
export class Inicio {
  private readonly cafesApi = inject(Cafes);
  private readonly variedadesApi = inject(VariedadesApi);

  /** GET /api/cafes: lo usan Destacados y Orígenes (y el conteo de Variedades). */
  protected readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });

  /** GET /api/variedades */
  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });

  protected readonly listaCafes = computed<Cafe[]>(() => (this.cafes.hasValue() ? this.cafes.value() : []));
  protected readonly listaVariedades = computed<Variedad[]>(() =>
    this.variedades.hasValue() ? this.variedades.value() : [],
  );

  protected readonly idVistaRapida = signal<number | null>(null);
}
