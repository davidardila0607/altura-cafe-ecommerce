namespace CafeApi.Models
{
    // ✅ Guía 2, paso 2: tabla intermedia entre carrito y cafés (tabla "carrito_producto").
    // Un carrito tiene muchos cafés y un café puede estar en muchos carritos;
    // cada fila guarda además la cantidad.
    public class CarritoProducto
    {
        public int Id { get; set; }

        public int CarritoId { get; set; }

        public Carrito? Carrito { get; set; }

        // ✅ Se conservan los nombres de la guía (ProductoId / Producto):
        // en este proyecto el "producto" es un Cafe.
        public int ProductoId { get; set; }

        public Cafe? Producto { get; set; }

        public int Cantidad { get; set; }
    }
}
