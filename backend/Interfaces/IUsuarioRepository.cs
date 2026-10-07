using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Guía 1, paso 9: contrato del repositorio de usuarios.
    public interface IUsuarioRepository
    {
        // ✅ Devuelve "El usuario ya existe." o "Usuario registrado correctamente.".
        Task<string> Registrar(UsuarioDto item);

        // ✅ Devuelve el JWT o "Usuario o contraseña incorrectos.".
        Task<string> Login(LoginDto item);

        // ✅ Fuera de la guía: datos del usuario para GET /api/auth/me (null si ya no existe).
        Task<UsuarioActualDto?> ObtenerPorId(int id);
    }
}
