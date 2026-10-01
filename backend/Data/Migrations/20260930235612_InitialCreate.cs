using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "variedades",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_variedades", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cafes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    variedad_id = table.Column<int>(type: "integer", nullable: false),
                    presentacion_gramos = table.Column<int>(type: "integer", nullable: false),
                    origen = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    stock = table.Column<int>(type: "integer", nullable: false),
                    precio = table.Column<decimal>(type: "numeric(12,0)", precision: 12, scale: 0, nullable: false),
                    imagen_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    imagen_public_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cafes", x => x.id);
                    table.CheckConstraint("ck_cafes_precio", "precio > 0");
                    table.CheckConstraint("ck_cafes_presentacion_gramos", "presentacion_gramos IN (340, 500)");
                    table.CheckConstraint("ck_cafes_stock", "stock >= 0");
                    table.ForeignKey(
                        name: "fk_cafes_variedades_variedad_id",
                        column: x => x.variedad_id,
                        principalTable: "variedades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "variedades",
                columns: new[] { "id", "descripcion", "nombre" },
                values: new object[,]
                {
                    { 1, null, "Castillo" },
                    { 2, null, "Geisha" },
                    { 3, null, "Moka" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_cafes_variedad_id",
                table: "cafes",
                column: "variedad_id");

            migrationBuilder.CreateIndex(
                name: "ux_variedades_nombre",
                table: "variedades",
                column: "nombre",
                unique: true);

            // ✅ Índice único que ignora mayúsculas. EF Core no modela índices
            // por expresión, así que se crea a mano. El nombre debe coincidir
            // con CafeConfiguration.IndiceCafeUnico (se usa para responder 409).
            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX ux_cafes_nombre_variedad_presentacion " +
                "ON cafes (lower(nombre), variedad_id, presentacion_gramos);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "DROP INDEX IF EXISTS ux_cafes_nombre_variedad_presentacion;");

            migrationBuilder.DropTable(
                name: "cafes");

            migrationBuilder.DropTable(
                name: "variedades");
        }
    }
}
