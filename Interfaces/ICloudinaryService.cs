namespace CafeApi.Interfaces
{
    // ✅ Contrato para trabajar con Cloudinary.
    public interface ICloudinaryService
    {
        // ✅ Sube una imagen y devuelve la URL generada.
        Task<string> UploadImageAsync(
            string base64Image
        );
    }
}