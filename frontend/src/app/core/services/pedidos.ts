import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatosEnvioDto, FiltrosHistorial, HistorialDto, PedidoDto, RespuestaCrearPedido } from '../models/pedido';
import { Carrito } from './carrito';

/**
 * Pedidos (guía de pedidos). Consume los endpoints de /api/Pedido; el interceptor agrega el token.
 * Un pedido se crea con lo que hay en el carrito y los datos de envío: la API copia los cafés
 * con su precio actual, deja el pedido "Pendiente" y vacía el carrito.
 */
@Service()
export class Pedidos {
  private readonly http = inject(HttpClient);
  private readonly carrito = inject(Carrito);
  private readonly url = `${environment.apiBaseUrl}/Pedido`;

  /**
   * POST /api/Pedido/CrearPedido con los datos de envío → { mensaje, pedidoId }.
   * Si la API responde 400 (carrito vacío o datos inválidos) o 409 (café propio o sin stock),
   * lanza el error para que el componente muestre su mensaje. Pase lo que pase, se recarga el
   * carrito: si salió bien, el contador del navbar vuelve a 0.
   */
  async crear(datos: DatosEnvioDto): Promise<RespuestaCrearPedido> {
    try {
      return await firstValueFrom(this.http.post<RespuestaCrearPedido>(`${this.url}/CrearPedido`, datos));
    } finally {
      await this.carrito.cargar();
    }
  }

  /** GET /api/Pedido/GetPedidos: los del usuario, el más reciente primero. */
  misPedidos(): Observable<PedidoDto[]> {
    return this.http.get<PedidoDto[]>(`${this.url}/GetPedidos`);
  }

  /** GET /api/Pedido/GetPedido/{pedidoId}: 404 si no existe o es de otro usuario. */
  pedido(pedidoId: number): Observable<PedidoDto> {
    return this.http.get<PedidoDto>(`${this.url}/GetPedido/${pedidoId}`);
  }

  /** GET /api/Pedido/Historial con los filtros que tengan valor (solo Administrador). */
  historial(filtros: FiltrosHistorial): Observable<HistorialDto> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor.trim()) {
        params = params.set(clave, valor.trim());
      }
    }
    return this.http.get<HistorialDto>(`${this.url}/Historial`, { params });
  }
}
