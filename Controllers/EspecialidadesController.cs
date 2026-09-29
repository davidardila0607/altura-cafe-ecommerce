using CafeApi.DTOs;
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

        public EspecialidadesController(
            IEspecialidadRepository especialidadRepository)
        {
            _especialidadRepository = especialidadRepository;
        }

        // ✅ GET ALL
        // Devuelve todas las especialidades utilizando DTOs.
        [HttpGet]
        public ActionResult<IEnumerable<EspecialidadResponseDto>> Get()
        {
            var especialidades =
                _especialidadRepository.GetAll();

            var response =
                especialidades.Select(especialidad =>
                    new EspecialidadResponseDto
                    {
                        Id = especialidad.Id,

                        Nombre = especialidad.Nombre
                    });

            return Ok(response);
        }

        // ✅ GET BY ID
        // Devuelve una especialidad utilizando DTOs.
        [HttpGet("{id}")]
        public ActionResult<EspecialidadResponseDto> Get(int id)
        {
            var especialidad =
                _especialidadRepository.GetById(id);

            if (especialidad == null)
            {
                return NotFound();
            }

            var response =
                new EspecialidadResponseDto
                {
                    Id = especialidad.Id,

                    Nombre = especialidad.Nombre
                };

            return Ok(response);
        }

        // ✅ POST
        // Todavía utiliza la entidad directamente.
        // Más adelante crearemos CreateEspecialidadDto.
        [HttpPost]
        public ActionResult<Especialidad> Post(
            [FromBody] Especialidad especialidad)
        {
            var created =
                _especialidadRepository.Create(especialidad);

            return CreatedAtAction(
                nameof(Get),
                new { id = created.Id },
                created
            );
        }

        // ✅ PUT
        // Todavía utiliza la entidad directamente.
        // Más adelante crearemos UpdateEspecialidadDto.
        [HttpPut("{id}")]
        public IActionResult Put(
            int id,
            [FromBody] Especialidad especialidad)
        {
            var result =
                _especialidadRepository.Update(
                    id,
                    especialidad
                );

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        // ✅ DELETE
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result =
                _especialidadRepository.Delete(id);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}