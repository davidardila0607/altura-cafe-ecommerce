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
    public class CafesController : ControllerBase
    {
        private const string MensajeCafeDuplicado =
            "Ya existe un café con ese nombre, variedad y presentación.";

        private const string MensajeVariedadInexistente =
            "La variedad indicada no existe.";

        private readonly ICafeRepository _cafeRepository;

        private readonly IVariedadRepository _variedadRepository;

        private readonly ICloudinaryService _cloudinaryService;

        // ✅ Logger del controlador.
        private readonly ILogger<CafesController> _logger;

        public CafesController(
            ICafeRepository cafeRepository,
            IVariedadRepository variedadRepository,
            ICloudinaryService cloudinaryService,
            ILogger<CafesController> logger)
        {
            _cafeRepository = cafeRepository;

            _variedadRepository = variedadRepository;

            _cloudinaryService = cloudinaryService;

            // ✅ Inyección del logger.
            _logger = logger;
        }

        // ✅ PÚBLICO
        // Devuelve información preparada para el cliente.
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CafeResponseDto>>> Get(
            CancellationToken cancellationToken)
        {
            var cafes = await _cafeRepository.GetAllAsync(cancellationToken);

            // ✅ Registrar consulta de cafés.
            _logger.LogInformation(
                "Se consultó la lista de cafés."
            );

            return Ok(cafes);
        }

        // ✅ PÚBLICO
        // Devuelve un café por Id utilizando CafeResponseDto.
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<CafeResponseDto>> Get(
            int id,
            CancellationToken cancellationToken)
        {
            // ✅ Buscar el café.
            var cafe = await _cafeRepository.GetByIdAsync(id, cancellationToken);

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

            return Ok(cafe);
        }

        // ✅ AUTENTICADO
        // Cualquier usuario con JWT válido puede crear cafés.
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<CafeResponseDto>> Post(
            [FromBody] CreateCafeDto dto,
            CancellationToken cancellationToken)
        {
            // ✅ La variedad debe existir.
            if (!await _variedadRepository.ExistsAsync(dto.VariedadId, cancellationToken))
            {
                ModelState.AddModelError(nameof(dto.VariedadId), MensajeVariedadInexistente);

                return ValidationProblem(ModelState);
            }

            // ✅ Creamos una entidad Cafe a partir del DTO.
            var cafe = new Cafe
            {
                Nombre = dto.Nombre.Trim(),
                VariedadId = dto.VariedadId,
                Presentacion = dto.PresentacionGramos,
                Origen = dto.Origen.Trim(),
                Stock = dto.Stock,
                Precio = dto.Precio,
                ImagenUrl = dto.ImagenUrl,
                ImagenPublicId = dto.ImagenPublicId
            };

            int id;

            try
            {
                // ✅ Guardamos la entidad en la base de datos.
                id = await _cafeRepository.CreateAsync(cafe, cancellationToken);
            }
            catch (DbUpdateException ex)
                when (ex.EsViolacionDeUnicidad(CafeConfiguration.IndiceCafeUnico))
            {
                _logger.LogWarning(
                    "Intento de crear un café duplicado: {Nombre}",
                    dto.Nombre
                );

                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Café duplicado",
                    detail: MensajeCafeDuplicado
                );
            }

            _logger.LogInformation(
                "Se creó el café: {Nombre}",
                cafe.Nombre
            );

            var response = await _cafeRepository.GetByIdAsync(id, cancellationToken);

            // ✅ Devuelve HTTP 201 Created.
            return CreatedAtAction(
                nameof(Get),
                new { id },
                response
            );
        }

        // ✅ SOLO ADMINISTRADOR
        // Requiere JWT válido + Role = Administrador.
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<CafeResponseDto>> Put(
            int id,
            [FromBody] UpdateCafeDto dto,
            CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "Solicitud de actualización para el café con Id: {Id}",
                id
            );

            var cafe = await _cafeRepository.FindAsync(id, cancellationToken);

            // ✅ Si no existe devolvemos 404.
            if (cafe == null)
            {
                _logger.LogWarning(
                    "No se pudo actualizar el café con Id: {Id} porque no existe.",
                    id
                );

                return NotFound();
            }

            // ✅ La variedad debe existir.
            if (!await _variedadRepository.ExistsAsync(dto.VariedadId, cancellationToken))
            {
                ModelState.AddModelError(nameof(dto.VariedadId), MensajeVariedadInexistente);

                return ValidationProblem(ModelState);
            }

            // ✅ Se guarda para borrar la imagen anterior si cambia.
            var publicIdAnterior = cafe.ImagenPublicId;

            cafe.Nombre = dto.Nombre.Trim();
            cafe.VariedadId = dto.VariedadId;
            cafe.Presentacion = dto.PresentacionGramos;
            cafe.Origen = dto.Origen.Trim();
            cafe.Stock = dto.Stock;
            cafe.Precio = dto.Precio;
            cafe.ImagenUrl = dto.ImagenUrl;
            cafe.ImagenPublicId = dto.ImagenPublicId;

            try
            {
                // ✅ Actualizamos el registro.
                await _cafeRepository.UpdateAsync(cafe, cancellationToken);
            }
            catch (DbUpdateException ex)
                when (ex.EsViolacionDeUnicidad(CafeConfiguration.IndiceCafeUnico))
            {
                _logger.LogWarning(
                    "La actualización del café con Id: {Id} generaría un duplicado.",
                    id
                );

                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Café duplicado",
                    detail: MensajeCafeDuplicado
                );
            }

            _logger.LogInformation(
                "Se actualizó correctamente el café con Id: {Id}",
                id
            );

            // ✅ Si la imagen cambió, se borra la anterior de Cloudinary.
            if (!string.IsNullOrEmpty(publicIdAnterior) &&
                publicIdAnterior != cafe.ImagenPublicId)
            {
                await BorrarImagenSinFallarAsync(publicIdAnterior, id);
            }

            var response = await _cafeRepository.GetByIdAsync(id, cancellationToken);

            return Ok(response);
        }

        // ✅ SOLO ADMINISTRADOR
        // Requiere JWT válido + Role = Administrador.
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(
            int id,
            CancellationToken cancellationToken)
        {
            _logger.LogInformation(
                "Solicitud de eliminación para el café con Id: {Id}",
                id
            );

            var cafe = await _cafeRepository.FindAsync(id, cancellationToken);

            if (cafe == null)
            {
                _logger.LogWarning(
                    "No se pudo eliminar el café con Id: {Id} porque no existe.",
                    id
                );

                return NotFound();
            }

            var publicId = cafe.ImagenPublicId;

            // ✅ Borrado físico.
            await _cafeRepository.DeleteAsync(cafe, cancellationToken);

            _logger.LogInformation(
                "Se eliminó correctamente el café con Id: {Id}",
                id
            );

            // ✅ Se borra también su imagen de Cloudinary.
            if (!string.IsNullOrEmpty(publicId))
            {
                await BorrarImagenSinFallarAsync(publicId, id);
            }

            return NoContent();
        }

        // ✅ Borra una imagen de Cloudinary sin hacer fallar la operación:
        // el cambio en la base de datos ya se guardó, así que un error
        // aquí solo se registra en el log.
        private async Task BorrarImagenSinFallarAsync(string publicId, int cafeId)
        {
            try
            {
                // ✅ CancellationToken.None: la limpieza debe terminar
                // aunque el cliente se desconecte.
                await _cloudinaryService.DeleteImageAsync(
                    publicId,
                    CancellationToken.None
                );

                _logger.LogInformation(
                    "Se borró de Cloudinary la imagen {PublicId} del café con Id: {Id}",
                    publicId,
                    cafeId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "No se pudo borrar de Cloudinary la imagen {PublicId} del café con Id: {Id}",
                    publicId,
                    cafeId
                );
            }
        }
    }
}
