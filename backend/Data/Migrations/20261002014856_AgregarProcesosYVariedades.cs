using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarProcesosYVariedades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "procesos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_procesos", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "procesos",
                columns: new[] { "id", "descripcion", "nombre" },
                values: new object[,]
                {
                    { 1, "Se retira toda la pulpa y el mucílago con agua antes de secar el grano. Da una taza limpia, brillante y de acidez clara.", "Lavado" },
                    { 2, "Se quita la pulpa pero se deja parte del mucílago, dulce y pegajoso como la miel, durante el secado. Da más dulzor y cuerpo.", "Honey" },
                    { 3, "La cereza o el grano reposan en tanques controlados antes del secado. Aporta notas frutales, vinosas e intensas.", "Fermentado" }
                });

            // ✅ Los cafés que ya existan quedan como "Lavado" (id 1) para que la FK sea válida.
            // Después se quita el valor por defecto: los cafés nuevos deben indicar su proceso.
            migrationBuilder.AddColumn<int>(
                name: "proceso_id",
                table: "cafes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql("ALTER TABLE cafes ALTER COLUMN proceso_id DROP DEFAULT;");

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 1,
                column: "descripcion",
                value: "La variedad más cultivada de Colombia. Desarrollada por Cenicafé para resistir la roya sin perder calidad en taza.");

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 2,
                columns: new[] { "descripcion", "nombre" },
                values: new object[] { "Variedad tradicional de porte bajo. Su taza es brillante, con acidez viva y cuerpo medio.", "Caturra" });

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 3,
                columns: new[] { "descripcion", "nombre" },
                values: new object[] { "Desarrollada por Cenicafé a partir de Caturra e Híbrido de Timor. Resistente a la roya, de taza equilibrada.", "Colombia" });

            migrationBuilder.InsertData(
                table: "variedades",
                columns: new[] { "id", "descripcion", "nombre" },
                values: new object[,]
                {
                    { 4, "Una de las variedades originales que llegaron a América. Taza limpia, dulce y delicada.", "Típica" },
                    { 5, "Variedad de Cenicafé de porte alto, con herencia de Típica y Bourbon. Dulce y de buen cuerpo.", "Tabi" },
                    { 6, "Variedad clásica de frutos rojos. Destaca por su dulzor y su cuerpo redondo.", "Bourbon Rojo" },
                    { 7, "Sus frutos maduran amarillos. Taza con dulzor tipo miel y acidez suave.", "Bourbon Amarillo" },
                    { 8, "Variedad rara y muy apreciada en el Huila. Notas florales y frutales de gran complejidad.", "Bourbon Rosado" },
                    { 9, "Exótica y floral, una de las variedades más valoradas del café de especialidad.", "Geisha" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_cafes_proceso_id",
                table: "cafes",
                column: "proceso_id");

            migrationBuilder.CreateIndex(
                name: "ux_procesos_nombre",
                table: "procesos",
                column: "nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_cafes_procesos_proceso_id",
                table: "cafes",
                column: "proceso_id",
                principalTable: "procesos",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // ✅ El café único ahora incluye el proceso: el mismo café puede venderse
            // Lavado y Honey. EF Core no modela índices por expresión, así que se crea a mano.
            // El nombre debe coincidir con CafeConfiguration.IndiceCafeUnico (se usa para el 409).
            migrationBuilder.Sql("DROP INDEX IF EXISTS ux_cafes_nombre_variedad_presentacion;");
            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX ux_cafes_nombre_variedad_proceso_presentacion " +
                "ON cafes (lower(nombre), variedad_id, proceso_id, presentacion_gramos);");

            // ✅ La semilla inserta ids fijos (variedades 4-9, procesos 1-3). PostgreSQL no mueve
            // el contador de identidad con esos inserts: se ajusta al mayor id para que la
            // próxima variedad creada por la API no choque con uno sembrado.
            migrationBuilder.Sql("SELECT setval(pg_get_serial_sequence('variedades', 'id'), (SELECT MAX(id) FROM variedades));");
            migrationBuilder.Sql("SELECT setval(pg_get_serial_sequence('procesos', 'id'), (SELECT MAX(id) FROM procesos));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS ux_cafes_nombre_variedad_proceso_presentacion;");

            migrationBuilder.DropForeignKey(
                name: "fk_cafes_procesos_proceso_id",
                table: "cafes");

            migrationBuilder.DropTable(
                name: "procesos");

            migrationBuilder.DropIndex(
                name: "ix_cafes_proceso_id",
                table: "cafes");

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 9);

            migrationBuilder.DropColumn(
                name: "proceso_id",
                table: "cafes");

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 1,
                column: "descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 2,
                columns: new[] { "descripcion", "nombre" },
                values: new object[] { null, "Geisha" });

            migrationBuilder.UpdateData(
                table: "variedades",
                keyColumn: "id",
                keyValue: 3,
                columns: new[] { "descripcion", "nombre" },
                values: new object[] { null, "Moka" });

            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX ux_cafes_nombre_variedad_presentacion " +
                "ON cafes (lower(nombre), variedad_id, presentacion_gramos);");
        }
    }
}
