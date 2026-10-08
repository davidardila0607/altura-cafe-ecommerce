/**
 * Pedidos (guía de pedidos y guía 3). Coinciden con los DTOs del backend (JSON en camelCase):
 * PedidoDto, PedidoProductoDto, PedidoAdminDto, HistorialDto y DatosEnvioDto.
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
  /** Referencia del pago ante Wompi: "PEDIDO-15" (o "PEDIDO-15-2" si se reintentó). */
  referenciaWompi: string;
  direccionEnvio: string;
  ciudad: string;
  departamento: string;
  telefono: string;
  notasEntrega: string | null;
  productos: PedidoProductoDto[];
}

/** Un pedido en el historial del panel: el mismo PedidoDto más el cliente, las unidades y la transacción. */
export interface PedidoAdminDto extends PedidoDto {
  clienteNombre: string;
  clienteEmail: string;
  unidades: number;
  transactionIdWompi: string | null;
}

/** GET /api/Pedido/Historial: indicadores de las compras pagadas y la lista filtrada. */
export interface HistorialDto {
  comprasPagadas: number;
  unidadesVendidas: number;
  ingresos: number;
  pedidos: PedidoAdminDto[];
}

/** Filtros opcionales del historial (las fechas en formato AAAA-MM-DD). */
export interface FiltrosHistorial {
  estado: EstadoPedido | '';
  desde: string;
  hasta: string;
  texto: string;
}

/** Cuerpo de POST /api/Pedido/CrearPedido (DatosEnvioDto). */
export interface DatosEnvioDto {
  direccionEnvio: string;
  ciudad: string;
  departamento: string;
  telefono: string;
  notasEntrega: string | null;
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

/** "Pendiente" y "Rechazado" se pueden pagar (un rechazado se reintenta). */
export function sePuedePagar(pedido: PedidoDto): boolean {
  return pedido.estado === 'Pendiente' || pedido.estado === 'Rechazado';
}
