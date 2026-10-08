import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Cafe } from '../../core/models/cafe';
import { Variedad } from '../../core/models/variedad';
import { Cafes } from '../../core/services/cafes';
import { Variedades as VariedadesApi } from '../../core/services/variedades';
import { refrescarScroll } from '../../core/utils/gsap';
import { VistaRapida } from '../../shared/vista-rapida/vista-rapida';
import { Altimetro } from './altimetro/altimetro';
import { CintaNotas } from './cinta-notas/cinta-notas';
import { Resenas } from './resenas/resenas';
import { Destacados } from './destacados/destacados';
import { Hero } from './hero/hero';
import { Origenes } from './origenes/origenes';
import { Proceso } from './proceso/proceso';
import { Variedades } from './variedades/variedades';

/**
 * Inicio: el ascenso del valle a la cumbre. Cada sección lleva data-etapa (la lee el
 * altímetro) y su altitud está en ETAPAS_ASCENSO (core/data/contenido-marca.ts).
 */
@Component({
  selector: 'app-inicio',
  imports: [Hero, Altimetro, Destacados, Proceso, CintaNotas, Origenes, Variedades, Resenas, VistaRapida],
  template: `
    <app-hero data-etapa="valle" />

    <app-destacados
      data-etapa="ladera"
      [cafes]="listaCafes()"
      [cargando]="cafes.isLoading()"
      [error]="!!cafes.error()"
      (reintentar)="cafes.reload()"
      (ver)="cafeSeleccionado.set($event)"
    />

    <app-proceso data-etapa="finca" />

    <app-cinta-notas [cafes]="listaCafes()" />

    <app-origenes
      data-etapa="cordillera"
      [cafes]="listaCafes()"
      [cargando]="cafes.isLoading()"
      [error]="!!cafes.error()"
      (reintentar)="cafes.reload()"
    />

    <app-variedades
      data-etapa="cafetal"
      [variedades]="listaVariedades()"
      [cafes]="listaCafes()"
      [cargando]="variedades.isLoading()"
      [error]="!!variedades.error()"
      (reintentar)="variedades.reload()"
    />

    <!-- Cumbre: reseñas de clientes (antes, "Llegaste a la cumbre"). -->
    <app-resenas data-etapa="cumbre" />

    <app-altimetro />

    <app-vista-rapida [cafe]="cafeSeleccionado()" (cerrar)="cafeSeleccionado.set(null)" />
  `,
  styles: `
    /* En escritorio el contenido deja libre el margen derecho, donde va el altímetro. */
    @media (min-width: 1024px) {
      :host {
        display: block;
        --margen-lateral: clamp(8.5rem, 10vw, 10rem);
      }
    }
  `,
})
export class Inicio {
  private readonly cafesApi = inject(Cafes);
  private readonly variedadesApi = inject(VariedadesApi);

  /** GET /api/cafes: lo usan Destacados, Orígenes, la cinta y el conteo de Variedades. */
  protected readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });

  /** GET /api/variedades */
  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });

  protected readonly listaCafes = computed<Cafe[]>(() => (this.cafes.hasValue() ? this.cafes.value() : []));
  protected readonly listaVariedades = computed<Variedad[]>(() =>
    this.variedades.hasValue() ? this.variedades.value() : [],
  );

  protected readonly cafeSeleccionado = signal<Cafe | null>(null);

  constructor() {
    // Cuando llegan los datos la página cambia de alto: los ScrollTrigger deben recalcularse.
    afterRenderEffect(() => {
      this.cafes.status();
      this.variedades.status();
      refrescarScroll();
    });
  }
}
