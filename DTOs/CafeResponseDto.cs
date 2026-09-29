namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para responder al cliente.
    // Define exactamente qué información sale de la API.
    public class CafeResponseDto
    {
        // ✅ Identificador único del café.
        public int Id { get; set; }

        // ✅ Nombre de la especialidad.
        public string Especialidad { get; set; } = string.Empty;

        // ✅ URL de la imagen principal del producto.
        public string ImagenUrl { get; set; } = string.Empty;

        // ✅ Nombre comercial del café.
        public string Nombre { get; set; } = string.Empty;

        // ✅ País o región de origen.
        public string Origen { get; set; } = string.Empty;

        // ✅ Cantidad real disponible.
        public int StockDisponible { get; set; }

        // ✅ Estado calculado según el stock.
        public string EstadoStock { get; set; } = string.Empty;

        // ✅ Precio de venta.
        public decimal Precio { get; set; }

        // ✅ Indica si el producto puede comprarse.
        public bool Disponible { get; set; }

    }

}
