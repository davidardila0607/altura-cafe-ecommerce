namespace CafeApi.DTOs
{
    // ✅ Datos del usuario autenticado (GET /api/auth/me).
    // Se leen de la base de datos con el Id que viene en el JWT (claim NameIdentifier).
    public class UsuarioActualDto
    {
        public string Email { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;

        public List<string> Roles { get; set; } = [];
    }
}
