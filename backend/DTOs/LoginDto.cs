using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ Guía 1, paso 5: credenciales para iniciar sesión (POST /api/auth/Login).
    // Adaptación 2: solo se agregaron validaciones con mensajes en español.
    public class LoginDto
    {
        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Escribe un correo electrónico válido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Password { get; set; } = string.Empty;
    }
}
