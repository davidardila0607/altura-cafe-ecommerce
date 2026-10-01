using CafeApi.DTOs;
using CafeApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresentacionesController : ControllerBase
    {
        // ✅ PÚBLICO
        // Devuelve las presentaciones disponibles a partir del enum Presentacion.
        [HttpGet]
        [AllowAnonymous]
        public ActionResult<IEnumerable<PresentacionResponseDto>> Get()
        {
            var presentaciones = Enum.GetValues<Presentacion>()
                .Select(p => new PresentacionResponseDto
                {
                    Value = (int)p,
                    Label = $"{(int)p} g"
                });

            return Ok(presentaciones);
        }
    }
}
