namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para representar
    // información del usuario autenticado.
    public class UserDto
    {
        // ✅ Identificador del usuario.
        public int Id { get; set; }

        // ✅ Correo electrónico.
        public string Email { get; set; } = string.Empty;

        // ✅ Nombre visible del usuario.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Rol asignado.
        public string Role { get; set; } = string.Empty;
    }
}