using Shared.DTOs;

namespace IntelliFit.ServiceAbstraction;

/// <summary>
/// Service for AI-powered workout and nutrition plan generation using Google Gemini
/// </summary>
public interface IAIService
{
    /// <summary>
    /// Generate a personalized workout plan using AI based on user preferences
    /// </summary>
    Task<WorkoutPlanGenerationResult> GenerateWorkoutPlanAsync(GenerateWorkoutPlanRequest request);

    /// <summary>
    /// Generate a personalized nutrition plan using AI based on user preferences
    /// </summary>
    Task<NutritionPlanGenerationResult> GenerateNutritionPlanAsync(GenerateNutritionPlanRequest request);

    /// <summary>
    /// Chat with AI coach for fitness advice
    /// </summary>
    Task<string> ChatWithAIAsync(string userMessage, int userId);
}
