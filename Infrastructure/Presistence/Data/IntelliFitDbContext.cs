using Microsoft.EntityFrameworkCore;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Models.AI;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Infrastructure.Persistence
{
    public class IntelliFitDbContext : DbContext
    {
        public IntelliFitDbContext(DbContextOptions<IntelliFitDbContext> options) : base(options)
        {
        }

        // Core Users (single table with Role column)
        public DbSet<User> Users { get; set; }

        // User Profiles (role-specific data)
        public DbSet<MemberProfile> MemberProfiles { get; set; }
        public DbSet<CoachProfile> CoachProfiles { get; set; }

        // Billing
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<TokenPackage> TokenPackages { get; set; }
        public DbSet<TokenTransaction> TokenTransactions { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // Equipment
        public DbSet<EquipmentCategory> EquipmentCategories { get; set; }
        public DbSet<Equipment> Equipment { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<EquipmentTimeSlot> EquipmentTimeSlots { get; set; }
        public DbSet<CoachSessionEquipment> CoachSessionEquipments { get; set; }

        // Health
        public DbSet<InBodyMeasurement> InBodyMeasurements { get; set; }

        // Workouts
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        public DbSet<WorkoutPlanExercise> WorkoutPlanExercises { get; set; }
        public DbSet<WorkoutLog> WorkoutLogs { get; set; }
        public DbSet<WorkoutLogExercise> WorkoutLogExercises { get; set; }  // NEW: Normalized exercise logs
        public DbSet<WorkoutTemplate> WorkoutTemplates { get; set; }
        public DbSet<WorkoutTemplateExercise> WorkoutTemplateExercises { get; set; }

        // Nutrition
        public DbSet<NutritionPlan> NutritionPlans { get; set; }
        public DbSet<Meal> Meals { get; set; }
        public DbSet<MealIngredient> MealIngredients { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }

        // AI / ML
        public DbSet<AiChatLog> AiChatLogs { get; set; }
        public DbSet<AiProgramGeneration> AiProgramGenerations { get; set; }
        public DbSet<AiWorkflowJob> AiWorkflowJobs { get; set; }
        public DbSet<UserFeatureSnapshot> UserFeatureSnapshots { get; set; }  // NEW: ML feature store
        public DbSet<AiModelVersion> AiModelVersions { get; set; }  // NEW: Model versioning
        public DbSet<AiInferenceLog> AiInferenceLogs { get; set; }  // NEW: Inference logging
        public DbSet<VectorEmbedding> VectorEmbeddings { get; set; }  // NEW: Vector storage
        public DbSet<FitnessKnowledge> FitnessKnowledge { get; set; }  // NEW: RAG knowledge base
        public DbSet<UserAIWorkoutPlan> UserAIWorkoutPlans { get; set; }
        public DbSet<UserAIWorkoutPlanDay> UserAIWorkoutPlanDays { get; set; }
        public DbSet<UserAIWorkoutPlanExercise> UserAIWorkoutPlanExercises { get; set; }

        // AI Feedback Loop (Flan-T5 workout generation)
        public DbSet<WorkoutFeedback> WorkoutFeedbacks { get; set; }  // User feedback for AI learning
        public DbSet<UserStrengthProfile> UserStrengthProfiles { get; set; }  // Per-exercise strength tracking
        public DbSet<MuscleDevelopmentScan> MuscleDevelopmentScans { get; set; }  // Vision AI analysis

        // Engagement
        public DbSet<ActivityFeed> ActivityFeeds { get; set; }
        public DbSet<ProgressMilestone> ProgressMilestones { get; set; }
        public DbSet<UserMilestone> UserMilestones { get; set; }
        public DbSet<Achievement> Achievements { get; set; }  // NEW: Achievement definitions
        public DbSet<UserAchievement> UserAchievements { get; set; }  // NEW: User achievement tracking

        // System
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<CoachReview> CoachReviews { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostgreSQL enum mappings
            modelBuilder.HasPostgresEnum<GenderType>();
            modelBuilder.HasPostgresEnum<SubscriptionStatus>();
            modelBuilder.HasPostgresEnum<BookingStatus>();
            modelBuilder.HasPostgresEnum<EquipmentStatus>();
            modelBuilder.HasPostgresEnum<TransactionType>();
            modelBuilder.HasPostgresEnum<PaymentStatus>();
            modelBuilder.HasPostgresEnum<NotificationType>();

            // Table mappings
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<MemberProfile>().ToTable("member_profiles");
            modelBuilder.Entity<CoachProfile>().ToTable("coach_profiles");
            modelBuilder.Entity<SubscriptionPlan>().ToTable("subscription_plans");
            modelBuilder.Entity<UserSubscription>().ToTable("user_subscriptions");
            modelBuilder.Entity<TokenPackage>().ToTable("token_packages");
            modelBuilder.Entity<TokenTransaction>().ToTable("token_transactions");
            modelBuilder.Entity<Payment>().ToTable("payments");
            modelBuilder.Entity<EquipmentCategory>().ToTable("equipment_categories");
            modelBuilder.Entity<Equipment>().ToTable("equipment");
            modelBuilder.Entity<Booking>().ToTable("bookings");
            modelBuilder.Entity<EquipmentTimeSlot>().ToTable("equipment_time_slots");
            modelBuilder.Entity<CoachSessionEquipment>().ToTable("coach_session_equipments");
            modelBuilder.Entity<InBodyMeasurement>().ToTable("inbody_measurements");
            modelBuilder.Entity<Exercise>().ToTable("exercises");
            modelBuilder.Entity<WorkoutPlan>().ToTable("workout_plans");
            modelBuilder.Entity<WorkoutPlanExercise>().ToTable("workout_plan_exercises");
            modelBuilder.Entity<WorkoutLog>().ToTable("workout_logs");
            modelBuilder.Entity<WorkoutLogExercise>().ToTable("workout_log_exercises");  // NEW
            modelBuilder.Entity<WorkoutTemplate>().ToTable("workout_templates");
            modelBuilder.Entity<WorkoutTemplateExercise>().ToTable("workout_template_exercises");
            modelBuilder.Entity<NutritionPlan>().ToTable("nutrition_plans");
            modelBuilder.Entity<Meal>().ToTable("meals");
            modelBuilder.Entity<MealIngredient>().ToTable("meal_ingredients");
            modelBuilder.Entity<Ingredient>().ToTable("ingredients");
            modelBuilder.Entity<AiChatLog>().ToTable("ai_chat_logs");
            modelBuilder.Entity<AiProgramGeneration>().ToTable("ai_program_generations");
            modelBuilder.Entity<AiWorkflowJob>().ToTable("ai_workflow_jobs");
            modelBuilder.Entity<UserFeatureSnapshot>().ToTable("user_feature_snapshots");  // NEW
            modelBuilder.Entity<AiModelVersion>().ToTable("ai_model_versions");  // NEW
            modelBuilder.Entity<AiInferenceLog>().ToTable("ai_inference_logs");  // NEW
            modelBuilder.Entity<VectorEmbedding>().ToTable("vector_embeddings");  // NEW
            modelBuilder.Entity<FitnessKnowledge>().ToTable("fitness_knowledge");  // NEW
            modelBuilder.Entity<WorkoutFeedback>().ToTable("workout_feedbacks");  // AI feedback loop
            modelBuilder.Entity<UserStrengthProfile>().ToTable("user_strength_profiles");  // Strength tracking
            modelBuilder.Entity<MuscleDevelopmentScan>().ToTable("muscle_development_scans");  // Vision AI
            modelBuilder.Entity<ActivityFeed>().ToTable("activity_feeds");
            modelBuilder.Entity<ProgressMilestone>().ToTable("progress_milestones");
            modelBuilder.Entity<UserMilestone>().ToTable("user_milestones");
            modelBuilder.Entity<Achievement>().ToTable("achievements");  // NEW
            modelBuilder.Entity<UserAchievement>().ToTable("user_achievements");  // NEW
            modelBuilder.Entity<Notification>().ToTable("notifications");
            modelBuilder.Entity<ChatMessage>().ToTable("chat_messages");
            modelBuilder.Entity<CoachReview>().ToTable("coach_reviews");
            modelBuilder.Entity<AuditLog>().ToTable("audit_logs");

            // User Configuration (single table with Role column)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();

                // Role stored as string
                entity.Property(e => e.Role)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue(UserRole.Member);

                // One-to-one relationships with profiles
                entity.HasOne(e => e.MemberProfile)
                    .WithOne(p => p.User)
                    .HasForeignKey<MemberProfile>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CoachProfile)
                    .WithOne(p => p.User)
                    .HasForeignKey<CoachProfile>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // MemberProfile Configuration
            modelBuilder.Entity<MemberProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.Property(e => e.CurrentWeight).HasPrecision(5, 2);
                entity.Property(e => e.TargetWeight).HasPrecision(5, 2);
                entity.Property(e => e.Height).HasPrecision(5, 2);

                // FK to SubscriptionPlan
                entity.HasOne(e => e.SubscriptionPlan)
                    .WithMany()
                    .HasForeignKey(e => e.SubscriptionPlanId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CoachProfile Configuration
            modelBuilder.Entity<CoachProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.Property(e => e.Rating).HasPrecision(3, 2);
                entity.Property(e => e.HourlyRate).HasPrecision(10, 2);
            });

            // SubscriptionPlan Configuration
            modelBuilder.Entity<SubscriptionPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);
                entity.Property(e => e.Price).HasPrecision(10, 2);
            });

            // UserSubscription Configuration
            modelBuilder.Entity<UserSubscription>(entity =>
            {
                entity.HasKey(e => e.SubscriptionId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserSubscriptions)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Plan)
                    .WithMany(p => p.UserSubscriptions)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Payment)
                    .WithMany()
                    .HasForeignKey(e => e.PaymentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // TokenPackage Configuration
            modelBuilder.Entity<TokenPackage>(entity =>
            {
                entity.HasKey(e => e.PackageId);
                entity.Property(e => e.Price).HasPrecision(10, 2);
            });

            // TokenTransaction Configuration
            modelBuilder.Entity<TokenTransaction>(entity =>
            {
                entity.HasKey(e => e.TransactionId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.TokenTransactions)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Payment Configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.Amount).HasPrecision(10, 2);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Payments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Package)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(e => e.PackageId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EquipmentCategory Configuration
            modelBuilder.Entity<EquipmentCategory>(entity =>
            {
                entity.HasKey(e => e.CategoryId);
            });

            // Equipment Configuration
            modelBuilder.Entity<Equipment>(entity =>
            {
                entity.HasKey(e => e.EquipmentId);

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Equipment)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Booking Configuration
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(e => e.BookingId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Bookings)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Equipment)
                    .WithMany(eq => eq.Bookings)
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Coach relationship now uses CoachProfile
                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.Bookings)
                    .HasForeignKey(e => e.CoachId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Parent-child booking relationship (for coach session -> auto-booked equipment)
                entity.HasOne(e => e.ParentCoachBooking)
                    .WithMany(b => b.ChildEquipmentBookings)
                    .HasForeignKey(e => e.ParentCoachBookingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // InBodyMeasurement Configuration
            modelBuilder.Entity<InBodyMeasurement>(entity =>
            {
                entity.HasKey(e => e.MeasurementId);
                entity.Property(e => e.Weight).HasPrecision(5, 2);
                entity.Property(e => e.Height).HasPrecision(5, 2);
                entity.Property(e => e.BodyFatPercentage).HasPrecision(5, 2);
                entity.Property(e => e.MuscleMass).HasPrecision(5, 2);
                entity.Property(e => e.BodyWaterPercentage).HasPrecision(5, 2);
                entity.Property(e => e.Protein).HasPrecision(5, 2);
                entity.Property(e => e.Minerals).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalRightArmLean).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalRightArmFat).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalLeftArmLean).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalLeftArmFat).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalTrunkLean).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalTrunkFat).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalRightLegLean).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalRightLegFat).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalLeftLegLean).HasPrecision(5, 2);
                entity.Property(e => e.SegmentalLeftLegFat).HasPrecision(5, 2);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.InBodyMeasurements)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.MeasuredByUser)
                    .WithMany()
                    .HasForeignKey(e => e.MeasuredBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Exercise Configuration
            modelBuilder.Entity<Exercise>(entity =>
            {
                entity.HasKey(e => e.ExerciseId);
                entity.HasIndex(e => e.Name);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.ExercisesCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Exercise to Equipment relationship
                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutPlan Configuration
            modelBuilder.Entity<WorkoutPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutPlans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.WorkoutPlansCreated)
                    .HasForeignKey(e => e.GeneratedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ApprovedByCoach)
                    .WithMany(c => c.WorkoutPlansApproved)
                    .HasForeignKey(e => e.ApprovedBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutPlanExercise Configuration
            modelBuilder.Entity<WorkoutPlanExercise>(entity =>
            {
                entity.HasKey(e => e.WorkoutPlanExerciseId);

                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.WorkoutPlanExercises)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany(ex => ex.WorkoutPlanExercises)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // WorkoutLog Configuration
            modelBuilder.Entity<WorkoutLog>(entity =>
            {
                entity.HasKey(e => e.LogId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Plan)
                    .WithMany(wp => wp.WorkoutLogs)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutTemplate Configuration
            modelBuilder.Entity<WorkoutTemplate>(entity =>
            {
                entity.HasKey(e => e.TemplateId);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.WorkoutTemplatesCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // WorkoutTemplateExercise Configuration
            modelBuilder.Entity<WorkoutTemplateExercise>(entity =>
            {
                entity.HasKey(e => e.TemplateExerciseId);

                entity.HasOne(e => e.Template)
                    .WithMany(t => t.TemplateExercises)
                    .HasForeignKey(e => e.TemplateId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany(ex => ex.WorkoutTemplateExercises)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // NutritionPlan Configuration
            modelBuilder.Entity<NutritionPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.NutritionPlans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.GeneratedByCoach)
                    .WithMany(c => c.NutritionPlansCreated)
                    .HasForeignKey(e => e.GeneratedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ApprovedByCoach)
                    .WithMany(c => c.NutritionPlansApproved)
                    .HasForeignKey(e => e.ApprovedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Meal Configuration
            modelBuilder.Entity<Meal>(entity =>
            {
                entity.HasKey(e => e.MealId);

                entity.HasOne(e => e.NutritionPlan)
                    .WithMany(np => np.Meals)
                    .HasForeignKey(e => e.NutritionPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.MealsCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // MealIngredient Configuration
            modelBuilder.Entity<MealIngredient>(entity =>
            {
                entity.HasKey(e => e.MealIngredientId);
                entity.Property(e => e.Quantity).HasPrecision(10, 2);

                entity.HasOne(e => e.Meal)
                    .WithMany(m => m.Ingredients)
                    .HasForeignKey(e => e.MealId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Ingredient)
                    .WithMany(i => i.MealIngredients)
                    .HasForeignKey(e => e.IngredientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Ingredient Configuration
            modelBuilder.Entity<Ingredient>(entity =>
            {
                entity.HasKey(e => e.IngredientId);
                entity.Property(e => e.ProteinPer100g).HasPrecision(6, 2);
                entity.Property(e => e.CarbsPer100g).HasPrecision(6, 2);
                entity.Property(e => e.FatsPer100g).HasPrecision(6, 2);
                entity.HasIndex(e => e.Name);
            });

            // AiChatLog Configuration
            modelBuilder.Entity<AiChatLog>(entity =>
            {
                entity.HasKey(e => e.ChatId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiChatLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // AiProgramGeneration Configuration
            modelBuilder.Entity<AiProgramGeneration>(entity =>
            {
                entity.HasKey(e => e.GenerationId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiProgramGenerations)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.AiGenerations)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.NutritionPlan)
                    .WithMany(np => np.AiGenerations)
                    .HasForeignKey(e => e.NutritionPlanId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // AiWorkflowJob Configuration
            modelBuilder.Entity<AiWorkflowJob>(entity =>
            {
                entity.HasKey(e => e.JobId);
                entity.HasIndex(e => new { e.UserId, e.Status });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiWorkflowJobs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ActivityFeed Configuration
            modelBuilder.Entity<ActivityFeed>(entity =>
            {
                entity.HasKey(e => e.ActivityId);
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.ActivityFeeds)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ProgressMilestone Configuration
            modelBuilder.Entity<ProgressMilestone>(entity =>
            {
                entity.HasKey(e => e.MilestoneId);
            });

            // UserMilestone Configuration
            modelBuilder.Entity<UserMilestone>(entity =>
            {
                entity.HasKey(e => e.UserMilestoneId);
                entity.HasIndex(e => new { e.UserId, e.MilestoneId });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserMilestones)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Milestone)
                    .WithMany(m => m.UserMilestones)
                    .HasForeignKey(e => e.MilestoneId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Notification Configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationId);
                entity.HasIndex(e => new { e.UserId, e.IsRead });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ChatMessage Configuration
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.ChatMessageId);

                entity.HasIndex(e => e.ConversationId);
                entity.HasIndex(e => new { e.SenderId, e.ReceiverId });
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.ExpiresAt);

                entity.Property(e => e.Message).IsRequired();
                entity.Property(e => e.ConversationId).IsRequired().HasMaxLength(50);

                entity.HasOne(e => e.Sender)
                    .WithMany()
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Receiver)
                    .WithMany()
                    .HasForeignKey(e => e.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CoachReview Configuration
            modelBuilder.Entity<CoachReview>(entity =>
            {
                entity.HasKey(e => e.ReviewId);
                entity.Property(e => e.Rating).HasPrecision(3, 2);

                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.Reviews)
                    .HasForeignKey(e => e.CoachId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.CoachReviews)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // AuditLog Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.LogId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.Action);
                entity.HasIndex(e => e.UserId);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // EquipmentTimeSlot Configuration
            modelBuilder.Entity<EquipmentTimeSlot>(entity =>
            {
                entity.HasKey(e => e.SlotId);
                entity.HasIndex(e => new { e.EquipmentId, e.SlotDate, e.StartTime }).IsUnique();
                entity.HasIndex(e => new { e.SlotDate, e.IsBooked });

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.BookedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.BookedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Booking)
                    .WithMany(b => b.EquipmentTimeSlots)
                    .HasForeignKey(e => e.BookingId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // CoachSessionEquipment Configuration
            modelBuilder.Entity<CoachSessionEquipment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CoachBookingId);

                entity.HasOne(e => e.CoachBooking)
                    .WithMany()
                    .HasForeignKey(e => e.CoachBookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.EquipmentBooking)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentBookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.WorkoutPlanExercise)
                    .WithMany()
                    .HasForeignKey(e => e.WorkoutPlanExerciseId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Performance Indexes
            modelBuilder.Entity<User>().HasIndex(e => e.IsActive);
            modelBuilder.Entity<User>().HasIndex(e => e.Role);
            modelBuilder.Entity<User>().HasIndex(e => e.CreatedAt);
            modelBuilder.Entity<User>().HasIndex(e => e.LastLoginAt);

            modelBuilder.Entity<WorkoutPlan>().HasIndex(e => new { e.UserId, e.IsActive });
            modelBuilder.Entity<WorkoutPlan>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<NutritionPlan>().HasIndex(e => new { e.UserId, e.IsActive });
            modelBuilder.Entity<NutritionPlan>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<Booking>().HasIndex(e => new { e.UserId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => new { e.CoachId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => new { e.EquipmentId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => e.Status);

            modelBuilder.Entity<TokenTransaction>().HasIndex(e => new { e.UserId, e.CreatedAt });
            modelBuilder.Entity<TokenTransaction>().HasIndex(e => e.TransactionType);

            modelBuilder.Entity<ChatMessage>().HasIndex(e => new { e.ConversationId, e.CreatedAt });

            modelBuilder.Entity<WorkoutLog>().HasIndex(e => new { e.UserId, e.WorkoutDate });
            modelBuilder.Entity<WorkoutLog>().HasIndex(e => e.WorkoutDate);

            modelBuilder.Entity<AiChatLog>().HasIndex(e => new { e.UserId, e.SessionId });
            modelBuilder.Entity<AiChatLog>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<CoachReview>().HasIndex(e => new { e.CoachId, e.CreatedAt });
            modelBuilder.Entity<CoachReview>().HasIndex(e => e.Rating);

            modelBuilder.Entity<UserSubscription>().HasIndex(e => new { e.UserId, e.Status });
            modelBuilder.Entity<UserSubscription>().HasIndex(e => e.EndDate);

            modelBuilder.Entity<Payment>().HasIndex(e => new { e.UserId, e.CreatedAt });
            modelBuilder.Entity<Payment>().HasIndex(e => e.Status);

            modelBuilder.Entity<Exercise>().HasIndex(e => e.MuscleGroup);
            modelBuilder.Entity<Exercise>().HasIndex(e => e.DifficultyLevel);

            // ========== NEW ENTITY CONFIGURATIONS ==========

            // WorkoutLogExercise Configuration (normalized exercise tracking)
            modelBuilder.Entity<WorkoutLogExercise>(entity =>
            {
                entity.HasKey(e => e.WorkoutLogExerciseId);
                entity.Property(e => e.TotalVolume).HasPrecision(12, 2);

                entity.HasOne(e => e.WorkoutLog)
                    .WithMany(wl => wl.WorkoutLogExercises)
                    .HasForeignKey(e => e.LogId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany()
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.PlannedExercise)
                    .WithMany()
                    .HasForeignKey(e => e.PlannedExerciseId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Performance indexes
                entity.HasIndex(e => new { e.LogId, e.OrderPerformed });
                entity.HasIndex(e => e.ExerciseId);
                entity.HasIndex(e => e.IsPersonalRecord);
            });

            // Achievement Configuration
            modelBuilder.Entity<Achievement>(entity =>
            {
                entity.HasKey(e => e.AchievementId);
                entity.HasIndex(e => e.Code).IsUnique();
                entity.HasIndex(e => e.Category);
                entity.Property(e => e.Code).HasMaxLength(50);
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.Rarity).HasMaxLength(20);
            });

            // UserAchievement Configuration
            modelBuilder.Entity<UserAchievement>(entity =>
            {
                entity.HasKey(e => e.UserAchievementId);
                entity.HasIndex(e => new { e.UserId, e.AchievementId }).IsUnique();
                entity.HasIndex(e => new { e.UserId, e.IsEarned });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserAchievements)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Achievement)
                    .WithMany(a => a.UserAchievements)
                    .HasForeignKey(e => e.AchievementId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // UserFeatureSnapshot Configuration (ML feature store)
            modelBuilder.Entity<UserFeatureSnapshot>(entity =>
            {
                entity.HasKey(e => e.SnapshotId);
                entity.HasIndex(e => new { e.UserId, e.IsLatest });
                entity.HasIndex(e => new { e.UserId, e.ComputedAt });
                entity.HasIndex(e => e.FeatureVersion);

                entity.Property(e => e.HeightCm).HasPrecision(5, 2);
                entity.Property(e => e.WeightKg).HasPrecision(5, 2);
                entity.Property(e => e.Bmi).HasPrecision(4, 2);
                entity.Property(e => e.BodyFatPercentage).HasPrecision(5, 2);
                entity.Property(e => e.MuscleMassKg).HasPrecision(5, 2);
                entity.Property(e => e.ExperienceYears).HasPrecision(4, 1);
                entity.Property(e => e.AvgWorkoutDuration).HasPrecision(6, 2);
                entity.Property(e => e.WorkoutConsistencyScore).HasPrecision(5, 2);
                entity.Property(e => e.BenchPressMax).HasPrecision(6, 2);
                entity.Property(e => e.SquatMax).HasPrecision(6, 2);
                entity.Property(e => e.DeadliftMax).HasPrecision(6, 2);
                entity.Property(e => e.OverheadPressMax).HasPrecision(6, 2);
                entity.Property(e => e.TotalVolumeLastWeek).HasPrecision(12, 2);
                entity.Property(e => e.VolumeProgressionRate).HasPrecision(6, 3);
                entity.Property(e => e.AiAcceptanceRate).HasPrecision(5, 2);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // AiModelVersion Configuration
            modelBuilder.Entity<AiModelVersion>(entity =>
            {
                entity.HasKey(e => e.ModelVersionId);
                entity.HasIndex(e => new { e.ModelName, e.Version }).IsUnique();
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsDefault);

                entity.Property(e => e.ModelName).HasMaxLength(100);
                entity.Property(e => e.Version).HasMaxLength(50);
                entity.Property(e => e.Accuracy).HasPrecision(5, 4);
                entity.Property(e => e.Precision).HasPrecision(5, 4);
                entity.Property(e => e.Recall).HasPrecision(5, 4);
                entity.Property(e => e.F1Score).HasPrecision(5, 4);
                entity.Property(e => e.AverageLatencyMs).HasPrecision(8, 2);
            });

            // AiInferenceLog Configuration (high-volume logging)
            modelBuilder.Entity<AiInferenceLog>(entity =>
            {
                entity.HasKey(e => e.InferenceId);
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });
                entity.HasIndex(e => new { e.ModelVersionId, e.CreatedAt });
                entity.HasIndex(e => e.InferenceType);
                entity.HasIndex(e => e.IsSuccess);
                entity.HasIndex(e => e.CreatedAt); // For time-based partitioning

                entity.Property(e => e.InferenceType).HasMaxLength(100);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ModelVersion)
                    .WithMany()
                    .HasForeignKey(e => e.ModelVersionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.FeatureSnapshot)
                    .WithMany()
                    .HasForeignKey(e => e.FeatureSnapshotId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // VectorEmbedding Configuration
            modelBuilder.Entity<VectorEmbedding>(entity =>
            {
                entity.HasKey(e => e.EmbeddingId);
                entity.HasIndex(e => new { e.ContentType, e.ContentId }).IsUnique();
                entity.HasIndex(e => e.EmbeddingModel);

                entity.Property(e => e.ContentType).HasMaxLength(50);
                entity.Property(e => e.EmbeddingModel).HasMaxLength(100);
                // Note: For actual vector operations, install pgvector extension and add:
                // ALTER TABLE vector_embeddings ADD COLUMN embedding_vector vector(1536);
                // CREATE INDEX ON vector_embeddings USING ivfflat (embedding_vector vector_cosine_ops);
            });

            // FitnessKnowledge Configuration (RAG knowledge base)
            modelBuilder.Entity<FitnessKnowledge>(entity =>
            {
                entity.HasKey(e => e.KnowledgeId);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.Priority);

                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.Subcategory).HasMaxLength(50);
                entity.Property(e => e.Source).HasMaxLength(50);
                entity.Property(e => e.Title).HasMaxLength(255);
                entity.Property(e => e.Priority).HasPrecision(3, 2);

                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ApprovedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.ApprovedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ========== WORKOUT AI FEEDBACK LOOP CONFIGURATIONS ==========

            // WorkoutFeedback Configuration (AI learning feedback)
            modelBuilder.Entity<WorkoutFeedback>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });
                entity.HasIndex(e => e.WorkoutLogId);
                entity.HasIndex(e => e.WorkoutPlanId);
                entity.HasIndex(e => e.FeedbackType);

                // ExerciseFeedback stored as JSONB
                entity.Property(e => e.ExerciseFeedback)
                    .HasColumnType("jsonb");

                entity.Property(e => e.DifficultyLevel).HasMaxLength(20);
                entity.Property(e => e.FeedbackType).HasMaxLength(20);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutFeedbacks)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.WorkoutLog)
                    .WithMany()
                    .HasForeignKey(e => e.WorkoutLogId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.WorkoutFeedbacks)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // UserStrengthProfile Configuration (per-exercise strength tracking)
            modelBuilder.Entity<UserStrengthProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.ExerciseId }).IsUnique();
                entity.HasIndex(e => new { e.UserId, e.UpdatedAt });
                entity.HasIndex(e => e.ConfidenceScore);

                entity.Property(e => e.Estimated1RM).HasPrecision(6, 2);
                entity.Property(e => e.ConfidenceScore).HasPrecision(4, 3);
                entity.Property(e => e.AvgWorkingWeight).HasPrecision(6, 2);
                entity.Property(e => e.MaxWeightLifted).HasPrecision(6, 2);
                entity.Property(e => e.StrengthTrend).HasMaxLength(20);
                entity.Property(e => e.LastUpdatedFrom).HasMaxLength(50);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.StrengthProfiles)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany(e => e.UserStrengthProfiles)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // MuscleDevelopmentScan Configuration (Vision AI analysis)
            modelBuilder.Entity<MuscleDevelopmentScan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.ScanDate });
                entity.HasIndex(e => e.ImageType);

                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.ImageType).HasMaxLength(20);
                entity.Property(e => e.ModelVersion).HasMaxLength(100);
                entity.Property(e => e.BodyFatEstimate).HasPrecision(5, 2);
                entity.Property(e => e.MuscleDefinitionScore).HasPrecision(4, 3);
                entity.Property(e => e.ConfidenceScore).HasPrecision(4, 3);

                // MuscleScores stored as JSONB
                entity.Property(e => e.MuscleScores)
                    .HasColumnType("jsonb");

                // Array columns for muscle groups
                entity.Property(e => e.UnderdevelopedMuscles)
                    .HasColumnType("text[]");
                entity.Property(e => e.WellDevelopedMuscles)
                    .HasColumnType("text[]");

                entity.HasOne(e => e.User)
                    .WithMany(u => u.MuscleScans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserAIWorkoutPlan Configuration
            modelBuilder.Entity<UserAIWorkoutPlan>(entity =>
            {
                entity.ToTable("user_ai_workout_plans");
                entity.HasKey(e => e.PlanId);
                entity.HasIndex(e => new { e.UserId, e.IsActive });
                entity.HasIndex(e => e.CreatedAt);

                entity.Property(e => e.PlanName).HasMaxLength(255);
                entity.Property(e => e.FitnessLevel).HasMaxLength(50);
                entity.Property(e => e.Goal).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20);
                entity.Property(e => e.ModelVersion).HasMaxLength(50);

                entity.HasOne(e => e.User)
                    .WithMany() // Assuming User doesn't need a collection back for now, or update User.cs later
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserAIWorkoutPlanDay Configuration
            modelBuilder.Entity<UserAIWorkoutPlanDay>(entity =>
            {
                entity.ToTable("user_ai_workout_plan_days");
                entity.HasKey(e => e.DayId);
                entity.HasIndex(e => e.PlanId);

                entity.Property(e => e.DayName).HasMaxLength(100);

                entity.HasOne(e => e.Plan)
                    .WithMany(p => p.Days)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserAIWorkoutPlanExercise Configuration
            modelBuilder.Entity<UserAIWorkoutPlanExercise>(entity =>
            {
                entity.ToTable("user_ai_workout_plan_exercises");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.PlanDayId);
                entity.HasIndex(e => e.ExerciseId);

                entity.Property(e => e.ExerciseName).HasMaxLength(255);
                entity.Property(e => e.WeightRecommendation).HasMaxLength(255);
                entity.Property(e => e.WeightKg).HasPrecision(6, 2);
                entity.Property(e => e.Sets).HasMaxLength(50);
                entity.Property(e => e.Reps).HasMaxLength(50);
                entity.Property(e => e.Rest).HasMaxLength(50);
                entity.Property(e => e.Tempo).HasMaxLength(50);
                entity.Property(e => e.ExerciseType).HasMaxLength(50);
                entity.Property(e => e.MovementPattern).HasMaxLength(50);

                entity.HasOne(e => e.Day)
                    .WithMany(d => d.Exercises)
                    .HasForeignKey(e => e.PlanDayId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany()
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Global Query Filters for soft delete (when implemented)
            // Uncomment when ready to implement soft delete globally:
            // modelBuilder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        }
    }
}
