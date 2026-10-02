using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla procesos.
    public class ProcesoConfiguration : IEntityTypeConfiguration<Proceso>
    {
        // ✅ Nombre del índice único sobre nombre.
        public const string IndiceNombreUnico = "ux_procesos_nombre";

        public void Configure(EntityTypeBuilder<Proceso> builder)
        {
            builder.ToTable("procesos");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Nombre)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.Descripcion);

            builder.HasIndex(p => p.Nombre)
                .IsUnique()
                .HasDatabaseName(IndiceNombreUnico);

            // ✅ Semilla: los tres procesos del catálogo.
            builder.HasData(
                new Proceso
                {
                    Id = 1,
                    Nombre = "Lavado",
                    Descripcion = "Se retira toda la pulpa y el mucílago con agua antes de secar el grano. Da una taza limpia, brillante y de acidez clara."
                },
                new Proceso
                {
                    Id = 2,
                    Nombre = "Honey",
                    Descripcion = "Se quita la pulpa pero se deja parte del mucílago, dulce y pegajoso como la miel, durante el secado. Da más dulzor y cuerpo."
                },
                new Proceso
                {
                    Id = 3,
                    Nombre = "Fermentado",
                    Descripcion = "La cereza o el grano reposan en tanques controlados antes del secado. Aporta notas frutales, vinosas e intensas."
                }
            );
        }
    }
}
