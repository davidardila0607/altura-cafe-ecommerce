using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ Cuerpo de PUT /api/usuarios/{id}/rol.
    public class CambiarRolDto
    {
        // ✅ Solo los dos roles que existen (los mismos del CHECK de la tabla usuario).
        [Required(ErrorMessage = "El rol es obligatorio.")]
        [RegularExpression("^(Administrador|Cliente)$", ErrorMessage = "El rol debe ser Administrador o Cliente.")]
        public string Rol { get; set; } = string.Empty;
    }
}
