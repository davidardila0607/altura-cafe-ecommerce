using CafeApi.Data;
using CafeApi.Data.Configurations;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VariedadesController : ControllerBase
    {
        private const string MensajeVariedadDuplicada =
            "Ya existe una variedad con ese nombre.";

        private const string MensajeVariedadConCafes =
            "No se puede eliminar una variedad que tiene cafés asociados.";

        private readonly IVariedadRepository _variedadRepository;

        public VariedadesController(
            IVariedadRepository variedadRepository)
        {
            _variedadRepository = variedadRepository;
        }

        // ✅ PÚBLICO
        // Devuelve todas las variedades utilizando DTOs.
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<VariedadResponseDto>>> Get(
            CancellationToken cancellationToken)
        {
            return Ok(await _variedadRepository.GetAllAsync(cancellationToken));
        }

        // ✅ PÚBLICO
        // Devuelve una variedad utilizando DTOs.
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<VariedadResponseDto>> Get(
            int id,
            CancellationToken cancellationToken)
        {
            var variedad = await _variedadRepository.GetByIdAsync(id, cancellationToken);

            if (variedad == null)
            {
                return NotFound();
            }

            return Ok(variedad);
        }

        // ✅ SOLO ADMINISTRADOR
        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<VariedadResponseDto>> Post(
            [FromBody] CreateVariedadDto dto,
            CancellationToken cancellationToken)
        {
            var variedad = new Variedad
            {
                Nombre = dto.Nombre.Trim(),
                Descripcion = dto.Descripcion
            };

            try
            {
                await _variedadRepository.CreateAsync(variedad, cancellationToken);
            }
            catch (DbUpdateException ex)
                when (ex.EsViolacionDeUnicidad(VariedadConfiguration.IndiceNombreUnico))
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Variedad duplicada",
                    detail: MensajeVariedadDuplicada
                );
            }

            var response = new VariedadResponseDto
            {
                Id = variedad.Id,
                Nombre = variedad.Nombre,
                Descripcion = variedad.Descripcion
            };

            return CreatedAtAction(
                nameof(Get),
                new { id = variedad.Id },
                response
            );
        }

        // ✅ SOLO ADMINISTRADOR
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Put(
            int id,
            [FromBody] UpdateVariedadDto dto,
            CancellationToken cancellationToken)
        {
            var variedad = await _variedadRepository.FindAsync(id, cancellationToken);

            if (variedad == null)
            {
                return NotFound();
            }

            variedad.Nombre = dto.Nombre.Trim();
            variedad.Descripcion = dto.Descripcion;

            try
            {
                await _variedadRepository.UpdateAsync(variedad, cancellationToken);
            }
            catch (DbUpdateException ex)
                when (ex.EsViolacionDeUnicidad(VariedadConfiguration.IndiceNombreUnico))
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Variedad duplicada",
                    detail: MensajeVariedadDuplicada
                );
            }

            return NoContent();
        }

        // ✅ SOLO ADMINISTRADOR
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(
            int id,
            CancellationToken cancellationToken)
        {
            var variedad = await _variedadRepository.FindAsync(id, cancellationToken);

            if (variedad == null)
            {
                return NotFound();
            }

            // ✅ No se permite borrar una variedad con cafés (FK RESTRICT).
            if (await _variedadRepository.TieneCafesAsync(id, cancellationToken))
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Variedad en uso",
                    detail: MensajeVariedadConCafes
                );
            }

            try
            {
                await _variedadRepository.DeleteAsync(variedad, cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.EsViolacionDeClaveForanea())
            {
                // ✅ Un café se asoció entre la comprobación y el borrado.
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Variedad en uso",
                    detail: MensajeVariedadConCafes
                );
            }

            return NoContent();
        }
    }
}
