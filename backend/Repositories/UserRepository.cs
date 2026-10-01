using CafeApi.DTOs;
using CafeApi.Interfaces;
using Npgsql;

namespace CafeApi.Repositories
{
    // ✅ Implementación del repositorio de usuarios.
    public class UserRepository : IUserRepository
    {
        // ✅ Cadena de conexión PostgreSQL.
        private readonly string _connectionString;

        // ✅ Constructor del repositorio.
        public UserRepository(
            string connectionString)
        {
            _connectionString = connectionString;
        }

        // ✅ Obtiene un usuario utilizando su correo.
        public async Task<UserDto?> GetByEmailAsync(
            string email)
        {
            using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            using var command =
                new NpgsqlCommand(
                    @"SELECT
                        id,
                        email,
                        nombre,
                        role
                      FROM users
                      WHERE email = @email;",
                    connection
                );

            command.Parameters.AddWithValue(
                "email",
                email
            );

            using var reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new UserDto
            {
                // ✅ Id del usuario.
                Id = reader.GetInt32(0),

                // ✅ Correo electrónico.
                Email = reader.GetString(1),

                // ✅ Nombre.
                Nombre = reader.GetString(2),

                // ✅ Rol.
                Role = reader.GetString(3)
            };
        }

        // ✅ Obtiene un usuario por Id.
        public async Task<UserDto?> GetByIdAsync(
            int id)
        {
            using var connection =
                new NpgsqlConnection(_connectionString);

            await connection.OpenAsync();

            using var command =
                new NpgsqlCommand(
                    @"SELECT
                        id,
                        email,
                        nombre,
                        role
                      FROM users
                      WHERE id = @id;",
                    connection
                );

            command.Parameters.AddWithValue(
                "id",
                id
            );

            using var reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new UserDto
            {
                // ✅ Id.
                Id = reader.GetInt32(0),

                // ✅ Correo.
                Email = reader.GetString(1),

                // ✅ Nombre.
                Nombre = reader.GetString(2),

                // ✅ Rol.
                Role = reader.GetString(3)
            };
        }
    }
}