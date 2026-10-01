using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CafeApi.Data
{
    // ✅ Ayudas para interpretar errores de PostgreSQL
    // que llegan envueltos en DbUpdateException.
    public static class DbUpdateExceptionExtensions
    {
        // ✅ true si el error es una violación del índice único indicado (23505).
        public static bool EsViolacionDeUnicidad(
            this DbUpdateException exception,
            string nombreRestriccion)
        {
            return exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation
            } postgres
                && postgres.ConstraintName == nombreRestriccion;
        }

        // ✅ true si el error es una violación de clave foránea (23503).
        public static bool EsViolacionDeClaveForanea(
            this DbUpdateException exception)
        {
            return exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.ForeignKeyViolation
            };
        }
    }
}
