using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Repositories
{
    // ✅ Guía 2, pasos 7 a 13: carrito de compras.
    // Equivalencias con la guía: _context.Producto = _context.Cafes y Producto.Valor = Cafe.Precio.
    public class CarritoRepository : ICarritoRepository
    {
        // ✅ Mensajes de la guía. Son públicos para que CarritoController
        // los compare y elija el código HTTP (adaptación D).
        public const string MensajeProductoNoExiste = "El producto no existe.";
        public const string MensajeProductoPropio = "No puedes comprar tu propio producto.";
        public const string MensajeNoEstaEnCarrito = "El producto no está en el carrito.";

        // ✅ Adaptación C: mensajes de stock (la guía no controla el stock).
        public const string MensajeAgotado = "El producto está agotado.";
        public const string InicioMensajeSinStock = "Solo hay ";

        private readonly AppDbContext _context;

        public CarritoRepository(AppDbContext context)
        {
            _context = context;
        }

        // ✅ Paso 8: devuelve el carrito del usuario y, si todavía no tiene, lo crea.
        // Así no hay que crear un carrito al registrarse: nace la primera vez que se usa.
        private async Task<Carrito> ObtenerCarritoLocal(int usuarioId)
        {
            var carrito = await _context.Carrito.FirstOrDefaultAsync(x => x.UsuarioId == usuarioId);

            if (carrito == null)
            {
                carrito = new Carrito
                {
                    UsuarioId = usuarioId
                };

                await _context.Carrito.AddAsync(carrito);
                await _context.SaveChangesAsync();
            }

            return carrito;
        }

        // ✅ Paso 9: agregar un café. Si ya estaba en el carrito, se suman las cantidades.
        public async Task<string> AgregarProducto(int usuarioId, AddProductDto item)
        {
            var producto = await _context.Cafes.FirstOrDefaultAsync(x => x.Id == item.ProductId);

            if (producto == null)
            {
                return MensajeProductoNoExiste;
            }

            // ✅ Nadie compra los cafés que él mismo publicó.
            if (producto.UsuarioId == usuarioId)
            {
                return MensajeProductoPropio;
            }

            // ✅ Adaptación C: no se agregan cafés agotados.
            if (producto.Stock == 0)
            {
                return MensajeAgotado;
            }

            var carrito = await ObtenerCarritoLocal(usuarioId);

            var productoCarrito = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
                x.CarritoId == carrito.Id && x.ProductoId == item.ProductId);

            // ✅ Adaptación C: lo que ya hay en el carrito más lo nuevo no puede superar el stock.
            // Se suma como long para que una cantidad enorme no "dé la vuelta" a un número negativo.
            var cantidadActual = productoCarrito?.Cantidad ?? 0;

            if ((long)cantidadActual + item.Cantidad > producto.Stock)
            {
                return MensajeSinStock(producto.Stock);
            }

            if (productoCarrito == null)
            {
                productoCarrito = new CarritoProducto
                {
                    CarritoId = carrito.Id,
                    ProductoId = item.ProductId,
                    Cantidad = item.Cantidad
                };

                await _context.CarritoProducto.AddAsync(productoCarrito);
            }
            else
            {
                productoCarrito.Cantidad += item.Cantidad;
            }

            await _context.SaveChangesAsync();

            return "Producto agregado al carrito.";
        }

        // ✅ Paso 10: el carrito con sus cafés. Una sola consulta con JOIN que trae
        // solo las columnas que se muestran (proyección), sin cargar entidades completas.
        public async Task<CarritoDto> ObtenerCarrito(int usuarioId)
        {
            var carrito = await ObtenerCarritoLocal(usuarioId);

            var productos = await _context.CarritoProducto
                .Where(x => x.CarritoId == carrito.Id)
                .OrderBy(x => x.Id)
                .Select(x => new CarritoProductoDto
                {
                    ProductoId = x.ProductoId,
                    Nombre = x.Producto!.Nombre,
                    ImagenUrl = x.Producto.ImagenUrl,
                    Precio = (double)x.Producto.Precio,
                    Cantidad = x.Cantidad,
                    Subtotal = (double)(x.Producto.Precio * x.Cantidad),

                    // ✅ Adaptación A.
                    Variedad = x.Producto.Variedad.Nombre,
                    Proceso = x.Producto.Proceso.Nombre,
                    PresentacionGramos = (int)x.Producto.Presentacion,
                    Stock = x.Producto.Stock
                })
                .ToListAsync();

            return new CarritoDto
            {
                CarritoId = carrito.Id,
                Productos = productos,
                Total = productos.Sum(x => x.Subtotal),
                TotalUnidades = productos.Sum(x => x.Cantidad)
            };
        }

        // ✅ Paso 11: cambiar la cantidad de un café que ya está en el carrito.
        public async Task<string> ActualizarProducto(int usuarioId, AddProductDto item)
        {
            var carrito = await ObtenerCarritoLocal(usuarioId);

            var product = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
                x.CarritoId == carrito.Id && x.ProductoId == item.ProductId);

            if (product == null)
            {
                return MensajeNoEstaEnCarrito;
            }

            // ✅ Adaptación C: la nueva cantidad no puede superar el stock.
            // Solo se lee la columna stock del café.
            var stock = await _context.Cafes
                .Where(c => c.Id == item.ProductId)
                .Select(c => c.Stock)
                .FirstAsync();

            if (stock == 0)
            {
                return MensajeAgotado;
            }

            if (item.Cantidad > stock)
            {
                return MensajeSinStock(stock);
            }

            product.Cantidad = item.Cantidad;
            await _context.SaveChangesAsync();

            return "Cantidad actualizada.";
        }

        // ✅ Paso 12: quitar un café del carrito.
        public async Task<string> EliminarProducto(int usuarioId, int productoId)
        {
            var carrito = await ObtenerCarritoLocal(usuarioId);

            var item = await _context.CarritoProducto.FirstOrDefaultAsync(x =>
                x.CarritoId == carrito.Id && x.ProductoId == productoId);

            if (item == null)
            {
                return MensajeNoEstaEnCarrito;
            }

            _context.CarritoProducto.Remove(item);
            await _context.SaveChangesAsync();

            return "Producto eliminado del carrito.";
        }

        // ✅ Paso 13: quitar todos los cafés (el carrito sigue existiendo, vacío).
        public async Task<string> VaciarCarrito(int usuarioId)
        {
            var carrito = await ObtenerCarritoLocal(usuarioId);

            var productos = await _context.CarritoProducto
                .Where(x => x.CarritoId == carrito.Id)
                .ToListAsync();

            _context.CarritoProducto.RemoveRange(productos);
            await _context.SaveChangesAsync();

            return "Carrito vaciado.";
        }

        // ✅ "Solo hay 5 unidades disponibles de este café." (en singular si queda 1).
        private static string MensajeSinStock(int stock) =>
            stock == 1
                ? $"{InicioMensajeSinStock}1 unidad disponible de este café."
                : $"{InicioMensajeSinStock}{stock} unidades disponibles de este café.";
    }
}
