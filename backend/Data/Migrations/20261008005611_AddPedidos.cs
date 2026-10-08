using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pedido",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<int>(type: "integer", nullable: false),
                    total = table.Column<decimal>(type: "numeric(12,0)", precision: 12, scale: 0, nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pedido", x => x.id);
                    table.CheckConstraint("ck_pedido_estado", "estado IN ('Pendiente', 'Pagado', 'Rechazado')");
                    table.ForeignKey(
                        name: "fk_pedido_usuario_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuario",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "pedido_producto",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    pedido_id = table.Column<int>(type: "integer", nullable: false),
                    producto_id = table.Column<int>(type: "integer", nullable: false),
                    cantidad = table.Column<int>(type: "integer", nullable: false),
                    precio = table.Column<decimal>(type: "numeric(12,0)", precision: 12, scale: 0, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pedido_producto", x => x.id);
                    table.CheckConstraint("ck_pedido_producto_cantidad", "cantidad >= 1");
                    table.ForeignKey(
                        name: "fk_pedido_producto_cafes_producto_id",
                        column: x => x.producto_id,
                        principalTable: "cafes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_pedido_producto_pedido_pedido_id",
                        column: x => x.pedido_id,
                        principalTable: "pedido",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_pedido_usuario_id",
                table: "pedido",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_pedido_producto_pedido_id",
                table: "pedido_producto",
                column: "pedido_id");

            migrationBuilder.CreateIndex(
                name: "ix_pedido_producto_producto_id",
                table: "pedido_producto",
                column: "producto_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pedido_producto");

            migrationBuilder.DropTable(
                name: "pedido");
        }
    }
}
