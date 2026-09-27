using System.Text.Json;

namespace CafeApi.Middleware
{
    // ✅ Middleware global para capturar excepciones.
    // Intercepta cualquier error no controlado de la aplicación.
    public class ExceptionMiddleware
    {
        // ✅ Permite continuar el flujo hacia el siguiente middleware.
        private readonly RequestDelegate _next;

        // ✅ Constructor.
        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
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
