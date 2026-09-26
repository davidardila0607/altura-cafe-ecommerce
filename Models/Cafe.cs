namespace CafeApi.Models
{
    public class Cafe
    {
        public int Id { get; set; }
        public int EspecialidadId { get; set; }
        public string Especialidad { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Origen { get; set; } = string.Empty;
        public int Stock { get; set; }
        public decimal Precio { get; set; }
    }
}
