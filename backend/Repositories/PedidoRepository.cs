using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CafeApi.Repositories
{
    // ✅ Guía de pedidos, pasos 7 a 10: crear pedidos a partir del carrito y consultarlos.
    // Equivalencias con la guía: Producto = Cafe y Producto.Valor = Cafe.Precio.
    public class PedidoRepository : IPedidoRepository
    {
        // ✅ Mensajes de la guía. Son públicos para que PedidoController
        // los compare y elija el código HTTP (adaptación D).
        public const string MensajeCarritoVacio = "El carrito está vacío.";
        public const string MensajeProductoPropio = "No puedes comprar tus propios productos.";
        public const string MensajePedidoCreado = "Pedido creado correctamente.";

        // ✅ Adaptación A: mensajes de stock (la guía no controla el stock).
        // "No hay stock suficiente de Pitalito (disponibles: 3)." / "Pitalito está agotado."
        public const string InicioMensajeSinStock = "No hay stock suficiente de ";
        public const string FinMensajeAgotado = " está agotado.";

        // ✅ Guía 3, adaptación 4: mensajes de PrepararPago.
        public const string MensajePedidoNoEncontrado = "Pedido no encontrado.";
        public const string MensajePedidoPagado = "Este pedido ya fue pagado.";

        private readonly AppDbContext _context;
        private readonly IWompiService _wompiService;
        private readonly WompiSettings _wompiSettings;
        private readonly ILogger<PedidoRepository> _logger;

        // ✅ Guía 3, paso 14 (en el PDF el contexto se llama ApplicationDbContext; aquí es AppDbContext).
        // El logger no está en la guía: registra los descuentos de stock que no alcanzan (adaptación 7).
        public PedidoRepository(
            AppDbContext context,
            IWompiService wompiService,
            IOptions<WompiSettings> options,
            ILogger<PedidoRepository> logger)
        {
            _context = context;
            _wompiService = wompiService;
            _wompiSettings = options.Value;
            _logger = logger;
        }

        // ✅ Paso 8: convierte el carrito en un pedido "Pendiente" y vacía el carrito.
        // Todo se guarda con un solo SaveChangesAsync: o se crea el pedido y se vacía
        // el carrito, o no pasa nada.
        public async Task<string> CrearPedido(int usuarioId)
        {
            var carrito = await _context.Carrito
                .Include(x => x.Productos)
                .ThenInclude(x => x.Producto)
                .FirstOrDefaultAsync(x => x.UsuarioId == usuarioId);

            if (carrito == null || !carrito.Productos.Any())
            {
                return MensajeCarritoVacio;
            }

            var pedido = new Pedido
            {
                UsuarioId = usuarioId,
                Estado = "Pendiente",
                Fecha = DateTime.UtcNow
            };

            foreach (var item in carrito.Productos)
            {
                if (item.Producto == null)
                {
                    continue;
                }

                if (item.Producto.UsuarioId == usuarioId)
                {
                    return MensajeProductoPropio;
                }

                // ✅ Adaptación A: el stock pudo bajar desde que el café entró al carrito.
                // Si no alcanza, se devuelve el motivo antes de guardar: no se crea nada
                // y el carrito queda igual. El stock NO se descuenta aquí: se descontará
                // cuando el pago se apruebe (guía de Wompi).
                if (item.Producto.Stock == 0)
                {
                    return $"{item.Producto.Nombre}{FinMensajeAgotado}";
                }

                if (item.Cantidad > item.Producto.Stock)
                {
                    return $"{InicioMensajeSinStock}{item.Producto.Nombre} (disponibles: {item.Producto.Stock}).";
                }

                pedido.Productos.Add(new PedidoProducto
                {
                    ProductoId = item.ProductoId,
                    Cantidad = item.Cantidad,
                    // ✅ En la guía: (decimal)item.Producto.Valor. Cafe.Precio ya es decimal.
                    Precio = item.Producto.Precio
                });
            }

            pedido.Total = pedido.Productos.Sum(x => x.Precio * x.Cantidad);

            // ✅ Guía 3, paso 8: el Id lo genera la base de datos, así que primero se guarda el
            // pedido y después se le asigna la referencia "PEDIDO-{Id}". Las dos escrituras van
            // en una transacción: o queda el pedido con su referencia y el carrito vacío, o nada.
            await using var transaccion = await _context.Database.BeginTransactionAsync();

            await _context.Pedido.AddAsync(pedido);
            _context.CarritoProducto.RemoveRange(carrito.Productos);
            await _context.SaveChangesAsync();

            pedido.ReferenciaWompi = $"PEDIDO-{pedido.Id}";
            await _context.SaveChangesAsync();

            await transaccion.CommitAsync();

            return MensajePedidoCreado;
        }

        // ✅ Paso 9: los pedidos del usuario. Proyección directa al DTO: una sola consulta
        // con JOIN que trae solo las columnas que se muestran.
        public async Task<List<PedidoDto>> ObtenerPedidos(int usuarioId)
        {
            return await _context.Pedido
                .Where(x => x.UsuarioId == usuarioId)
                // ✅ Adaptación B: el más reciente primero (el Id desempata pedidos del mismo instante).
                .OrderByDescending(x => x.Fecha)
                .ThenByDescending(x => x.Id)
                .Select(x => new PedidoDto
                {
                    Id = x.Id,
                    Fecha = x.Fecha,
                    Estado = x.Estado,
                    Total = x.Total,
                    ReferenciaWompi = x.ReferenciaWompi,
                    Productos = x.Productos
                        .OrderBy(p => p.Id)
                        .Select(p => new PedidoProductoDto
                        {
                            ProductoId = p.ProductoId,
                            Nombre = p.Producto!.Nombre,
                            ImagenUrl = p.Producto.ImagenUrl,
                            Cantidad = p.Cantidad,
                            Precio = p.Precio
                        }).ToList()
                }).ToListAsync();
        }

        // ✅ Paso 10: un pedido. El filtro por UsuarioId hace que nadie pueda ver
        // el pedido de otra persona: para la API, simplemente no existe (null → 404).
        public async Task<PedidoDto?> ObtenerPedido(int usuarioId, int pedidoId)
        {
            return await _context.Pedido
                .Where(x => x.Id == pedidoId && x.UsuarioId == usuarioId)
                .Select(x => new PedidoDto
                {
                    Id = x.Id,
                    Fecha = x.Fecha,
                    Estado = x.Estado,
                    Total = x.Total,
                    ReferenciaWompi = x.ReferenciaWompi,
                    Productos = x.Productos
                        .OrderBy(p => p.Id)
                        .Select(p => new PedidoProductoDto
                        {
                            ProductoId = p.ProductoId,
                            Nombre = p.Producto!.Nombre,
                            ImagenUrl = p.Producto.ImagenUrl,
                            Cantidad = p.Cantidad,
                            Precio = p.Precio
                        }).ToList()
                }).FirstOrDefaultAsync();
        }

        // ✅ Adaptación C: el pedido recién creado es el de mayor Id del usuario.
        // Solo se lee la columna id (usa el índice ix_pedido_usuario_id).
        public async Task<int?> ObtenerUltimoPedidoId(int usuarioId)
        {
            return await _context.Pedido
                .Where(x => x.UsuarioId == usuarioId)
                .OrderByDescending(x => x.Id)
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync();
        }

        // ✅ Adaptación F: todos los pedidos (más recientes primero) con el nombre y el
        // correo del cliente, leídos en el mismo JOIN (nunca se lee el hash de la contraseña).
        public async Task<List<PedidoAdminDto>> ObtenerTodos()
        {
            return await _context.Pedido
                .OrderByDescending(x => x.Fecha)
                .ThenByDescending(x => x.Id)
                .Select(x => new PedidoAdminDto
                {
                    Id = x.Id,
                    Fecha = x.Fecha,
                    Estado = x.Estado,
                    Total = x.Total,
                    ReferenciaWompi = x.ReferenciaWompi,
                    ClienteNombre = x.Usuario!.Nombre,
                    ClienteEmail = x.Usuario.Email,
                    Productos = x.Productos
                        .OrderBy(p => p.Id)
                        .Select(p => new PedidoProductoDto
                        {
                            ProductoId = p.ProductoId,
                            Nombre = p.Producto!.Nombre,
                            ImagenUrl = p.Producto.ImagenUrl,
                            Cantidad = p.Cantidad,
                            Precio = p.Precio
                        }).ToList()
                }).ToListAsync();
        }

        // ✅ Guía 3, adaptación 4: antes de preparar el pago se comprueba que se pueda pagar.
        // Devuelve null si todo está bien, o el motivo (el controlador elige 404 o 409).
        // Proyección: solo lee el estado del pedido y el nombre y el stock de sus cafés.
        public async Task<string?> ValidarPago(int usuarioId, int pedidoId)
        {
            var pedido = await _context.Pedido
                .Where(x => x.Id == pedidoId && x.UsuarioId == usuarioId)
                .Select(x => new
                {
                    x.Estado,
                    Productos = x.Productos.Select(p => new { p.Cantidad, p.Producto!.Nombre, p.Producto.Stock }).ToList()
                })
                .FirstOrDefaultAsync();

            if (pedido == null)
            {
                return MensajePedidoNoEncontrado;
            }

            if (pedido.Estado == "Pagado")
            {
                return MensajePedidoPagado;
            }

            // El stock pudo bajar desde que se creó el pedido (otro cliente pagó antes).
            foreach (var producto in pedido.Productos)
            {
                if (producto.Stock == 0)
                {
                    return $"{producto.Nombre}{FinMensajeAgotado}";
                }

                if (producto.Cantidad > producto.Stock)
                {
                    return $"{InicioMensajeSinStock}{producto.Nombre} (disponibles: {producto.Stock}).";
                }
            }

            return null;
        }

        // ✅ Guía 3, paso 13: datos para abrir el pago, con la firma de integridad.
        public async Task<WompiPagoDto?> PrepararPago(int usuarioId, int pedidoId)
        {
            var pedido = await _context.Pedido.FirstOrDefaultAsync(x =>
                x.Id == pedidoId && x.UsuarioId == usuarioId);

            if (pedido == null)
            {
                return null;
            }

            // ✅ Adaptación 4: un pedido rechazado se puede volver a pagar. Vuelve a "Pendiente" y
            // recibe una referencia nueva (PEDIDO-15 → PEDIDO-15-2 → PEDIDO-15-3), porque Wompi no
            // acepta una referencia que ya tuvo una transacción finalizada.
            if (pedido.Estado == "Rechazado")
            {
                pedido.Estado = "Pendiente";
                pedido.ReferenciaWompi = SiguienteReferencia(pedido.Id, pedido.ReferenciaWompi);
                await _context.SaveChangesAsync();
            }

            // Pesos sin decimales → centavos (45.000 COP = 4.500.000 centavos).
            var montoCentavos = (long)(pedido.Total * 100);

            var firma = _wompiService.GenerarFirmaIntegridad(pedido.ReferenciaWompi, montoCentavos, "COP");

            return new WompiPagoDto
            {
                PublicKey = _wompiSettings.PublicKey,
                Reference = pedido.ReferenciaWompi,
                AmountInCents = montoCentavos,
                Currency = "COP",
                IntegritySignature = firma,
                RedirectUrl = _wompiSettings.RedirectUrl,
                ModoSimulado = _wompiSettings.ModoSimulado
            };
        }

        // ✅ Guía 3, paso 17: aplica el resultado de una transacción al pedido.
        // Lo usan el webhook (evento de Wompi ya validado), SimularPago (evento firmado por
        // nosotros y validado igual) y ConfirmarPago (transacción consultada a Wompi).
        public async Task ProcesarPagoWompi(WompiWebhookDto webhook)
        {
            var transaction = webhook.Data?.Transaction;

            if (transaction == null)
            {
                return;
            }

            // Se cargan también los cafés: si el pago se aprueba hay que descontar su stock.
            var pedido = await _context.Pedido
                .Include(x => x.Productos)
                .ThenInclude(x => x.Producto)
                .FirstOrDefaultAsync(x => x.ReferenciaWompi == transaction.Reference);

            if (pedido == null)
            {
                return;
            }

            // ✅ Adaptación 7 (idempotencia): Wompi puede enviar el mismo evento más de una vez.
            // Un pedido ya pagado no cambia más: así el stock nunca se descuenta dos veces.
            if (pedido.Estado == "Pagado")
            {
                return;
            }

            pedido.TransactionIdWompi = transaction.Id;

            if (transaction.Status == "APPROVED")
            {
                // ✅ Adaptación 5: el monto y la moneda deben ser los del pedido. Si no coinciden
                // (alguien cambió el monto), el pedido no se marca como pagado.
                var montoEsperado = (long)(pedido.Total * 100);

                if (transaction.AmountInCents == montoEsperado && transaction.Currency == "COP")
                {
                    pedido.Estado = "Pagado";
                    DescontarStock(pedido);
                }
                else
                {
                    _logger.LogWarning(
                        "Transacción {Id} aprobada con monto o moneda distintos al pedido {Pedido}: {Monto} {Moneda} (esperado {Esperado} COP)",
                        transaction.Id, pedido.Id, transaction.AmountInCents, transaction.Currency, montoEsperado);
                }
            }

            // ✅ Adaptación 6: VOIDED (anulada) y ERROR también son pagos que no se hicieron.
            // PENDING (en proceso) no cambia el estado: llegará otro evento con el resultado final.
            if (transaction.Status is "DECLINED" or "VOIDED" or "ERROR")
            {
                pedido.Estado = "Rechazado";
            }

            // Estado y stock se guardan juntos, en un solo SaveChangesAsync.
            await _context.SaveChangesAsync();
        }

        // ✅ Adaptación 7: al pagarse, cada café pierde las unidades vendidas. Si alguno ya no
        // alcanza (lo compró otra persona mientras tanto), queda en 0 y se registra en el log.
        private void DescontarStock(Pedido pedido)
        {
            foreach (var item in pedido.Productos)
            {
                if (item.Producto == null)
                {
                    continue;
                }

                if (item.Producto.Stock < item.Cantidad)
                {
                    _logger.LogWarning(
                        "Stock insuficiente al pagar el pedido {Pedido}: {Cafe} tenía {Stock} y se vendieron {Cantidad}",
                        pedido.Id, item.Producto.Nombre, item.Producto.Stock, item.Cantidad);
                    item.Producto.Stock = 0;
                }
                else
                {
                    item.Producto.Stock -= item.Cantidad;
                }
            }
        }

        // PEDIDO-15 → PEDIDO-15-2; PEDIDO-15-2 → PEDIDO-15-3.
        private static string SiguienteReferencia(int pedidoId, string actual)
        {
            var partes = actual.Split('-');
            var intento = partes.Length == 3 && int.TryParse(partes[2], out var anterior) ? anterior + 1 : 2;

            return $"PEDIDO-{pedidoId}-{intento}";
        }
    }
}
