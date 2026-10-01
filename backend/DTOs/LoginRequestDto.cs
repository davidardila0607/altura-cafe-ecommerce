using System.ComponentModel.DataAnnotations;



namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para recibir credenciales
    // durante el inicio de sesión.
    public class LoginRequestDto
    {
        // ✅ Correo electrónico del usuario.
        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Debe proporcionar un correo válido.")]
        public string Email { get; set; } = string.Empty;

        // ✅ Contraseña del usuario.
        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Password { get; set; } = string.Empty;
    }
}