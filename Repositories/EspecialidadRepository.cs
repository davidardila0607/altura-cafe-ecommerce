using CafeApi.Interfaces;
using CafeApi.Models;
using Npgsql;

namespace CafeApi.Repositories
{
    public class EspecialidadRepository : IEspecialidadRepository
    {
        private readonly string _connectionString;

        public EspecialidadRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IEnumerable<Especialidad> GetAll()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
                "SELECT id, nombre, descripcion FROM especialidades ORDER BY id;", connection);
            using var reader = command.ExecuteReader();

            var especialidades = new List<Especialidad>();
            while (reader.Read())
            {
                especialidades.Add(new Especialidad
                {
                    Id = reader.GetInt32(0),
                    Nombre = reader.GetString(1),
                    Descripcion = reader.GetString(2),
                });
            }
            return especialidades;
        }

        public Especialidad? GetById(int id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
                "SELECT id, nombre, descripcion FROM especialidades WHERE id = @id;", connection);
            command.Parameters.AddWithValue("id", id);
            using var reader = command.ExecuteReader();

            if (!reader.Read()) return null;

            return new Especialidad
            {
                Id = reader.GetInt32(0),
                Nombre = reader.GetString(1),
                Descripcion = reader.GetString(2),
            };
        }

        public Especialidad Create(Especialidad especialidad)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
                "INSERT INTO especialidades (nombre, descripcion) VALUES (@nombre, @descripcion) RETURNING id;",
                connection);
            command.Parameters.AddWithValue("nombre", especialidad.Nombre);
            command.Parameters.AddWithValue("descripcion", especialidad.Descripcion);

            especialidad.Id = (int)command.ExecuteScalar()!;
            return especialidad;
        }

        public bool Update(int id, Especialidad especialidad)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(
                "UPDATE especialidades SET nombre = @nombre, descripcion = @descripcion WHERE id = @id;",
                connection);
            command.Parameters.AddWithValue("nombre", especialidad.Nombre);
            command.Parameters.AddWithValue("descripcion", especialidad.Descripcion);
            command.Parameters.AddWithValue("id", id);

            return command.ExecuteNonQuery() > 0;
        }

        public bool Delete(int id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand("DELETE FROM especialidades WHERE id = @id;", connection);
            command.Parameters.AddWithValue("id", id);

            return command.ExecuteNonQuery() > 0;
        }
    }
}
