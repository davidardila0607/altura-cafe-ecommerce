using CafeApi.Data;
using CafeApi.DTOs;
using CafeApi.Interfaces;
using CafeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Repositories
{
    // ✅ Implementación con EF Core del repositorio de cafés.
    public class CafeRepository : ICafeRepository
    {
        private readonly AppDbContext _context;

        public CafeRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<CafeResponseDto>> GetAllAsync(
            CancellationToken cancellationToken)
        {
            return await ProyectarAResponse(
                    _context.Cafes.AsNoTracking().OrderBy(c => c.Id)
                )
                .ToListAsync(cancellationToken);
        }

        public async Task<CafeResponseDto?> GetByIdAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await ProyectarAResponse(
                    _context.Cafes.AsNoTracking().Where(c => c.Id == id)
                )
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<Cafe?> FindAsync(
            int id,
            CancellationToken cancellationToken)
        {
            return await _context.Cafes
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        }

        public async Task<int> CreateAsync(
            Cafe cafe,
            CancellationToken cancellationToken)
        {
            _context.Cafes.Add(cafe);

            await _context.SaveChangesAsync(cancellationToken);

            return cafe.Id;
        }

        public async Task UpdateAsync(
            Cafe cafe,
            CancellationToken cancellationToken)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(
            Cafe cafe,
            CancellationToken cancellationToken)
        {
            _context.Cafes.Remove(cafe);

            await _context.SaveChangesAsync(cancellationToken);
        }

        // ✅ Proyección única a CafeResponseDto.
        // Se traduce a un solo SELECT con INNER JOIN a variedades.
        private static IQueryable<CafeResponseDto> ProyectarAResponse(
            IQueryable<Cafe> cafes)
        {
            return cafes.Select(c => new CafeResponseDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                VariedadId = c.VariedadId,
                VariedadNombre = c.Variedad.Nombre,
                PresentacionGramos = (int)c.Presentacion,
                Origen = c.Origen,
                Stock = c.Stock,
                Precio = c.Precio,
                ImagenUrl = c.ImagenUrl,
                ImagenPublicId = c.ImagenPublicId
            });
        }
    }
}
