using CafeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CafeApi.Data.Configurations
{
    // ✅ Configuración Fluent API de la tabla pedido_producto.
    public class PedidoProductoConfiguration : IEntityTypeConfiguration<PedidoProducto>
    {
        public void Configure(EntityTypeBuilder<PedidoProducto> builder)
        {
            // ✅ Igual que en el carrito: nunca hay filas con 0 o menos unidades.
            builder.ToTable("pedido_producto", tabla =>
            {
                tabla.HasCheckConstraint(
                    "ck_pedido_producto_cantidad",
                    "cantidad >= 1"
                );
            });

            builder.HasKey(pp => pp.Id);

            // ✅ Precio guardado en el momento de la compra (pesos sin decimales).
            builder.Property(pp => pp.Precio)
                .HasPrecision(12, 0);

            // ✅ Los productos son parte del pedido: si se borra el pedido, se borran con él (CASCADE).
            builder.HasOne(pp => pp.Pedido)
                .WithMany(p => p.Productos)
                .HasForeignKey(pp => pp.PedidoId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ RESTRICT (al contrario que en el carrito): un café que aparece en un pedido
            // no se puede borrar, para no perder el historial. CafesController lo comprueba
            // antes y responde 409 (adaptación E).
            builder.HasOne(pp => pp.Producto)
                .WithMany()
                .HasForeignKey(pp => pp.ProductoId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
