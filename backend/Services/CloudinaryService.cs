using CafeApi.Configurations;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace CafeApi.Services
{
    // ✅ Servicio encargado de comunicarse con Cloudinary.
    public class CloudinaryService : ICloudinaryService
    {
        // ✅ Tamaño máximo permitido: 5 MB (ya decodificado).
        private const int TamanoMaximoBytes = 5 * 1024 * 1024;

        // ✅ Carpeta de Cloudinary donde se guardan las imágenes de cafés.
        private const string Carpeta = "cafes";

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
            _cloudinary.Api.Secure = true;
        }

        // ✅ Valida y sube una imagen.
        public async Task<ImagenSubidaDto> UploadImageAsync(
            string imagenBase64,
            CancellationToken cancellationToken)
        {
            var contenido = Decodificar(imagenBase64);

            var extension = DetectarFormato(contenido)
                ?? throw new ImagenInvalidaException(
                    "Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP."
                );

            using var stream = new MemoryStream(contenido);

            // ✅ Crear parámetros de subida.
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription($"cafe.{extension}", stream),
                Folder = Carpeta,
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            };

            // ✅ Subir imagen a Cloudinary.
            var uploadResult = await _cloudinary.UploadAsync(
                uploadParams,
                cancellationToken
            );

            // ✅ Validar errores.
            if (uploadResult.Error != null)
            {
                throw new InvalidOperationException(
                    $"Cloudinary rechazó la subida: {uploadResult.Error.Message}"
                );
            }

            return new ImagenSubidaDto
            {
                ImageUrl = uploadResult.SecureUrl.ToString(),
                PublicId = uploadResult.PublicId
            };
        }

        // ✅ Borra una imagen por su publicId.
        public async Task DeleteImageAsync(
            string publicId,
            CancellationToken cancellationToken)
        {
            var deletionParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image,
                Invalidate = true
            };

            var result = await _cloudinary.DestroyAsync(deletionParams);

            // ✅ "ok" = borrada; "not found" = ya no existía (no es un error).
            if (result.Error != null ||
                (result.Result != "ok" && result.Result != "not found"))
            {
                throw new InvalidOperationException(
                    $"Cloudinary no pudo borrar la imagen '{publicId}': " +
                    $"{result.Error?.Message ?? result.Result}"
                );
            }
        }

        // ✅ Acepta Base64 puro o con prefijo data URI
        // ("data:image/png;base64,...") sin duplicar el prefijo.
        private static byte[] Decodificar(string imagenBase64)
        {
            var datos = imagenBase64.Trim();

            if (datos.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var coma = datos.IndexOf(',');

                if (coma < 0 ||
                    !datos[..coma].EndsWith(";base64", StringComparison.OrdinalIgnoreCase))
                {
                    throw new ImagenInvalidaException(
                        "El prefijo data URI no es válido. Usa el formato data:image/...;base64,..."
                    );
                }

                datos = datos[(coma + 1)..];
            }

            // ✅ Rechaza antes de decodificar si claramente supera 5 MB.
            if ((long)datos.Length * 3 / 4 > TamanoMaximoBytes + 3)
            {
                throw new ImagenInvalidaException(
                    "La imagen supera el tamaño máximo de 5 MB."
                );
            }

            var buffer = new byte[datos.Length * 3 / 4 + 3];

            if (!Convert.TryFromBase64String(datos, buffer, out var bytesEscritos) ||
                bytesEscritos == 0)
            {
                throw new ImagenInvalidaException(
                    "La imagen no es un Base64 válido."
                );
            }

            if (bytesEscritos > TamanoMaximoBytes)
            {
                throw new ImagenInvalidaException(
                    "La imagen supera el tamaño máximo de 5 MB."
                );
            }

            return buffer[..bytesEscritos];
        }

        // ✅ Detecta el formato real por la firma de bytes,
        // sin confiar en el prefijo que envía el cliente.
        private static string? DetectarFormato(byte[] contenido)
        {
            ReadOnlySpan<byte> bytes = contenido;

            if (bytes.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF }))
            {
                return "jpg";
            }

            if (bytes.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            {
                return "png";
            }

            if (bytes.Length >= 12 &&
                bytes[..4].SequenceEqual("RIFF"u8) &&
                bytes.Slice(8, 4).SequenceEqual("WEBP"u8))
            {
                return "webp";
            }

            return null;
        }
    }
}
