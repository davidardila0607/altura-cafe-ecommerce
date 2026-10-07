namespace CafeApi.DTOs
{
    // ✅ Guía 2, paso 6: el carrito completo (respuesta de GET /api/Carrito/GetCarrito).
    public class CarritoDto
    {
        public int CarritoId { get; set; }

        public List<CarritoProductoDto> Productos { get; set; } = new();

        // ✅ double como la guía. Los precios son pesos sin decimales, así que no se pierde nada.
        public double Total { get; set; }

        // ✅ Adaptación A: suma de las cantidades, para el contador del ícono del carrito.
        public int TotalUnidades { get; set; }
    }
}
