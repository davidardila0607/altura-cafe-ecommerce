using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ✅ Cada café pasa a tener dueño (usuario_id NOT NULL, sin valor por defecto).
            // Requisito: la tabla cafes debe estar VACÍA antes de aplicar esta migración
            // (los cafés anteriores no tenían dueño). Si tiene filas, PostgreSQL rechaza
            // la columna y la migración no se aplica: borra los cafés y vuelve a intentarlo.
            migrationBuilder.AddColumn<int>(
                name: "usuario_id",
                table: "cafes",
                type: "integer",
                nullable: false);

            migrationBuilder.CreateTable(
                name: "usuario",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    password = table.Column<string>(type: "text", nullable: false),
                    rol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuario", x => x.id);
                    table.CheckConstraint("ck_usuario_rol", "rol IN ('Administrador', 'Cliente')");
                });

            migrationBuilder.CreateIndex(
                name: "ix_cafes_usuario_id",
                table: "cafes",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ux_usuario_email",
                table: "usuario",
                column: "email",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_cafes_usuario_usuario_id",
                table: "cafes",
                column: "usuario_id",
                principalTable: "usuario",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_cafes_usuario_usuario_id",
                table: "cafes");

            migrationBuilder.DropTable(
                name: "usuario");

            migrationBuilder.DropIndex(
                name: "ix_cafes_usuario_id",
                table: "cafes");

            migrationBuilder.DropColumn(
                name: "usuario_id",
                table: "cafes");
        }
    }
}
