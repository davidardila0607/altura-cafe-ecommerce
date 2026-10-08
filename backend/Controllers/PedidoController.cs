using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using CafeApi.Repositories;
using CafeApi.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace CafeApi.Controllers
{
    // ✅ Guía de pedidos, paso 11: pedidos del usuario que inició sesión.
    // Rutas: POST /api/Pedido/CrearPedido, GET /api/Pedido/GetPedidos,
    // GET /api/Pedido/GetPedido/{pedidoId} y, para el panel, GET /api/Pedido/Todos.
    // Guía 3 (Wompi): POST {id}/PrepararPago, POST Webhook (público), POST {id}/SimularPago
    // (solo en modo simulación) y POST {id}/ConfirmarPago (solo con Wompi real).
    [ApiController]
    [Route("api/[controller]")]
    public class PedidoController : ControllerBase
    {
        private const string MensajePedidoNoEncontrado = "Pedido no encontrado.";

        private readonly IPedidoRepository _pedidoRepository;
        private readonly IWompiService _wompiService;
        private readonly WompiSettings _wompiSettings;

        public PedidoController(
            IPedidoRepository pedidoRepository,
            IWompiService wompiService,
            IOptions<WompiSettings> options)
        {
            _pedidoRepository = pedidoRepository;
            _wompiService = wompiService;
            _wompiSettings = options.Value;
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

        // ===== Guía 3: pagos con Wompi =====

        // ✅ Guía 3, paso 15: datos firmados para abrir el pago.
        // Adaptación 4: 404 si el pedido no existe o es de otro usuario; 409 si ya está pagado
        // o si falta stock de algún café; un pedido rechazado se puede volver a pagar.
        [Authorize]
        [HttpPost("{id:int}/PrepararPago")]
        public async Task<IActionResult> PrepararPago(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var problema = await _pedidoRepository.ValidarPago(userId, id);
            if (problema != null)
            {
                return RespuestaDeProblema(problema);
            }

            var pago = await _pedidoRepository.PrepararPago(userId, id);
            if (pago == null)
            {
                return NotFound(new { mensaje = MensajePedidoNoEncontrado });
            }

            return Ok(pago);
        }

        // ✅ Guía 3, paso 16: Wompi avisa aquí que una transacción cambió de estado.
        // Es público (Wompi no tiene nuestro token): lo protege la validación del checksum.
        [HttpPost("Webhook")]
        public async Task<IActionResult> Webhook([FromBody] WompiWebhookDto webhook)
        {
            return await RecibirEvento(webhook);
        }

        // ✅ Adaptación 1 (modo simulación): la "pasarela de pruebas" de Altura. Arma el mismo
        // evento que enviaría Wompi, lo firma con nuestro EventSecret y lo pasa por el mismo
        // camino que el webhook real (RecibirEvento → ValidarEvento → ProcesarPagoWompi).
        // Solo existe con ModoSimulado = true; con Wompi real responde 404.
        [Authorize]
        [HttpPost("{id:int}/SimularPago")]
        public async Task<IActionResult> SimularPago(int id, [FromBody] SimularPagoDto datos)
        {
            if (!_wompiSettings.ModoSimulado)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var problema = await _pedidoRepository.ValidarPago(userId, id);
            if (problema != null)
            {
                return RespuestaDeProblema(problema);
            }

            // Referencia y monto vigentes del pedido (los mismos que firmó PrepararPago).
            var pago = await _pedidoRepository.PrepararPago(userId, id);
            if (pago == null)
            {
                return NotFound(new { mensaje = MensajePedidoNoEncontrado });
            }

            var evento = new WompiWebhookDto
            {
                Event = "transaction.updated",
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Data = new WompiData
                {
                    Transaction = new WompiTransaction
                    {
                        Id = $"SIM-{Guid.NewGuid()}",
                        Reference = pago.Reference,
                        Status = datos.Aprobado ? "APPROVED" : "DECLINED",
                        AmountInCents = pago.AmountInCents,
                        Currency = pago.Currency
                    }
                },
                // Las mismas propiedades que firma Wompi en sus eventos.
                Signature = new WompiSignature
                {
                    Properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"]
                }
            };
            evento.Signature.Checksum = _wompiService.CalcularChecksumEvento(evento);

            var respuesta = await RecibirEvento(evento);
            if (respuesta is not OkResult)
            {
                return respuesta;
            }

            var pedido = await _pedidoRepository.ObtenerPedido(userId, id);
            return Ok(new { estado = pedido?.Estado, transactionId = evento.Data.Transaction.Id });
        }

        // ✅ Modo real: al volver del checkout, Wompi agrega ?id=<transacción> a la URL de retorno.
        // El frontend la envía aquí; se consulta la transacción a Wompi (con la llave privada) y,
        // si es de este pedido, se aplica con ProcesarPagoWompi. No hace falta checksum: los datos
        // vienen de nuestra propia consulta autenticada a Wompi, no de un tercero.
        // El webhook sigue siendo la fuente principal (la redirección es solo informativa).
        [Authorize]
        [HttpPost("{id:int}/ConfirmarPago")]
        public async Task<IActionResult> ConfirmarPago(int id, [FromBody] ConfirmarPagoDto datos)
        {
            if (_wompiSettings.ModoSimulado)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var pedido = await _pedidoRepository.ObtenerPedido(userId, id);

            if (pedido == null)
            {
                return NotFound(new { mensaje = MensajePedidoNoEncontrado });
            }

            var transaccion = await _wompiService.ConsultarTransaccion(datos.TransactionId);

            if (transaccion == null)
            {
                return NotFound(new { mensaje = "No encontramos la transacción en Wompi." });
            }

            if (transaccion.Reference != pedido.ReferenciaWompi)
            {
                return Conflict(new { mensaje = "La transacción no corresponde a este pedido." });
            }

            await _pedidoRepository.ProcesarPagoWompi(new WompiWebhookDto
            {
                Event = "transaction.updated",
                Data = new WompiData { Transaction = transaccion }
            });

            var actualizado = await _pedidoRepository.ObtenerPedido(userId, id);
            return Ok(new { estado = actualizado?.Estado, transactionId = transaccion.Id });
        }

        // ✅ Un solo camino para los eventos (webhook real y pasarela de pruebas).
        // Adaptación 3: un evento con checksum inválido → 401 y no se cambia nada.
        // Con un evento válido se responde siempre 200 (Wompi reintenta si recibe otro código).
        private async Task<IActionResult> RecibirEvento(WompiWebhookDto webhook)
        {
            if (!_wompiService.ValidarEvento(webhook))
            {
                return Unauthorized();
            }

            if (webhook.Event != "transaction.updated")
            {
                return Ok();
            }

            await _pedidoRepository.ProcesarPagoWompi(webhook);
            return Ok();
        }

        // ✅ Adaptación 4: 404 si el pedido no existe o es ajeno; 409 en los demás casos
        // (ya pagado, sin stock o agotado), siempre con { mensaje }.
        private IActionResult RespuestaDeProblema(string mensaje)
        {
            if (mensaje == PedidoRepository.MensajePedidoNoEncontrado)
            {
                return NotFound(new { mensaje });
            }

            return Conflict(new { mensaje });
        }
    }
}
