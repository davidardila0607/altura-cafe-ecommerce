using CafeApi.DTOs;

namespace CafeApi.Interfaces
{
    // ✅ Contrato de acceso a datos de procesos (por ahora solo lectura).
    public interface IProcesoRepository
    {
        // ✅ Lectura sin seguimiento, proyectada a DTO.
        Task<IReadOnlyList<ProcesoResponseDto>> GetAllAsync(
            CancellationToken cancellationToken
        );

        // ✅ true si existe un proceso con ese Id (validación de cafés).
        Task<bool> ExistsAsync(
            int id,
            CancellationToken cancellationToken
        );
    }
}
