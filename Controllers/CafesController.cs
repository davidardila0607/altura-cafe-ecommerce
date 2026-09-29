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

        // ✅ Logger del controlador.
        private readonly ILogger<CafesController> _logger;

        public CafesController(
        ICafeRepository cafeRepository,
        ILogger<CafesController> logger)
        {
            _cafeRepository = cafeRepository;

            // ✅ Inyección del logger.
            _logger = logger;
        }

        /*public CafesController(ICafeRepository cafeRepository)
        {
            _cafeRepository = cafeRepository;
        }*/

        // ✅ PÚBLICO
        // Devuelve información preparada para el cliente.
        [HttpGet]
        [AllowAnonymous]
        public ActionResult<IEnumerable<CafeResponseDto>> Get()
        {
            var cafes = _cafeRepository.GetAll();

            // ✅ Registrar consulta de cafés.
            _logger.LogInformation(
            "Se consultó la lista de cafés."
            );

            var response = cafes.Select(cafe => new CafeResponseDto
            {
                Id = cafe.Id,

                Especialidad = cafe.Especialidad,

                Nombre = cafe.Nombre,

                ImagenUrl = cafe.ImagenUrl,

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

                _logger.LogInformation(
                   "Se consultó el café con Id: {Id}",
                   id
                );

            // ✅ Si no existe devolvemos 404.
            if (cafe == null)
            {
                _logger.LogWarning(
                    "No se encontró el café con Id: {Id}",
                    id
                   );



                return NotFound();
            }

            // ✅ Convertimos la entidad Cafe en CafeResponseDto.
            var response = new CafeResponseDto
            {
                Id = cafe.Id,

                Especialidad = cafe.Especialidad,

                Nombre = cafe.Nombre,

                ImagenUrl = cafe.ImagenUrl,

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

                ImagenUrl = dto.ImagenUrl,

                Origen = dto.Origen,

                Stock = dto.Stock,

                Precio = dto.Precio
            };

            // ✅ Guardamos la entidad en la base de datos.
            var created = _cafeRepository.Create(cafe);

                _logger.LogInformation(
                    "Se creó el café: {Nombre}",
                     cafe.Nombre
                 );

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

                ImagenUrl = dto.ImagenUrl,

                Origen = dto.Origen,

                Stock = dto.Stock,

                Precio = dto.Precio
            };

            _logger.LogInformation(
            "Solicitud de actualización para el café con Id: {Id}",
            id
            );

            // ✅ Actualizamos el registro.
            var result = _cafeRepository.Update(id, cafe);

            // ✅ Si no existe devolvemos 404.
            if (!result)
            {
                _logger.LogWarning(
                "No se pudo actualizar el café con Id: {Id} porque no existe.",
                id
                );

                return NotFound();
            }

            _logger.LogInformation(
            "Se actualizó correctamente el café con Id: {Id}",
            id
            );

            return NoContent();
        }

        
           // ✅ SOLO ADMINISTRADOR
           // Requiere JWT válido + Role = Administrador.
           [HttpDelete("{id}")]
           [Authorize(Roles = "Administrador")]
           public IActionResult Delete(int id)
           {
            _logger.LogInformation(
            "Solicitud de eliminación para el café con Id: {Id}",
            id
            );

            var result = _cafeRepository.Delete(id);

            if (!result)
            {
                _logger.LogWarning(
                "No se pudo eliminar el café con Id: {Id} porque no existe.",
                id
                );

                return NotFound();
            }

            _logger.LogInformation(
            "Se eliminó correctamente el café con Id: {Id}",
            id
            );

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