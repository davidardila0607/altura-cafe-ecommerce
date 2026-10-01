namespace CafeApi.DTOs
{
    // ✅ Respuesta de POST /api/images.
    public class ImagenSubidaDto
    {
        // ✅ URL segura (https) de la imagen en Cloudinary.
        public string ImageUrl { get; set; } = string.Empty;

        // ✅ Identificador de la imagen en Cloudinary.
        // Se guarda en el café para poder borrarla después.
        public string PublicId { get; set; } = string.Empty;
    }
}
