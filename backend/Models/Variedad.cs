namespace CafeApi.Models
{
    // ✅ Entidad que representa una variedad de café
    // (Premium, Especial, Orgánico...).
    public class Variedad
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Nombre de la variedad. Obligatorio y único.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Descripción opcional.
        public string? Descripcion { get; set; }

        // ✅ Cafés que pertenecen a esta variedad.
        public ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();
    }
}
