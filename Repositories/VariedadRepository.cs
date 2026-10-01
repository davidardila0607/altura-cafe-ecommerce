using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Repositories
{
    // ✅ Implementación con EF Core del repositorio de variedades.
    public class VariedadRepository : IVariedadRepository
    {
        private readonly AppDbContext _context;

        public VariedadRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<VariedadResponseDto>> GetAllAsync(
            CancellationToken cancellationToken)
        {
            return await _context.Variedades
                .AsNoTracking()
                .OrderBy(v => v.Id)
                .Select(v => new VariedadResponseDto
                {
                    Id = v.Id,
                    Nombre = v.Nombre,
                    Descripcion = v.Descripcion
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<VariedadResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await _context.Variedades
                .AsNoTracking()
                .Where(v => v.Id == id)
                .Select(v => new VariedadResponseDto
                {
                    Id = v.Id,
                    Nombre = v.Nombre,
                    Descripcion = v.Descripcion
                })
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<Variedad?> FindAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await _context.Variedades
                .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        }

        public async Task<bool> ExistsAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await _context.Variedades
                .AnyAsync(v => v.Id == id, cancellationToken);
        }

        public async Task<bool> TieneCafesAsync(
            int id,
            CancellationToken cancellationToken)
        {
            // ✅ Usa el índice de la FK variedad_id.
            return await _context.Cafes
                .AnyAsync(c => c.VariedadId == id, cancellationToken);
        }

        public async Task CreateAsync(
            Variedad variedad,
            CancellationToken cancellationToken)
        {
            _context.Variedades.Add(variedad);

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(
            Variedad variedad,
            CancellationToken cancellationToken)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(
            Variedad variedad,
            CancellationToken cancellationToken)
        {
            _context.Variedades.Remove(variedad);

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
