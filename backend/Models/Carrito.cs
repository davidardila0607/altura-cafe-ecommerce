namespace CafeApi.Models
{
    // ✅ Guía 2, paso 1: carrito de compras de un usuario (tabla "carrito").
    // Cada usuario tiene como máximo un carrito (índice único en UsuarioId).
    public class Carrito
    {
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public Usuario? Usuario { get; set; }

        // ✅ Las filas de la tabla intermedia: qué cafés hay y cuántas unidades de cada uno.
        public ICollection<CarritoProducto> Productos { get; set; } = new List<CarritoProducto>();
    }
}
