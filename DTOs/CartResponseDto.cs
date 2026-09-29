namespace CafeApi.DTOs
{
    // ✅ Representa el carrito completo.
    public class CartResponseDto
    {
        // ✅ Identificador del carrito.
        public int CartId { get; set; }

        // ✅ Usuario propietario.
        public int UserId { get; set; }

        // ✅ Productos del carrito.
        public List<CartItemResponseDto> Items { get; set; }
            = new();

        // ✅ Número total de productos.
        public int CantidadItems { get; set; }

        // ✅ Valor total del carrito.
        public decimal Total { get; set; }
    }
}