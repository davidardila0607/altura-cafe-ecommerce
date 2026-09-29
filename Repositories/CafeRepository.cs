using CafeApi.Interfaces;
using CafeApi.Models;
using Npgsql;

namespace CafeApi.Repositories
{
    public class CafeRepository : ICafeRepository
    {
        private readonly string _connectionString;

        public CafeRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        // ✅ Consulta base utilizada para obtener cafés.
        // Incluye la especialidad asociada y la URL de la imagen.
        private const string SelectBase =
            "SELECT c.id, " +
            "c.especialidad_id, " +
            "e.nombre AS especialidad, " +
            "c.nombre, " +
            "c.imagen_url, " +
            "c.origen, " +
            "c.stock, " +
            "c.precio " +
            "FROM cafes c " +
            "INNER JOIN especialidades e ON e.id = c.especialidad_id";

        public IEnumerable<Cafe> GetAll()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand($"{SelectBase} ORDER BY c.id;", connection);
            using var reader = command.ExecuteReader();

            var cafes = new List<Cafe>();
            while (reader.Read())
            {
                cafes.Add(Map(reader));
            }
            return cafes;
        }

        public Cafe? GetById(int id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand($"{SelectBase} WHERE c.id = @id;", connection);
            command.Parameters.AddWithValue("id", id);
            using var reader = command.ExecuteReader();

            return reader.Read() ? Map(reader) : null;
        }

        public Cafe Create(Cafe cafe)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
               "INSERT INTO cafes " +
               "(especialidad_id, nombre, imagen_url, origen, stock, precio) " +
                "VALUES " +
               "(@especialidadId, @nombre, @imagenUrl, @origen, @stock, @precio) " +
                 "RETURNING id;",
                connection);
            command.Parameters.AddWithValue("especialidadId", cafe.EspecialidadId);
            command.Parameters.AddWithValue("nombre", cafe.Nombre);
            command.Parameters.AddWithValue("imagenUrl", cafe.ImagenUrl);
            command.Parameters.AddWithValue("origen", cafe.Origen);
            command.Parameters.AddWithValue("stock", cafe.Stock);
            command.Parameters.AddWithValue("precio", cafe.Precio);

            cafe.Id = (int)command.ExecuteScalar()!;
            return cafe;
        }

        public bool Update(int id, Cafe cafe)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
                   "UPDATE cafes SET " +
                   "especialidad_id = @especialidadId, " +
                   "nombre = @nombre, " +
                   "imagen_url = @imagenUrl, " +
                   "origen = @origen, " +
                   "stock = @stock, " +
                   "precio = @precio " +
                   "WHERE id = @id;",
            connection);
            command.Parameters.AddWithValue("especialidadId", cafe.EspecialidadId);
            command.Parameters.AddWithValue("nombre", cafe.Nombre);
            command.Parameters.AddWithValue("imagenUrl", cafe.ImagenUrl);
            command.Parameters.AddWithValue("origen", cafe.Origen);
            command.Parameters.AddWithValue("stock", cafe.Stock);
            command.Parameters.AddWithValue("precio", cafe.Precio);
            command.Parameters.AddWithValue("id", id);

            return command.ExecuteNonQuery() > 0;
        }

        public bool Delete(int id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand("DELETE FROM cafes WHERE id = @id;", connection);
            command.Parameters.AddWithValue("id", id);

            return command.ExecuteNonQuery() > 0;
        }

        private static Cafe Map(NpgsqlDataReader reader) => new()
        {
            Id = reader.GetInt32(0),
            EspecialidadId = reader.GetInt32(1),
            Especialidad = reader.GetString(2),
            Nombre = reader.GetString(3),
            // ✅ URL de la imagen.
            ImagenUrl = reader.IsDBNull(4)
                      ? string.Empty
                    : reader.GetString(4),
            Origen = reader.GetString(5),
            Stock = reader.GetInt32(6),
            Precio = reader.GetDecimal(7),
        };
    }
}