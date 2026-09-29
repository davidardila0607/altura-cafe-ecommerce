namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para exponer especialidades al cliente.
    // Evita exponer directamente la entidad.
    public class EspecialidadResponseDto
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Nombre de la especialidad.
        public string Nombre { get; set; } = string.Empty;
    }
}
