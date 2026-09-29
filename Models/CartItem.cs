namespace CafeApi.Models
{
    // ✅ Representa un producto agregado al carrito.
    public class CartItem
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Carrito al que pertenece.
        public int CartId { get; set; }

        // ✅ Café seleccionado.
        public int CafeId { get; set; }

        // ✅ Cantidad agregada.
        public int Cantidad { get; set; }

        // ✅ Precio del café en el momento de agregarlo.
        public decimal PrecioUnitario { get; set; }
    }
}