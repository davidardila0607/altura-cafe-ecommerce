using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla intermedia carrito_producto.
    public class CarritoProductoConfiguration : IEntityTypeConfiguration<CarritoProducto>
    {
        public void Configure(EntityTypeBuilder<CarritoProducto> builder)
        {
            // ✅ El CHECK protege la base: nunca hay filas con 0 o menos unidades.
            builder.ToTable("carrito_producto", tabla =>
            {
                tabla.HasCheckConstraint(
                    "ck_carrito_producto_cantidad",
                    "cantidad >= 1"
                );
            });

            builder.HasKey(cp => cp.Id);

            // ✅ Un café aparece una sola vez en cada carrito: si se agrega otra vez,
            // se suma la cantidad (ver CarritoRepository.AgregarProducto).
            // Este índice también sirve para buscar las filas de un carrito.
            builder.HasIndex(cp => new { cp.CarritoId, cp.ProductoId })
                .IsUnique()
                .HasDatabaseName("ux_carrito_producto_carrito_producto");

            // ✅ Si se vacía o se borra el carrito, se borran sus filas (CASCADE).
            builder.HasOne(cp => cp.Carrito)
                .WithMany(c => c.Productos)
                .HasForeignKey(cp => cp.CarritoId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Si el administrador elimina un café, desaparece de todos los carritos (CASCADE).
            // Sin relación inversa en Cafe: el café no necesita conocer los carritos.
            builder.HasOne(cp => cp.Producto)
                .WithMany()
                .HasForeignKey(cp => cp.ProductoId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
