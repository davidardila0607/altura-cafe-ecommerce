using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDireccionPedido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ciudad",
                table: "pedido",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "No registrada");

            migrationBuilder.AddColumn<string>(
                name: "departamento",
                table: "pedido",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "No registrada");

            migrationBuilder.AddColumn<string>(
                name: "direccion_envio",
                table: "pedido",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "No registrada");

            migrationBuilder.AddColumn<string>(
                name: "notas_entrega",
                table: "pedido",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "telefono",
                table: "pedido",
                type: "character varying(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "No registrada");

            // ✅ Los pedidos que ya existían quedan con "No registrada" (el valor por defecto de
            // arriba). Después se quita ese valor por defecto: los pedidos nuevos siempre traen
            // sus datos de envío (DatosEnvioDto los exige).
            migrationBuilder.Sql(
                "ALTER TABLE pedido ALTER COLUMN direccion_envio DROP DEFAULT, " +
                "ALTER COLUMN ciudad DROP DEFAULT, " +
                "ALTER COLUMN departamento DROP DEFAULT, " +
                "ALTER COLUMN telefono DROP DEFAULT;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ciudad",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "departamento",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "direccion_envio",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "notas_entrega",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "telefono",
                table: "pedido");
        }
    }
}
