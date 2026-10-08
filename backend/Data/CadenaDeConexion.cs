using Npgsql;

namespace CafeApi.Data
{
    // ✅ Railway: la base PostgreSQL entrega su dirección en la variable DATABASE_URL con formato
    // de URL ("postgresql://usuario:clave@host:puerto/base"), pero Npgsql espera el formato
    // "Host=...;Port=...;Username=...;Password=...;Database=...". Esta clase hace la conversión.
    public static class CadenaDeConexion
    {
        // Devuelve la cadena de conexión que usará la API:
        // 1. ConnectionStrings:CafeDatabase si existe (local: appsettings.Development.json;
        //    o la variable ConnectionStrings__CafeDatabase).
        // 2. Si no, DATABASE_URL convertida (Railway).
        // 3. Si no hay ninguna, null (Program.cs detiene el arranque con un mensaje claro).
        public static string? Resolver(IConfiguration configuracion)
        {
            var cadena = configuracion.GetConnectionString("CafeDatabase");

            if (!string.IsNullOrWhiteSpace(cadena))
            {
                return cadena;
            }

            var url = configuracion["DATABASE_URL"];

            return string.IsNullOrWhiteSpace(url) ? null : DesdeUrl(url);
        }

        // "postgresql://usuario:clave@host:puerto/base" → cadena de Npgsql.
        // El usuario y la clave pueden venir codificados para URL (por ejemplo %40 en vez de @).
        // SSL Mode=Prefer: usa SSL si el servidor lo ofrece y, si no, conecta igual. La red privada
        // de Railway ya va cifrada (WireGuard) y su documentación no exige un modo SSL concreto.
        // (Trust Server Certificate no se agrega: desde Npgsql 8 está obsoleto y no hace nada.)
        public static string DesdeUrl(string url)
        {
            var uri = new Uri(url);
            var credenciales = uri.UserInfo.Split(':', 2);

            var constructor = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Username = Uri.UnescapeDataString(credenciales[0]),
                Password = credenciales.Length > 1 ? Uri.UnescapeDataString(credenciales[1]) : string.Empty,
                Database = uri.AbsolutePath.TrimStart('/'),
                SslMode = SslMode.Prefer
            };

            return constructor.ConnectionString;
        }
    }
}
