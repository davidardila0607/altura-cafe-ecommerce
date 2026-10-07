using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Repositories;
using CafeApi.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CafeApi.Controllers
{
    // ✅ Administración de usuarios (página /admin/usuarios). Solo con la política
    // GestionUsuarios (rol Administrador). No hay endpoint para borrar usuarios.
    [ApiController]
    [Route("api/usuarios")]
    [Authorize(Policy = Politicas.GestionUsuarios)]
    public class UsuariosController : ControllerBase
    {
        private const string MensajePropioRol = "No puedes quitarte tu propio rol de administrador.";

        private readonly IUsuarioRepository _usuarioRepository;

        public UsuariosController(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        // ✅ GET /api/usuarios: id, nombre, email, rol y cafés creados (sin contraseña).
        [HttpGet]
        public async Task<ActionResult<List<UsuarioAdminDto>>> Obtener()
        {
            return Ok(await _usuarioRepository.ObtenerUsuarios());
        }

        // ✅ PUT /api/usuarios/{id}/rol con { rol }. 200 / 400 / 404 / 409, siempre con { mensaje }.
        // El usuario afectado ve el rol nuevo cuando vuelve a iniciar sesión (el rol va dentro del token).
        [HttpPut("{id:int}/rol")]
        public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolDto item)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // ✅ Evita que el panel se quede sin nadie que lo administre por un clic propio.
            if (id == userId && item.Rol != Roles.Administrador)
            {
                return Conflict(new { mensaje = MensajePropioRol });
            }

            var mensaje = await _usuarioRepository.CambiarRol(id, item.Rol);

            if (mensaje == UsuarioRepository.MensajeUsuarioNoExiste)
            {
                return NotFound(new { mensaje });
            }

            return Ok(new { mensaje });
        }
    }
}
