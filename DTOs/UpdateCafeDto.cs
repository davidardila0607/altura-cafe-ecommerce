using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para actualizar cafés.
    // Lo recibirá el endpoint PUT.
    public class UpdateCafeDto
    {
        // ✅ Obligatorio.
        [Required(ErrorMessage = "La especialidad es obligatoria.")]
        public int EspecialidadId { get; set; }

        // ✅ Nombre obligatorio.
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(
        100,
        ErrorMessage = "El nombre no puede superar los 100 caracteres."
        )]
        public string Nombre { get; set; } = string.Empty;

        // ✅ URL de la imagen principal del café.
        // La imagen se almacenará en Cloudinary.
        // En la base de datos solo guardaremos la URL.
        [StringLength(
            500,
            ErrorMessage = "La URL de la imagen no puede superar los 500 caracteres."
        )]
        public string ImagenUrl { get; set; } = string.Empty;

        // ✅ Origen obligatorio.
        [Required(ErrorMessage = "El origen es obligatorio.")]
        [StringLength(
        100,
        ErrorMessage = "El origen no puede superar los 100 caracteres."
        )]
        public string Origen { get; set; } = string.Empty;

        // ✅ El stock no puede ser negativo.
        [Range(
        0,
        int.MaxValue,
        ErrorMessage = "El stock no puede ser negativo."
        )]
        public int Stock { get; set; }

        // ✅ El precio debe ser mayor que cero.
        [Range(
        typeof(decimal),
        "0.01",
        "1000000",
        ErrorMessage = "El precio debe ser mayor que cero."
        )]
        public decimal Precio { get; set; }
    }
}
