namespace CafeApi.DTOs
{
    // ✅ Datos del usuario autenticado, leídos de los claims del JWT (GET /api/auth/me).
    public class UsuarioActualDto
    {
        public string Email { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;

        public List<string> Roles { get; set; } = [];
    }
}
