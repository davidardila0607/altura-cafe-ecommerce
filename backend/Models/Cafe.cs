namespace CafeApi.Models
{
    // ✅ Entidad que representa un café dentro del catálogo.
    public class Cafe
    {
        // ✅ Identificador único del café.
        public int Id { get; set; }

        // ✅ Nombre comercial del café.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Relación con la variedad (FK obligatoria).
        public int VariedadId { get; set; }

        // ✅ Variedad a la que pertenece el café.
        public Variedad Variedad { get; set; } = null!;

        // ✅ Relación con el proceso de beneficio (FK obligatoria).
        public int ProcesoId { get; set; }

        // ✅ Proceso del café (Lavado, Honey, Fermentado).
        public Proceso Proceso { get; set; } = null!;

        // ✅ Presentación en gramos (340 o 500).
        public Presentacion Presentacion { get; set; }

        // ✅ País o región de origen.
        public string Origen { get; set; } = string.Empty;

        // ✅ Cantidad disponible en inventario.
        public int Stock { get; set; }

        // ✅ Precio de venta en pesos colombianos, sin decimales.
        public decimal Precio { get; set; }

        // ✅ URL de la imagen en Cloudinary (opcional).
        public string? ImagenUrl { get; set; }

        // ✅ publicId de la imagen en Cloudinary (opcional).
        // Se necesita para poder borrar la imagen después.
        public string? ImagenPublicId { get; set; }

        // ✅ Guía 1, paso 2: dueño del café (el usuario que lo creó, leído del JWT).
        public int UsuarioId { get; set; }

        public Usuario? Usuario { get; set; }

        // ✅ Fecha de creación (UTC). La asigna AppDbContext.
        public DateTime FechaCreacion { get; set; }

        // ✅ Fecha de última modificación (UTC). La asigna AppDbContext.
        public DateTime FechaActualizacion { get; set; }
    }
}
