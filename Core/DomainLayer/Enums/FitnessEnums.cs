namespace IntelliFit.Domain.Enums
{
    /// <summary>
    /// Fitness level classification for workout and nutrition planning.
    /// Used by ML models for classification and plan generation.
    /// </summary>
    public enum FitnessLevel
    {
        /// <summary>
        /// New to fitness, 0-6 months training experience
        /// </summary>
        Beginner = 0,

        /// <summary>
        /// Some experience, 6 months - 2 years training
        /// </summary>
        Intermediate = 1,

        /// <summary>
        /// Experienced, 2+ years consistent training
        /// </summary>
        Advanced = 2,

        /// <summary>
        /// Elite/competitive level athletes
        /// </summary>
        Elite = 3
    }

    /// <summary>
    /// Difficulty level for exercises and workout plans.
    /// </summary>
    public enum ExerciseDifficulty
    {
        Beginner = 0,
        Intermediate = 1,
        Advanced = 2
    }

    /// <summary>
    /// Primary muscle groups for exercise categorization.
    /// </summary>
    public enum MuscleGroup
    {
        Chest = 0,
        Back = 1,
        Shoulders = 2,
        Biceps = 3,
        Triceps = 4,
        Forearms = 5,
        Quadriceps = 6,
        Hamstrings = 7,
        Glutes = 8,
        Calves = 9,
        Core = 10,
        FullBody = 11,
        Cardio = 12
    }

    /// <summary>
    /// Workout plan status for approval workflow.
    /// </summary>
    public enum PlanStatus
    {
        Draft = 0,
        PendingReview = 1,
        Approved = 2,
        Rejected = 3,
        Active = 4,
        Completed = 5,
        Archived = 6
    }

    /// <summary>
    /// Source of plan generation.
    /// </summary>
    public enum PlanSource
    {
        Manual = 0,
        AiGenerated = 1,
        CoachCreated = 2,
        Template = 3
    }
}
