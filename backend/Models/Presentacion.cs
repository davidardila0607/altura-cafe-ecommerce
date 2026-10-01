namespace CafeApi.Models
{
    // ✅ Presentaciones disponibles de un café, expresadas en gramos.
    // Es un enum en código (no una tabla): se guarda como int
    // en la columna presentacion_gramos con un CHECK (340, 500).
    public enum Presentacion
    {
        G340 = 340,
        G500 = 500
    }
}
