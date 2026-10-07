using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Guía 2, paso 7: contrato del repositorio del carrito.
    // Los métodos que modifican devuelven un texto (como la guía);
    // CarritoController lo traduce a un código HTTP.
    public interface ICarritoRepository
    {
        Task<CarritoDto> ObtenerCarrito(int usuarioId);

        Task<string> AgregarProducto(int usuarioId, AddProductDto item);

        Task<string> ActualizarProducto(int usuarioId, AddProductDto item);

        Task<string> EliminarProducto(int usuarioId, int productoId);

        Task<string> VaciarCarrito(int usuarioId);
    }
}
