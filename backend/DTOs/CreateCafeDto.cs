using CafeApi.Models;
using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para crear nuevos cafés.
    // Este objeto será el que recibirá el endpoint POST.
    public class CreateCafeDto
    {
        // ✅ Nombre obligatorio, máximo 100 caracteres.
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(
            100,
            ErrorMessage = "El nombre no puede superar los 100 caracteres."
        )]
        public string Nombre { get; set; } = string.Empty;

        // ✅ Variedad obligatoria. Si no existe, el controlador responde 400.
        [Range(
            1,
            int.MaxValue,
            ErrorMessage = "La variedad es obligatoria."
        )]
        public int VariedadId { get; set; }

        // ✅ Proceso obligatorio. Si no existe, el controlador responde 400.
        [Range(
            1,
            int.MaxValue,
            ErrorMessage = "El proceso es obligatorio."
        )]
        public int ProcesoId { get; set; }

        // ✅ Solo 340 o 500 gramos.
        [EnumDataType(
            typeof(Presentacion),
            ErrorMessage = "La presentación debe ser de 340 o 500 gramos."
        )]
        public Presentacion PresentacionGramos { get; set; }

        // ✅ Origen obligatorio, máximo 100 caracteres.
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

        // ✅ Pesos colombianos: mayor que cero y sin decimales.
        [Range(
            typeof(decimal),
            "1",
            "999999999999",
            ErrorMessage = "El precio debe ser mayor que cero y no superar 999.999.999.999."
        )]
        [SinDecimales(
            ErrorMessage = "El precio debe ser un valor entero en pesos colombianos (sin decimales)."
        )]
        public decimal Precio { get; set; }

        // ✅ URL de la imagen devuelta por POST /api/images (opcional).
        [StringLength(
            500,
            ErrorMessage = "La URL de la imagen no puede superar los 500 caracteres."
        )]
        public string? ImagenUrl { get; set; }

        // ✅ publicId de la imagen devuelto por POST /api/images (opcional).
        [StringLength(
            255,
            ErrorMessage = "El publicId de la imagen no puede superar los 255 caracteres."
        )]
        public string? ImagenPublicId { get; set; }
    }
}
