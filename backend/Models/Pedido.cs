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

        // ✅ Guía 3, paso 6: referencia con la que Wompi identifica el pago ("PEDIDO-15") y el id
        // de la última transacción que nos informó. Si un pago se rechaza y se reintenta, la
        // referencia cambia a "PEDIDO-15-2" (Wompi no deja reutilizar una referencia ya usada).
        public string ReferenciaWompi { get; set; } = string.Empty;
        public string? TransactionIdWompi { get; set; }

        // ✅ Adaptación a la guía de pedidos: adónde se envía el café (llega en DatosEnvioDto).
        public string DireccionEnvio { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string Departamento { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string? NotasEntrega { get; set; }
    }
}
