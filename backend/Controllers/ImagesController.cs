using CafeApi.DTOs;
using CafeApi.Interfaces;
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

        private readonly ILogger<ImagesController> _logger;

        public ImagesController(
            ICloudinaryService cloudinaryService,
            ILogger<ImagesController> logger)
        {
            _cloudinaryService = cloudinaryService;

            _logger = logger;
        }

        // ✅ SOLO ADMINISTRADOR
        // Sube una imagen (jpg, png o webp, máximo 5 MB) a la carpeta "cafes".
        [HttpPost]
        [Authorize(Roles = "Administrador")]
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
    }
}
