namespace CafeApi.Models
{
    // ✅ Guía 3, paso 2: configuración de Wompi (sección "WompiSettings").
    // Las llaves reales nunca van en el repositorio: en local, appsettings.Development.json;
    // en producción, variables de entorno WompiSettings__*.
    public class WompiSettings
    {
        public string PublicKey { get; set; } = string.Empty;
        public string PrivateKey { get; set; } = string.Empty;
        public string IntegritySecret { get; set; } = string.Empty;
        public string EventSecret { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;

        // ✅ Adaptación 1 (no está en la guía): sin llaves reales de Sandbox, la tienda usa una
        // "pasarela de pruebas" propia (/pago/simulador) en vez del checkout de Wompi.
        // true = simulación (POST /api/Pedido/{id}/SimularPago existe); false = Wompi real.
        public bool ModoSimulado { get; set; }
    }
}
