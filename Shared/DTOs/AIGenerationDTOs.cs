using Shared.DTOs.Meal;

namespace Shared.DTOs;

/// <summary>
/// Request for AI-generated workout plan
/// </summary>
public class GenerateWorkoutPlanRequest
{
    public int UserId { get; set; }
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;  // e.g., "5'10\""
    public string Weight { get; set; } = string.Empty;   // e.g., "170 lbs"
    public string FitnessGoal { get; set; } = string.Empty;  // e.g., "Muscle Gain", "Weight Loss"
    public string FitnessLevel { get; set; } = string.Empty; // e.g., "Beginner", "Intermediate"
    public int WorkoutDaysPerWeek { get; set; }
    public string? Injuries { get; set; }  // e.g., "Lower back pain"
    public string? EquipmentAccess { get; set; }  // e.g., "Full gym", "Home gym"
}

/// <summary>
/// Request for AI-generated nutrition plan
/// </summary>
public class GenerateNutritionPlanRequest
{
    public int UserId { get; set; }
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Weight { get; set; } = string.Empty;
    public string FitnessGoal { get; set; } = string.Empty;
    public string? DietaryRestrictions { get; set; }  // e.g., "Lactose intolerant", "Vegetarian"
    public string? FoodAllergies { get; set; }
}

/// <summary>
/// Result of AI workout plan generation
/// </summary>
public class WorkoutPlanGenerationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? PlanInstanceID { get; set; }
    public string? PlanName { get; set; }
    public List<string>? Schedule { get; set; }
    public List<ExerciseDayDto>? Exercises { get; set; }
    public int TokensSpent { get; set; } = 50;  // Default cost for AI generation
}

/// <summary>
/// Result of AI nutrition plan generation
/// </summary>
public class NutritionPlanGenerationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? PlanID { get; set; }
    public string? PlanName { get; set; }
    public int DailyCalories { get; set; }
    public List<MealDto>? Meals { get; set; }
    public int TokensSpent { get; set; } = 50;  // Default cost for AI generation
}

/// <summary>
/// Exercise day in AI-generated workout plan
/// </summary>
public class ExerciseDayDto
{
    public string Day { get; set; } = string.Empty;
    public List<RoutineDto> Routines { get; set; } = new();
}

/// <summary>
/// Individual exercise routine
/// </summary>
public class RoutineDto
{
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public string? Duration { get; set; }
    public string? Description { get; set; }
}
