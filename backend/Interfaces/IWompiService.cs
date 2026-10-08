using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Guía 3, paso 10: firmas de Wompi.
    public interface IWompiService
    {
        // Firma de integridad del pago: SHA-256 de referencia + monto en centavos + moneda + IntegritySecret.
        string GenerarFirmaIntegridad(string referencia, long montoCentavos, string moneda);

        // true solo si el checksum del evento coincide con el que calculamos con el EventSecret.
        bool ValidarEvento(WompiWebhookDto webhook);

        // ✅ Adaptación 3: el cálculo del checksum de un evento, separado para que la pasarela de
        // pruebas (SimularPago) firme sus eventos con la misma fórmula que valida ValidarEvento.
        string CalcularChecksumEvento(WompiWebhookDto webhook);

        // ✅ Modo real (ConfirmarPago): consulta una transacción a la API de Wompi con la llave privada.
        // null si Wompi no la encuentra o no responde.
        Task<WompiTransaction?> ConsultarTransaccion(string transactionId);
    }
}
