using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CafeApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWompi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "referencia_wompi",
                table: "pedido",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "transaction_id_wompi",
                table: "pedido",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            // ✅ Los pedidos que ya existían reciben su referencia antes de crear el índice único
            // (si no, todos quedarían con '' y no tendrían cómo pagarse).
            migrationBuilder.Sql("UPDATE pedido SET referencia_wompi = 'PEDIDO-' || id WHERE referencia_wompi = '';");

            migrationBuilder.CreateIndex(
                name: "ux_pedido_referencia_wompi",
                table: "pedido",
                column: "referencia_wompi",
                unique: true,
                filter: "referencia_wompi <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_pedido_referencia_wompi",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "referencia_wompi",
                table: "pedido");

            migrationBuilder.DropColumn(
                name: "transaction_id_wompi",
                table: "pedido");
        }
    }
}
