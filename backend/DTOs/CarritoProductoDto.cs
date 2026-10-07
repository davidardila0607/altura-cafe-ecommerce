namespace CafeApi.DTOs
{
    // ✅ Guía 2, paso 6: una fila del carrito.
    public class CarritoProductoDto
    {
        public int ProductoId { get; set; }

        public string? Nombre { get; set; }

        public string? ImagenUrl { get; set; }

        public double Precio { get; set; }

        public int Cantidad { get; set; }

        public double Subtotal { get; set; }

        // ✅ Adaptación A: datos que muestra la interfaz del carrito.
        public string? Variedad { get; set; }

        public string? Proceso { get; set; }

        public int PresentacionGramos { get; set; }

        // ✅ Unidades disponibles: el selector de cantidad no deja pasar de aquí.
        public int Stock { get; set; }
    }
}
