using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class ImplementTPTForRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookings_coach_profiles_CoachId",
                table: "bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_coach_reviews_coach_profiles_CoachId",
                table: "coach_reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_exercises_coach_profiles_CreatedByCoachId",
                table: "exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_meals_coach_profiles_CreatedByCoachId",
                table: "meals");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coach_profiles_ApprovedByCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coach_profiles_GeneratedByCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coach_profiles_ApprovedBy",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coach_profiles_GeneratedByCoachId",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_templates_coach_profiles_CreatedByCoachId",
                table: "workout_templates");

            migrationBuilder.DropIndex(
                name: "IX_users_Role",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Meals",
                table: "nutrition_plans");

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "workout_templates",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "workout_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId1",
                table: "workout_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "nutrition_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId1",
                table: "nutrition_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "meals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "exercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "coach_reviews",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CoachProfileCoachId",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "admins",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    IsSuperAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    Permissions = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admins", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_admins_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "coaches",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Specialization = table.Column<string>(type: "text", nullable: true),
                    Certifications = table.Column<string[]>(type: "text[]", nullable: true),
                    ExperienceYears = table.Column<int>(type: "integer", nullable: true),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    HourlyRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    TotalReviews = table.Column<int>(type: "integer", nullable: false),
                    TotalClients = table.Column<int>(type: "integer", nullable: false),
                    AvailabilitySchedule = table.Column<string>(type: "text", nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coaches", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_coaches_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "members",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    FitnessGoal = table.Column<string>(type: "text", nullable: true),
                    MedicalConditions = table.Column<string>(type: "text", nullable: true),
                    Allergies = table.Column<string>(type: "text", nullable: true),
                    FitnessLevel = table.Column<string>(type: "text", nullable: true),
                    PreferredWorkoutTime = table.Column<string>(type: "text", nullable: true),
                    SubscriptionPlanId = table.Column<int>(type: "integer", nullable: true),
                    MembershipStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MembershipEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentWeight = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    TargetWeight = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    Height = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    TotalWorkoutsCompleted = table.Column<int>(type: "integer", nullable: false),
                    TotalCaloriesBurned = table.Column<int>(type: "integer", nullable: false),
                    Achievements = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_members", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_members_subscription_plans_SubscriptionPlanId",
                        column: x => x.SubscriptionPlanId,
                        principalTable: "subscription_plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_members_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "receptionists",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ShiftSchedule = table.Column<string>(type: "text", nullable: true),
                    HireDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Department = table.Column<string>(type: "text", nullable: true),
                    TotalCheckIns = table.Column<int>(type: "integer", nullable: false),
                    TotalPaymentsProcessed = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_receptionists", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_receptionists_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Migrate existing coach_profiles data to coaches table
            migrationBuilder.Sql(@"
                INSERT INTO coaches (""UserId"", ""Specialization"", ""Certifications"", ""ExperienceYears"", ""Bio"", 
                                     ""HourlyRate"", ""Rating"", ""TotalReviews"", ""TotalClients"", ""AvailabilitySchedule"", ""IsAvailable"")
                SELECT cp.""UserId"", cp.""Specialization"", cp.""Certifications"", cp.""ExperienceYears"", cp.""Bio"",
                       cp.""HourlyRate"", cp.""Rating"", cp.""TotalReviews"", cp.""TotalClients"", cp.""AvailabilitySchedule"", cp.""IsAvailable""
                FROM coach_profiles cp
                WHERE cp.""UserId"" IN (SELECT ""UserId"" FROM users);
            ");

            // Migrate existing member_profiles data to members table
            migrationBuilder.Sql(@"
                INSERT INTO members (""UserId"", ""FitnessGoal"", ""MedicalConditions"", ""Allergies"", ""FitnessLevel"",
                                     ""PreferredWorkoutTime"", ""SubscriptionPlanId"", ""MembershipStartDate"", ""MembershipEndDate"",
                                     ""CurrentWeight"", ""TargetWeight"", ""Height"", ""TotalWorkoutsCompleted"", ""TotalCaloriesBurned"", ""Achievements"")
                SELECT mp.""UserId"", mp.""FitnessGoal"", mp.""MedicalConditions"", mp.""Allergies"", mp.""FitnessLevel"",
                       mp.""PreferredWorkoutTime"", mp.""SubscriptionPlanId"", mp.""MembershipStartDate"", mp.""MembershipEndDate"",
                       mp.""CurrentWeight"", mp.""TargetWeight"", mp.""Height"", mp.""TotalWorkoutsCompleted"", mp.""TotalCaloriesBurned"", 
                       COALESCE(mp.""Achievements"", '[]')
                FROM member_profiles mp
                WHERE mp.""UserId"" IN (SELECT ""UserId"" FROM users);
            ");

            migrationBuilder.CreateIndex(
                name: "IX_workout_templates_CoachProfileCoachId",
                table: "workout_templates",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_plans_CoachProfileCoachId",
                table: "workout_plans",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_plans_CoachProfileCoachId1",
                table: "workout_plans",
                column: "CoachProfileCoachId1");

            migrationBuilder.CreateIndex(
                name: "IX_nutrition_plans_CoachProfileCoachId",
                table: "nutrition_plans",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_nutrition_plans_CoachProfileCoachId1",
                table: "nutrition_plans",
                column: "CoachProfileCoachId1");

            migrationBuilder.CreateIndex(
                name: "IX_meals_CoachProfileCoachId",
                table: "meals",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_exercises_CoachProfileCoachId",
                table: "exercises",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_coach_reviews_CoachProfileCoachId",
                table: "coach_reviews",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_CoachProfileCoachId",
                table: "bookings",
                column: "CoachProfileCoachId");

            migrationBuilder.CreateIndex(
                name: "IX_members_SubscriptionPlanId",
                table: "members",
                column: "SubscriptionPlanId");

            // Clean up invalid CoachId references before adding FK constraints
            // Temporarily disable check constraint for bookings
            migrationBuilder.Sql(@"ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_booking_type_match;");

            migrationBuilder.Sql(@"
                UPDATE bookings 
                SET ""CoachId"" = NULL 
                WHERE ""CoachId"" IS NOT NULL 
                AND ""CoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            // Re-enable check constraint
            migrationBuilder.Sql(@"
                ALTER TABLE bookings ADD CONSTRAINT chk_booking_type_match 
                CHECK (
                    (""BookingType"" = 'Equipment' AND ""EquipmentId"" IS NOT NULL) OR
                    (""BookingType"" = 'Coach' AND ""CoachId"" IS NOT NULL) OR
                    ""BookingType"" NOT IN ('Equipment', 'Coach')
                );
            ");

            migrationBuilder.Sql(@"
                UPDATE exercises 
                SET ""CreatedByCoachId"" = NULL 
                WHERE ""CreatedByCoachId"" IS NOT NULL 
                AND ""CreatedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE meals 
                SET ""CreatedByCoachId"" = NULL 
                WHERE ""CreatedByCoachId"" IS NOT NULL 
                AND ""CreatedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE nutrition_plans 
                SET ""GeneratedByCoachId"" = NULL 
                WHERE ""GeneratedByCoachId"" IS NOT NULL 
                AND ""GeneratedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE nutrition_plans 
                SET ""ApprovedByCoachId"" = NULL 
                WHERE ""ApprovedByCoachId"" IS NOT NULL 
                AND ""ApprovedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE workout_plans 
                SET ""GeneratedByCoachId"" = NULL 
                WHERE ""GeneratedByCoachId"" IS NOT NULL 
                AND ""GeneratedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE workout_plans 
                SET ""ApprovedBy"" = NULL 
                WHERE ""ApprovedBy"" IS NOT NULL 
                AND ""ApprovedBy"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE workout_templates 
                SET ""CreatedByCoachId"" = NULL 
                WHERE ""CreatedByCoachId"" IS NOT NULL 
                AND ""CreatedByCoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.Sql(@"
                UPDATE coach_reviews 
                SET ""CoachId"" = NULL 
                WHERE ""CoachId"" IS NOT NULL 
                AND ""CoachId"" NOT IN (SELECT ""UserId"" FROM coaches);
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_bookings_coach_profiles_CoachProfileCoachId",
                table: "bookings",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_bookings_coaches_CoachId",
                table: "bookings",
                column: "CoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_coach_reviews_coach_profiles_CoachProfileCoachId",
                table: "coach_reviews",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_coach_reviews_coaches_CoachId",
                table: "coach_reviews",
                column: "CoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_coach_profiles_CoachProfileCoachId",
                table: "exercises",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_coaches_CreatedByCoachId",
                table: "exercises",
                column: "CreatedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_meals_coach_profiles_CoachProfileCoachId",
                table: "meals",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_meals_coaches_CreatedByCoachId",
                table: "meals",
                column: "CreatedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coach_profiles_CoachProfileCoachId",
                table: "nutrition_plans",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coach_profiles_CoachProfileCoachId1",
                table: "nutrition_plans",
                column: "CoachProfileCoachId1",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coaches_ApprovedByCoachId",
                table: "nutrition_plans",
                column: "ApprovedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coaches_GeneratedByCoachId",
                table: "nutrition_plans",
                column: "GeneratedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coach_profiles_CoachProfileCoachId",
                table: "workout_plans",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coach_profiles_CoachProfileCoachId1",
                table: "workout_plans",
                column: "CoachProfileCoachId1",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coaches_ApprovedBy",
                table: "workout_plans",
                column: "ApprovedBy",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coaches_GeneratedByCoachId",
                table: "workout_plans",
                column: "GeneratedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_templates_coach_profiles_CoachProfileCoachId",
                table: "workout_templates",
                column: "CoachProfileCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId");

            migrationBuilder.AddForeignKey(
                name: "FK_workout_templates_coaches_CreatedByCoachId",
                table: "workout_templates",
                column: "CreatedByCoachId",
                principalTable: "coaches",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookings_coach_profiles_CoachProfileCoachId",
                table: "bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_bookings_coaches_CoachId",
                table: "bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_coach_reviews_coach_profiles_CoachProfileCoachId",
                table: "coach_reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_coach_reviews_coaches_CoachId",
                table: "coach_reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_exercises_coach_profiles_CoachProfileCoachId",
                table: "exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_exercises_coaches_CreatedByCoachId",
                table: "exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_meals_coach_profiles_CoachProfileCoachId",
                table: "meals");

            migrationBuilder.DropForeignKey(
                name: "FK_meals_coaches_CreatedByCoachId",
                table: "meals");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coach_profiles_CoachProfileCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coach_profiles_CoachProfileCoachId1",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coaches_ApprovedByCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_nutrition_plans_coaches_GeneratedByCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coach_profiles_CoachProfileCoachId",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coach_profiles_CoachProfileCoachId1",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coaches_ApprovedBy",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_plans_coaches_GeneratedByCoachId",
                table: "workout_plans");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_templates_coach_profiles_CoachProfileCoachId",
                table: "workout_templates");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_templates_coaches_CreatedByCoachId",
                table: "workout_templates");

            migrationBuilder.DropTable(
                name: "admins");

            migrationBuilder.DropTable(
                name: "coaches");

            migrationBuilder.DropTable(
                name: "members");

            migrationBuilder.DropTable(
                name: "receptionists");

            migrationBuilder.DropIndex(
                name: "IX_workout_templates_CoachProfileCoachId",
                table: "workout_templates");

            migrationBuilder.DropIndex(
                name: "IX_workout_plans_CoachProfileCoachId",
                table: "workout_plans");

            migrationBuilder.DropIndex(
                name: "IX_workout_plans_CoachProfileCoachId1",
                table: "workout_plans");

            migrationBuilder.DropIndex(
                name: "IX_nutrition_plans_CoachProfileCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropIndex(
                name: "IX_nutrition_plans_CoachProfileCoachId1",
                table: "nutrition_plans");

            migrationBuilder.DropIndex(
                name: "IX_meals_CoachProfileCoachId",
                table: "meals");

            migrationBuilder.DropIndex(
                name: "IX_exercises_CoachProfileCoachId",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "IX_coach_reviews_CoachProfileCoachId",
                table: "coach_reviews");

            migrationBuilder.DropIndex(
                name: "IX_bookings_CoachProfileCoachId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "workout_templates");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId1",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "nutrition_plans");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId1",
                table: "nutrition_plans");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "meals");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "coach_reviews");

            migrationBuilder.DropColumn(
                name: "CoachProfileCoachId",
                table: "bookings");

            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Meals",
                table: "nutrition_plans",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Role",
                table: "users",
                column: "Role");

            migrationBuilder.AddForeignKey(
                name: "FK_bookings_coach_profiles_CoachId",
                table: "bookings",
                column: "CoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_coach_reviews_coach_profiles_CoachId",
                table: "coach_reviews",
                column: "CoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_coach_profiles_CreatedByCoachId",
                table: "exercises",
                column: "CreatedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_meals_coach_profiles_CreatedByCoachId",
                table: "meals",
                column: "CreatedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coach_profiles_ApprovedByCoachId",
                table: "nutrition_plans",
                column: "ApprovedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_nutrition_plans_coach_profiles_GeneratedByCoachId",
                table: "nutrition_plans",
                column: "GeneratedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coach_profiles_ApprovedBy",
                table: "workout_plans",
                column: "ApprovedBy",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_plans_coach_profiles_GeneratedByCoachId",
                table: "workout_plans",
                column: "GeneratedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_templates_coach_profiles_CreatedByCoachId",
                table: "workout_templates",
                column: "CreatedByCoachId",
                principalTable: "coach_profiles",
                principalColumn: "CoachId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
