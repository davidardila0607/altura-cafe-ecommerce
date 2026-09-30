using CafeApi.Configurations;
using CafeApi.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace CafeApi.Services
{
    // ✅ Servicio encargado de comunicarse con Cloudinary.
    public class CloudinaryService : ICloudinaryService
    {
        // ✅ Cliente Cloudinary.
        private readonly Cloudinary _cloudinary;

        // ✅ Constructor.
        public CloudinaryService(
            IOptions<CloudinarySettings> settings)
        {
            var account = new Account(
                settings.Value.CloudName,
                settings.Value.ApiKey,
                settings.Value.ApiSecret
            );

            _cloudinary = new Cloudinary(account);
        }

        // ✅ Sube una imagen y devuelve la URL generada.
        public async Task<string> UploadImageAsync(
            string base64Image)
        {
            // ✅ Crear parámetros de subida.
            var uploadParams =
                new ImageUploadParams
                {
                    File = new FileDescription(
                        $"data:image/jpeg;base64,{base64Image}"
                    ),

                    Folder = "CafeApi"
                };

            // ✅ Subir imagen a Cloudinary.
            var uploadResult =
                await _cloudinary.UploadAsync(
                    uploadParams
                );

            // ✅ Validar errores.
            if (uploadResult.Error != null)
            {
                throw new InvalidOperationException(
                    uploadResult.Error.Message
                );
            }

            // ✅ Devolver URL segura.
            return uploadResult.SecureUrl.ToString();
        }
    }
}