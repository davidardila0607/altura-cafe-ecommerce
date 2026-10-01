using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Contrato para trabajar con Cloudinary.
    public interface ICloudinaryService
    {
        // ✅ Valida y sube una imagen en Base64 (con o sin prefijo data URI).
        // Lanza ImagenInvalidaException si no es jpg/png/webp o supera 5 MB.
        Task<ImagenSubidaDto> UploadImageAsync(
            string imagenBase64,
            CancellationToken cancellationToken
        );

        // ✅ Borra una imagen por su publicId.
        // Lanza InvalidOperationException si Cloudinary devuelve un error.
        Task DeleteImageAsync(
            string publicId,
            CancellationToken cancellationToken
        );
    }
}
