using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Contrato para la gestión de usuarios.
    // Define las operaciones necesarias para
    // interactuar con los usuarios del sistema.
    public interface IUserRepository
    {
        // ✅ Busca un usuario por correo electrónico.
        // Se utilizará para relacionar el JWT
        // con el usuario persistido en la base de datos.
        Task<UserDto?> GetByEmailAsync(
            string email
        );

        // ✅ Busca un usuario por Id.
        Task<UserDto?> GetByIdAsync(
            int id
        );
    }
}