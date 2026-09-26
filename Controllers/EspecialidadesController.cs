using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EspecialidadesController : ControllerBase
    {
        private readonly IEspecialidadRepository _especialidadRepository;

        public EspecialidadesController(IEspecialidadRepository especialidadRepository)
        {
            _especialidadRepository = especialidadRepository;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Especialidad>> Get()
        {
            return Ok(_especialidadRepository.GetAll());
        }

        [HttpGet("{id}")]
        public ActionResult<Especialidad> Get(int id)
        {
            var especialidad = _especialidadRepository.GetById(id);
            if (especialidad == null) return NotFound();
            return Ok(especialidad);
        }

        [HttpPost]
        public ActionResult<Especialidad> Post([FromBody] Especialidad especialidad)
        {
            var created = _especialidadRepository.Create(especialidad);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult Put(int id, [FromBody] Especialidad especialidad)
        {
            var result = _especialidadRepository.Update(id, especialidad);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _especialidadRepository.Delete(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}