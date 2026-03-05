using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAIMLInfrastructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "workout_logs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OverallRpe",
                table: "workout_logs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "workout_logs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "achievements",
                columns: table => new
                {
                    AchievementId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IconUrl = table.Column<string>(type: "text", nullable: true),
                    TokenReward = table.Column<int>(type: "integer", nullable: false),
                    XpReward = table.Column<int>(type: "integer", nullable: false),
                    ThresholdValue = table.Column<int>(type: "integer", nullable: true),
                    IsSecret = table.Column<bool>(type: "boolean", nullable: false),
                    Rarity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_achievements", x => x.AchievementId);
                });

            migrationBuilder.CreateTable(
                name: "ai_model_versions",
                columns: table => new
                {
                    ModelVersionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModelName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ModelPath = table.Column<string>(type: "text", nullable: true),
                    HyperParameters = table.Column<string>(type: "text", nullable: true),
                    Accuracy = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    Precision = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    Recall = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    F1Score = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: true),
                    AverageLatencyMs = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    TrafficPercentage = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    TrainedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeployedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RetiredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrainingSampleCount = table.Column<int>(type: "integer", nullable: true),
                    TrainingDataVersion = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_model_versions", x => x.ModelVersionId);
                });

            migrationBuilder.CreateTable(
                name: "fitness_knowledge",
                columns: table => new
                {
                    KnowledgeId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Subcategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Tags = table.Column<string[]>(type: "text[]", nullable: true),
                    MuscleGroups = table.Column<string[]>(type: "text[]", nullable: true),
                    FitnessLevels = table.Column<string[]>(type: "text[]", nullable: true),
                    Priority = table.Column<float>(type: "real", precision: 3, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ApprovedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fitness_knowledge", x => x.KnowledgeId);
                    table.ForeignKey(
                        name: "FK_fitness_knowledge_users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_fitness_knowledge_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_feature_snapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FeatureVersion = table.Column<string>(type: "text", nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    HeightCm = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    Bmi = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    FitnessLevel = table.Column<string>(type: "text", nullable: true),
                    ExperienceYears = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    BodyFatPercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    MuscleMassKg = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    WorkoutsLast30Days = table.Column<int>(type: "integer", nullable: false),
                    TotalMinutesLast30Days = table.Column<int>(type: "integer", nullable: false),
                    TotalCaloriesLast30Days = table.Column<int>(type: "integer", nullable: false),
                    AvgWorkoutDuration = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    WorkoutConsistencyScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    BenchPressMax = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    SquatMax = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    DeadliftMax = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    OverheadPressMax = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    TotalVolumeLastWeek = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    VolumeProgressionRate = table.Column<decimal>(type: "numeric(6,3)", precision: 6, scale: 3, nullable: false),
                    PreferredWorkoutTime = table.Column<string>(type: "text", nullable: true),
                    PreferredWorkoutDays = table.Column<int>(type: "integer", nullable: true),
                    FavoriteExerciseIds = table.Column<string>(type: "text", nullable: true),
                    AvoidedExerciseIds = table.Column<string>(type: "text", nullable: true),
                    PlanCompletionRate = table.Column<int>(type: "integer", nullable: false),
                    AverageFeedbackRating = table.Column<int>(type: "integer", nullable: false),
                    DaysActive = table.Column<int>(type: "integer", nullable: false),
                    LastWorkoutDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentStreakDays = table.Column<int>(type: "integer", nullable: false),
                    LongestStreakDays = table.Column<int>(type: "integer", nullable: false),
                    TotalAiPlansGenerated = table.Column<int>(type: "integer", nullable: false),
                    AiPlansAccepted = table.Column<int>(type: "integer", nullable: false),
                    AiPlansRejected = table.Column<int>(type: "integer", nullable: false),
                    AiAcceptanceRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    ComputedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsLatest = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_feature_snapshots", x => x.SnapshotId);
                    table.ForeignKey(
                        name: "FK_user_feature_snapshots_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vector_embeddings",
                columns: table => new
                {
                    EmbeddingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ContentId = table.Column<int>(type: "integer", nullable: false),
                    SourceText = table.Column<string>(type: "text", nullable: false),
                    Embedding = table.Column<float[]>(type: "real[]", nullable: true),
                    EmbeddingModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EmbeddingDimension = table.Column<int>(type: "integer", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vector_embeddings", x => x.EmbeddingId);
                });

            migrationBuilder.CreateTable(
                name: "workout_log_exercises",
                columns: table => new
                {
                    WorkoutLogExerciseId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LogId = table.Column<int>(type: "integer", nullable: false),
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    OrderPerformed = table.Column<int>(type: "integer", nullable: false),
                    SetsCompleted = table.Column<int>(type: "integer", nullable: false),
                    RepsPerSet = table.Column<string>(type: "text", nullable: true),
                    WeightPerSet = table.Column<string>(type: "text", nullable: true),
                    TotalVolume = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    RestSecondsBetweenSets = table.Column<int>(type: "integer", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    Rpe = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    IsPersonalRecord = table.Column<bool>(type: "boolean", nullable: false),
                    PlannedExerciseId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_log_exercises", x => x.WorkoutLogExerciseId);
                    table.ForeignKey(
                        name: "FK_workout_log_exercises_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "ExerciseId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_workout_log_exercises_workout_logs_LogId",
                        column: x => x.LogId,
                        principalTable: "workout_logs",
                        principalColumn: "LogId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workout_log_exercises_workout_plan_exercises_PlannedExercis~",
                        column: x => x.PlannedExerciseId,
                        principalTable: "workout_plan_exercises",
                        principalColumn: "WorkoutPlanExerciseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_achievements",
                columns: table => new
                {
                    UserAchievementId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AchievementId = table.Column<int>(type: "integer", nullable: false),
                    CurrentProgress = table.Column<int>(type: "integer", nullable: false),
                    IsEarned = table.Column<bool>(type: "boolean", nullable: false),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RewardClaimed = table.Column<bool>(type: "boolean", nullable: false),
                    RewardClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsNotified = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_achievements", x => x.UserAchievementId);
                    table.ForeignKey(
                        name: "FK_user_achievements_achievements_AchievementId",
                        column: x => x.AchievementId,
                        principalTable: "achievements",
                        principalColumn: "AchievementId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_achievements_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_inference_logs",
                columns: table => new
                {
                    InferenceId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    ModelVersionId = table.Column<int>(type: "integer", nullable: false),
                    InferenceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FeatureSnapshotId = table.Column<int>(type: "integer", nullable: true),
                    InputFeatures = table.Column<string>(type: "text", nullable: true),
                    OutputResult = table.Column<string>(type: "text", nullable: true),
                    ConfidenceScores = table.Column<string>(type: "text", nullable: true),
                    LatencyMs = table.Column<int>(type: "integer", nullable: false),
                    TokensUsed = table.Column<int>(type: "integer", nullable: true),
                    UserRating = table.Column<int>(type: "integer", nullable: true),
                    WasAccepted = table.Column<bool>(type: "boolean", nullable: true),
                    UserFeedback = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    IsSuccess = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_inference_logs", x => x.InferenceId);
                    table.ForeignKey(
                        name: "FK_ai_inference_logs_ai_model_versions_ModelVersionId",
                        column: x => x.ModelVersionId,
                        principalTable: "ai_model_versions",
                        principalColumn: "ModelVersionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ai_inference_logs_user_feature_snapshots_FeatureSnapshotId",
                        column: x => x.FeatureSnapshotId,
                        principalTable: "user_feature_snapshots",
                        principalColumn: "SnapshotId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ai_inference_logs_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_achievements_Category",
                table: "achievements",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_achievements_Code",
                table: "achievements",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_CreatedAt",
                table: "ai_inference_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_FeatureSnapshotId",
                table: "ai_inference_logs",
                column: "FeatureSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_InferenceType",
                table: "ai_inference_logs",
                column: "InferenceType");

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_IsSuccess",
                table: "ai_inference_logs",
                column: "IsSuccess");

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_ModelVersionId_CreatedAt",
                table: "ai_inference_logs",
                columns: new[] { "ModelVersionId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ai_inference_logs_UserId_CreatedAt",
                table: "ai_inference_logs",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ai_model_versions_IsActive",
                table: "ai_model_versions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ai_model_versions_IsDefault",
                table: "ai_model_versions",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_ai_model_versions_ModelName_Version",
                table: "ai_model_versions",
                columns: new[] { "ModelName", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fitness_knowledge_ApprovedByUserId",
                table: "fitness_knowledge",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_fitness_knowledge_Category",
                table: "fitness_knowledge",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_fitness_knowledge_CreatedByUserId",
                table: "fitness_knowledge",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_fitness_knowledge_IsActive",
                table: "fitness_knowledge",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_fitness_knowledge_Priority",
                table: "fitness_knowledge",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_user_achievements_AchievementId",
                table: "user_achievements",
                column: "AchievementId");

            migrationBuilder.CreateIndex(
                name: "IX_user_achievements_UserId_AchievementId",
                table: "user_achievements",
                columns: new[] { "UserId", "AchievementId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_achievements_UserId_IsEarned",
                table: "user_achievements",
                columns: new[] { "UserId", "IsEarned" });

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_snapshots_FeatureVersion",
                table: "user_feature_snapshots",
                column: "FeatureVersion");

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_snapshots_UserId_ComputedAt",
                table: "user_feature_snapshots",
                columns: new[] { "UserId", "ComputedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_snapshots_UserId_IsLatest",
                table: "user_feature_snapshots",
                columns: new[] { "UserId", "IsLatest" });

            migrationBuilder.CreateIndex(
                name: "IX_vector_embeddings_ContentType_ContentId",
                table: "vector_embeddings",
                columns: new[] { "ContentType", "ContentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vector_embeddings_EmbeddingModel",
                table: "vector_embeddings",
                column: "EmbeddingModel");

            migrationBuilder.CreateIndex(
                name: "IX_workout_log_exercises_ExerciseId",
                table: "workout_log_exercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_log_exercises_IsPersonalRecord",
                table: "workout_log_exercises",
                column: "IsPersonalRecord");

            migrationBuilder.CreateIndex(
                name: "IX_workout_log_exercises_LogId_OrderPerformed",
                table: "workout_log_exercises",
                columns: new[] { "LogId", "OrderPerformed" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_log_exercises_PlannedExerciseId",
                table: "workout_log_exercises",
                column: "PlannedExerciseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_inference_logs");

            migrationBuilder.DropTable(
                name: "fitness_knowledge");

            migrationBuilder.DropTable(
                name: "user_achievements");

            migrationBuilder.DropTable(
                name: "vector_embeddings");

            migrationBuilder.DropTable(
                name: "workout_log_exercises");

            migrationBuilder.DropTable(
                name: "ai_model_versions");

            migrationBuilder.DropTable(
                name: "user_feature_snapshots");

            migrationBuilder.DropTable(
                name: "achievements");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "workout_logs");

            migrationBuilder.DropColumn(
                name: "OverallRpe",
                table: "workout_logs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "workout_logs");
        }
    }
}
