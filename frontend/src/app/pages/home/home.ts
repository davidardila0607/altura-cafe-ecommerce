import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Cafe } from '../../core/models/cafe';
import { Variedad } from '../../core/models/variedad';
import { Busqueda } from '../../core/services/busqueda';
import { Cafes } from '../../core/services/cafes';
import { Variedades } from '../../core/services/variedades';
import { normalizarTexto } from '../../core/utils/imagenes';
import { Footer } from '../../shared/footer/footer';
import { IlustracionBolsas } from '../../shared/ilustracion-bolsas/ilustracion-bolsas';
import { Navbar } from '../../shared/navbar/navbar';
import { TarjetaCafe } from '../../shared/tarjeta-cafe/tarjeta-cafe';

@Component({
  selector: 'app-home',
  imports: [Navbar, Footer, IlustracionBolsas, TarjetaCafe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly cafesApi = inject(Cafes);
  private readonly variedadesApi = inject(Variedades);
  protected readonly busqueda = inject(Busqueda);

  /** GET /api/cafes */
  protected readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });

  /** GET /api/variedades (para los chips de filtro). */
  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });

  /** null = "Todas". */
  protected readonly variedadSeleccionada = signal<number | null>(null);

  protected readonly placeholders = [1, 2, 3, 4, 5, 6];

  protected readonly listaVariedades = computed<Variedad[]>(() =>
    this.variedades.hasValue() ? this.variedades.value() : [],
  );

  private readonly todosLosCafes = computed<Cafe[]>(() => (this.cafes.hasValue() ? this.cafes.value() : []));

  /** Filtro por variedad + búsqueda del navbar (nombre, origen o variedad; sin importar tildes). */
  protected readonly cafesFiltrados = computed<Cafe[]>(() => {
    const variedadId = this.variedadSeleccionada();
    const texto = normalizarTexto(this.busqueda.texto());

    return this.todosLosCafes().filter((cafe) => {
      if (variedadId !== null && cafe.variedadId !== variedadId) {
        return false;
      }
      if (!texto) {
        return true;
      }
      return [cafe.nombre, cafe.origen, cafe.variedadNombre].some((campo) =>
        normalizarTexto(campo).includes(texto),
      );
    });
  });

  protected readonly resumen = computed(() => {
    const total = this.todosLosCafes().length;
    const visibles = this.cafesFiltrados().length;
    if (visibles === total) {
      return total === 1 ? '1 café' : `${total} cafés`;
    }
    return `${visibles} de ${total} cafés`;
  });

  protected seleccionarVariedad(id: number | null): void {
    this.variedadSeleccionada.set(id);
  }

  protected limpiarFiltros(): void {
    this.variedadSeleccionada.set(null);
    this.busqueda.limpiar();
  }

  protected reintentar(): void {
    this.cafes.reload();
    if (this.variedades.error()) {
      this.variedades.reload();
    }
  }

  protected verCafes(evento: Event): void {
    evento.preventDefault();
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('productos')?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
  }
}
