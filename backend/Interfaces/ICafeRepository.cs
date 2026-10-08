using CafeApi.DTOs;
using CafeApi.Models;

namespace CafeApi.Interfaces
{
    // ✅ Contrato de acceso a datos de cafés.
    public interface ICafeRepository
    {
        // ✅ Lecturas sin seguimiento, proyectadas a DTO.
        Task<IReadOnlyList<CafeResponseDto>> GetAllAsync(
            CancellationToken cancellationToken
        );

        Task<CafeResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken
        );

        // ✅ Obtiene la entidad con seguimiento para modificarla o eliminarla.
        Task<Cafe?> FindAsync(
            int id,
            CancellationToken cancellationToken
        );

        // ✅ Inserta el café y devuelve su Id.
        // Guía 1, paso 14: recibe el userId (sale del JWT) para guardarlo como dueño.
        // Va antes del CancellationToken, que por convención siempre es el último.
        Task<int> CreateAsync(
            Cafe cafe,
            int userId,
            CancellationToken cancellationToken
        );

        // ✅ Guarda los cambios hechos sobre una entidad obtenida con FindAsync.
        Task UpdateAsync(
            Cafe cafe,
            CancellationToken cancellationToken
        );

        // ✅ Borrado físico.
        Task DeleteAsync(
            Cafe cafe,
            CancellationToken cancellationToken
        );

        // ✅ Adaptación E de la guía de pedidos: true si el café aparece en algún pedido
        // (entonces no se puede borrar, para conservar el historial).
        Task<bool> TienePedidosAsync(
            int id,
            CancellationToken cancellationToken
        );

        // ✅ true si algún café usa esa imagen de Cloudinary.
        Task<bool> ImagenEnUsoAsync(
            string publicId,
            CancellationToken cancellationToken
        );
    }
}
