namespace CafeApi.DTOs
{
    // ✅ Representa una línea del carrito.
    public class CartItemResponseDto
    {
        // ✅ Producto asociado.
        public int CafeId { get; set; }

        // ✅ Nombre visible para Angular.
        public string CafeNombre { get; set; } = string.Empty;

        // ✅ Preparado para futuras imágenes.
        public string ImagenUrl { get; set; } = string.Empty;

        // ✅ Precio unitario congelado.
        public decimal Precio { get; set; }

        // ✅ Cantidad agregada al carrito.
        public int Cantidad { get; set; }

        // ✅ Precio × Cantidad.
        public decimal Subtotal { get; set; }
    }
}