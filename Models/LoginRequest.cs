namespace CafeApi.Models
{
    public class LoginRequest
    {
        // ✅ NUEVO
        // Correo que enviará el usuario durante el login.
        // La API lo usará para identificar quién intenta acceder.
        public string Email { get; set; } = string.Empty;

        // ✅ NUEVO
        // Contraseña enviada por el usuario.
        // En esta fase será una contraseña de prueba para aprender JWT.
        public string Password { get; set; } = string.Empty;
    }
}