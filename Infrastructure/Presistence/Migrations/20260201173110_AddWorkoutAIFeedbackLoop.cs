using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutAIFeedbackLoop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAt",
                table: "workout_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "workout_plans",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DaysPerWeek",
                table: "workout_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FitnessLevel",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GenerationLatencyMs",
                table: "workout_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Goal",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "workout_plans",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ModelVersion",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlanData",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestParameters",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestParametersHash",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserContextSnapshot",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "muscle_development_scans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ImageType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MuscleScores = table.Column<string>(type: "jsonb", nullable: true),
                    UnderdevelopedMuscles = table.Column<string[]>(type: "text[]", nullable: true),
                    WellDevelopedMuscles = table.Column<string[]>(type: "text[]", nullable: true),
                    BodyFatEstimate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    MuscleDefinitionScore = table.Column<decimal>(type: "numeric(4,3)", precision: 4, scale: 3, nullable: true),
                    PostureNotes = table.Column<string>(type: "text", nullable: true),
                    AsymmetryDetected = table.Column<bool>(type: "boolean", nullable: false),
                    ModelVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(4,3)", precision: 4, scale: 3, nullable: true),
                    ProcessingTimeMs = table.Column<int>(type: "integer", nullable: true),
                    ScanDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_muscle_development_scans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_muscle_development_scans_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_strength_profiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    Estimated1RM = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric(4,3)", precision: 4, scale: 3, nullable: false),
                    AvgWorkingWeight = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    MaxWeightLifted = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    FeedbackCount = table.Column<int>(type: "integer", nullable: false),
                    LastWorkoutDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StrengthTrend = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    LastUpdatedFrom = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_strength_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_strength_profiles_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "ExerciseId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_strength_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_feedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    WorkoutLogId = table.Column<int>(type: "integer", nullable: false),
                    WorkoutPlanId = table.Column<int>(type: "integer", nullable: true),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    DifficultyLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ExerciseFeedback = table.Column<string>(type: "jsonb", nullable: false),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    FeedbackType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WorkoutLogLogId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_feedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_feedbacks_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workout_feedbacks_workout_logs_WorkoutLogId",
                        column: x => x.WorkoutLogId,
                        principalTable: "workout_logs",
                        principalColumn: "LogId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workout_feedbacks_workout_logs_WorkoutLogLogId",
                        column: x => x.WorkoutLogLogId,
                        principalTable: "workout_logs",
                        principalColumn: "LogId");
                    table.ForeignKey(
                        name: "FK_workout_feedbacks_workout_plans_WorkoutPlanId",
                        column: x => x.WorkoutPlanId,
                        principalTable: "workout_plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_muscle_development_scans_ImageType",
                table: "muscle_development_scans",
                column: "ImageType");

            migrationBuilder.CreateIndex(
                name: "IX_muscle_development_scans_UserId_ScanDate",
                table: "muscle_development_scans",
                columns: new[] { "UserId", "ScanDate" });

            migrationBuilder.CreateIndex(
                name: "IX_user_strength_profiles_ConfidenceScore",
                table: "user_strength_profiles",
                column: "ConfidenceScore");

            migrationBuilder.CreateIndex(
                name: "IX_user_strength_profiles_ExerciseId",
                table: "user_strength_profiles",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_user_strength_profiles_UserId_ExerciseId",
                table: "user_strength_profiles",
                columns: new[] { "UserId", "ExerciseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_strength_profiles_UserId_UpdatedAt",
                table: "user_strength_profiles",
                columns: new[] { "UserId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_feedbacks_FeedbackType",
                table: "workout_feedbacks",
                column: "FeedbackType");

            migrationBuilder.CreateIndex(
                name: "IX_workout_feedbacks_UserId_CreatedAt",
                table: "workout_feedbacks",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_feedbacks_WorkoutLogId",
                table: "workout_feedbacks",
                column: "WorkoutLogId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_feedbacks_WorkoutLogLogId",
                table: "workout_feedbacks",
                column: "WorkoutLogLogId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_feedbacks_WorkoutPlanId",
                table: "workout_feedbacks",
                column: "WorkoutPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "muscle_development_scans");

            migrationBuilder.DropTable(
                name: "user_strength_profiles");

            migrationBuilder.DropTable(
                name: "workout_feedbacks");

            migrationBuilder.DropColumn(
                name: "ActivatedAt",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "DaysPerWeek",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "FitnessLevel",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "GenerationLatencyMs",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "Goal",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "ModelVersion",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "PlanData",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "RequestParameters",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "RequestParametersHash",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "UserContextSnapshot",
                table: "workout_plans");
        }
    }
}
