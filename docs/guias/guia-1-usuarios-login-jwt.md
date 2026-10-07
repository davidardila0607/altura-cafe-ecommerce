# Guía 1 — Integración de usuarios, login, registro y JWT

## Objetivo

En esta guía se implementará el sistema de autenticación del e-commerce. Al finalizar tendremos:

- Registro de usuarios.
- Login.
- Contraseñas almacenadas de forma segura.
- Generación de JWT.
- Relación entre Usuario y Producto.
- Endpoints protegidos mediante JWT.

## 1. Crear la clase Usuario

Dentro de la carpeta `Models` crear la siguiente clase:

```csharp
public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public ICollection<Producto> Productos { get; set; } = new List<Producto>();
}
```

## 2. Modificar Producto

Modificarlo para relacionarlo con el usuario agregando los siguientes atributos:

```csharp
public int UsuarioId { get; set; }
public Usuario? Usuario { get; set; }
```

## 3. Configurar el DbContext

Agregar al DbContext el DbSet de la clase Usuario:

```csharp
public DbSet<Usuario> Usuario { get; set; }
```

## 4. Crear la migración

```bash
dotnet ef migrations add AddUsuario
dotnet ef database update
```

## 5. Crear DTOs para manejar la clase Usuario

```csharp
public class UsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```

## 6. Configurar JWT

En el archivo `appsettings.json` agregar la siguiente configuración:

```json
"JwtSettings": {
  "Key": "CLAVE_SECRETA_DEL_PROYECTO",
  "Issuer": "EcommerceApi",
  "Audience": "EcommerceAngular",
  "DurationInMinutes": 60
}
```

## 7. Crear JwtSettings

Dentro de la carpeta `Models` definimos la siguiente clase:

```csharp
public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int DurationInMinutes { get; set; }
}
```

## 8. Configurar JWT en Program.cs

Instalar JwtBearer en el proyecto:

```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

Registrar la configuración:

```csharp
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
```

Configurar autenticación:

```csharp
var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>();

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
```

Configurar el middleware, antes de `MapControllers()`:

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

## 9. Crear la interfaz IUsuarioRepository y el repositorio UsuarioRepository

En la carpeta `Interfaces` crear:

```csharp
public interface IUsuarioRepository
{
    Task<string> Registrar(UsuarioDto item);
    Task<string> Login(LoginDto item);
}
```

En la carpeta `Repositories` crear el repositorio `UsuarioRepository` implementando la interfaz:

```csharp
public class UsuarioRepository : IUsuarioRepository
{
}
```

Inyectar los siguientes servicios:

```csharp
private readonly AppDbContext _context;
private readonly JwtSettings _jwtSettings;
```

Crear el constructor:

```csharp
public UsuarioRepository(AppDbContext context, IOptions<JwtSettings> jwtSettings)
{
    _context = context;
    _jwtSettings = jwtSettings.Value;
}
```

Registrar el repositorio en `Program.cs`:

```csharp
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
```

## 10. Agregar funcionalidad al método Registrar

Para las contraseñas utilizaremos `PasswordHasher`.

```csharp
public async Task<string> Registrar(UsuarioDto item)
{
    var usuarioExiste = await _context.Usuario.AnyAsync(x => x.Email == item.Email);

    if (usuarioExiste)
    {
        return "El usuario ya existe.";
    }

    var usuario = new Usuario
    {
        Nombre = item.Nombre,
        Email = item.Email
    };

    var passwordHasher = new PasswordHasher<Usuario>();
    usuario.Password = passwordHasher.HashPassword(usuario, item.Password);

    await _context.Usuario.AddAsync(usuario);
    await _context.SaveChangesAsync();

    return "Usuario registrado correctamente.";
}
```

## 11. Crear el método para generar el JWT

```csharp
private string GenerarToken(Usuario usuario)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
        new Claim(ClaimTypes.Name, usuario.Nombre),
        new Claim(ClaimTypes.Email, usuario.Email)
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _jwtSettings.Issuer,
        audience: _jwtSettings.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
        signingCredentials: credentials);

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

## 12. Agregar funcionalidad al método Login

```csharp
public async Task<string> Login(LoginDto item)
{
    var usuario = await _context.Usuario.FirstOrDefaultAsync(x => x.Email == item.Email);

    if (usuario == null)
    {
        return "Usuario o contraseña incorrectos.";
    }

    var passwordHasher = new PasswordHasher<Usuario>();
    var resultado = passwordHasher.VerifyHashedPassword(usuario, usuario.Password, item.Password);

    if (resultado == PasswordVerificationResult.Failed)
    {
        return "Usuario o contraseña incorrectos.";
    }

    return GenerarToken(usuario);
}
```

## 13. Crear AuthController

En la carpeta `Controllers` creamos un controlador llamado `AuthController` y dentro de él agregamos lo siguiente.

Inyectamos el repositorio:

```csharp
private readonly IUsuarioRepository _usuarioRepository;
```

Creamos el constructor:

```csharp
public AuthController(IUsuarioRepository usuarioRepository)
{
    _usuarioRepository = usuarioRepository;
}
```

Creamos los métodos HTTP correspondientes para llamar a los métodos Registrar y Login:

```csharp
[HttpPost("Register")]
public async Task<IActionResult> Register([FromBody] UsuarioDto item)
{
    return Ok(await _usuarioRepository.Registrar(item));
}

[HttpPost("Login")]
public async Task<IActionResult> Login([FromBody] LoginDto item)
{
    return Ok(await _usuarioRepository.Login(item));
}
```

## 14. Crear producto utilizando el JWT

Antes, cuando creábamos productos, no relacionábamos quién era el dueño de ese producto. Ahora podemos obtener el usuario directamente desde el token y utilizarlo para registrarlo como el dueño de ese producto.

Cambiamos el siguiente método de nuestra interfaz de productos:

```csharp
public Task<string> CreateProducto(ProductoDto item, int userId);
```

Dentro del método HTTP en el controlador de productos agregar la siguiente línea:

```csharp
var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

Y ese `userId` lo enviamos de la siguiente manera:

```csharp
var respuesta = await _productoRepository.CreateProducto(item, userId);
```

## 15. Proteger los endpoints

Dentro de nuestros controladores podemos definir qué métodos HTTP requieren permisos (haber iniciado sesión previamente) para poder usarlos.

La manera de proteger un endpoint es agregando la etiqueta `[Authorize]` a los endpoints que queramos proteger:

```csharp
[Authorize]
[HttpPost("CreateProducto")]
```
