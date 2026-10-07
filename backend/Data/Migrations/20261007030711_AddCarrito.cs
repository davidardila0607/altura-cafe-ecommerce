using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCarrito : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "carrito",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_carrito", x => x.id);
                    table.ForeignKey(
                        name: "fk_carrito_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "carrito_producto",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    carrito_id = table.Column<int>(type: "integer", nullable: false),
                    producto_id = table.Column<int>(type: "integer", nullable: false),
                    cantidad = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_carrito_producto", x => x.id);
                    table.CheckConstraint("ck_carrito_producto_cantidad", "cantidad >= 1");
                    table.ForeignKey(
                        name: "fk_carrito_producto_cafes_producto_id",
                        column: x => x.producto_id,
                        principalTable: "cafes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_carrito_producto_carrito_carrito_id",
                        column: x => x.carrito_id,
                        principalTable: "carrito",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ux_carrito_usuario_id",
                table: "carrito",
                column: "usuario_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_carrito_producto_producto_id",
                table: "carrito_producto",
                column: "producto_id");

            migrationBuilder.CreateIndex(
                name: "ux_carrito_producto_carrito_producto",
                table: "carrito_producto",
                columns: new[] { "carrito_id", "producto_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "carrito_producto");

            migrationBuilder.DropTable(
                name: "carrito");
        }
    }
}
