using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para agregar un producto al carrito.
    public class AddCartItemDto
    {
        // ✅ Café que se desea agregar.
        [Required(ErrorMessage = "El café es obligatorio.")]
        public int CafeId { get; set; }

        // ✅ Cantidad que el usuario desea agregar.
        [Range(
            1,
            100,
            ErrorMessage = "La cantidad debe estar entre 1 y 100."
        )]
        public int Cantidad { get; set; }
    }
}