import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { Cafe } from '../../core/models/cafe';
import { Avisos } from '../../core/services/avisos';
import { Carrito } from '../../core/services/carrito';
import { mensajeDeError } from '../../core/utils/errores';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';

/** Por qué no se puede agregar el café (o 'disponible' si sí se puede). */
type Estado = 'disponible' | 'propio' | 'agotado' | 'completo';

const TEXTO_BLOQUEADO: Record<Exclude<Estado, 'disponible'>, string> = {
  propio: 'Este café es tuyo',
  agotado: 'Agotado',
  completo: 'Ya tienes todas las unidades disponibles',
};

/**
 * Selector de cantidad + botón "Agregar al carrito" (cards y vista rápida).
 *
 * - La cantidad va de 1 hasta las unidades que todavía se pueden agregar
 *   (stock − las que ya están en el carrito).
 * - Sin sesión, el botón lleva a /login y después vuelve a esta página.
 * - El dueño del café, un café agotado o uno que ya está completo en el carrito
 *   muestran un botón deshabilitado que explica el motivo.
 * - 'compacta' (cards): el resultado se avisa abajo a la derecha (ZonaAvisos).
 *   'completa' (vista rápida, que es un <dialog> modal): el aviso va dentro del panel,
 *   porque lo que está fuera del diálogo no se puede pulsar.
 */
@Component({
  selector: 'app-agregar-carrito',
  imports: [SelectorCantidad, RouterLink],
  templateUrl: './agregar-carrito.html',
  styleUrl: './agregar-carrito.css',
  host: { '[class.compacta]': "variante() === 'compacta'" },
})
export class AgregarCarrito {
  readonly cafe = input.required<Cafe>();
  readonly variante = input<'compacta' | 'completa'>('completa');

  private readonly auth = inject(Auth);
  private readonly carrito = inject(Carrito);
  private readonly avisos = inject(Avisos);
  private readonly router = inject(Router);

  /** Unidades que todavía se pueden agregar. */
  protected readonly disponibles = computed(() => Math.max(0, this.cafe().stock - this.carrito.cantidadDe(this.cafe().id)));

  protected readonly estado = computed<Estado>(() => {
    const sesion = this.auth.sesion();
    if (sesion && this.cafe().usuarioId === sesion.id) {
      return 'propio';
    }
    if (this.cafe().stock <= 0) {
      return 'agotado';
    }
    return this.disponibles() > 0 ? 'disponible' : 'completo';
  });

  protected readonly textoBloqueado = computed(() => {
    const estado = this.estado();
    return estado === 'disponible' ? '' : TEXTO_BLOQUEADO[estado];
  });

  /** Si baja el máximo (por ejemplo, porque se agregaron unidades), la cantidad se ajusta sola. */
  protected readonly cantidad = linkedSignal<number, number>({
    source: this.disponibles,
    computation: (maximo, previo) => Math.max(1, Math.min(previo?.value ?? 1, maximo)),
  });

  protected readonly enviando = signal(false);
  /** Aviso dentro del panel (solo variante 'completa'); se limpia al cambiar de café. */
  protected readonly mensaje = linkedSignal<number, { tipo: 'exito' | 'error'; texto: string } | null>({
    source: () => this.cafe().id,
    computation: () => null,
  });

  protected async agregar(): Promise<void> {
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/login'], { queryParams: { volver: this.router.url } });
      return;
    }

    const completa = this.variante() === 'completa';
    this.enviando.set(true);
    this.mensaje.set(null);
    try {
      await this.carrito.agregar(this.cafe().id, this.cantidad());
      this.cantidad.set(1);
      if (completa) {
        this.mensaje.set({ tipo: 'exito', texto: 'Agregado al carrito.' });
      } else {
        this.avisos.exito('Agregado al carrito', { texto: 'Ver carrito', ruta: '/carrito' });
      }
    } catch (error) {
      // 404 (el café ya no existe) o 409 (propio, agotado o sin unidades): texto de la API.
      const texto = mensajeDeError(error);
      if (completa) {
        this.mensaje.set({ tipo: 'error', texto });
      } else {
        this.avisos.error(texto);
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
