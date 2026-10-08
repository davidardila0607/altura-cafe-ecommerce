namespace CafeApi.Models
{
    // ✅ Guía de pedidos, paso 2: un café dentro de un pedido (tabla "pedido_producto").
    public class PedidoProducto
    {
        public int Id { get; set; }

        public int PedidoId { get; set; }

        public Pedido? Pedido { get; set; }

        // ✅ Se conservan los nombres de la guía (ProductoId / Producto):
        // en este proyecto el "producto" es un Cafe, igual que en CarritoProducto.
        public int ProductoId { get; set; }

        public Cafe? Producto { get; set; }

        public int Cantidad { get; set; }

        // ✅ Precio del café en el momento de la compra. Se guarda aquí porque
        // el precio del café puede cambiar después y el pedido no debe cambiar con él.
        public decimal Precio { get; set; }
    }
}
