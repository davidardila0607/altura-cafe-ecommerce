namespace CafeApi.Seguridad
{
    // ✅ Nombres de los roles que viajan en el JWT (claim "role").
    // Usar estas constantes evita errores de escritura en los controladores.
    public static class Roles
    {
        public const string Administrador = "Administrador";

        public const string Cliente = "Cliente";
    }
}
