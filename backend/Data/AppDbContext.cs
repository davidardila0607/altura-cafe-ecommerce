using CafeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CafeApi.Data
{
    // ✅ Contexto de EF Core de CafeApi.
    // Las migraciones generadas a partir de este contexto
    // son la fuente de verdad del esquema de la base de datos.
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // ✅ Tabla variedades.
        public DbSet<Variedad> Variedades => Set<Variedad>();

        // ✅ Tabla procesos.
        public DbSet<Proceso> Procesos => Set<Proceso>();

        // ✅ Tabla cafes.
        public DbSet<Cafe> Cafes => Set<Cafe>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ✅ Aplica todas las clases IEntityTypeConfiguration
            // de la carpeta Data/Configurations.
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(AppDbContext).Assembly
            );
        }

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            AsignarFechas();

            return base.SaveChanges(acceptAllChangesOnSuccess);
        }

        public override Task<int> SaveChangesAsync(
            bool acceptAllChangesOnSuccess,
            CancellationToken cancellationToken = default)
        {
            AsignarFechas();

            return base.SaveChangesAsync(
                acceptAllChangesOnSuccess,
                cancellationToken
            );
        }

        // ✅ Asigna created_at y updated_at en UTC
        // para que ningún repositorio tenga que hacerlo a mano.
        private void AsignarFechas()
        {
            var ahora = DateTime.UtcNow;

            foreach (var entry in ChangeTracker.Entries<Cafe>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.FechaCreacion = ahora;
                    entry.Entity.FechaActualizacion = ahora;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.FechaActualizacion = ahora;

                    // ✅ La fecha de creación nunca se modifica.
                    entry.Property(c => c.FechaCreacion).IsModified = false;
                }
            }
        }
    }
}
