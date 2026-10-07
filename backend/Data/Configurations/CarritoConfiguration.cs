using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla carrito.
    public class CarritoConfiguration : IEntityTypeConfiguration<Carrito>
    {
        public void Configure(EntityTypeBuilder<Carrito> builder)
        {
            builder.ToTable("carrito");

            builder.HasKey(c => c.Id);

            // ✅ Un carrito por usuario: el índice único lo garantiza en la base de datos.
            builder.HasIndex(c => c.UsuarioId)
                .IsUnique()
                .HasDatabaseName("ux_carrito_usuario_id");

            // ✅ Relación uno a uno con usuario. Si algún día se borra el usuario,
            // su carrito se borra con él (CASCADE).
            builder.HasOne(c => c.Usuario)
                .WithOne(u => u.Carrito)
                .HasForeignKey<Carrito>(c => c.UsuarioId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
