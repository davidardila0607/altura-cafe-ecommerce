using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CafeApi.Controllers
{
    // ✅ Guía 2, paso 14: carrito del usuario que inició sesión.
    // Rutas: GET /api/Carrito/GetCarrito, POST /api/Carrito/AgregarProducto,
    // PUT /api/Carrito/ActualizarCarrito, DELETE /api/Carrito/EliminarProducto/{productId}
    // y DELETE /api/Carrito/VaciarCarrito. Todas exigen un JWT válido.
    [ApiController]
    [Route("api/[controller]")]
    public class CarritoController : ControllerBase
    {
        private readonly ICarritoRepository _carritoRepository;

        public CarritoController(ICarritoRepository carritoRepository)
        {
            _carritoRepository = carritoRepository;
        }

        // ✅ El userId sale del token y no del cuerpo de la petición:
        // así nadie puede ver ni cambiar el carrito de otra persona.
        [Authorize]
        [HttpGet("GetCarrito")]
        public async Task<IActionResult> Obtener()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _carritoRepository.ObtenerCarrito(userId));
        }

        [Authorize]
        [HttpPost("AgregarProducto")]
        public async Task<IActionResult> Agregar([FromBody] AddProductDto item)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Responder(await _carritoRepository.AgregarProducto(userId, item));
        }

        [Authorize]
        [HttpPut("ActualizarCarrito")]
        public async Task<IActionResult> Actualizar([FromBody] AddProductDto item)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Responder(await _carritoRepository.ActualizarProducto(userId, item));
        }

        [Authorize]
        [HttpDelete("EliminarProducto/{productId}")]
        public async Task<IActionResult> Eliminar([FromRoute] int productId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Responder(await _carritoRepository.EliminarProducto(userId, productId));
        }

        [Authorize]
        [HttpDelete("VaciarCarrito")]
        public async Task<IActionResult> Vaciar()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Responder(await _carritoRepository.VaciarCarrito(userId));
        }

        // ✅ Adaptación D (igual que la adaptación 7 de la Guía 1): la guía responde Ok()
        // siempre y el frontend no sabría si algo falló. El repositorio sigue devolviendo
        // un texto y aquí se traduce a un código HTTP, siempre con { mensaje }:
        //   "El producto no existe." / "El producto no está en el carrito." → 404
        //   "No puedes comprar tu propio producto." / "El producto está agotado." /
        //   "Solo hay N unidades disponibles de este café." → 409 (choca con el estado actual)
        //   cualquier otro texto (los de éxito) → 200
        private IActionResult Responder(string mensaje)
        {
            if (mensaje == CarritoRepository.MensajeProductoNoExiste ||
                mensaje == CarritoRepository.MensajeNoEstaEnCarrito)
            {
                return NotFound(new { mensaje });
            }

            if (mensaje == CarritoRepository.MensajeProductoPropio ||
                mensaje == CarritoRepository.MensajeAgotado ||
                mensaje.StartsWith(CarritoRepository.InicioMensajeSinStock))
            {
                return Conflict(new { mensaje });
            }

            return Ok(new { mensaje });
        }
    }
}
