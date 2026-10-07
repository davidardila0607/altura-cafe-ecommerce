import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auth } from '../auth/auth';
import { CarritoDto, RespuestaCarrito } from '../models/carrito';

/**
 * Carrito de compras del usuario (Guía 2). Consume los 5 endpoints de /api/Carrito.
 *
 * - El carrito vive en la base de datos; aquí se guarda una copia en un signal para que el
 *   contador del navbar, el panel y la página /carrito se actualicen solos.
 * - Se carga al iniciar sesión (o al recargar la página con una sesión guardada) y se borra
 *   de la memoria al cerrar sesión.
 * - Después de cada cambio se vuelve a pedir el carrito: así los totales siempre son los que
 *   calcula la API (una sola fuente de verdad).
 * - Los métodos que modifican devuelven el { mensaje } de la API; si la API responde 404 o 409,
 *   lanzan el error para que el componente muestre su mensaje (mensajeDeError).
 */
@Service()
export class Carrito {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);
  private readonly url = `${environment.apiBaseUrl}/Carrito`;

  private readonly _datos = signal<CarritoDto | null>(null);
  readonly datos = this._datos.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal(false);

  readonly productos = computed(() => this._datos()?.productos ?? []);
  /** Suma de las cantidades: es el número del ícono del carrito. */
  readonly totalUnidades = computed(() => this._datos()?.totalUnidades ?? 0);
  readonly total = computed(() => this._datos()?.total ?? 0);

  constructor() {
    // Cada vez que cambia la sesión (inicia, se restaura o se cierra) se recarga o se vacía.
    effect(() => {
      const token = this.auth.sesion()?.token;
      untracked(() => (token ? void this.cargar() : this._datos.set(null)));
    });
  }

  /** Unidades de este café que ya están en el carrito (0 si no está). */
  cantidadDe(productoId: number): number {
    return this.productos().find((p) => p.productoId === productoId)?.cantidad ?? 0;
  }

  /** GET /api/Carrito/GetCarrito (la API crea el carrito vacío la primera vez). */
  async cargar(): Promise<void> {
    const token = this.auth.sesion()?.token;
    if (!token) {
      return;
    }
    this.cargando.set(true);
    this.error.set(false);
    try {
      const datos = await firstValueFrom(this.http.get<CarritoDto>(`${this.url}/GetCarrito`));
      // Si la sesión cambió mientras llegaba la respuesta, se descarta.
      if (this.auth.sesion()?.token === token) {
        this._datos.set(datos);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  /** POST /api/Carrito/AgregarProducto */
  agregar(productId: number, cantidad: number): Promise<string> {
    return this.modificar(this.http.post<RespuestaCarrito>(`${this.url}/AgregarProducto`, { productId, cantidad }));
  }

  /** PUT /api/Carrito/ActualizarCarrito */
  actualizar(productId: number, cantidad: number): Promise<string> {
    return this.modificar(this.http.put<RespuestaCarrito>(`${this.url}/ActualizarCarrito`, { productId, cantidad }));
  }

  /** DELETE /api/Carrito/EliminarProducto/{productId} */
  eliminar(productId: number): Promise<string> {
    return this.modificar(this.http.delete<RespuestaCarrito>(`${this.url}/EliminarProducto/${productId}`));
  }

  /** DELETE /api/Carrito/VaciarCarrito */
  vaciar(): Promise<string> {
    return this.modificar(this.http.delete<RespuestaCarrito>(`${this.url}/VaciarCarrito`));
  }

  /** Envía el cambio y, salga bien o mal, recarga el carrito (el stock pudo cambiar). */
  private async modificar(peticion: Observable<RespuestaCarrito>): Promise<string> {
    try {
      const { mensaje } = await firstValueFrom(peticion);
      return mensaje;
    } finally {
      await this.cargar();
    }
  }
}
