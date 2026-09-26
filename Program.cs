using CafeApi.Interfaces;
using CafeApi.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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
Console.WriteLine("========DATOS DE CONEXIÓN=========");
Console.WriteLine($"Entorno       : {builder.Environment.EnvironmentName}");
Console.WriteLine($"Base de Datos : {databaseProvider}");
Console.WriteLine($"Puerto        : {databasePort}");
Console.WriteLine("========================================");
Console.WriteLine();

builder.Services.AddScoped<IEspecialidadRepository>(_ =>
    new EspecialidadRepository(connectionString));

builder.Services.AddScoped<ICafeRepository>(_ =>
    new CafeRepository(connectionString));

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
                            builder.Configuration["Jwt:Key"]!))
            };
    });

builder.Services.AddControllers();

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngularLocalhost");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();