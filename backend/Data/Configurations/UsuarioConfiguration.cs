using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla usuario.
    public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
    {
        public void Configure(EntityTypeBuilder<Usuario> builder)
        {
            // ✅ El CHECK protege la base aunque alguien escriba por fuera de la API.
            builder.ToTable("usuario", tabla =>
            {
                tabla.HasCheckConstraint(
                    "ck_usuario_rol",
                    "rol IN ('Administrador', 'Cliente')"
                );
            });

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Nombre)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(150);

            // ✅ Un correo = una cuenta. Como el email se guarda en minúsculas,
            // basta un índice único normal (sin lower()).
            builder.HasIndex(u => u.Email)
                .IsUnique()
                .HasDatabaseName("ux_usuario_email");

            // ✅ Hash de PasswordHasher (texto Base64, longitud variable).
            builder.Property(u => u.Password)
                .IsRequired();

            builder.Property(u => u.Rol)
                .IsRequired()
                .HasMaxLength(20);
        }
    }
}
