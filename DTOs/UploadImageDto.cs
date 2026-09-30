using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para subir imágenes.
    public class UploadImageDto
    {
        // ✅ Imagen codificada en Base64.
        [Required(
            ErrorMessage = "La imagen es obligatoria."
        )]
        public string ImagenBase64 { get; set; }
            = string.Empty;
    }
}