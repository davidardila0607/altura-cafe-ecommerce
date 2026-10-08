namespace CafeApi.DTOs
{
    // ✅ Un pedido visto desde el panel (historial de compras): el mismo PedidoDto
    // más los datos del cliente, las unidades y la transacción de Wompi.
    public class PedidoAdminDto : PedidoDto
    {
        public string ClienteNombre { get; set; } = string.Empty;

        public string ClienteEmail { get; set; } = string.Empty;

        // Suma de las cantidades de sus cafés.
        public int Unidades { get; set; }

        // Id de la última transacción que informó Wompi (o "SIM-…" en modo simulación).
        public string? TransactionIdWompi { get; set; }
    }

    // ✅ Respuesta de GET /api/Pedido/Historial: indicadores de las compras pagadas
    // (del rango y el texto filtrados) y la lista de pedidos.
    public class HistorialDto
    {
        public int ComprasPagadas { get; set; }

        public int UnidadesVendidas { get; set; }

        public decimal Ingresos { get; set; }

        public List<PedidoAdminDto> Pedidos { get; set; } = new();
    }
}
