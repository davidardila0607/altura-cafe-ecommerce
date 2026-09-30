namespace CafeApi.Configurations
{
    // ✅ Configuración utilizada para conectarse
    // con la cuenta de Cloudinary.
    public class CloudinarySettings
    {
        // ✅ Nombre de la nube de Cloudinary.
        public string CloudName { get; set; } = string.Empty;

        // ✅ API Key de Cloudinary.
        public string ApiKey { get; set; } = string.Empty;

        // ✅ API Secret de Cloudinary.
        public string ApiSecret { get; set; } = string.Empty;
    }
}