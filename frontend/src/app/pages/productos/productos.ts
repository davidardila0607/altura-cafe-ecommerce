import { ApplicationRef, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Cafe } from '../../core/models/cafe';
import { Cafes } from '../../core/services/cafes';
import { Presentaciones } from '../../core/services/presentaciones';
import { Procesos } from '../../core/services/procesos';
import { Variedades } from '../../core/services/variedades';
import { conTransicion } from '../../core/utils/transicion';
import { contarCafes } from '../../core/utils/texto';
import { EstadoError } from '../../shared/estado-error/estado-error';
import { TarjetaCafe } from '../../shared/tarjeta-cafe/tarjeta-cafe';
import { VistaRapida } from '../../shared/vista-rapida/vista-rapida';
import { AtraparFoco } from '../../shared/atrapar-foco/atrapar-foco';
import {
  aplicarFiltros,
  contarFiltrosActivos,
  claveOrigen,
  contarPor,
  FILTROS_VACIOS,
  Filtros as EstadoFiltros,
  filtrosAUrl,
  filtrosDesdeUrl,
  mismosFiltros,
  opcionesDeOrigen,
  Orden,
  ORDENES,
} from './catalogo';
import { Filtros } from './filtros/filtros';
import { GuiaProcesos } from './guia-procesos/guia-procesos';

/** Espera antes de escribir la búsqueda en la URL mientras se teclea. */
const ESPERA_URL_MS = 300;

@Component({
  selector: 'app-productos',
  imports: [Filtros, GuiaProcesos, TarjetaCafe, VistaRapida, EstadoError, AtraparFoco],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {
  private readonly cafesApi = inject(Cafes);
  private readonly variedadesApi = inject(Variedades);
  private readonly presentacionesApi = inject(Presentaciones);
  private readonly procesosApi = inject(Procesos);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly appRef = inject(ApplicationRef);

  protected readonly cafes = rxResource({ stream: () => this.cafesApi.listar() });
  protected readonly variedades = rxResource({ stream: () => this.variedadesApi.listar() });
  protected readonly presentaciones = rxResource({ stream: () => this.presentacionesApi.listar() });
  protected readonly procesos = rxResource({ stream: () => this.procesosApi.listar() });

  protected readonly ordenes = ORDENES;

  /** Estado del catálogo: fuente de verdad en memoria, reflejada en la URL. */
  protected readonly filtros = signal<EstadoFiltros>(filtrosDesdeUrl(this.ruta.snapshot.queryParamMap));
  private readonly parametros = toSignal(this.ruta.queryParamMap);
  private esperaUrl: ReturnType<typeof setTimeout> | undefined;

  protected readonly todos = computed<Cafe[]>(() => (this.cafes.hasValue() ? this.cafes.value() : []));
  protected readonly resultados = computed(() => aplicarFiltros(this.todos(), this.filtros()));
  protected readonly activos = computed(() => contarFiltrosActivos(this.filtros()));
  protected readonly listaVariedades = computed(() => (this.variedades.hasValue() ? this.variedades.value() : []));
  protected readonly listaPresentaciones = computed(() =>
    this.presentaciones.hasValue() ? this.presentaciones.value() : [],
  );
  protected readonly origenes = computed(() => opcionesDeOrigen(this.todos()));
  protected readonly listaProcesos = computed(() => (this.procesos.hasValue() ? this.procesos.value() : []));
  /** Cafés por variedad, proceso y origen (sobre todo el catálogo): el número de cada fila del filtro. */
  protected readonly conteoVariedades = computed(() => contarPor(this.todos(), 'variedadNombre'));
  protected readonly conteoProcesos = computed(() => contarPor(this.todos(), 'procesoNombre'));
  protected readonly conteoOrigenes = computed(() => {
    const conteo: Record<string, number> = {};
    for (const cafe of this.todos()) {
      conteo[claveOrigen(cafe)] = (conteo[claveOrigen(cafe)] ?? 0) + 1;
    }
    return conteo;
  });

  protected readonly resumen = computed(() => {
    const total = this.todos().length;
    const visibles = this.resultados().length;
    return visibles === total ? contarCafes(total) : `${visibles} de ${contarCafes(total)}`;
  });

  protected readonly cafeSeleccionado = signal<Cafe | null>(null);
  protected readonly panelAbierto = signal(false);
  private readonly panel = viewChild<ElementRef<HTMLDialogElement>>('panelFiltros');

  constructor() {
    // La URL cambió desde fuera (buscador del navbar, enlaces del Inicio, atrás/adelante).
    effect(() => {
      const params = this.parametros();
      if (!params) {
        return;
      }
      const desdeUrl = filtrosDesdeUrl(params);
      if (!mismosFiltros(desdeUrl, this.filtros())) {
        this.filtros.set(desdeUrl);
      }
    });
  }

  /** Cambia filtros: anima el reordenamiento y luego refleja el estado en la URL. */
  protected cambiar(cambios: Partial<EstadoFiltros>): void {
    const nuevo = { ...this.filtros(), ...cambios };
    if (mismosFiltros(nuevo, this.filtros())) {
      return;
    }

    // Escribir en el buscador es frecuente: sin animación y con la URL diferida.
    const soloBusqueda = Object.keys(cambios).length === 1 && 'q' in cambios;
    if (soloBusqueda) {
      this.filtros.set(nuevo);
      clearTimeout(this.esperaUrl);
      this.esperaUrl = setTimeout(() => this.escribirUrl(nuevo), ESPERA_URL_MS);
      return;
    }

    void conTransicion(this.appRef, () => this.filtros.set(nuevo)).then(() => this.escribirUrl(nuevo));
  }

  protected limpiar(): void {
    this.cambiar({ ...FILTROS_VACIOS, orden: this.filtros().orden });
  }

  protected ordenar(evento: Event): void {
    this.cambiar({ orden: (evento.target as HTMLSelectElement).value as Orden });
  }

  protected reintentar(): void {
    this.cafes.reload();
    if (this.variedades.error()) {
      this.variedades.reload();
    }
    if (this.presentaciones.error()) {
      this.presentaciones.reload();
    }
    if (this.procesos.error()) {
      this.procesos.reload();
    }
  }

  // ===== Panel de filtros en móvil =====
  protected abrirPanel(): void {
    this.panel()?.nativeElement.showModal();
    this.panelAbierto.set(true);
  }

  protected cerrarPanel(): void {
    this.panel()?.nativeElement.close();
  }

  protected alCerrarPanel(): void {
    this.panelAbierto.set(false);
  }

  protected clicPanel(evento: MouseEvent): void {
    if (evento.target === this.panel()?.nativeElement) {
      this.cerrarPanel();
    }
  }

  private escribirUrl(f: EstadoFiltros): void {
    if (mismosFiltros(f, filtrosDesdeUrl(this.ruta.snapshot.queryParamMap))) {
      return;
    }
    // scroll: 'manual': al filtrar, el router no lleva la página arriba (sí lo hace al cambiar de ruta).
    void this.router.navigate([], { relativeTo: this.ruta, queryParams: filtrosAUrl(f), replaceUrl: true, scroll: 'manual' });
  }
}
