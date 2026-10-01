namespace CafeApi.Services
{
    // ✅ La imagen recibida no cumple las reglas (formato, tamaño o Base64).
    // El controlador la convierte en una respuesta 400.
    public class ImagenInvalidaException : Exception
    {
        public ImagenInvalidaException(string message)
            : base(message)
        {
        }
    }
}
