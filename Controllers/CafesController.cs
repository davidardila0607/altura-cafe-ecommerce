using CafeApi.Interfaces;
using CafeApi.Models;
using CafeApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

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
        // Devuelve información preparada para el cliente.
        [HttpGet]
        [AllowAnonymous]
        public ActionResult<IEnumerable<CafeResponseDto>> Get()
        {
            var cafes = _cafeRepository.GetAll();

            var response = cafes.Select(cafe => new CafeResponseDto
            {
                Id = cafe.Id,

                Especialidad = cafe.Especialidad,

                Nombre = cafe.Nombre,

                Origen = cafe.Origen,

                StockDisponible = cafe.Stock,

                Disponible = cafe.Stock > 0,

                EstadoStock = ObtenerEstadoStock(cafe.Stock),

                Precio = cafe.Precio
            });
            Console.WriteLine("===== GET DTO EJECUTADO =====");
            return Ok(response);
            
        }

        // ✅ PÚBLICO
        // Devuelve un café por Id utilizando CafeResponseDto.
        [HttpGet("{id}")]
        [AllowAnonymous]
        public ActionResult<CafeResponseDto> Get(int id)
        {
            // ✅ Buscar el café.
            var cafe = _cafeRepository.GetById(id);

            // ✅ Si no existe devolvemos 404.
            if (cafe == null)
            {
                return NotFound();
            }

            // ✅ Convertimos la entidad Cafe en CafeResponseDto.
            var response = new CafeResponseDto
            {
                Id = cafe.Id,

                Especialidad = cafe.Especialidad,

                Nombre = cafe.Nombre,

                Origen = cafe.Origen,

                StockDisponible = cafe.Stock,

                Disponible = cafe.Stock > 0,

                EstadoStock = ObtenerEstadoStock(cafe.Stock),

                Precio = cafe.Precio
            };

            return Ok(response);

        }
            // ✅ AUTENTICADO
            // Cualquier usuario con JWT válido puede crear cafés.
            [HttpPost]
        [Authorize]
        public ActionResult<Cafe> Post([FromBody] CreateCafeDto dto)
        {
            // ✅ Creamos una entidad Cafe a partir del DTO.
            var cafe = new Cafe
            {
                // ✅ Copiamos los datos validados del DTO.
                EspecialidadId = dto.EspecialidadId,

                Nombre = dto.Nombre,

                Origen = dto.Origen,

                Stock = dto.Stock,

                Precio = dto.Precio
            };

            // ✅ Guardamos la entidad en la base de datos.
            var created = _cafeRepository.Create(cafe);

            // ✅ Devuelve HTTP 201 Created.
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
        public IActionResult Put(int id, [FromBody] UpdateCafeDto dto)
        {
            // ✅ Convertimos el DTO en una entidad Cafe.
            var cafe = new Cafe
            {
                EspecialidadId = dto.EspecialidadId,

                Nombre = dto.Nombre,

                Origen = dto.Origen,

                Stock = dto.Stock,

                Precio = dto.Precio
            };

            // ✅ Actualizamos el registro.
            var result = _cafeRepository.Update(id, cafe);

            // ✅ Si no existe el registro devolvemos 404.
            if (!result)
                return NotFound();

            // ✅ Actualización correcta.
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

        // ✅ Calcula el estado del stock según la cantidad disponible.
        private static string ObtenerEstadoStock(int stock)
        {
            if (stock == 0)
            {
                return "Agotado";
            }

            if (stock <= 10)
            {
                return "Pocas unidades";
            }

            if (stock <= 50)
            {
                return "Disponible";
            }

            return "Alta disponibilidad";

        }
    }

}