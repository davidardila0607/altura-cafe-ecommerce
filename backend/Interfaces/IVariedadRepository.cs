using CafeApi.DTOs;
using CafeApi.Models;

namespace CafeApi.Interfaces
{
    // ✅ Contrato de acceso a datos de variedades.
    public interface IVariedadRepository
    {
        // ✅ Lecturas sin seguimiento, proyectadas a DTO.
        Task<IReadOnlyList<VariedadResponseDto>> GetAllAsync(
            CancellationToken cancellationToken
        );

        Task<VariedadResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken
        );

        // ✅ Obtiene la entidad con seguimiento para modificarla o eliminarla.
        Task<Variedad?> FindAsync(
            int id,
            CancellationToken cancellationToken
        );

        Task<bool> ExistsAsync(
            int id,
            CancellationToken cancellationToken
        );

        // ✅ true si la variedad tiene cafés asociados.
        Task<bool> TieneCafesAsync(
            int id,
            CancellationToken cancellationToken
        );

        Task CreateAsync(
            Variedad variedad,
            CancellationToken cancellationToken
        );

        Task UpdateAsync(
            Variedad variedad,
            CancellationToken cancellationToken
        );

        Task DeleteAsync(
            Variedad variedad,
            CancellationToken cancellationToken
        );
    }
}
