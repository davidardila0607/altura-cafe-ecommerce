namespace CafeApi.Models
{
    // ✅ Representa el carrito activo de un usuario.
    public class Cart
    {
        // ✅ Identificador único del carrito.
        public int Id { get; set; }

        // ✅ Usuario propietario del carrito.
        public int UserId { get; set; }

        // ✅ Fecha de creación.
        public DateTime FechaCreacion { get; set; }

        // ✅ Fecha de última modificación.
        public DateTime FechaActualizacion { get; set; }

        // ✅ Estado del carrito.
        public string Estado { get; set; } = "Activo";
    }
}