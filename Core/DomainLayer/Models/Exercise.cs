using System;

namespace IntelliFit.Domain.Models
{
    public class Exercise
    {
        public int ExerciseId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string Category { get; set; } = null!;
        public string MuscleGroup { get; set; } = null!;
        public string? DifficultyLevel { get; set; }
        public string? EquipmentRequired { get; set; }  // Legacy text field for compatibility
        public int? EquipmentId { get; set; }  // Foreign key to specific equipment
        public string? VideoUrl { get; set; }
        public string? Instructions { get; set; }
        public int? CaloriesPerMinute { get; set; }
        public bool IsActive { get; set; } = true;
        public int? CreatedByCoachId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual CoachProfile? CreatedByCoach { get; set; }
        public virtual Equipment? Equipment { get; set; }  // Navigation to specific equipment
        public virtual ICollection<WorkoutPlanExercise> WorkoutPlanExercises { get; set; } = new List<WorkoutPlanExercise>();
        public virtual ICollection<WorkoutTemplateExercise> WorkoutTemplateExercises { get; set; } = new List<WorkoutTemplateExercise>();

        /// <summary>
        /// NEW: User strength profiles for this exercise (AI-learned from feedback)
        /// </summary>
        public virtual ICollection<UserStrengthProfile> UserStrengthProfiles { get; set; } = new List<UserStrengthProfile>();
    }
}
