using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Guía de pedidos, paso 7: contrato del repositorio de pedidos.
    // CrearPedido devuelve un texto (como la guía); PedidoController lo traduce a un código HTTP.
    public interface IPedidoRepository
    {
        Task<string> CrearPedido(int usuarioId);

        Task<List<PedidoDto>> ObtenerPedidos(int usuarioId);

        // ✅ Corrección de la guía: la interfaz decía Task<PedidoDto>, pero la implementación
        // devuelve null cuando el pedido no existe o es de otro usuario.
        Task<PedidoDto?> ObtenerPedido(int usuarioId, int pedidoId);

        // ✅ Adaptación C: id del pedido más reciente del usuario (el que se acaba de crear),
        // para que el frontend pueda abrirlo.
        Task<int?> ObtenerUltimoPedidoId(int usuarioId);

        // ✅ Adaptación F: todos los pedidos con los datos del cliente (panel de administración).
        Task<List<PedidoAdminDto>> ObtenerTodos();
    }
}
