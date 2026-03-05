using System.Text.Json;
using System.Text.Json.Serialization;

namespace Shared.DTOs
{
    // Request DTO for the Python API
    public class WorkoutApiRequest
    {
        [JsonPropertyName("prompt")]
        public string Prompt { get; set; } = string.Empty;

        [JsonPropertyName("max_length")]
        public int MaxLength { get; set; } = 1024;
    }

    // Response DTO from the Python API
    public class WorkoutApiResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("plan")]
        public WorkoutGeneratorPlan? Plan { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("raw")]
        public string? Raw { get; set; }
    }

    // Workout Plan structure from AI Generator
    public class WorkoutGeneratorPlan
    {
        [JsonPropertyName("plan_name")]
        public string PlanName { get; set; } = string.Empty;

        [JsonPropertyName("fitness_level")]
        public string FitnessLevel { get; set; } = string.Empty;

        [JsonPropertyName("goal")]
        public string Goal { get; set; } = string.Empty;

        [JsonPropertyName("days_per_week")]
        public int DaysPerWeek { get; set; }

        [JsonPropertyName("program_duration_weeks")]
        public int ProgramDurationWeeks { get; set; }

        [JsonPropertyName("days")]
        public List<WorkoutGeneratorDay> Days { get; set; } = new();
    }

    public class WorkoutGeneratorDay
    {
        [JsonPropertyName("day_number")]
        public int DayNumber { get; set; }

        [JsonPropertyName("day_name")]
        public string DayName { get; set; } = string.Empty;

        [JsonPropertyName("focus_areas")]
        public List<string> FocusAreas { get; set; } = new();

        [JsonPropertyName("estimated_duration_minutes")]
        public int EstimatedDurationMinutes { get; set; }

        [JsonPropertyName("exercises")]
        public List<WorkoutGeneratorExercise> Exercises { get; set; } = new();
    }

    public class WorkoutGeneratorExercise
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("sets")]
        public string Sets { get; set; } = string.Empty;

        [JsonPropertyName("reps")]
        public string Reps { get; set; } = string.Empty;

        [JsonPropertyName("rest")]
        public string Rest { get; set; } = string.Empty;

        [JsonPropertyName("target_muscles")]
        public List<string> TargetMuscles { get; set; } = new();

        [JsonPropertyName("equipment")]
        public string Equipment { get; set; } = string.Empty;

        [JsonPropertyName("movement_pattern")]
        public string MovementPattern { get; set; } = string.Empty;

        [JsonPropertyName("exercise_type")]
        public string ExerciseType { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    // Request DTO from your frontend/client
    public class GenerateWorkoutRequest
    {
        public int Days { get; set; }
        public string Level { get; set; } = string.Empty;
        public string Goal { get; set; } = string.Empty;
        public List<string>? Equipment { get; set; }
        public int? MemberId { get; set; } // For saving to member's plan
        public string? CoachFeedback { get; set; } // If regenerating based on coach feedback
    }

    // Coach review DTOs
    public class WorkoutPlanReviewRequest
    {
        public int PlanId { get; set; }
        public bool Approved { get; set; }
        public string? CoachComments { get; set; }
        public List<ExerciseModification>? Modifications { get; set; }
    }

    public class ExerciseModification
    {
        public int DayNumber { get; set; }
        public int ExerciseIndex { get; set; }
        public string? NewSets { get; set; }
        public string? NewReps { get; set; }
        public string? NewRest { get; set; }
        public string? NewNotes { get; set; }
    }

    public class AIFeedbackRequest
    {
        public string OriginalPrompt { get; set; } = string.Empty;
        public string CoachFeedback { get; set; } = string.Empty;
        public WorkoutGeneratorPlan RejectedPlan { get; set; } = new();
    }
}
