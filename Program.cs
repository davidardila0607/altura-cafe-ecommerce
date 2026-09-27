using CafeApi.Interfaces;
using CafeApi.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using CafeApi.Middleware;

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

//
// ===== DIAGNÓSTICO SEGURO DE BASE DE DATOS =====
//

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

builder.Services.AddScoped<IEspecialidadRepository>(_ =>
    new EspecialidadRepository(connectionString));

builder.Services.AddScoped<ICafeRepository>(_ =>
    new CafeRepository(connectionString));

//
// ===== JWT AUTHENTICATION =====
//

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration["Jwt:Key"]!
                        )
                    )
            };
    });

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
        Description = "API REST para gestión de cafés y especialidades."
    });

    // ✅ NUEVO
    // Configuración JWT para Swagger.
    /*options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description =
            "Introduce únicamente el token JWT. Swagger añadirá automáticamente 'Bearer '."
    }); 
    

    // ✅ NUEVO
    // Requiere JWT para endpoints protegidos.
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });*/
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