using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ Adaptación a la guía de pedidos: datos de envío que se piden al confirmar el pedido
    // (cuerpo de POST /api/Pedido/CrearPedido). Si algo no cumple, [ApiController] responde
    // 400 con estos mensajes antes de llegar al repositorio.
    public class DatosEnvioDto
    {
        [Required(ErrorMessage = "La dirección es obligatoria.")]
        [StringLength(200, ErrorMessage = "La dirección no puede superar los 200 caracteres.")]
        public string DireccionEnvio { get; set; } = string.Empty;

        [Required(ErrorMessage = "La ciudad es obligatoria.")]
        [StringLength(80, ErrorMessage = "La ciudad no puede superar los 80 caracteres.")]
        public string Ciudad { get; set; } = string.Empty;

        [Required(ErrorMessage = "El departamento es obligatorio.")]
        [StringLength(80, ErrorMessage = "El departamento no puede superar los 80 caracteres.")]
        public string Departamento { get; set; } = string.Empty;

        // Solo números, de 7 (fijo) a 15 dígitos (móvil con indicativo).
        [Required(ErrorMessage = "El teléfono es obligatorio.")]
        [RegularExpression(@"^\d{7,15}$", ErrorMessage = "El teléfono debe tener entre 7 y 15 dígitos, solo números.")]
        public string Telefono { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "Las notas de entrega no pueden superar los 300 caracteres.")]
        public string? NotasEntrega { get; set; }
    }
}
