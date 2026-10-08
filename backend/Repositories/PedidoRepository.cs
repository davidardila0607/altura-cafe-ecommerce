using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.EntityFrameworkCore;

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

        private readonly AppDbContext _context;

        public PedidoRepository(AppDbContext context)
        {
            _context = context;
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

            await _context.Pedido.AddAsync(pedido);
            _context.CarritoProducto.RemoveRange(carrito.Productos);
            await _context.SaveChangesAsync();

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
    }
}
