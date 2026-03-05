using System.Text.Json;
using AutoMapper;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// Service for processing workout feedback and updating strength profiles
/// Implements the AI learning feedback loop
/// </summary>
public class WorkoutFeedbackService : IWorkoutFeedbackService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<WorkoutFeedbackService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    // Constants for 1RM estimation and adjustments
    private const decimal BRZYCKI_CONSTANT = 1.0278m;
    private const decimal TOO_LIGHT_INCREASE = 0.05m; // 5% increase
    private const decimal TOO_HEAVY_DECREASE = 0.05m; // 5% decrease
    private const decimal PERFECT_CONFIDENCE_BOOST = 0.05m;
    private const decimal IMPERFECT_CONFIDENCE_PENALTY = 0.03m;

    public WorkoutFeedbackService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<WorkoutFeedbackService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    /// <summary>
    /// Submit feedback after completing a workout
    /// </summary>
    public async Task<WorkoutFeedbackResult> SubmitFeedbackAsync(int userId, SubmitWorkoutFeedbackRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Processing workout feedback for user {UserId}, workout log {WorkoutLogId}",
                userId, request.WorkoutLogId);

            // 1. Validate workout log exists
            var workoutLog = await _unitOfWork.Repository<WorkoutLog>()
                .GetByIdAsync(request.WorkoutLogId);

            if (workoutLog == null)
            {
                return new WorkoutFeedbackResult
                {
                    Success = false,
                    Message = $"Workout log {request.WorkoutLogId} not found"
                };
            }

            if (workoutLog.UserId != userId)
            {
                return new WorkoutFeedbackResult
                {
                    Success = false,
                    Message = "Workout log does not belong to this user"
                };
            }

            // 2. Create feedback record
            var feedback = new WorkoutFeedback
            {
                UserId = userId,
                WorkoutLogId = request.WorkoutLogId,
                WorkoutPlanId = request.WorkoutPlanId,
                Rating = request.Rating,
                DifficultyLevel = request.DifficultyLevel,
                ExerciseFeedback = JsonSerializer.Serialize(request.ExerciseFeedbacks, _jsonOptions),
                Comments = request.Comments,
                FeedbackType = "PostWorkout",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WorkoutFeedback>().AddAsync(feedback);

            // 3. Process each exercise feedback and update strength profiles
            var strengthUpdates = new List<StrengthProfileUpdate>();

            foreach (var exerciseFeedback in request.ExerciseFeedbacks)
            {
                var update = await UpdateStrengthProfileAsync(userId, exerciseFeedback);
                if (update != null)
                {
                    strengthUpdates.Add(update);
                }
            }

            // 4. Save all changes
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Saved feedback {FeedbackId} with {UpdateCount} strength profile updates",
                feedback.Id, strengthUpdates.Count);

            return new WorkoutFeedbackResult
            {
                Success = true,
                FeedbackId = feedback.Id,
                StrengthUpdates = strengthUpdates,
                Message = $"Feedback saved with {strengthUpdates.Count} strength profile updates"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting workout feedback for user {UserId}", userId);
            return new WorkoutFeedbackResult
            {
                Success = false,
                Message = $"Failed to submit feedback: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Get user's feedback history
    /// </summary>
    public async Task<IEnumerable<WorkoutFeedbackDto>> GetUserFeedbackHistoryAsync(int userId, int limit = 20)
    {
        try
        {
            var feedbacks = await _unitOfWork.Repository<WorkoutFeedback>()
                .FindAsync(f => f.UserId == userId);

            return feedbacks
                .OrderByDescending(f => f.CreatedAt)
                .Take(limit)
                .Select(f => new WorkoutFeedbackDto
                {
                    Id = f.Id,
                    WorkoutLogId = f.WorkoutLogId,
                    WorkoutPlanId = f.WorkoutPlanId,
                    Rating = f.Rating,
                    DifficultyLevel = f.DifficultyLevel,
                    ExerciseFeedbacks = ParseExerciseFeedbacks(f.ExerciseFeedback),
                    Comments = f.Comments,
                    FeedbackType = f.FeedbackType,
                    CreatedAt = f.CreatedAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feedback history for user {UserId}", userId);
            return Enumerable.Empty<WorkoutFeedbackDto>();
        }
    }

    /// <summary>
    /// Update strength profile based on feedback
    /// Uses Brzycki formula for 1RM estimation and adjusts based on user feedback
    /// </summary>
    public async Task<StrengthProfileUpdate?> UpdateStrengthProfileAsync(int userId, ExerciseFeedbackDto exerciseFeedback)
    {
        try
        {
            if (exerciseFeedback.ExerciseId <= 0 || !exerciseFeedback.WeightUsed.HasValue)
                return null;

            // Get or create strength profile
            var profile = await _unitOfWork.Repository<UserStrengthProfile>()
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ExerciseId == exerciseFeedback.ExerciseId);

            var isNew = profile == null;

            if (isNew)
            {
                profile = new UserStrengthProfile
                {
                    UserId = userId,
                    ExerciseId = exerciseFeedback.ExerciseId,
                    ConfidenceScore = 0.50m,
                    CreatedAt = DateTime.UtcNow
                };
            }

            // Store old values for result
            var oldEstimated1RM = profile!.Estimated1RM;
            var oldConfidence = profile.ConfidenceScore;

            // Calculate new 1RM estimate using Brzycki formula
            // 1RM = weight × (36 / (37 - reps))
            var reps = exerciseFeedback.SetsCompleted > 0 ? 10 : 8; // Assume 10 reps for completed sets
            var calculated1RM = Calculate1RM(exerciseFeedback.WeightUsed.Value, reps);

            // Adjust based on weight feeling
            var adjustmentReason = "Calculated from workout";
            switch (exerciseFeedback.WeightFeeling.ToLower())
            {
                case "toolight":
                    // Weight was too light - actual 1RM is probably higher
                    calculated1RM *= (1 + TOO_LIGHT_INCREASE);
                    profile.ConfidenceScore = Math.Max(0.1m, oldConfidence - IMPERFECT_CONFIDENCE_PENALTY);
                    adjustmentReason = "Weight felt too light - increased estimate";
                    break;

                case "tooheavy":
                    // Weight was too heavy - actual 1RM is probably lower
                    calculated1RM *= (1 - TOO_HEAVY_DECREASE);
                    profile.ConfidenceScore = Math.Max(0.1m, oldConfidence - IMPERFECT_CONFIDENCE_PENALTY);
                    adjustmentReason = "Weight felt too heavy - decreased estimate";
                    break;

                case "perfect":
                    // Weight was perfect - increase confidence
                    profile.ConfidenceScore = Math.Min(1.0m, oldConfidence + PERFECT_CONFIDENCE_BOOST);
                    adjustmentReason = "Weight felt perfect - confidence increased";
                    break;
            }

            // Update profile with weighted average (give more weight to higher confidence)
            if (isNew)
            {
                profile.Estimated1RM = calculated1RM;
            }
            else
            {
                // Weighted average: new value gets weight based on confidence
                var weight = 0.3m + (profile.ConfidenceScore * 0.4m);
                profile.Estimated1RM = (profile.Estimated1RM * (1 - weight)) + (calculated1RM * weight);
            }

            // Update other tracking fields
            profile.FeedbackCount++;
            profile.LastWorkoutDate = DateTime.UtcNow;
            profile.LastUpdatedFrom = "Feedback";
            profile.UpdatedAt = DateTime.UtcNow;

            // Update max weight if applicable
            if (!profile.MaxWeightLifted.HasValue || exerciseFeedback.WeightUsed > profile.MaxWeightLifted)
            {
                profile.MaxWeightLifted = exerciseFeedback.WeightUsed;
            }

            // Update average working weight (running average)
            if (!profile.AvgWorkingWeight.HasValue)
            {
                profile.AvgWorkingWeight = exerciseFeedback.WeightUsed;
            }
            else
            {
                profile.AvgWorkingWeight = (profile.AvgWorkingWeight * 0.8m) + (exerciseFeedback.WeightUsed * 0.2m);
            }

            // Determine strength trend
            profile.StrengthTrend = DetermineStrengthTrend(oldEstimated1RM, profile.Estimated1RM);

            // Save or update
            if (isNew)
            {
                await _unitOfWork.Repository<UserStrengthProfile>().AddAsync(profile);
            }
            else
            {
                _unitOfWork.Repository<UserStrengthProfile>().Update(profile);
            }

            // Get exercise name for result
            var exercise = await _unitOfWork.Repository<Exercise>().GetByIdAsync(exerciseFeedback.ExerciseId);

            return new StrengthProfileUpdate
            {
                ExerciseId = exerciseFeedback.ExerciseId,
                ExerciseName = exercise?.Name ?? exerciseFeedback.ExerciseName ?? "Unknown",
                OldEstimated1RM = oldEstimated1RM,
                NewEstimated1RM = profile.Estimated1RM,
                ConfidenceChange = profile.ConfidenceScore - oldConfidence,
                Reason = adjustmentReason
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error updating strength profile for user {UserId}, exercise {ExerciseId}",
                userId, exerciseFeedback.ExerciseId);
            return null;
        }
    }

    #region Private Methods

    /// <summary>
    /// Calculate 1RM using Brzycki formula
    /// 1RM = weight × (36 / (37 - reps))
    /// </summary>
    private static decimal Calculate1RM(decimal weight, int reps)
    {
        if (reps >= 37) reps = 36; // Prevent division by zero
        if (reps <= 0) reps = 1;

        return weight * (36m / (37m - reps));
    }

    /// <summary>
    /// Determine strength trend based on 1RM change
    /// </summary>
    private static string DetermineStrengthTrend(decimal old1RM, decimal new1RM)
    {
        if (old1RM == 0) return "Stable";

        var changePercent = ((new1RM - old1RM) / old1RM) * 100;

        return changePercent switch
        {
            > 2 => "Increasing",
            < -2 => "Decreasing",
            _ => "Stable"
        };
    }

    /// <summary>
    /// Parse exercise feedback JSON
    /// </summary>
    private List<ExerciseFeedbackDto> ParseExerciseFeedbacks(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return new List<ExerciseFeedbackDto>();

        try
        {
            return JsonSerializer.Deserialize<List<ExerciseFeedbackDto>>(json, _jsonOptions)
                   ?? new List<ExerciseFeedbackDto>();
        }
        catch
        {
            return new List<ExerciseFeedbackDto>();
        }
    }

    #endregion
}
