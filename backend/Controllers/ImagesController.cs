using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Seguridad;
using CafeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CafeApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImagesController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly ICafeRepository _cafeRepository;

        private readonly ILogger<ImagesController> _logger;

        public ImagesController(
            ICloudinaryService cloudinaryService,
            ICafeRepository cafeRepository,
            ILogger<ImagesController> logger)
        {
            _cloudinaryService = cloudinaryService;
            _cafeRepository = cafeRepository;

            _logger = logger;
        }

        // Carpeta de Cloudinary donde viven las imágenes de los cafés.
        private const string CarpetaCafes = "cafes/";

        // ✅ GESTIÓN DE INVENTARIO
        // Sube una imagen (jpg, png o webp, máximo 5 MB) a la carpeta "cafes".
        [HttpPost]
        [Authorize(Policy = Politicas.GestionInventario)]
        public async Task<ActionResult<ImagenSubidaDto>> UploadImage(
            [FromBody] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var imagen = await _cloudinaryService.UploadImageAsync(
                    dto.ImagenBase64,
                    cancellationToken
                );

                _logger.LogInformation(
                    "Se subió la imagen {PublicId} a Cloudinary.",
                    imagen.PublicId
                );

                return Ok(imagen);
            }
            catch (ImagenInvalidaException ex)
            {
                ModelState.AddModelError(nameof(dto.ImagenBase64), ex.Message);

                return ValidationProblem(ModelState);
            }
        }

        // ✅ GESTIÓN DE INVENTARIO
        // Borra una imagen subida que no se llegó a usar (por ejemplo, si se cancela el
        // formulario o la creación del café falla). Solo acepta imágenes de la carpeta
        // "cafes": así no se puede borrar ninguna otra imagen de la cuenta de Cloudinary.
        // Ejemplo: DELETE /api/images?publicId=cafes/abc123
        [HttpDelete]
        [Authorize(Policy = Politicas.GestionInventario)]
        public async Task<IActionResult> DeleteImage(
            [FromQuery] string publicId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(publicId) ||
                !publicId.StartsWith(CarpetaCafes, StringComparison.Ordinal) ||
                publicId.Contains(".."))
            {
                ModelState.AddModelError(nameof(publicId), "Solo se pueden borrar imágenes de la carpeta de cafés.");
                return ValidationProblem(ModelState);
            }

            // ✅ Una imagen que usa un café no se borra por aquí (se borra al eliminar o
            // cambiar la imagen del café).
            if (await _cafeRepository.ImagenEnUsoAsync(publicId, cancellationToken))
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Imagen en uso",
                    detail: "La imagen pertenece a un café y no se puede borrar por separado."
                );
            }

            await _cloudinaryService.DeleteImageAsync(publicId, cancellationToken);

            _logger.LogInformation(
                "Se borró de Cloudinary la imagen no usada {PublicId}.",
                publicId
            );

            return NoContent();
        }
    }
}
