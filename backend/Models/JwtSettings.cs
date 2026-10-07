namespace CafeApi.Models
{
    // ✅ Guía 1, paso 7: valores de la sección "JwtSettings" de appsettings.
    // Key: clave secreta con la que la API firma los tokens (solo en appsettings.Development.json).
    public class JwtSettings
    {
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int DurationInMinutes { get; set; }
    }
}
