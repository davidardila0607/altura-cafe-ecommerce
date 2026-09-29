namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para responder
    // después de un inicio de sesión exitoso.
    public class LoginResponseDto
    {
        // ✅ JWT generado por CafeApi.
        public string Token { get; set; } = string.Empty;

        // ✅ Correo autenticado.
        public string Email { get; set; } = string.Empty;

        // ✅ Rol asignado.
        public string Role { get; set; } = string.Empty;
    }
}