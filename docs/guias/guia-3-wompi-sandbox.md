# Guía 3 — Integración de Wompi Sandbox

## Objetivo

En esta guía se integrará Wompi en ambiente Sandbox para permitir realizar pagos de prueba dentro del e-commerce.

Al finalizar tendremos:

- Cuenta de pruebas de Wompi.
- Credenciales Sandbox.
- Configuración de Wompi en .NET.
- Generación de referencia de pago.
- Generación de firma de integridad.
- Preparación del pago.
- Checkout de Wompi.
- Redirección después del pago.
- Webhook para recibir el resultado de la transacción.
- Actualización del estado del pedido.

## 1. Crear cuenta de pruebas

Para realizar la integración necesitamos las credenciales de prueba proporcionadas por Wompi. Utilizaremos el ambiente Sandbox, que está diseñado para realizar pruebas sin utilizar dinero real. Desde la documentación de Wompi podemos consultar el proceso para acceder a las llaves de prueba.

- Link para crear cuenta: Dashboard de Comercios Wompi
- Link de documentación: Ambientes y llaves de Wompi

Las credenciales que necesitaremos son principalmente:

- Public Key
- Private Key
- Integrity Secret
- Event Secret

## 2. Crear WompiSettings

En la carpeta `Models` vamos a crear la siguiente clase:

```csharp
public class WompiSettings
{
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public string IntegritySecret { get; set; } = string.Empty;
    public string EventSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}
```

## 3. Configurar appsettings.json

```json
"WompiSettings": {
  "PublicKey": "pub_test_xxxxxxxxx",
  "PrivateKey": "prv_test_xxxxxxxxx",
  "IntegritySecret": "xxxxxxxxxxxxxxxx",
  "EventSecret": "xxxxxxxxxxxxxxxx",
  "BaseUrl": "https://sandbox.wompi.co/v1",
  "RedirectUrl": "http://localhost:4200/pago/resultado"
}
```

## 4. Registrar configuración

En el archivo `Program.cs` agregar lo siguiente:

```csharp
builder.Services.Configure<WompiSettings>(builder.Configuration.GetSection("WompiSettings"));
```

## 5. ¿Qué necesita Wompi?

Para iniciar el proceso de pago necesitamos principalmente:

- Referencia
- Monto
- Moneda
- Firma de integridad
- Public Key
- URL de retorno

## 6. Agregar referencia Wompi al Pedido

Como el pedido necesita identificarse durante el proceso de pago, modificaremos la clase `Pedido`:

```csharp
public string ReferenciaWompi { get; set; } = string.Empty;
public string? TransactionIdWompi { get; set; }
```

## 7. Crear la migración

```bash
dotnet ef migrations add AddWompi
dotnet ef database update
```

## 8. Generar la referencia

Cuando se crea el pedido podemos generar una referencia:

```csharp
pedido.ReferenciaWompi = $"PEDIDO-{pedido.Id}";
```

Sin embargo, como el Id se genera en la base de datos, una opción sencilla es guardar primero el pedido y después generar la referencia:

```csharp
pedido.ReferenciaWompi = $"PEDIDO-{pedido.Id}";
await _context.SaveChangesAsync();
```

### ¿Qué es un Webhook?

Un webhook permite que Wompi le informe directamente a nuestra API que una transacción cambió de estado.

## 9. Crear DTO del Webhook

En la carpeta `DTOs` crear las siguientes clases:

```csharp
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
    public long AmountInCents { get; set; }
    public string? Currency { get; set; }
}

public class WompiSignature
{
    public List<string>? Properties { get; set; }
    public string? Checksum { get; set; }
}
```

## 10. Crear IWompiService

Crear la interfaz `IWompiService` en la carpeta `Interfaces`:

```csharp
public interface IWompiService
{
    string GenerarFirmaIntegridad(string referencia, long montoCentavos, string moneda);
    bool ValidarEvento(WompiWebhookDto webhook);
}
```

En la carpeta `Repositories` crear el servicio `WompiService` implementando la interfaz:

```csharp
public class WompiService : IWompiService
{
}
```

Registrar el servicio:

```csharp
builder.Services.AddScoped<IWompiService, WompiService>();
```

Agregar dentro del servicio de Wompi:

