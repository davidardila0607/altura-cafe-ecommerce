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

            // ✅ Semilla: las 9 variedades del catálogo.
            builder.HasData(
                new Variedad { Id = 1, Nombre = "Castillo", Descripcion = "La variedad más cultivada de Colombia. Desarrollada por Cenicafé para resistir la roya sin perder calidad en taza." },
                new Variedad { Id = 2, Nombre = "Caturra", Descripcion = "Variedad tradicional de porte bajo. Su taza es brillante, con acidez viva y cuerpo medio." },
                new Variedad { Id = 3, Nombre = "Colombia", Descripcion = "Desarrollada por Cenicafé a partir de Caturra e Híbrido de Timor. Resistente a la roya, de taza equilibrada." },
                new Variedad { Id = 4, Nombre = "Típica", Descripcion = "Una de las variedades originales que llegaron a América. Taza limpia, dulce y delicada." },
                new Variedad { Id = 5, Nombre = "Tabi", Descripcion = "Variedad de Cenicafé de porte alto, con herencia de Típica y Bourbon. Dulce y de buen cuerpo." },
                new Variedad { Id = 6, Nombre = "Bourbon Rojo", Descripcion = "Variedad clásica de frutos rojos. Destaca por su dulzor y su cuerpo redondo." },
                new Variedad { Id = 7, Nombre = "Bourbon Amarillo", Descripcion = "Sus frutos maduran amarillos. Taza con dulzor tipo miel y acidez suave." },
                new Variedad { Id = 8, Nombre = "Bourbon Rosado", Descripcion = "Variedad rara y muy apreciada en el Huila. Notas florales y frutales de gran complejidad." },
                new Variedad { Id = 9, Nombre = "Geisha", Descripcion = "Exótica y floral, una de las variedades más valoradas del café de especialidad." }
            );
        }
    }
}
