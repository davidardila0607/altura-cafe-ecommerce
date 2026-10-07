/**
 * Carrito de compras (Guía 2). Coinciden con los DTOs del backend (JSON en camelCase):
 * CarritoDto, CarritoProductoDto y AddProductDto.
 */
export interface CarritoProductoDto {
  /** Id del café (la guía lo llama "producto"). */
  productoId: number;
  nombre: string | null;
  imagenUrl: string | null;
  /** Precio unitario en pesos, sin decimales. */
  precio: number;
  cantidad: number;
  subtotal: number;
  variedad: string | null;
  proceso: string | null;
  presentacionGramos: number;
  /** Unidades disponibles del café: el selector de cantidad no pasa de aquí. */
  stock: number;
}

export interface CarritoDto {
  carritoId: number;
  productos: CarritoProductoDto[];
  total: number;
  totalUnidades: number;
}

/** Cuerpo de AgregarProducto y ActualizarCarrito. */
export interface AddProductDto {
  productId: number;
  cantidad: number;
}

/** Respuesta de las operaciones que modifican el carrito (200, 404 o 409). */
export interface RespuestaCarrito {
  mensaje: string;
}
