using System.Text.Json.Serialization;

namespace CafeApi.DTOs
{
    // ✅ Guía 3, paso 9: el evento que Wompi envía a POST /api/Pedido/Webhook.
    // Ejemplo (docs.wompi.co, "Eventos"):
    // { "event": "transaction.updated",
    //   "data": { "transaction": { "id": "...", "reference": "PEDIDO-15", "status": "APPROVED",
    //                              "amount_in_cents": 4490000, "currency": "COP", ... } },
    //   "signature": { "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
    //                  "checksum": "3476DDA5..." },
    //   "timestamp": 1530291411, ... }
    // ASP.NET Core ya compara los nombres sin distinguir mayúsculas ("event" = Event); solo hace
    // falta [JsonPropertyName] donde Wompi usa snake_case (adaptación 2).
    public class WompiWebhookDto
    {
        public string? Event { get; set; }
        public WompiData? Data { get; set; }
        public long Timestamp { get; set; }
        public WompiSignature? Signature { get; set; }
    }

    public class WompiData
    {
        public WompiTransaction? Transaction { get; set; }
    }

    public class WompiTransaction
    {
        public string? Id { get; set; }
        public string? Reference { get; set; }
        public string? Status { get; set; }

        [JsonPropertyName("amount_in_cents")]
        public long AmountInCents { get; set; }

        public string? Currency { get; set; }
    }

    public class WompiSignature
    {
        public List<string>? Properties { get; set; }
        public string? Checksum { get; set; }
    }

    // ✅ Respuesta de GET {BaseUrl}/transactions/{id} (ConfirmarPago, modo real):
    // { "data": { "id": "...", "reference": "...", "status": "...", "amount_in_cents": ..., ... } }
    public class WompiTransaccionRespuesta
    {
        public WompiTransaction? Data { get; set; }
    }
}
