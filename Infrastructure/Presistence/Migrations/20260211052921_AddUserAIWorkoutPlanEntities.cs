using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAIWorkoutPlanEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_ai_workout_plans",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PlanName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    FitnessLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Goal = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DaysPerWeek = table.Column<int>(type: "integer", nullable: true),
                    ProgramDurationWeeks = table.Column<int>(type: "integer", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ModelVersion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    GenerationLatencyMs = table.Column<int>(type: "integer", nullable: true),
                    RawPlanDataJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_ai_workout_plans", x => x.PlanId);
                    table.ForeignKey(
                        name: "FK_user_ai_workout_plans_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_ai_workout_plan_days",
                columns: table => new
                {
                    DayId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlanId = table.Column<int>(type: "integer", nullable: false),
                    DayNumber = table.Column<int>(type: "integer", nullable: false),
                    DayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FocusAreas = table.Column<string>(type: "text", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_ai_workout_plan_days", x => x.DayId);
                    table.ForeignKey(
                        name: "FK_user_ai_workout_plan_days_user_ai_workout_plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "user_ai_workout_plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_ai_workout_plan_exercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlanDayId = table.Column<int>(type: "integer", nullable: false),
                    ExerciseId = table.Column<int>(type: "integer", nullable: true),
                    ExerciseName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    OrderInDay = table.Column<int>(type: "integer", nullable: false),
                    Sets = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Reps = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Rest = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RestSeconds = table.Column<int>(type: "integer", nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    WeightRecommendation = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Tempo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EquipmentId = table.Column<int>(type: "integer", nullable: true),
                    EquipmentRequired = table.Column<string>(type: "text", nullable: true),
                    TargetMuscle = table.Column<string>(type: "text", nullable: true),
                    ExerciseType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MovementPattern = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_ai_workout_plan_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_ai_workout_plan_exercises_equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipment",
                        principalColumn: "EquipmentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_ai_workout_plan_exercises_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "ExerciseId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_ai_workout_plan_exercises_user_ai_workout_plan_days_Pl~",
                        column: x => x.PlanDayId,
                        principalTable: "user_ai_workout_plan_days",
                        principalColumn: "DayId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plan_days_PlanId",
                table: "user_ai_workout_plan_days",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plan_exercises_EquipmentId",
                table: "user_ai_workout_plan_exercises",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plan_exercises_ExerciseId",
                table: "user_ai_workout_plan_exercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plan_exercises_PlanDayId",
                table: "user_ai_workout_plan_exercises",
                column: "PlanDayId");

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plans_CreatedAt",
                table: "user_ai_workout_plans",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_user_ai_workout_plans_UserId_IsActive",
                table: "user_ai_workout_plans",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_ai_workout_plan_exercises");

            migrationBuilder.DropTable(
                name: "user_ai_workout_plan_days");

            migrationBuilder.DropTable(
                name: "user_ai_workout_plans");
        }
    }
}
