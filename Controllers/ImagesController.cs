using CafeApi.DTOs;
using CafeApi.Interfaces;
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

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> UploadImage(
            [FromBody] UploadImageDto dto)
        {
            var imageUrl =
                await _cloudinaryService.UploadImageAsync(
                    dto.ImagenBase64
                );

            return Ok(new
            {
                imageUrl
            });
        }
    }
}