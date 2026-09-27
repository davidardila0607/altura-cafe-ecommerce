using CafeApi.Models;
using Google.Apis.Auth;
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

        // ✅ LOGIN PARA PRUEBAS JWT Y ROLES
        // Permite iniciar sesión como Administrador o Cliente.
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // ✅ Almacenará el rol del usuario autenticado.
            string role;

            // ✅ Usuario Administrador
            if (request.Email == "admin@cafeapi.com" &&
            request.Password == "123456")
            {
                role = "Administrador";
            }

            // ✅ Usuario Cliente
            else if (request.Email == "cliente@cafeapi.com" &&
            request.Password == "123456")
            {
                role = "Cliente";
            }

            // ✅ Credenciales incorrectas
            else
            {
                return Unauthorized("Credenciales inválidas.");
            }

            // ✅ Genera JWT incluyendo el rol.
            var token = GenerateJwt(
            request.Email,
            request.Email,
            role
            );

            return Ok(new
            {
                token,
                role
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
            "Cliente"
            );

            return Ok(new
            {
                token = jwt,
                email = payload.Email,
                name = payload.Name,
                role = "Cliente"
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