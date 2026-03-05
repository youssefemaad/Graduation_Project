using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentBookingLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EquipmentId",
                table: "exercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAiGenerated",
                table: "bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsAutoBookedForCoachSession",
                table: "bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ParentCoachBookingId",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "coach_session_equipments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CoachBookingId = table.Column<int>(type: "integer", nullable: false),
                    EquipmentBookingId = table.Column<int>(type: "integer", nullable: false),
                    EquipmentId = table.Column<int>(type: "integer", nullable: false),
                    WorkoutPlanExerciseId = table.Column<int>(type: "integer", nullable: true),
                    IsApprovedByCoach = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coach_session_equipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_coach_session_equipments_bookings_CoachBookingId",
                        column: x => x.CoachBookingId,
                        principalTable: "bookings",
                        principalColumn: "BookingId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_coach_session_equipments_bookings_EquipmentBookingId",
                        column: x => x.EquipmentBookingId,
                        principalTable: "bookings",
                        principalColumn: "BookingId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_coach_session_equipments_equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipment",
                        principalColumn: "EquipmentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coach_session_equipments_workout_plan_exercises_WorkoutPlan~",
                        column: x => x.WorkoutPlanExerciseId,
                        principalTable: "workout_plan_exercises",
                        principalColumn: "WorkoutPlanExerciseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "equipment_time_slots",
                columns: table => new
                {
                    SlotId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EquipmentId = table.Column<int>(type: "integer", nullable: false),
                    SlotDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    IsBooked = table.Column<bool>(type: "boolean", nullable: false),
                    BookedByUserId = table.Column<int>(type: "integer", nullable: true),
                    BookingId = table.Column<int>(type: "integer", nullable: true),
                    IsCoachSession = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BookedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_time_slots", x => x.SlotId);
                    table.ForeignKey(
                        name: "FK_equipment_time_slots_bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "bookings",
                        principalColumn: "BookingId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_equipment_time_slots_equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipment",
                        principalColumn: "EquipmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_equipment_time_slots_users_BookedByUserId",
                        column: x => x.BookedByUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exercises_EquipmentId",
                table: "exercises",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_ParentCoachBookingId",
                table: "bookings",
                column: "ParentCoachBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_coach_session_equipments_CoachBookingId",
                table: "coach_session_equipments",
                column: "CoachBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_coach_session_equipments_EquipmentBookingId",
                table: "coach_session_equipments",
                column: "EquipmentBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_coach_session_equipments_EquipmentId",
                table: "coach_session_equipments",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_coach_session_equipments_WorkoutPlanExerciseId",
                table: "coach_session_equipments",
                column: "WorkoutPlanExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_time_slots_BookedByUserId",
                table: "equipment_time_slots",
                column: "BookedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_time_slots_BookingId",
                table: "equipment_time_slots",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_time_slots_EquipmentId_SlotDate_StartTime",
                table: "equipment_time_slots",
                columns: new[] { "EquipmentId", "SlotDate", "StartTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipment_time_slots_SlotDate_IsBooked",
                table: "equipment_time_slots",
                columns: new[] { "SlotDate", "IsBooked" });

            migrationBuilder.AddForeignKey(
                name: "FK_bookings_bookings_ParentCoachBookingId",
                table: "bookings",
                column: "ParentCoachBookingId",
                principalTable: "bookings",
                principalColumn: "BookingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_equipment_EquipmentId",
                table: "exercises",
                column: "EquipmentId",
                principalTable: "equipment",
                principalColumn: "EquipmentId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookings_bookings_ParentCoachBookingId",
                table: "bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_exercises_equipment_EquipmentId",
                table: "exercises");

            migrationBuilder.DropTable(
                name: "coach_session_equipments");

            migrationBuilder.DropTable(
                name: "equipment_time_slots");

            migrationBuilder.DropIndex(
                name: "IX_exercises_EquipmentId",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "IX_bookings_ParentCoachBookingId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "EquipmentId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "IsAiGenerated",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "IsAutoBookedForCoachSession",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "ParentCoachBookingId",
                table: "bookings");
        }
    }
}
