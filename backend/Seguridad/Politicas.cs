using Microsoft.AspNetCore.Authorization;

namespace CafeApi.Seguridad
{
    // ✅ Políticas de autorización.
    // Los controladores piden una POLÍTICA ("qué se necesita para gestionar el inventario"),
    // no un rol concreto. Para dar acceso a otro rol (por ejemplo "Editor") solo se cambia
    // la regla aquí; los controladores no se tocan.
    public static class Politicas
    {
        public const string GestionInventario = "GestionInventario";

        // ✅ Ver la lista de usuarios y cambiar su rol (página /admin/usuarios).
        public const string GestionUsuarios = "GestionUsuarios";

        // ✅ Registra todas las políticas. Se llama una vez desde Program.cs.
        public static void Registrar(AuthorizationBuilder autorizacion)
        {
            autorizacion.AddPolicy(GestionInventario, politica =>
                politica.RequireRole(Roles.Administrador));

            autorizacion.AddPolicy(GestionUsuarios, politica =>
                politica.RequireRole(Roles.Administrador));
        }
    }
}
