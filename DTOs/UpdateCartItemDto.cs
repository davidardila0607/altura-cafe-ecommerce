using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para modificar
    // la cantidad de un producto en el carrito.
    public class UpdateCartItemDto
    {
        // ✅ Nueva cantidad.
        [Range(
            1,
            100,
            ErrorMessage = "La cantidad debe estar entre 1 y 100."
        )]
        public int Cantidad { get; set; }
    }
}