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
        Task<int> CreateAsync(
            Cafe cafe,
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
    }
}
