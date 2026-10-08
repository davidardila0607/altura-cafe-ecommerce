/**
 * Pedidos (guía de pedidos). Coinciden con los DTOs del backend (JSON en camelCase):
 * PedidoDto, PedidoProductoDto y PedidoAdminDto.
 */
export type EstadoPedido = 'Pendiente' | 'Pagado' | 'Rechazado';

export interface PedidoProductoDto {
  /** Id del café (la guía lo llama "producto"). */
  productoId: number;
  nombre: string | null;
  imagenUrl: string | null;
  cantidad: number;
  /** Precio guardado al crear el pedido (no cambia aunque cambie el del café). */
  precio: number;
}

export interface PedidoDto {
  id: number;
  /** Fecha en UTC (ISO 8601); el pipe date la muestra en la hora local. */
  fecha: string;
  estado: EstadoPedido;
  total: number;
  productos: PedidoProductoDto[];
}

/** Un pedido en el panel (GET /api/Pedido/Todos): el mismo PedidoDto más el cliente. */
export interface PedidoAdminDto extends PedidoDto {
  clienteNombre: string;
  clienteEmail: string;
}

/** Respuesta de POST /api/Pedido/CrearPedido (200). */
export interface RespuestaCrearPedido {
  mensaje: string;
  pedidoId: number;
}

/** Unidades de un pedido (suma de las cantidades). */
export function unidadesDe(pedido: PedidoDto): number {
  return pedido.productos.reduce((suma, p) => suma + p.cantidad, 0);
}
