namespace CafeApi.Models
{
    // ✅ Proceso de beneficio del café (Lavado, Honey, Fermentado).
    // Es lo que se hace con la cereza después de recogerla y cambia mucho el sabor.
    public class Proceso
    {
        // ✅ Identificador único.
        public int Id { get; set; }

        // ✅ Nombre del proceso. Obligatorio, único, máximo 50 caracteres.
        public string Nombre { get; set; } = string.Empty;

        // ✅ Descripción opcional.
        public string? Descripcion { get; set; }

        // ✅ Cafés con este proceso.
        public ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();
    }
}
