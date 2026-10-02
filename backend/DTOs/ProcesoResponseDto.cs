namespace CafeApi.DTOs
{
    // ✅ DTO de salida de un proceso (GET /api/procesos).
    public class ProcesoResponseDto
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }
    }
}
