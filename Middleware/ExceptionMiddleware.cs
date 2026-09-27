using System.Text.Json;

namespace CafeApi.Middleware
{
    // ✅ Middleware global para capturar excepciones.
    // Intercepta cualquier error no controlado de la aplicación.
    public class ExceptionMiddleware
    {
        // ✅ Continúa la ejecución del pipeline.
        private readonly RequestDelegate _next;

        // ✅ Logger para registrar errores.
        private readonly ILogger<ExceptionMiddleware> _logger;

        // ✅ Constructor.
        public ExceptionMiddleware(RequestDelegate next,
            ILogger<ExceptionMiddleware> logger)
        {
            _next = next;

            // ✅ Crear un logger para este middleware.
            _logger = logger;

        }

        // ✅ Método principal del middleware.
        // Se ejecuta en cada petición HTTP.
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // ✅ Continúa hacia el siguiente middleware
                // o controlador.
                await _next(context);
            }
            catch (Exception ex)
            {
                // ✅ Registrar el error.
                _logger.LogError(
                    ex,
                    "Ocurrió una excepción no controlada."
                );
                // ✅ Si ocurre una excepción,
                // la manejamos aquí.
                await HandleExceptionAsync(context, ex);
            }
        }

        // ✅ Construye una respuesta uniforme para los errores.
        private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
        {
            // ✅ Siempre devolveremos JSON.
            context.Response.ContentType = "application/json";

            // ✅ Error interno del servidor.
            context.Response.StatusCode =
            StatusCodes.Status500InternalServerError;

            // ✅ Objeto de respuesta.
            var response = new
            {
                success = false,

                message = "Ha ocurrido un error inesperado.",

                detail = exception.Message
            };

            // ✅ Convertir objeto a JSON.
            var json = JsonSerializer.Serialize(response);

            // ✅ Enviar respuesta.
            await context.Response.WriteAsync(json);
        }
    }
}
