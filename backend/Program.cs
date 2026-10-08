using CafeApi.Interfaces;
using CafeApi.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using CafeApi.Data;
using CafeApi.Middleware;
using CafeApi.Configurations;
using CafeApi.Services;
using CafeApi.Seguridad;
using CafeApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ✅ Producción (Railway y similares): el hosting indica el puerto en la variable PORT.
// Si existe, la API escucha en todas las interfaces de ese puerto; si no, se usa
// launchSettings.json (http://localhost:5031 en desarrollo).
var puerto = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(puerto))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{puerto}");
}

// ✅ Orígenes que pueden llamar a la API desde el navegador (CORS).
// En desarrollo: http://localhost:4200 (appsettings.json). En producción se agrega
// la URL del frontend con la variable de entorno Cors__AllowedOrigins__0.
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.WithOrigins(origenesPermitidos)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var connectionString =
    builder.Configuration.GetConnectionString("CafeDatabase");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Falta la cadena de conexión. Configura ConnectionStrings:CafeDatabase " +
        "(en local, appsettings.Development.json; en producción, la variable ConnectionStrings__CafeDatabase).");
}

// ✅ Sin una clave propia la API firmaría tokens con el marcador de appsettings.json.
// Se exige que exista y que no sea el marcador (HMAC-SHA256 necesita al menos 32 bytes).
var claveJwt = builder.Configuration["JwtSettings:Key"];

if (string.IsNullOrWhiteSpace(claveJwt) ||
    claveJwt == "CLAVE_SECRETA_DEL_PROYECTO" ||
    Encoding.UTF8.GetByteCount(claveJwt) < 32)
{
    throw new InvalidOperationException(
        "Falta la clave de los JWT o es demasiado corta. Configura JwtSettings:Key con 64 bytes aleatorios en Base64 " +
        "(en local, appsettings.Development.json; en producción, la variable JwtSettings__Key).");
}
builder.Services.Configure<CloudinarySettings>(
 builder.Configuration.GetSection("CloudinarySettings"));


// ===== DIAGNÓSTICO SEGURO DE BASE DE DATOS ====//

string databaseProvider;
string databasePort;

if (connectionString.Contains("supabase", StringComparison.OrdinalIgnoreCase))
{
    databaseProvider = "PostgreSQL (Supabase)";
    databasePort = "5432";
}
else if (connectionString.Contains("5432"))
{
    databaseProvider = "PostgreSQL";
    databasePort = "5432";
}
else if (connectionString.Contains("3306"))
{
    databaseProvider = "MySQL";
    databasePort = "3306";
}
else
{
    databaseProvider = "Desconocida";
    databasePort = "N/D";
}

Console.WriteLine();
Console.WriteLine("======== DATOS DE CONEXIÓN ========");
Console.WriteLine($"Entorno       : {builder.Environment.EnvironmentName}");
Console.WriteLine($"Base de Datos : {databaseProvider}");
Console.WriteLine($"Puerto        : {databasePort}");
Console.WriteLine("===================================");
Console.WriteLine();

// ✅ EF Core con PostgreSQL (Npgsql) y nombres snake_case.
builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(connectionString)
        .UseSnakeCaseNamingConvention());

// ✅ Repositorios: reciben AppDbContext por inyección de dependencias.
builder.Services.AddScoped<IVariedadRepository, VariedadRepository>();

builder.Services.AddScoped<ICafeRepository, CafeRepository>();

builder.Services.AddScoped<IProcesoRepository, ProcesoRepository>();

// ✅ Guía 1, paso 9: registro, login y JWT.
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

// ✅ Guía 2, paso 7: carrito de compras.
builder.Services.AddScoped<ICarritoRepository, CarritoRepository>();

// ✅ Guía de pedidos, paso 7: pedidos creados a partir del carrito.
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();

// ✅ Guía 3, pasos 4 y 10: configuración y servicio de Wompi (en el PDF a la línea de
// Configure le falta el paréntesis de cierre). AddHttpClient permite a WompiService consultar
// una transacción a la API de Wompi (ConfirmarPago, modo real).
builder.Services.Configure<WompiSettings>(builder.Configuration.GetSection("WompiSettings"));
builder.Services.AddScoped<IWompiService, WompiService>();
builder.Services.AddHttpClient();

// ✅ Registro del servicio Cloudinary.
builder.Services.AddScoped<
ICloudinaryService,
CloudinaryService>();

//
// ===== JWT AUTHENTICATION (Guía 1, paso 8) =====
//

// ✅ Lee la sección "JwtSettings" para inyectarla con IOptions<JwtSettings> (UsuarioRepository).
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>();

// ✅ Cada petición con "Authorization: Bearer <token>" se valida así: mismo emisor,
// misma audiencia, sin expirar y firmado con nuestra Key.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings!.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.Key))
        };
    });

builder.Services.AddAuthorization();

// ✅ Adaptación 3: sobre AddAuthorization se conservan las políticas por rol
// (GestionInventario = Administrador; ver Seguridad/Politicas.cs).
Politicas.Registrar(builder.Services.AddAuthorizationBuilder());

builder.Services.AddControllers();

//
// ===== SWAGGER =====
//

// ✅ NUEVO
// Permite que Swagger descubra automáticamente los endpoints.
builder.Services.AddEndpointsApiExplorer();

// ✅ NUEVO
// Genera la documentación Swagger.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CafeApi",
        Version = "v1",
        Description = "API REST para gestión de cafés y variedades."
    });

    // ✅ Configuración JWT para Swagger (botón Authorize).
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description =
            "Introduce únicamente el token JWT. Swagger añadirá automáticamente 'Bearer '."
    });

    // ✅ Envía el JWT en las peticiones hechas desde Swagger.
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

// ✅ Conservamos OpenAPI nativo.
builder.Services.AddOpenApi();

var app = builder.Build();

// ✅ Swagger y OpenAPI solo en Development: en producción no se publica la documentación.
// No hay UseHttpsRedirection: en producción el hosting (Railway) recibe el HTTPS y
// reenvía la petición a la API por HTTP dentro de su red.
if (app.Environment.IsDevelopment())
{
    // ✅ Mantiene disponible el JSON OpenAPI.
    app.MapOpenApi();

    // ✅ Swagger JSON.
    app.UseSwagger();

    // ✅ Interfaz gráfica Swagger.
    app.UseSwaggerUI();
}

// ✅ Middleware global de excepciones.
// Captura errores no controlados en toda la aplicación.
app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("PermitirFrontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// ✅ Salud: público, para que el hosting compruebe que la API está viva.
app.MapGet("/api/health", () => Results.Ok(new { estado = "ok" }));

app.Run();