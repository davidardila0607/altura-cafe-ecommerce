using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CafesController : ControllerBase
    {
        private readonly ICafeRepository _cafeRepository;

        public CafesController(ICafeRepository cafeRepository)
        {
            _cafeRepository = cafeRepository;
        }

        // ✅ PÚBLICO
        // Cualquier usuario puede consultar la lista de cafés.
        [HttpGet]
        [AllowAnonymous]
        public ActionResult<IEnumerable<Cafe>> Get()
        {
            return Ok(_cafeRepository.GetAll());
        }

        // ✅ PÚBLICO
        // Cualquier usuario puede consultar un café por su Id.
        [HttpGet("{id}")]
        [AllowAnonymous]
        public ActionResult<Cafe> Get(int id)
        {
            var cafe = _cafeRepository.GetById(id);

            if (cafe == null)
                return NotFound();

            return Ok(cafe);
        }

        // ✅ AUTENTICADO
        // Cualquier usuario con un JWT válido puede crear cafés.
        [HttpPost]
        [Authorize]
        public ActionResult<Cafe> Post([FromBody] Cafe cafe)
        {
            var created = _cafeRepository.Create(cafe);

            return CreatedAtAction(
            nameof(Get),
            new { id = created.Id },
            created
            );
        }

        // ✅ SOLO ADMINISTRADOR
        // Requiere JWT válido + Role = Administrador.
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Put(int id, [FromBody] Cafe cafe)
        {
            var result = _cafeRepository.Update(id, cafe);

            if (!result)
                return NotFound();

            return NoContent();
        }

        // ✅ SOLO ADMINISTRADOR
        // Requiere JWT válido + Role = Administrador.
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Delete(int id)
        {
            var result = _cafeRepository.Delete(id);

            if (!result)
                return NotFound();

            return NoContent();
        }
    }
}