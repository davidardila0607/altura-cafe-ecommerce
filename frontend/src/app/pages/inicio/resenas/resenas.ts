import { Component, computed, signal } from '@angular/core';
import { PROMEDIO_RESENAS, RESENAS } from '../../../core/data/resenas';
import { movimientoReducido } from '../../../core/utils/medios';
import { TarjetaResena } from './tarjeta-resena';

/** Cuántas reseñas se ven a la vez con movimiento reducido. */
const POR_PAGINA = 3;

/**
 * Cierre del Inicio ("Cumbre"): reseñas de clientes (de ejemplo, ver core/data/resenas.ts).
 *
 * Con movimiento: una "rueda" (marquesina vertical). Las 10 reseñas se reparten en dos columnas
 * que suben despacio y sin fin; la segunda va desfasada media vuelta. Cada columna tiene su lista
 * dos veces seguidas (la copia con aria-hidden): al subir exactamente el alto de una lista
 * (translateY(-50%)) la copia queda donde empezó la original y el bucle no da saltos. Bordes con
 * máscara de gradiente. Se pausa con el mouse encima, con el foco del teclado o con el botón
 * "Pausar" (WCAG 2.2.2: todo movimiento automático de más de 5 s debe poder detenerse).
 *
 * Con movimiento reducido: nada se mueve solo; se ven 3 reseñas y los botones Anterior / Siguiente.
 */
@Component({
  selector: 'app-resenas',
  imports: [TarjetaResena],
  templateUrl: './resenas.html',
  styleUrl: './resenas.css',
})
export class Resenas {
  protected readonly resenas = RESENAS;
  protected readonly promedio = PROMEDIO_RESENAS.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  protected readonly estrellasPromedio = Math.round(PROMEDIO_RESENAS);

  /** Se decide una vez al cargar, como el resto del Inicio. */
  protected readonly reducido = movimientoReducido();

  /** Dos columnas: reseñas pares e impares (5 y 5). En móvil solo se ve la primera. */
  protected readonly columnas = [RESENAS.filter((_, i) => i % 2 === 0), RESENAS.filter((_, i) => i % 2 === 1)];

  protected readonly pausada = signal(false);

  // ===== Movimiento reducido: de 3 en 3 =====
  protected readonly pagina = signal(0);
  protected readonly paginas = Math.ceil(RESENAS.length / POR_PAGINA);
  /** La última página empieza antes para mostrar siempre 3 (8, 9 y 10). */
  protected readonly inicio = computed(() => Math.min(this.pagina() * POR_PAGINA, RESENAS.length - POR_PAGINA));
  protected readonly visibles = computed(() => RESENAS.slice(this.inicio(), this.inicio() + POR_PAGINA));

  protected anterior(): void {
    this.pagina.update((p) => Math.max(0, p - 1));
  }

  protected siguiente(): void {
    this.pagina.update((p) => Math.min(this.paginas - 1, p + 1));
  }
}
