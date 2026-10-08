namespace CafeApi.DTOs
{
    // ✅ Guía de pedidos, paso 6: un pedido con sus productos
    // (respuesta de GET /api/Pedido/GetPedidos y GET /api/Pedido/GetPedido/{pedidoId}).
    public class PedidoDto
    {
        public int Id { get; set; }

        public DateTime Fecha { get; set; }

        public string? Estado { get; set; }

        public decimal Total { get; set; }

        public List<PedidoProductoDto> Productos { get; set; } = new();
    }
}
