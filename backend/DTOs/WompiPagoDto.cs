namespace CafeApi.DTOs
{
    // ✅ Guía 3, paso 11: lo que el frontend necesita para abrir el pago
    // (respuesta de POST /api/Pedido/{id}/PrepararPago).
    public class WompiPagoDto
    {
        public string PublicKey { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public long AmountInCents { get; set; }
        public string Currency { get; set; } = "COP";
        public string IntegritySignature { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;

        // ✅ Adaptación 1: el frontend decide adónde ir. true → /pago/simulador (pasarela de
        // pruebas de Altura); false → Web Checkout de Wompi (https://checkout.wompi.co/p/).
        public bool ModoSimulado { get; set; }
    }

    // ✅ Adaptación 1: cuerpo de POST /api/Pedido/{id}/SimularPago.
    public class SimularPagoDto
    {
        public bool Aprobado { get; set; }
    }

    // ✅ Modo real: cuerpo de POST /api/Pedido/{id}/ConfirmarPago con el id de transacción
    // que Wompi agrega a la URL de retorno (/pago/resultado?id=...).
    public class ConfirmarPagoDto
    {
        public string TransactionId { get; set; } = string.Empty;
    }
}
