using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInBodyMeasurementColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old columns with wrong names
            migrationBuilder.DropColumn(
                name: "ProteinPercentage",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "BoneMass",
                table: "inbody_measurements");

            // Add correct columns
            migrationBuilder.AddColumn<decimal>(
                name: "Protein",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Minerals",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalTrunkLean",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalTrunkFat",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalLeftArmFat",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalLeftArmLean",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalLeftLegFat",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalLeftLegLean",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalRightArmFat",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalRightArmLean",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalRightLegFat",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SegmentalRightLegLean",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Minerals",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "Protein",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalLeftArmFat",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalLeftArmLean",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalLeftLegFat",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalLeftLegLean",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalRightArmFat",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalRightArmLean",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalRightLegFat",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalRightLegLean",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalTrunkLean",
                table: "inbody_measurements");

            migrationBuilder.DropColumn(
                name: "SegmentalTrunkFat",
                table: "inbody_measurements");

            migrationBuilder.AddColumn<decimal>(
                name: "ProteinPercentage",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BoneMass",
                table: "inbody_measurements",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);
        }
    }
}
