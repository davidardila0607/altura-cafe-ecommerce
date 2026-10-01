using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla variedades.
    public class VariedadConfiguration : IEntityTypeConfiguration<Variedad>
    {
        // ✅ Nombre del índice único sobre nombre.
        // Se usa para detectar duplicados y responder 409.
        public const string IndiceNombreUnico = "ux_variedades_nombre";

        public void Configure(EntityTypeBuilder<Variedad> builder)
        {
            builder.ToTable("variedades");

            builder.HasKey(v => v.Id);

            builder.Property(v => v.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(v => v.Descripcion);

            builder.HasIndex(v => v.Nombre)
                .IsUnique()
                .HasDatabaseName(IndiceNombreUnico);

            // ✅ Semilla: variedades iniciales del catálogo.
            builder.HasData(
                new Variedad { Id = 1, Nombre = "Castillo", Descripcion = null },
                new Variedad { Id = 2, Nombre = "Geisha", Descripcion = null },
                new Variedad { Id = 3, Nombre = "Moka", Descripcion = null }
            );
        }
    }
}
