using CafeApi.DTOs;
using CafeApi.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CafeApi.Controllers
{
    // ✅ Guía 1, paso 13: registro e inicio de sesión.
    // Rutas: POST /api/auth/Register y POST /api/auth/Login.
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private const string MensajeUsuarioExiste = "El usuario ya existe.";
        private const string MensajeCredencialesIncorrectas = "Usuario o contraseña incorrectos.";

        private readonly IUsuarioRepository _usuarioRepository;

        public AuthController(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        // ✅ Adaptación 7: la guía responde Ok() siempre, incluso cuando el registro o el
        // login fallan, y así el frontend no puede saber qué pasó. El repositorio sigue
        // devolviendo un texto (como la guía) y aquí ese texto se traduce a un código HTTP:
        //   Register: "El usuario ya existe." → 400; registrado → 200. Ambos con { mensaje }.
        //   Login: "Usuario o contraseña incorrectos." → 401 { mensaje }; si no, es el token → 200 { token }.
        // Los datos inválidos (correo mal escrito, contraseña corta) los rechaza [ApiController] con 400.
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] UsuarioDto item)
        {
            var mensaje = await _usuarioRepository.Registrar(item);

            if (mensaje == MensajeUsuarioExiste)
            {
                return BadRequest(new { mensaje });
            }

            return Ok(new { mensaje });
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDto item)
        {
            var resultado = await _usuarioRepository.Login(item);

            if (resultado == MensajeCredencialesIncorrectas)
            {
                return Unauthorized(new { mensaje = resultado });
            }

            return Ok(new { token = resultado });
        }

        // ✅ Usuario actual: el Id sale del token y el resto se lee de la base de datos.
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UsuarioActualDto>> Me()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var usuario = await _usuarioRepository.ObtenerPorId(userId);

            // ✅ El token es válido pero el usuario ya no existe (por ejemplo, se borró).
            if (usuario == null)
            {
                return Unauthorized();
            }

            return Ok(usuario);
        }
    }
}
