namespace CafeApi.Models
{
    // ✅ Guía de pedidos, paso 1: un pedido creado a partir del carrito (tabla "pedido").
    // Estado: "Pendiente" al crearlo; la guía de Wompi lo cambiará a "Pagado" o "Rechazado".
    public class Pedido
    {
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public Usuario? Usuario { get; set; }

        // ✅ Suma de precio × cantidad de sus productos, calculada al crear el pedido.
        public decimal Total { get; set; }

        public string Estado { get; set; } = "Pendiente";

        // ✅ Fecha de creación en UTC.
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public ICollection<PedidoProducto> Productos { get; set; } = new List<PedidoProducto>();
    }
}
