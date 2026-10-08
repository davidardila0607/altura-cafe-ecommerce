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

        // ✅ Guía 3: referencia del pago ante Wompi ("PEDIDO-15"). La muestra la pasarela y la
        // usa ConfirmarPago para comprobar que una transacción es de este pedido.
        public string ReferenciaWompi { get; set; } = string.Empty;

        // ✅ Dirección de envío (adaptación a la guía de pedidos).
        public string DireccionEnvio { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string Departamento { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string? NotasEntrega { get; set; }

        public List<PedidoProductoDto> Productos { get; set; } = new();
    }
}
