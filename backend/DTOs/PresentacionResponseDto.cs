namespace CafeApi.DTOs
{
    // ✅ Presentación disponible para los formularios del frontend.
    public class PresentacionResponseDto
    {
        // ✅ Gramos (340 o 500).
        public int Value { get; set; }

        // ✅ Texto visible, por ejemplo "340 g".
        public string Label { get; set; } = string.Empty;
    }
}
