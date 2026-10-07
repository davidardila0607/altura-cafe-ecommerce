namespace CafeApi.Models
{
    // ✅ Guía 1, paso 1: usuario registrado en la tienda (tabla "usuario").
    public class Usuario
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        // ✅ Se guarda en minúsculas y sin espacios (ver UsuarioRepository).
        public string Email { get; set; } = string.Empty;

        // ✅ Nunca la contraseña en texto plano: es el hash de PasswordHasher.
        public string Password { get; set; } = string.Empty;

        // ✅ Adaptación 1 (no está en la guía): el panel y la política
        // GestionInventario dependen del rol ("Administrador" o "Cliente").
        public string Rol { get; set; } = "Cliente";

        // ✅ Cafés que creó este usuario (en la guía: Productos).
        public ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();

        // ✅ Guía 2, paso 4: el carrito del usuario (se crea la primera vez que lo usa).
        public Carrito? Carrito { get; set; }
    }
}
