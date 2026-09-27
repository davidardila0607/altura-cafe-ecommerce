using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para crear nuevos cafés.
    // Este objeto será el que recibirá el endpoint POST.
    public class CreateCafeDto
    {
        // ✅ Obligatorio.
        // Cada café debe pertenecer a una especialidad.
        [Required(ErrorMessage = "La especialidad es obligatoria.")]
        public int EspecialidadId { get; set; }

        // ✅ Obligatorio.
        // Evita nombres vacíos.
        [Required(ErrorMessage = "El nombre es obligatorio.")]

        // ✅ Máximo 100 caracteres.
        [StringLength(
            100,
            ErrorMessage = "El nombre no puede superar los 100 caracteres."
        )]
        public string Nombre { get; set; } = string.Empty;

        // ✅ Obligatorio.
        [Required(ErrorMessage = "El origen es obligatorio.")]

        // ✅ Máximo 100 caracteres.
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

        // ✅ El precio debe ser mayor que 0.
        [Range(
            0.01,
            1000000,
            ErrorMessage = "El precio debe ser mayor que cero."
        )]
        public decimal Precio { get; set; }
    }
}