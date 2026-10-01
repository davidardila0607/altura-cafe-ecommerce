namespace CafeApi.DTOs
{
    // ✅ DTO utilizado para exponer variedades al cliente.
    // Evita exponer directamente la entidad.
    public class VariedadResponseDto
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Nombre de la variedad.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Descripción opcional.
        public string? Descripcion { get; set; }
    }
}
