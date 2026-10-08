using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla pedido.
    public class PedidoConfiguration : IEntityTypeConfiguration<Pedido>
    {
        public void Configure(EntityTypeBuilder<Pedido> builder)
        {
            // ✅ Solo se aceptan tres estados. Hoy todos los pedidos nacen "Pendiente";
            // "Pagado" y "Rechazado" los asignará la guía de Wompi según el resultado del pago.
            builder.ToTable("pedido", tabla =>
            {
                tabla.HasCheckConstraint(
                    "ck_pedido_estado",
                    "estado IN ('Pendiente', 'Pagado', 'Rechazado')"
                );
            });

            builder.HasKey(p => p.Id);

            // ✅ Pesos colombianos sin decimales, igual que cafes.precio.
            builder.Property(p => p.Total)
                .HasPrecision(12, 0);

            builder.Property(p => p.Estado)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(p => p.Fecha)
                .HasColumnType("timestamp with time zone");

            // ✅ "Mis pedidos" siempre filtra por usuario: este índice evita recorrer la tabla.
            builder.HasIndex(p => p.UsuarioId)
                .HasDatabaseName("ix_pedido_usuario_id");

            // ✅ RESTRICT: no se puede borrar un usuario que tiene pedidos (el historial se conserva).
            builder.HasOne(p => p.Usuario)
                .WithMany(u => u.Pedidos)
                .HasForeignKey(p => p.UsuarioId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
