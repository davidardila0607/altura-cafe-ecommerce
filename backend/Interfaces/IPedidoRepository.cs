using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Guía de pedidos, paso 7: contrato del repositorio de pedidos.
    // CrearPedido devuelve un texto (como la guía); PedidoController lo traduce a un código HTTP.
    public interface IPedidoRepository
    {
        // Adaptación (dirección de envío): la guía solo recibe usuarioId.
        Task<string> CrearPedido(int usuarioId, DatosEnvioDto datos);

        Task<List<PedidoDto>> ObtenerPedidos(int usuarioId);

        // ✅ Corrección de la guía: la interfaz decía Task<PedidoDto>, pero la implementación
        // devuelve null cuando el pedido no existe o es de otro usuario.
        Task<PedidoDto?> ObtenerPedido(int usuarioId, int pedidoId);

        // ✅ Adaptación C: id del pedido más reciente del usuario (el que se acaba de crear),
        // para que el frontend pueda abrirlo.
        Task<int?> ObtenerUltimoPedidoId(int usuarioId);

        // ✅ Historial de compras del panel (reemplaza a ObtenerTodos, adaptación F):
        // filtros opcionales e indicadores de las compras pagadas.
        Task<HistorialDto> ObtenerHistorial(string? estado, DateOnly? desde, DateOnly? hasta, string? texto);

        // ✅ Guía 3, adaptación 4: null si el pedido se puede pagar; si no, el motivo.
        Task<string?> ValidarPago(int usuarioId, int pedidoId);

        // ✅ Guía 3, paso 12.
        Task<WompiPagoDto?> PrepararPago(int usuarioId, int pedidoId);

        // ✅ Guía 3, paso 17.
        Task ProcesarPagoWompi(WompiWebhookDto webhook);
    }
}
