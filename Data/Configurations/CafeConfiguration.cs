using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla cafes.
    public class CafeConfiguration : IEntityTypeConfiguration<Cafe>
    {
        // ✅ Índice único sobre (lower(nombre), variedad_id, presentacion_gramos).
        // EF Core no modela índices por expresión, por eso se crea
        // con migrationBuilder.Sql en la migración InitialCreate.
        public const string IndiceCafeUnico = "ux_cafes_nombre_variedad_presentacion";

        public void Configure(EntityTypeBuilder<Cafe> builder)
        {
            builder.ToTable("cafes", tabla =>
            {
                tabla.HasCheckConstraint(
                    "ck_cafes_stock",
                    "stock >= 0"
                );

                tabla.HasCheckConstraint(
                    "ck_cafes_precio",
                    "precio > 0"
                );

                tabla.HasCheckConstraint(
                    "ck_cafes_presentacion_gramos",
                    "presentacion_gramos IN (340, 500)"
                );
            });

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            // ✅ El enum se guarda como int (340 o 500).
            builder.Property(c => c.Presentacion)
                .HasColumnName("presentacion_gramos");

            builder.Property(c => c.Origen)
                .IsRequired()
                .HasMaxLength(100);

            // ✅ Pesos colombianos sin decimales: numeric(12,0).
            builder.Property(c => c.Precio)
                .HasPrecision(12, 0);

            builder.Property(c => c.ImagenUrl)
                .HasMaxLength(500);

            builder.Property(c => c.ImagenPublicId)
                .HasMaxLength(255);

            // ✅ timestamptz en UTC.
            builder.Property(c => c.FechaCreacion)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone");

            builder.Property(c => c.FechaActualizacion)
                .HasColumnName("updated_at")
                .HasColumnType("timestamp with time zone");

            // ✅ FK obligatoria a variedades con ON DELETE RESTRICT.
            builder.HasOne(c => c.Variedad)
                .WithMany(v => v.Cafes)
                .HasForeignKey(c => c.VariedadId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
