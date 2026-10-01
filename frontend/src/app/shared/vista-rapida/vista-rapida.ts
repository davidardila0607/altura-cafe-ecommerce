import { CurrencyPipe } from '@angular/common';
import {
  ApplicationRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { marcaVariedad } from '../../core/data/contenido-marca';
import { Cafe } from '../../core/models/cafe';
import { Cafes } from '../../core/services/cafes';
import { optimizarImagenCloudinary, srcsetCloudinary } from '../../core/utils/imagenes';
import { movimientoReducido } from '../../core/utils/medios';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';

/** Cantidad máxima que se puede elegir en la vista rápida. */
const CANTIDAD_MAXIMA = 10;
/** Duración de la animación de salida sin vuelo (debe coincidir con el CSS). */
const DURACION_CIERRE_MS = 220;

/**
 * Vista rápida de un café sobre un <dialog> modal nativo (foco atrapado y fondo inerte;
 * se cierra con la X, con Escape y con clic fuera del panel).
 *
 * Muestra enseguida los datos del café que viene de la lista y los actualiza con
 * GET /api/cafes/{id} (por ejemplo, si cambió el stock).
 *
 * "Vuelo de la bolsa": la imagen de la card y la del panel comparten el nombre de View
 * Transition "bolsa". El navegador toma una foto del estado anterior (la bolsa en la card),
 * aplicamos el cambio (abrir el diálogo) y anima la bolsa desde su posición vieja hasta la
 * nueva. Al cerrar se hace lo mismo al revés. Sin soporte de la API o con movimiento reducido,
 * el panel solo aparece con un fundido.
 */
@Component({
  selector: 'app-vista-rapida',
  imports: [CurrencyPipe, SelectorCantidad, AtraparFoco],
  templateUrl: './vista-rapida.html',
  styleUrl: './vista-rapida.css',
})
export class VistaRapida {
  /** Café a mostrar; null mantiene el panel cerrado. */
  readonly cafe = input<Cafe | null>(null);
  readonly cerrar = output<void>();

  private readonly cafesApi = inject(Cafes);
  private readonly appRef = inject(ApplicationRef);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly imagenPanel = viewChild<ElementRef<HTMLImageElement>>('imagenPanel');

  /** Datos frescos del café (GET /api/cafes/{id}). */
  protected readonly detalle = rxResource({
    params: () => this.cafe()?.id,
    stream: ({ params }) => this.cafesApi.obtener(params),
  });

  protected readonly cantidad = signal(1);
  protected readonly cerrando = signal(false);
  /** Mientras vuela la bolsa se usa la misma imagen de la card (ya descargada). */
  protected readonly imagenDeVuelo = signal<string | null>(null);

  /** Los datos de la API si ya llegaron y son de este café; si no, los de la lista. */
  protected readonly datos = computed(() => {
    const fresco = this.detalle.hasValue() ? this.detalle.value() : null;
    return fresco && fresco.id === this.cafe()?.id ? fresco : this.cafe();
  });
  protected readonly marca = computed(() => marcaVariedad(this.datos()?.variedadNombre));
  protected readonly imagen = computed(() => optimizarImagenCloudinary(this.datos()?.imagenUrl, 'f_auto,q_auto,w_900'));
  protected readonly srcset = computed(() => srcsetCloudinary(this.datos()?.imagenUrl, [600, 900, 1200]));
  protected readonly maximo = computed(() => Math.max(0, Math.min(this.datos()?.stock ?? 0, CANTIDAD_MAXIMA)));
  protected readonly agotado = computed(() => (this.datos()?.stock ?? 0) <= 0);

  constructor() {
    effect(() => {
      const cafe = this.cafe();
      const dialogo = this.dialogo().nativeElement;
      if (cafe && !dialogo.open) {
        untracked(() => this.abrir(cafe.id));
      } else if (!cafe && dialogo.open) {
        dialogo.close();
      }
    });
  }

  private abrir(id: number): void {
    const dialogo = this.dialogo().nativeElement;
    this.cantidad.set(1);
    this.cerrando.set(false);

    const origen = this.bolsaDeLaCard(id);
    if (!origen || !this.puedeVolar()) {
      dialogo.showModal();
      return;
    }

    this.imagenDeVuelo.set(origen.currentSrc || origen.src);
    origen.style.viewTransitionName = 'bolsa';
    this.conVuelo(async () => {
      origen.style.viewTransitionName = '';
      this.appRef.tick(); // el panel ya tiene la imagen antes de la foto del estado nuevo
      dialogo.showModal();
      await this.imagenPanel()?.nativeElement.decode().catch(() => undefined);
    }).then(() => this.imagenDeVuelo.set(null));
  }

  /** Cierre animado (la X, Escape y el clic fuera pasan por aquí). */
  protected solicitarCierre(): void {
    const dialogo = this.dialogo().nativeElement;
    if (this.cerrando() || !dialogo.open) {
      return;
    }

    // Si la card de origen está en pantalla, la bolsa vuelve volando a ella.
    const origen = this.bolsaDeLaCard(this.cafe()?.id);
    if (origen && this.puedeVolar() && this.estaEnPantalla(origen)) {
      void this.conVuelo(() => {
        dialogo.close();
        origen.style.viewTransitionName = 'bolsa';
      }).then(() => (origen.style.viewTransitionName = ''));
      return;
    }

    if (movimientoReducido()) {
      dialogo.close();
      return;
    }
    this.cerrando.set(true);
    setTimeout(() => dialogo.close(), DURACION_CIERRE_MS);
  }

  /** Escape dispara "cancel": se intercepta para animar la salida. */
  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.solicitarCierre();
  }

  /** El <dialog> ocupa toda la ventana: un clic que no cae dentro del panel es un clic fuera. */
  protected alHacerClic(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) {
      this.solicitarCierre();
    }
  }

  protected alCerrar(): void {
    this.cerrando.set(false);
    this.cerrar.emit();
  }

  /** Ejecuta un cambio dentro de una View Transition marcada como "vuelo" (ver styles.css). */
  private conVuelo(cambio: () => void | Promise<void>): Promise<void> {
    const raiz = document.documentElement;
    raiz.classList.add('transicion-vuelo');
    const transicion = document.startViewTransition(cambio);
    transicion.ready.catch(() => undefined);
    return transicion.finished.catch(() => undefined).finally(() => raiz.classList.remove('transicion-vuelo'));
  }

  private puedeVolar(): boolean {
    return !movimientoReducido() && 'startViewTransition' in document;
  }

  /** Imagen de la card de este café (las cards la marcan con data-bolsa). */
  private bolsaDeLaCard(id: number | undefined): HTMLImageElement | null {
    return id === undefined ? null : document.querySelector<HTMLImageElement>(`img[data-bolsa="${id}"]`);
  }

  private estaEnPantalla(el: HTMLElement): boolean {
    const caja = el.getBoundingClientRect();
    return caja.bottom > 0 && caja.top < window.innerHeight;
  }
}
