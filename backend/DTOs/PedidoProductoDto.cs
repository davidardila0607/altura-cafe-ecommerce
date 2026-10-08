namespace CafeApi.DTOs
{
    // ✅ Guía de pedidos, paso 6: un café dentro de un pedido.
    // Precio es el guardado en el pedido (el del momento de la compra), no el actual del café.
    public class PedidoProductoDto
    {
        public int ProductoId { get; set; }

        public string? Nombre { get; set; }

        public string? ImagenUrl { get; set; }

        public int Cantidad { get; set; }

        public decimal Precio { get; set; }
    }
}
