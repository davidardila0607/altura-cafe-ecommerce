namespace CafeApi.Models
{
    // ✅ Entidad que representa un usuario de CafeApi.
    public class Usuario
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Correo electrónico.
        public string Email { get; set; } = string.Empty;

        // ✅ Nombre visible.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Rol asignado.
        public string Role { get; set; } = string.Empty;

        // ✅ Indica si el usuario inició sesión mediante Google.
        public bool EsGoogleUser { get; set; }

        // ✅ Fecha de creación del usuario.
        public DateTime FechaCreacion { get; set; }
    }
}