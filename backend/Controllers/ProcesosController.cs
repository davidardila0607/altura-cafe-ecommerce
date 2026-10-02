using CafeApi.DTOs;
using CafeApi.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProcesosController : ControllerBase
    {
        private readonly IProcesoRepository _procesoRepository;

        public ProcesosController(IProcesoRepository procesoRepository)
        {
            _procesoRepository = procesoRepository;
        }

        // ✅ PÚBLICO
        // Devuelve los procesos de beneficio (Lavado, Honey, Fermentado).
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ProcesoResponseDto>>> Get(
            CancellationToken cancellationToken)
        {
            return Ok(await _procesoRepository.GetAllAsync(cancellationToken));
        }
    }
}
