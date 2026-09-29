namespace CafeApi.Models
{
    // ✅ Entidad que representa un café dentro del catálogo.
    public class Cafe
    {
        // ✅ Identificador único del café.
        public int Id { get; set; }

        // ✅ Relación con la especialidad.
        public int EspecialidadId { get; set; }

        // ✅ Nombre de la especialidad.
        // Se utiliza para consultas y respuestas al cliente.
        public string Especialidad { get; set; } = string.Empty;

        // ✅ Nombre comercial del café.
        public string Nombre { get; set; } = string.Empty;

        // ✅ URL de la imagen principal del producto.
        // La imagen se almacenará en Cloudinary.
        // En la base de datos solo guardaremos la URL.
        public string ImagenUrl { get; set; } = string.Empty;

        // ✅ País o región de origen.
        public string Origen { get; set; } = string.Empty;

        // ✅ Cantidad disponible en inventario.
        public int Stock { get; set; }

        // ✅ Precio de venta.
        public decimal Precio { get; set; }
    }
}