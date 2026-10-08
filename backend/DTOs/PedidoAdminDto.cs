namespace CafeApi.DTOs
{
    // ✅ Adaptación F (no está en la guía): un pedido visto desde el panel
    // (GET /api/Pedido/Todos). Es el mismo PedidoDto más los datos del cliente.
    public class PedidoAdminDto : PedidoDto
    {
        public string ClienteNombre { get; set; } = string.Empty;

        public string ClienteEmail { get; set; } = string.Empty;
    }
}
