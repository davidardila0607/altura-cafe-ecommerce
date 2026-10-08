using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Repositories;
using CafeApi.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CafeApi.Controllers
{
    // ✅ Guía de pedidos, paso 11: pedidos del usuario que inició sesión.
    // Rutas: POST /api/Pedido/CrearPedido, GET /api/Pedido/GetPedidos,
    // GET /api/Pedido/GetPedido/{pedidoId} y, para el panel, GET /api/Pedido/Todos.
    [ApiController]
    [Route("api/[controller]")]
    public class PedidoController : ControllerBase
    {
        private const string MensajePedidoNoEncontrado = "Pedido no encontrado.";

        private readonly IPedidoRepository _pedidoRepository;

        public PedidoController(IPedidoRepository pedidoRepository)
        {
            _pedidoRepository = pedidoRepository;
        }

        // ✅ Adaptación D (como en las guías anteriores): la guía responde Ok() siempre y el
        // frontend no sabría si algo falló. El repositorio sigue devolviendo un texto y aquí
        // se traduce a un código HTTP, siempre con { mensaje }:
        //   "El carrito está vacío." → 400 (no hay nada que comprar)
        //   "No puedes comprar tus propios productos." / sin stock / agotado → 409
        //   "Pedido creado correctamente." → 200 { mensaje, pedidoId } (adaptación C)
        [Authorize]
        [HttpPost("CrearPedido")]
        public async Task<IActionResult> Crear()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var mensaje = await _pedidoRepository.CrearPedido(userId);

            if (mensaje == PedidoRepository.MensajeCarritoVacio)
            {
                return BadRequest(new { mensaje });
            }

            if (mensaje == PedidoRepository.MensajeProductoPropio ||
                mensaje.StartsWith(PedidoRepository.InicioMensajeSinStock) ||
                mensaje.EndsWith(PedidoRepository.FinMensajeAgotado))
            {
                return Conflict(new { mensaje });
            }

            // ✅ Adaptación C: se devuelve también el id del pedido para abrir su detalle.
            var pedidoId = await _pedidoRepository.ObtenerUltimoPedidoId(userId);

            return Ok(new { mensaje, pedidoId });
        }

        [Authorize]
        [HttpGet("GetPedidos")]
        public async Task<List<PedidoDto>> Obtener()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return await _pedidoRepository.ObtenerPedidos(userId);
        }

        // ✅ Adaptación D: la guía devuelve el DTO directamente (null sería un 204 vacío).
        // Si el pedido no existe o es de otro usuario → 404 { mensaje }.
        [Authorize]
        [HttpGet("GetPedido/{pedidoId}")]
        public async Task<IActionResult> Obtener([FromRoute] int pedidoId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var pedido = await _pedidoRepository.ObtenerPedido(userId, pedidoId);

            if (pedido == null)
            {
                return NotFound(new { mensaje = MensajePedidoNoEncontrado });
            }

            return Ok(pedido);
        }

        // ✅ Adaptación F: todos los pedidos con el cliente, para /admin/pedidos.
        // Misma política que el inventario (hoy, rol Administrador): un Cliente recibe 403.
        [Authorize(Policy = Politicas.GestionInventario)]
        [HttpGet("Todos")]
        public async Task<List<PedidoAdminDto>> ObtenerTodos()
        {
            return await _pedidoRepository.ObtenerTodos();
        }
    }
}
