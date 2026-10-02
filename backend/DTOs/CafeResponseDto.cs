namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para responder al cliente.
    // Define exactamente qué información sale de la API.
    public class CafeResponseDto
    {
        // ✅ Identificador único del café.
        public int Id { get; set; }

        // ✅ Nombre comercial del café.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Variedad del café.
        public int VariedadId { get; set; }

        public string VariedadNombre { get; set; } = string.Empty;

        // ✅ Proceso del café.
        public int ProcesoId { get; set; }

        public string ProcesoNombre { get; set; } = string.Empty;

        // ✅ Presentación en gramos (340 o 500).
        public int PresentacionGramos { get; set; }

        // ✅ País o región de origen.
        public string Origen { get; set; } = string.Empty;

        // ✅ Cantidad real disponible.
        public int Stock { get; set; }

        // ✅ Precio de venta en pesos colombianos.
        public decimal Precio { get; set; }

        // ✅ Imagen en Cloudinary.
        public string? ImagenUrl { get; set; }

        public string? ImagenPublicId { get; set; }

        // ✅ Indica si el producto puede comprarse.
        public bool Disponible => Stock > 0;

        // ✅ Estado calculado según el stock.
        public string EstadoStock => ObtenerEstadoStock(Stock);

        // ✅ Calcula el estado del stock según la cantidad disponible.
        private static string ObtenerEstadoStock(int stock)
        {
            if (stock == 0)
            {
                return "Agotado";
            }

            if (stock <= 10)
            {
                return "Pocas unidades";
            }

            if (stock <= 50)
            {
                return "Disponible";
            }

            return "Alta disponibilidad";
        }
    }
}
