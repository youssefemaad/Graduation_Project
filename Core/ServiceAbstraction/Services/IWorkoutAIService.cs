using Shared.DTOs.WorkoutAI;

namespace ServiceAbstraction.Services;

/// <summary>
/// Service for AI-powered workout plan generation using Flan-T5 ML model
/// </summary>
public interface IWorkoutAIService
{
    /// <summary>
    /// Generate a personalized AI workout plan
    /// </summary>
    /// <param name="request">Generation parameters</param>
    /// <returns>Generated workout plan result</returns>
    Task<AIWorkoutPlanResult> GenerateWorkoutPlanAsync(GenerateAIWorkoutPlanRequest request);

    /// <summary>
    /// Get user's strength profile for all exercises
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Strength profile with all exercise data</returns>
    Task<UserStrengthProfileDto?> GetUserStrengthProfileAsync(int userId);

    /// <summary>
    /// Get user's latest muscle development scan
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Latest muscle scan result</returns>
    Task<MuscleScanResultDto?> GetLatestMuscleScanAsync(int userId);

    /// <summary>
    /// Check if ML service is healthy
    /// </summary>
    /// <returns>True if service is running and model is loaded</returns>
    Task<bool> IsMLServiceHealthyAsync();

    /// <summary>
    /// Save AI-generated workout plan (called after frontend generates via direct ML API)
    /// Used in optimized flow: Frontend → ML API → Frontend → Backend (save)
    /// </summary>
    /// <param name="request">Generated plan data to save</param>
    /// <returns>Save result with plan ID</returns>
    Task<SavePlanResponse> SaveAIGeneratedPlanAsync(SaveAIGeneratedPlanRequest request);

    /// <summary>
    /// Get all AI-generated workout plans for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>List of user's AI workout plans</returns>
    Task<List<UserAIWorkoutPlanDto>> GetUserAIPlansAsync(int userId);

    /// <summary>
    /// Delete an AI-generated workout plan
    /// </summary>
    /// <param name="planId">Plan ID</param>
    /// <param name="userId">User ID (for ownership check)</param>
    /// <returns>True if deleted successfully</returns>
    Task<bool> DeleteUserAIPlanAsync(int planId, int userId);
}

/// <summary>
/// Service for processing workout feedback and updating strength profiles
/// </summary>
public interface IWorkoutFeedbackService
{
    /// <summary>
    /// Submit feedback after completing a workout
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Feedback data</param>
    /// <returns>Feedback result with strength profile updates</returns>
    Task<WorkoutFeedbackResult> SubmitFeedbackAsync(int userId, SubmitWorkoutFeedbackRequest request);

    /// <summary>
    /// Get user's feedback history
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="limit">Maximum number of records to return</param>
    /// <returns>List of feedback records</returns>
    Task<IEnumerable<WorkoutFeedbackDto>> GetUserFeedbackHistoryAsync(int userId, int limit = 20);

    /// <summary>
    /// Update strength profile based on feedback
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="exerciseFeedback">Exercise feedback data</param>
    /// <returns>Updated strength profile entry</returns>
    Task<StrengthProfileUpdate?> UpdateStrengthProfileAsync(int userId, ExerciseFeedbackDto exerciseFeedback);
}

/// <summary>
/// HTTP client for communicating with Python ML service
/// </summary>
public interface IMLServiceClient
{
    /// <summary>
    /// Generate workout plan via ML service
    /// </summary>
    /// <param name="request">ML service request</param>
    /// <returns>ML service response</returns>
    Task<MLWorkoutResponse?> GenerateWorkoutPlanAsync(MLWorkoutRequest request);

    /// <summary>
    /// Check ML service health
    /// </summary>
    /// <returns>Health response or null if unavailable</returns>
    Task<MLHealthResponse?> CheckHealthAsync();
}

/// <summary>
/// DTO for workout feedback history
/// </summary>
public class WorkoutFeedbackDto
{
    public int Id { get; set; }
    public int WorkoutLogId { get; set; }
    public int? WorkoutPlanId { get; set; }
    public int? Rating { get; set; }
    public string? DifficultyLevel { get; set; }
    public List<ExerciseFeedbackDto> ExerciseFeedbacks { get; set; } = new();
    public string? Comments { get; set; }
    public string FeedbackType { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
