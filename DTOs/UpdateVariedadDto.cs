using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para actualizar variedades.
    public class UpdateVariedadDto
    {
        // ✅ Nombre obligatorio y único, máximo 100 caracteres.
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(
            100,
            ErrorMessage = "El nombre no puede superar los 100 caracteres."
        )]
        public string Nombre { get; set; } = string.Empty;

        // ✅ Descripción opcional.
        public string? Descripcion { get; set; }
    }
}
