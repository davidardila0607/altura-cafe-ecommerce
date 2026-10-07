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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularLocalhost", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var connectionString =
    builder.Configuration.GetConnectionString("CafeDatabase");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Configura la cadena de conexión en ConnectionStrings:CafeDatabase.");
}
builder.Services.Configure<CloudinarySettings>(
 builder.Configuration.GetSection("CloudinarySettings"));


// ===== DIAGNÓSTICO SEGURO DE BASE DE DATOS ====//

string databaseProvider;
string databasePort;

if (connectionString.Contains("supabase", StringComparison.OrdinalIgnoreCase) ||
    connectionString.Contains("5432"))
{
    databaseProvider = "PostgreSQL (Supabase)";
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

// ⏳ ICartRepository/CartRepository no se registra: el carrito está pendiente.

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

app.UseCors("AllowAngularLocalhost");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();