using CafeApi.DTOs;
using CafeApi.Models;
using CafeApi.Seguridad;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // ✅ Cuentas fijas de prueba (todavía no hay tabla de usuarios).
        // Para agregar un usuario autorizado basta con añadir una línea con su rol.
        private static readonly (string Email, string Password, string Nombre, string Rol)[] CuentasDePrueba =
        [
            ("admin@cafeapi.com", "123456", "Administración Altura", Roles.Administrador),
            ("cliente@cafeapi.com", "123456", "Cliente de prueba", Roles.Cliente),
        ];

        // ✅ LOGIN PARA PRUEBAS JWT Y ROLES
        // Permite iniciar sesión como Administrador o Cliente.
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDto request)
        {
            // ✅ Busca la cuenta (el correo sin distinguir mayúsculas).
            var cuenta = CuentasDePrueba.FirstOrDefault(c =>
                string.Equals(c.Email, request.Email.Trim(), StringComparison.OrdinalIgnoreCase) &&
                c.Password == request.Password);

            // ✅ Credenciales incorrectas.
            if (cuenta.Email is null)
            {
                return Unauthorized("Credenciales inválidas.");
            }

            // ✅ Genera JWT con email, nombre y rol.
            var token = GenerateJwt(cuenta.Email, cuenta.Nombre, cuenta.Rol);

            // ✅ Construimos la respuesta utilizando DTO.
            var response = new LoginResponseDto
            {
                Token = token,

                Email = cuenta.Email,

                Role = cuenta.Rol
            };

            return Ok(response);
        }

        // ✅ USUARIO ACTUAL
        // Devuelve lo que dice el JWT recibido: correo, nombre y roles.
        // El frontend lo usa para saber quién inició sesión.
        [HttpGet("me")]
        [Authorize]
        public ActionResult<UsuarioActualDto> Me()
        {
            return Ok(new UsuarioActualDto
            {
                Email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                Nombre = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
                Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList()
            });
        }


        // ✅ LOGIN CON GOOGLE
        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin(
        [FromBody] GoogleLoginRequest request)
        {
            GoogleJsonWebSignature.Payload payload;

            try
            {
                var settings =
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[]
                {
                 _configuration["Google:ClientId"]
                }
                };

                payload =
                await GoogleJsonWebSignature.ValidateAsync(
                request.IdToken,
                settings
                );
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(
                "Token de Google inválido."
                );
            }

            // ✅ Los usuarios Google entran inicialmente como Cliente.
            var jwt = GenerateJwt(
            payload.Email,
            payload.Name,
            Roles.Cliente
            );

            return Ok(new
            {
                token = jwt,
                email = payload.Email,
                name = payload.Name,
                role = Roles.Cliente
            });
        }

        // ✅ GENERADOR DE JWT CON ROLES
        private string GenerateJwt(
        string email,
        string name,
        string role)
        {
            // ✅ Claims incluidos dentro del JWT.
            var claims = new[]
            {
            // ✅ Correo electrónico.
            new Claim(ClaimTypes.Email, email),
 
            // ✅ Nombre del usuario.
            new Claim(ClaimTypes.Name, name),
 
            // ✅ Rol del usuario.
            new Claim(ClaimTypes.Role, role)
            };

            // ✅ Clave secreta utilizada para firmar el JWT.
            var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"]!
            )
            );

            // ✅ Algoritmo de firma.
            var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
            );

            // ✅ Construcción del Token.
            var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
            double.Parse(
            _configuration["Jwt:ExpiresInMinutes"]!
            )
            ),
            signingCredentials: creds
            );

            // ✅ Convertir JWT a string.
            return new JwtSecurityTokenHandler()
            .WriteToken(token);
        }
    }
}