```csharp
private readonly WompiSettings _settings;

public WompiService(IOptions<WompiSettings> options)
{
    _settings = options.Value;
}

public string GenerarFirmaIntegridad(string referencia, long montoCentavos, string moneda)
{
    var cadena = $"{referencia}" + $"{montoCentavos}" + $"{moneda}" + $"{_settings.IntegritySecret}";

    using var sha256 = SHA256.Create();
    var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(cadena));

    return Convert.ToHexString(hash).ToLower();
}

public bool ValidarEvento(WompiWebhookDto webhook)
{
    return true;
}
```

## 11. Crear DTO de respuesta

En la carpeta `DTOs` crear la siguiente clase:

```csharp
public class WompiPagoDto
{
    public string PublicKey { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public long AmountInCents { get; set; }
    public string Currency { get; set; } = "COP";
    public string IntegritySignature { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}
```

## 12. Agregar método al PedidoRepository

```csharp
Task<WompiPagoDto?> PrepararPago(int usuarioId, int pedidoId);
```

## 13. Implementar PrepararPago

```csharp
public async Task<WompiPagoDto?> PrepararPago(int usuarioId, int pedidoId)
{
    var pedido = await _context.Pedido.FirstOrDefaultAsync(x =>
        x.Id == pedidoId && x.UsuarioId == usuarioId);

    if (pedido == null)
    {
        return null;
    }

    var montoCentavos = (long)(pedido.Total * 100);

    var firma = _wompiService.GenerarFirmaIntegridad(pedido.ReferenciaWompi, montoCentavos, "COP");

    return new WompiPagoDto
    {
        PublicKey = _wompiSettings.PublicKey,
        Reference = pedido.ReferenciaWompi,
        AmountInCents = montoCentavos,
        Currency = "COP",
        IntegritySignature = firma,
        RedirectUrl = _wompiSettings.RedirectUrl
    };
}
```

## 14. Agregar configuración al Repository

Inyectamos esta configuración:

```csharp
private readonly WompiSettings _wompiSettings;
```

Agregamos la configuración al constructor:

```csharp
public PedidoRepository(ApplicationDbContext context, IWompiService wompiService, IOptions<WompiSettings> options)
{
    _context = context;
    _wompiService = wompiService;
    _wompiSettings = options.Value;
}
```

## 15. Agregar endpoint en PedidoController

```csharp
[Authorize]
[HttpPost("{id}/PrepararPago")]
public async Task<IActionResult> PrepararPago(int id)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var pago = await _pedidoRepository.PrepararPago(userId, id);
    return Ok(pago);
}
```

## 16. Crear endpoint Webhook en PedidoController

```csharp
[HttpPost("Webhook")]
public async Task<IActionResult> Webhook([FromBody] WompiWebhookDto webhook)
{
    if (webhook.Event != "transaction.updated")
    {
        return Ok();
    }

    await _pedidoRepository.ProcesarPagoWompi(webhook);
    return Ok();
}
```

## 17. Procesar el resultado

Agregar en `IPedidoRepository`:

```csharp
Task ProcesarPagoWompi(WompiWebhookDto webhook);
```

Implementar:

```csharp
public async Task ProcesarPagoWompi(WompiWebhookDto webhook)
{
    var transaction = webhook.Data!.Transaction!;

    var pedido = await _context.Pedido.FirstOrDefaultAsync(x =>
        x.ReferenciaWompi == transaction.Reference);

    if (pedido == null)
    {
        return;
    }

    pedido.TransactionIdWompi = transaction.Id;

    if (transaction.Status == "APPROVED")
    {
        pedido.Estado = "Pagado";
    }

    if (transaction.Status == "DECLINED")
    {
        pedido.Estado = "Rechazado";
    }

    await _context.SaveChangesAsync();
}
```

> **Nota:** la aplicación debe estar publicada para que Wompi pueda acceder a este endpoint.

## 18. Configurar el webhook en Wompi

En el ambiente de pruebas de Wompi debemos configurar la URL de eventos (webhook) para apuntar a nuestra API.

1. Entra al Dashboard de Wompi.
2. Ve a la configuración de desarrolladores: en el menú busca **Desarrollo → Programadores**.
3. Selecciona **Sandbox**.
4. Busca **"URL de eventos"**.
5. Coloca la URL pública de tu API + tu endpoint.
