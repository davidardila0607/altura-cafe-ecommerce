using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using CafeApi.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CafeApi.Repositories
{
    // ✅ Guía 1, pasos 9 a 12: registro, login y generación del JWT.
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly AppDbContext _context;
        private readonly JwtSettings _jwtSettings;

        // ✅ Adaptación 5: correos que se registran como Administrador ("Admin:Correos").
        private readonly HashSet<string> _correosAdministrador;

        public UsuarioRepository(
            AppDbContext context,
            IOptions<JwtSettings> jwtSettings,
            IConfiguration configuration)
        {
            _context = context;
            _jwtSettings = jwtSettings.Value;

            _correosAdministrador = (configuration.GetSection("Admin:Correos").Get<string[]>() ?? [])
                .Select(NormalizarEmail)
                .ToHashSet();
        }

        // ✅ Paso 10: registrar un usuario con la contraseña cifrada (hash).
        public async Task<string> Registrar(UsuarioDto item)
        {
            var email = NormalizarEmail(item.Email);

            var usuarioExiste = await _context.Usuario.AnyAsync(x => x.Email == email);

            if (usuarioExiste)
            {
                return "El usuario ya existe.";
            }

            var usuario = new Usuario
            {
                Nombre = item.Nombre.Trim(),
                Email = email,
                Rol = _correosAdministrador.Contains(email) ? Roles.Administrador : Roles.Cliente
            };

            // ✅ PasswordHasher guarda un hash con sal (empieza por "AQAAAA"),
            // nunca la contraseña escrita por el usuario.
            var passwordHasher = new PasswordHasher<Usuario>();
            usuario.Password = passwordHasher.HashPassword(usuario, item.Password);

            await _context.Usuario.AddAsync(usuario);
            await _context.SaveChangesAsync();

            return "Usuario registrado correctamente.";
        }

        // ✅ Paso 11: el token lleva quién es el usuario y su rol, firmado con JwtSettings:Key.
        private string GenerarToken(Usuario usuario)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nombre),
                new Claim(ClaimTypes.Email, usuario.Email),

                // ✅ Adaptación 6: el rol, para la política GestionInventario y el panel.
                new Claim(ClaimTypes.Role, usuario.Rol)
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

        // ✅ Paso 12: comprobar el correo y la contraseña y devolver el token.
        public async Task<string> Login(LoginDto item)
        {
            var email = NormalizarEmail(item.Email);

            var usuario = await _context.Usuario.FirstOrDefaultAsync(x => x.Email == email);

            if (usuario == null)
            {
                return "Usuario o contraseña incorrectos.";
            }

            // ✅ Se compara el hash guardado con la contraseña recibida.
            var passwordHasher = new PasswordHasher<Usuario>();
            var resultado = passwordHasher.VerifyHashedPassword(usuario, usuario.Password, item.Password);

            if (resultado == PasswordVerificationResult.Failed)
            {
                return "Usuario o contraseña incorrectos.";
            }

            return GenerarToken(usuario);
        }

        // ✅ Para GET /api/auth/me: proyección directa (sin cargar la entidad ni el hash).
        public async Task<UsuarioActualDto?> ObtenerPorId(int id)
        {
            return await _context.Usuario
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new UsuarioActualDto
                {
                    Email = u.Email,
                    Nombre = u.Nombre,
                    Roles = new List<string> { u.Rol }
                })
                .FirstOrDefaultAsync();
        }

        // ✅ Adaptación 4: "Ana@Correo.com " y "ana@correo.com" son la misma cuenta.
        private static string NormalizarEmail(string email) => email.Trim().ToLowerInvariant();
    }
}
