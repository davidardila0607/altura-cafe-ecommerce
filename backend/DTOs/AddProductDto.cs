using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ Guía 2, paso 6: café y cantidad para AgregarProducto y ActualizarCarrito.
    // Adaptación B: validaciones con mensajes en español ([ApiController] responde 400 solo).
    public class AddProductDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Indica un café válido.")]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser al menos 1.")]
        public int Cantidad { get; set; }
    }
}
