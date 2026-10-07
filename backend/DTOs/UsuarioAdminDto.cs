namespace CafeApi.DTOs
{
    // ✅ Una fila de la lista de usuarios del panel (GET /api/usuarios).
    // No tiene Password: el hash nunca sale de la base de datos.
    public class UsuarioAdminDto
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Rol { get; set; } = string.Empty;

        // ✅ Cuántos cafés del catálogo creó este usuario.
        public int CafesCreados { get; set; }
    }
}
