using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.Extensions.Options;

namespace CafeApi.Repositories
{
    // ✅ Guía 3, paso 10: firmas de Wompi. La guía pide crearlo en la carpeta Repositories
    // (aunque es un servicio, como CloudinaryService en Services/); se respetó la guía.
    public class WompiService : IWompiService
    {
        private readonly WompiSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<WompiService> _logger;

        public WompiService(
            IOptions<WompiSettings> options,
            IHttpClientFactory httpClientFactory,
            ILogger<WompiService> logger)
        {
            _settings = options.Value;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        // ✅ Firma de integridad (docs.wompi.co, "Widget & Checkout Web"): SHA-256 de
        // "<Referencia><MontoEnCentavos><Moneda><SecretoDeIntegridad>", sin separadores.
        // Se calcula siempre en el servidor: el IntegritySecret nunca llega al navegador.
        public string GenerarFirmaIntegridad(string referencia, long montoCentavos, string moneda)
        {
            var cadena = $"{referencia}" + $"{montoCentavos}" + $"{moneda}" + $"{_settings.IntegritySecret}";

            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(cadena));

            return Convert.ToHexString(hash).ToLower();
        }

        // ✅ Adaptación 3 (seguridad): la guía devuelve true siempre, así que cualquiera podría
        // enviar un evento falso y marcar un pedido como pagado. Aquí se valida de verdad: el
        // checksum que calculamos con nuestro EventSecret debe coincidir con el del evento.
        // Wompi lo muestra en mayúsculas; se compara sin distinguir mayúsculas.
        public bool ValidarEvento(WompiWebhookDto webhook)
        {
            var recibido = webhook.Signature?.Checksum;

            if (string.IsNullOrEmpty(recibido))
            {
                return false;
            }

            var calculado = CalcularChecksumEvento(webhook);

            return calculado.Length > 0 && string.Equals(calculado, recibido, StringComparison.OrdinalIgnoreCase);
        }

        // ✅ Checksum de un evento (docs.wompi.co, "Eventos"):
        // 1. Concatenar los VALORES de las propiedades que indica signature.properties
        //    (por ejemplo "transaction.id"), leídos de data y en el mismo orden.
        // 2. Agregar el timestamp del evento.
        // 3. Agregar el EventSecret.
        // 4. SHA-256 en hexadecimal.
        // Devuelve "" si el evento no trae los datos necesarios o pide una propiedad desconocida.
        public string CalcularChecksumEvento(WompiWebhookDto webhook)
        {
            var transaccion = webhook.Data?.Transaction;
            var propiedades = webhook.Signature?.Properties;

            if (transaccion == null || propiedades == null || propiedades.Count == 0)
            {
                return string.Empty;
            }

            var cadena = new StringBuilder();

            foreach (var propiedad in propiedades)
            {
                var valor = ValorDePropiedad(transaccion, propiedad);

                if (valor == null)
                {
                    _logger.LogWarning("Evento de Wompi con una propiedad de firma desconocida: {Propiedad}", propiedad);
                    return string.Empty;
                }

                cadena.Append(valor);
            }

            cadena.Append(webhook.Timestamp);
            cadena.Append(_settings.EventSecret);

            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(cadena.ToString()));

            return Convert.ToHexString(hash).ToLower();
        }

        // ✅ Modo real: GET {BaseUrl}/transactions/{id}. Wompi solo responde esta consulta con la
        // llave privada ("Authorization: Bearer prv_..."); con la pública da 404.
        public async Task<WompiTransaction?> ConsultarTransaccion(string transactionId)
        {
            var cliente = _httpClientFactory.CreateClient();
            var url = $"{_settings.BaseUrl.TrimEnd('/')}/transactions/{Uri.EscapeDataString(transactionId)}";

            using var peticion = new HttpRequestMessage(HttpMethod.Get, url);
            peticion.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.PrivateKey);

            try
            {
                using var respuesta = await cliente.SendAsync(peticion);

                if (!respuesta.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Wompi respondió {Codigo} al consultar la transacción {Id}", (int)respuesta.StatusCode, transactionId);
                    return null;
                }

                var cuerpo = await respuesta.Content.ReadFromJsonAsync<WompiTransaccionRespuesta>();
                return cuerpo?.Data;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "No se pudo consultar la transacción {Id} en Wompi", transactionId);
                return null;
            }
        }

        // ✅ Valor de "transaction.<campo>" con el nombre que usa Wompi (snake_case).
        private static string? ValorDePropiedad(WompiTransaction transaccion, string propiedad) =>
            propiedad switch
            {
                "transaction.id" => transaccion.Id,
                "transaction.status" => transaccion.Status,
                "transaction.amount_in_cents" => transaccion.AmountInCents.ToString(),
                "transaction.reference" => transaccion.Reference,
                "transaction.currency" => transaccion.Currency,
                _ => null
            };
    }
}
