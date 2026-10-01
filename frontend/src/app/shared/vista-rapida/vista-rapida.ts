import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { marcaVariedad } from '../../core/data/contenido-marca';
import { Cafes } from '../../core/services/cafes';
import { srcsetCloudinary, optimizarImagenCloudinary } from '../../core/utils/imagenes';
import { movimientoReducido } from '../../core/utils/medios';
import { EstadoError } from '../estado-error/estado-error';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';
import { AtraparFoco } from '../atrapar-foco/atrapar-foco';

/** Cantidad máxima que se puede elegir en la vista rápida. */
const CANTIDAD_MAXIMA = 10;
/** Duración de la animación de salida (debe coincidir con el CSS). */
const DURACION_CIERRE_MS = 220;

/**
 * Vista rápida de un café (GET /api/cafes/{id}).
 * Panel lateral en escritorio y hoja inferior en móvil, sobre un <dialog> modal nativo:
 * foco atrapado y fondo inerte; se cierra con la X, con Escape y con clic fuera del panel.
 */
@Component({
  selector: 'app-vista-rapida',
  imports: [CurrencyPipe, EstadoError, SelectorCantidad, AtraparFoco],
  templateUrl: './vista-rapida.html',
  styleUrl: './vista-rapida.css',
})
export class VistaRapida {
  /** Id del café a mostrar; null mantiene el panel cerrado. */
  readonly cafeId = input<number | null>(null);
  readonly cerrar = output<void>();

  private readonly cafesApi = inject(Cafes);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly cafe = rxResource({
    params: () => this.cafeId() ?? undefined,
    stream: ({ params }) => this.cafesApi.obtener(params),
  });

  protected readonly cantidad = signal(1);
  protected readonly cerrando = signal(false);

  protected readonly datos = computed(() => (this.cafe.hasValue() ? this.cafe.value() : null));
  protected readonly marca = computed(() => marcaVariedad(this.datos()?.variedadNombre));
  protected readonly imagen = computed(() => optimizarImagenCloudinary(this.datos()?.imagenUrl, 'f_auto,q_auto,w_1000'));
  protected readonly srcset = computed(() => srcsetCloudinary(this.datos()?.imagenUrl, [600, 900, 1200]));
  protected readonly maximo = computed(() => Math.max(0, Math.min(this.datos()?.stock ?? 0, CANTIDAD_MAXIMA)));
  protected readonly agotado = computed(() => (this.datos()?.stock ?? 0) <= 0);

  constructor() {
    effect(() => {
      const id = this.cafeId();
      const dialogo = this.dialogo().nativeElement;

      if (id !== null && !dialogo.open) {
        this.cantidad.set(1);
        this.cerrando.set(false);
        dialogo.showModal();
      } else if (id === null && dialogo.open) {
        dialogo.close();
      }
    });
  }

  /** Cierre animado (la X, Escape y el clic fuera pasan por aquí). */
  protected solicitarCierre(): void {
    if (this.cerrando()) {
      return;
    }

    const dialogo = this.dialogo().nativeElement;
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
}
