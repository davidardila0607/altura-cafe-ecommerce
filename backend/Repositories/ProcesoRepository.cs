using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Repositories
{
    // ✅ Implementación con EF Core del repositorio de procesos.
    public class ProcesoRepository : IProcesoRepository
    {
        private readonly AppDbContext _context;

        public ProcesoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<ProcesoResponseDto>> GetAllAsync(
            CancellationToken cancellationToken)
        {
            return await _context.Procesos
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .Select(p => new ProcesoResponseDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> ExistsAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await _context.Procesos
                .AnyAsync(p => p.Id == id, cancellationToken);
        }
    }
}
