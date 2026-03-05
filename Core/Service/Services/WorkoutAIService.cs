using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// Service for AI-powered workout plan generation using Flan-T5 ML model
/// Includes caching, user context enrichment, and database persistence
/// </summary>
public class WorkoutAIService : IWorkoutAIService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMLServiceClient _mlClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<WorkoutAIService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private const string CACHE_PREFIX = "workout_plan:";
    private const int CACHE_DURATION_HOURS = 24;

    /// <summary>
    /// Snake_case JSON options for deserializing ML service responses (Python snake_case → C# PascalCase)
    /// </summary>
    private static readonly JsonSerializerOptions _snakeCaseOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
    };

    public WorkoutAIService(
        IUnitOfWork unitOfWork,
        IMLServiceClient mlClient,
        IDistributedCache cache,
        ILogger<WorkoutAIService> logger)
    {
        _unitOfWork = unitOfWork;
        _mlClient = mlClient;
        _cache = cache;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    /// <summary>
    /// Generate a personalized AI workout plan
    /// </summary>
    public async Task<AIWorkoutPlanResult> GenerateWorkoutPlanAsync(GenerateAIWorkoutPlanRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Generating AI workout plan for user {UserId}: {Goal}, {Level}, {Days} days/week",
                request.UserId, request.Goal, request.FitnessLevel, request.DaysPerWeek);

            // 1. Build cache key
            var cacheKey = BuildCacheKey(request);

            // 2. Check cache (unless force regenerate)
            if (!request.ForceRegenerate)
            {
                var cachedPlan = await GetFromCacheAsync(cacheKey);
                if (cachedPlan != null)
                {
                    _logger.LogInformation("Returning cached plan for user {UserId}", request.UserId);
                    cachedPlan.FromCache = true;
                    return cachedPlan;
                }
            }

            // 3. Build ML request with user context
            var mlRequest = await BuildMLRequestAsync(request);

            // 4. Call ML service
            var mlResponse = await _mlClient.GenerateWorkoutPlanAsync(mlRequest);

            if (mlResponse == null || (mlResponse.Plan == null && !mlResponse.IsValidJson))
            {
                return new AIWorkoutPlanResult
                {
                    Success = false,
                    ErrorMessage = mlResponse?.Error ?? "Failed to generate workout plan"
                };
            }

            // 5. Parse and structure the plan data
            var planData = ParsePlanData(mlResponse.Plan);

            // 6. Save to database
            var savedPlan = await SaveWorkoutPlanAsync(request, mlRequest, mlResponse, planData);

            // 7. Build result
            var result = new AIWorkoutPlanResult
            {
                Success = true,
                PlanId = savedPlan.PlanId,
                PlanName = savedPlan.PlanName,
                PlanData = planData,
                ModelVersion = mlResponse.ModelVersion,
                GenerationLatencyMs = mlResponse.GenerationLatencyMs,
                FromCache = false,
                GeneratedAt = DateTime.UtcNow
            };

            // 8. Cache the result
            await CachePlanAsync(cacheKey, result);

            _logger.LogInformation(
                "Generated AI workout plan {PlanId} for user {UserId} in {Latency}ms",
                savedPlan.PlanId, request.UserId, mlResponse.GenerationLatencyMs);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI workout plan for user {UserId}", request.UserId);
            return new AIWorkoutPlanResult
            {
                Success = false,
                ErrorMessage = $"Failed to generate workout plan: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Get user's strength profile
    /// </summary>
    public async Task<UserStrengthProfileDto?> GetUserStrengthProfileAsync(int userId)
    {
        try
        {
            var profiles = await _unitOfWork.Repository<UserStrengthProfile>()
                .FindAsync(p => p.UserId == userId);

            if (!profiles.Any())
                return null;

            var exercises = await _unitOfWork.Repository<Exercise>().GetAllAsync();
            var exerciseDict = exercises.ToDictionary(e => e.ExerciseId, e => e.Name);

            return new UserStrengthProfileDto
            {
                UserId = userId,
                LastUpdated = profiles.Max(p => p.UpdatedAt),
                Exercises = profiles.Select(p => new ExerciseStrengthDto
                {
                    ExerciseId = p.ExerciseId,
                    ExerciseName = exerciseDict.TryGetValue(p.ExerciseId, out var name) ? name : "Unknown",
                    Estimated1RM = p.Estimated1RM,
                    ConfidenceScore = p.ConfidenceScore,
                    AvgWorkingWeight = p.AvgWorkingWeight,
                    MaxWeightLifted = p.MaxWeightLifted,
                    FeedbackCount = p.FeedbackCount,
                    StrengthTrend = p.StrengthTrend,
                    LastWorkoutDate = p.LastWorkoutDate
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting strength profile for user {UserId}", userId);
            return null;
        }
    }

    /// <summary>
    /// Get user's latest muscle development scan
    /// </summary>
    public async Task<MuscleScanResultDto?> GetLatestMuscleScanAsync(int userId)
    {
        try
        {
            var scans = await _unitOfWork.Repository<MuscleDevelopmentScan>()
                .FindAsync(s => s.UserId == userId);

            var latestScan = scans.OrderByDescending(s => s.ScanDate).FirstOrDefault();

            if (latestScan == null)
                return null;

            Dictionary<string, decimal>? muscleScores = null;
            if (!string.IsNullOrEmpty(latestScan.MuscleScores))
            {
                muscleScores = JsonSerializer.Deserialize<Dictionary<string, decimal>>(
                    latestScan.MuscleScores, _jsonOptions);
            }

            return new MuscleScanResultDto
            {
                ScanId = latestScan.Id,
                UserId = latestScan.UserId,
                ImageUrl = latestScan.ImageUrl,
                ImageType = latestScan.ImageType,
                MuscleScores = muscleScores,
                UnderdevelopedMuscles = latestScan.UnderdevelopedMuscles?.ToList(),
                WellDevelopedMuscles = latestScan.WellDevelopedMuscles?.ToList(),
                BodyFatEstimate = latestScan.BodyFatEstimate,
                MuscleDefinitionScore = latestScan.MuscleDefinitionScore,
                PostureNotes = latestScan.PostureNotes,
                AsymmetryDetected = latestScan.AsymmetryDetected,
                ConfidenceScore = latestScan.ConfidenceScore,
                ScanDate = latestScan.ScanDate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest muscle scan for user {UserId}", userId);
            return null;
        }
    }

    /// <summary>
    /// Check if ML service is healthy
    /// </summary>
    public async Task<bool> IsMLServiceHealthyAsync()
    {
        var health = await _mlClient.CheckHealthAsync();
        return health?.Status == "healthy";
    }

    public async Task<bool> DeleteUserAIPlanAsync(int planId, int userId)
    {
        var planRepo = _unitOfWork.Repository<UserAIWorkoutPlan>();
        var dayRepo = _unitOfWork.Repository<UserAIWorkoutPlanDay>();
        var exRepo = _unitOfWork.Repository<UserAIWorkoutPlanExercise>();

        var plan = await planRepo.GetByIdAsync(planId);
        if (plan == null) return false;

        if (plan.UserId != userId)
        {
            throw new UnauthorizedAccessException("User does not have permission to delete this plan.");
        }

        // Delete associated days and exercises
        var days = await dayRepo.FindAsync(d => d.PlanId == planId);
        foreach (var day in days)
        {
            var exercises = await exRepo.FindAsync(e => e.PlanDayId == day.DayId);
            exRepo.RemoveRange(exercises);
        }
        dayRepo.RemoveRange(days);

        // Delete the plan
        planRepo.Remove(plan);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    #region Private Methods

    /// <summary>
    /// Build ML request with enriched user context
    /// </summary>
    private async Task<MLWorkoutRequest> BuildMLRequestAsync(GenerateAIWorkoutPlanRequest request)
    {
        var mlRequest = new MLWorkoutRequest
        {
            UserId = request.UserId,
            FitnessLevel = request.FitnessLevel,
            Goal = request.Goal,
            DaysPerWeek = request.DaysPerWeek,
            Equipment = request.Equipment,
            Injuries = request.Injuries
        };

        if (request.IncludeUserContext)
        {
            mlRequest.UserContext = await BuildUserContextAsync(request.UserId);
        }

        return mlRequest;
    }

    /// <summary>
    /// Build user context from database (InBody, strength profile, muscle scan)
    /// </summary>
    private async Task<MLUserContext?> BuildUserContextAsync(int userId)
    {
        var context = new MLUserContext();
        var hasData = false;

        // 1. InBody Data
        try
        {
            var inBodyMeasurements = await _unitOfWork.Repository<InBodyMeasurement>()
                .FindAsync(m => m.UserId == userId);
            var latestInBody = inBodyMeasurements.OrderByDescending(m => m.CreatedAt).FirstOrDefault();

            if (latestInBody != null)
            {
                context.InBodyData = new MLInBodyData
                {
                    MuscleMassKg = latestInBody.MuscleMass,
                    BodyFatPercent = latestInBody.BodyFatPercentage,
                    SkeletalMuscleMass = latestInBody.MuscleMass // Use muscle mass as skeletal muscle mass
                };
                hasData = true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error building InBody context for user {UserId}: {Message}", userId, ex.Message);
        }

        // 2. Muscle Scan
        try
        {
            var muscleScans = await _unitOfWork.Repository<MuscleDevelopmentScan>()
                .FindAsync(s => s.UserId == userId);
            var latestScan = muscleScans.OrderByDescending(s => s.ScanDate).FirstOrDefault();

            if (latestScan != null)
            {
                // Safety check for null lists
                var weak = latestScan.UnderdevelopedMuscles?.ToList() ?? new List<string>();
                var strong = latestScan.WellDevelopedMuscles?.ToList() ?? new List<string>();

                context.MuscleScan = new MLMuscleScanData
                {
                    WeakAreas = weak,
                    StrongAreas = strong
                };
                hasData = true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error building Muscle Scan context for user {UserId}: {Message}", userId, ex.Message);
        }

        // 3. Strength Profile
        try
        {
            var strengthProfiles = await _unitOfWork.Repository<UserStrengthProfile>()
                .FindAsync(p => p.UserId == userId);

            if (strengthProfiles.Any())
            {
                var exercises = await _unitOfWork.Repository<Exercise>().GetAllAsync();
                var exerciseDict = exercises.ToDictionary(e => e.ExerciseId, e => e.Name);

                context.StrengthProfile = strengthProfiles
                    .Where(p => p.ConfidenceScore >= 0.5m) // Only include confident estimates
                    .OrderByDescending(p => p.ConfidenceScore)
                    .Take(10) // Limit to top 10 exercises
                    .Select(p => new MLStrengthProfileEntry
                    {
                        ExerciseName = exerciseDict.TryGetValue(p.ExerciseId, out var name) ? name : "Unknown",
                        OneRmKg = p.Estimated1RM,
                        ConfidenceScore = p.ConfidenceScore
                    })
                    .ToList();
                hasData = true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error building Strength Profile context for user {UserId}: {Message}", userId, ex.Message);
        }

        // 4. Feedback Summary
        try
        {
            var feedbacks = await _unitOfWork.Repository<WorkoutFeedback>()
                .FindAsync(f => f.UserId == userId);
            var recentFeedbacks = feedbacks
                .OrderByDescending(f => f.CreatedAt)
                .Take(5)
                .ToList();

            if (recentFeedbacks.Any())
            {
                var avgRating = recentFeedbacks
                    .Where(f => f.Rating.HasValue)
                    .Select(f => f.Rating!.Value)
                    .DefaultIfEmpty(0)
                    .Average();

                // Aggregate weight adjustments from exercise feedback
                var weightAdjustments = new Dictionary<string, string>();
                foreach (var feedback in recentFeedbacks)
                {
                    if (string.IsNullOrEmpty(feedback.ExerciseFeedback))
                        continue;

                    try
                    {
                        var exerciseFeedbacks = JsonSerializer.Deserialize<List<ExerciseFeedbackJson>>(
                            feedback.ExerciseFeedback, _jsonOptions);

                        if (exerciseFeedbacks != null)
                        {
                            foreach (var ef in exerciseFeedbacks.Where(e => e.WeightFeeling != "Perfect"))
                            {
                                var key = ef.ExerciseName ?? "exercises";
                                if (!weightAdjustments.ContainsKey(key))
                                {
                                    weightAdjustments[key] = ef.WeightFeeling ?? "unknown";
                                }
                            }
                        }
                    }
                    catch { /* Ignore parsing errors */ }
                }

                context.FeedbackSummary = new MLFeedbackSummary
                {
                    AvgRating = (decimal)avgRating,
                    WeightAdjustments = weightAdjustments.Any() ? weightAdjustments : null
                };
                hasData = true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error building Feedback context for user {UserId}: {Message}", userId, ex.Message);
        }

        return hasData ? context : null;
    }

    /// <summary>
    /// Parse ML response plan data into structured format.
    /// Uses SnakeCaseLower to map Python snake_case keys to C# PascalCase properties.
    /// Then populates Focus string from FocusAreas list for frontend display.
    /// </summary>
    private AIGeneratedPlanData? ParsePlanData(Dictionary<string, object>? plan)
    {
        if (plan == null)
            return null;

        try
        {
            // Serialize the raw dictionary (preserves original snake_case keys from ML)
            var json = JsonSerializer.Serialize(plan);

            // Deserialize using SnakeCaseLower: maps day_number → DayNumber, focus_areas → FocusAreas, etc.
            var planData = JsonSerializer.Deserialize<AIGeneratedPlanData>(json, _snakeCaseOptions);

            if (planData?.Days != null)
            {
                foreach (var day in planData.Days)
                {
                    // Populate Focus string from FocusAreas list for frontend display
                    if (string.IsNullOrEmpty(day.Focus) && day.FocusAreas?.Any() == true)
                    {
                        day.Focus = string.Join(", ", day.FocusAreas.Select(f =>
                            System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(f)));
                    }

                    // Ensure every day has a proper name
                    if (string.IsNullOrEmpty(day.DayName))
                    {
                        day.DayName = $"Day {day.DayNumber}";
                    }

                    // Ensure exercises list is never null
                    day.Exercises ??= new List<AIExercise>();
                }
            }

            return planData;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse plan data, returning raw structure");
            return new AIGeneratedPlanData
            {
                Schedule = "Custom",
                Days = new List<AIWorkoutDay>()
            };
        }
    }

    /// <summary>
    /// Save generated workout plan to database
    /// </summary>
    private async Task<WorkoutPlan> SaveWorkoutPlanAsync(
        GenerateAIWorkoutPlanRequest request,
        MLWorkoutRequest mlRequest,
        MLWorkoutResponse mlResponse,
        AIGeneratedPlanData? planData)
    {
        var workoutPlan = new WorkoutPlan
        {
            UserId = request.UserId,
            PlanName = $"AI {request.Goal} Plan - {request.FitnessLevel}",
            Description = $"AI-generated {request.DaysPerWeek}-day {request.Goal.ToLower()} workout plan for {request.FitnessLevel.ToLower()} level",
            PlanType = "AI-Generated",
            FitnessLevel = request.FitnessLevel,
            Goal = request.Goal,
            DaysPerWeek = request.DaysPerWeek,
            DifficultyLevel = MapFitnessLevelToDifficulty(request.FitnessLevel),
            Status = "Active",
            IsActive = true,

            // AI-specific fields
            PlanData = JsonSerializer.Serialize(planData, _jsonOptions),
            RequestParameters = JsonSerializer.Serialize(mlRequest, _jsonOptions),
            RequestParametersHash = ComputeHash(mlRequest),
            UserContextSnapshot = mlRequest.UserContext != null
                ? JsonSerializer.Serialize(mlRequest.UserContext, _jsonOptions)
                : null,
            ModelVersion = mlResponse.ModelVersion,
            GenerationLatencyMs = mlResponse.GenerationLatencyMs,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<WorkoutPlan>().AddAsync(workoutPlan);
        await _unitOfWork.SaveChangesAsync();

        return workoutPlan;
    }

    /// <summary>
    /// Build cache key from request parameters
    /// </summary>
    private string BuildCacheKey(GenerateAIWorkoutPlanRequest request)
    {
        var keyData = new
        {
            request.UserId,
            request.FitnessLevel,
            request.Goal,
            request.DaysPerWeek,
            Equipment = string.Join(",", request.Equipment.OrderBy(e => e)),
            Injuries = string.Join(",", request.Injuries.OrderBy(i => i))
        };

        return $"{CACHE_PREFIX}{ComputeHash(keyData)}";
    }

    /// <summary>
    /// Get cached plan
    /// </summary>
    private async Task<AIWorkoutPlanResult?> GetFromCacheAsync(string cacheKey)
    {
        try
        {
            var cached = await _cache.GetStringAsync(cacheKey);
            if (string.IsNullOrEmpty(cached))
                return null;

            return JsonSerializer.Deserialize<AIWorkoutPlanResult>(cached, _jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cached plan");
            return null;
        }
    }

    /// <summary>
    /// Cache generated plan
    /// </summary>
    private async Task CachePlanAsync(string cacheKey, AIWorkoutPlanResult result)
    {
        try
        {
            var json = JsonSerializer.Serialize(result, _jsonOptions);
            await _cache.SetStringAsync(cacheKey, json, new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(CACHE_DURATION_HOURS)
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache plan");
        }
    }

    /// <summary>
    /// Compute MD5 hash for cache key
    /// </summary>
    private static string ComputeHash(object data)
    {
        var json = JsonSerializer.Serialize(data);
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Map fitness level string to difficulty number
    /// </summary>
    private static string MapFitnessLevelToDifficulty(string fitnessLevel)
    {
        return fitnessLevel.ToLower() switch
        {
            "beginner" => "1",
            "intermediate" => "2",
            "advanced" => "3",
            _ => "2"
        };
    }

    /// <summary>
    /// Save AI-generated workout plan (called after frontend generates via direct ML API)
    /// </summary>
    public async Task<SavePlanResponse> SaveAIGeneratedPlanAsync(SaveAIGeneratedPlanRequest request)
    {
        try
        {
            // Serialize the plan data to JSON
            var planDataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                days = request.Days,
                plan_name = request.PlanName,
                fitness_level = request.FitnessLevel,
                goal = request.Goal,
                days_per_week = request.DaysPerWeek,
                program_duration_weeks = request.ProgramDurationWeeks
            });

            // Create workout plan entity
            var workoutPlan = new WorkoutPlan
            {
                UserId = request.UserId,
                PlanName = request.PlanName ?? "AI Workout Plan",
                DurationWeeks = request.ProgramDurationWeeks,
                DifficultyLevel = request.FitnessLevel ?? "Intermediate",
                FitnessLevel = request.FitnessLevel ?? "Intermediate",
                Goal = request.Goal ?? "General",
                DaysPerWeek = request.DaysPerWeek,
                PlanType = "AI-Generated",
                Status = "Active",
                Description = request.Notes ?? $"AI-generated plan ({request.ModelVersion ?? "v1"}, {request.GenerationLatencyMs}ms)",
                PlanData = planDataJson,
                ModelVersion = request.ModelVersion ?? "v1",
                GenerationLatencyMs = request.GenerationLatencyMs,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WorkoutPlan>().AddAsync(workoutPlan);
            await _unitOfWork.SaveChangesAsync();

            // Save exercises for each day
            int dayNumber = 1;
            foreach (var dayData in request.Days)
            {
                int orderIndex = 1;
                foreach (var exerciseData in dayData.Exercises)
                {
                    // Try to find exercise by name, create placeholder if not found
                    var exercise = (await _unitOfWork.Repository<Exercise>()
                        .FindAsync(e => e.Name.ToLower() == exerciseData.Name.ToLower()))
                        .FirstOrDefault();

                    int exerciseId;
                    if (exercise == null)
                    {
                        // Create a placeholder exercise for AI-generated names
                        var newExercise = new Exercise
                        {
                            Name = exerciseData.Name,
                            Category = exerciseData.ExerciseType ?? "Unknown",
                            MuscleGroup = exerciseData.TargetMuscles?.FirstOrDefault() ?? "General",
                            Description = $"AI-generated exercise: {exerciseData.Notes ?? ""}",
                            DifficultyLevel = "Intermediate",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        await _unitOfWork.Repository<Exercise>().AddAsync(newExercise);
                        await _unitOfWork.SaveChangesAsync();
                        exerciseId = newExercise.ExerciseId;
                    }
                    else
                    {
                        exerciseId = exercise.ExerciseId;
                    }

                    var planExercise = new WorkoutPlanExercise
                    {
                        WorkoutPlanId = workoutPlan.PlanId,
                        ExerciseId = exerciseId,
                        DayNumber = dayNumber,
                        OrderInDay = orderIndex++,
                        Sets = ParseSets(exerciseData.Sets ?? "3"),
                        Reps = ParseReps(exerciseData.Reps ?? "10"),
                        RestSeconds = ParseRestSeconds(exerciseData.Rest ?? "60s"),
                        Notes = exerciseData.Notes ?? ""
                    };

                    await _unitOfWork.Repository<WorkoutPlanExercise>().AddAsync(planExercise);
                }

                await _unitOfWork.SaveChangesAsync();
                dayNumber++;
            }

            _logger.LogInformation(
                "Successfully saved AI-generated plan {PlanId} for user {UserId} ({Model}, {Latency}ms)",
                workoutPlan.PlanId, request.UserId, request.ModelVersion, request.GenerationLatencyMs);

            return new SavePlanResponse
            {
                Success = true,
                PlanId = workoutPlan.PlanId,
                Message = $"Workout plan '{request.PlanName}' saved successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving AI-generated plan for user {UserId}", request.UserId);
            return new SavePlanResponse
            {
                Success = false,
                Error = $"Failed to save workout plan: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Get all AI-generated workout plans for a user
    /// </summary>
    public async Task<List<UserAIWorkoutPlanDto>> GetUserAIPlansAsync(int userId)
    {
        try
        {
            // Get all workout plans for the user
            var plans = (await _unitOfWork.Repository<WorkoutPlan>()
                .FindAsync(p => p.UserId == userId))
                .OrderByDescending(p => p.CreatedAt)
                .ToList();

            var result = new List<UserAIWorkoutPlanDto>();

            foreach (var plan in plans)
            {
                // Get exercises for this plan
                var planExercises = (await _unitOfWork.Repository<WorkoutPlanExercise>()
                    .FindAsync(pe => pe.WorkoutPlanId == plan.PlanId))
                    .OrderBy(pe => pe.DayNumber)
                    .ThenBy(pe => pe.OrderInDay)
                    .ToList();

                // Fetch the actual Exercise entities to get their names and equipment info
                var exerciseIds = planExercises.Select(pe => pe.ExerciseId).Distinct().ToList();
                var exerciseEntities = new Dictionary<int, Exercise>();
                foreach (var exId in exerciseIds)
                {
                    var exercise = await _unitOfWork.Repository<Exercise>().GetByIdAsync(exId);
                    if (exercise != null)
                    {
                        exerciseEntities[exId] = exercise;
                    }
                }

                // Also try to extract exercise names from PlanData JSON as a fallback
                var planDataExerciseNames = new Dictionary<int, Dictionary<int, string>>(); // dayNumber -> orderInDay -> name
                if (!string.IsNullOrEmpty(plan.PlanData))
                {
                    try
                    {
                        using var jsonDoc = System.Text.Json.JsonDocument.Parse(plan.PlanData);
                        if (jsonDoc.RootElement.TryGetProperty("days", out var daysEl))
                        {
                            foreach (var dayEl in daysEl.EnumerateArray())
                            {
                                var dayNum = dayEl.TryGetProperty("day_number", out var dnEl) ? dnEl.GetInt32() : 0;
                                if (dayNum > 0 && dayEl.TryGetProperty("exercises", out var exsEl))
                                {
                                    var orderMap = new Dictionary<int, string>();
                                    int order = 1;
                                    foreach (var exEl in exsEl.EnumerateArray())
                                    {
                                        var exName = exEl.TryGetProperty("exercise_name", out var enEl)
                                            ? enEl.GetString()
                                            : exEl.TryGetProperty("name", out var nEl)
                                                ? nEl.GetString()
                                                : null;
                                        if (!string.IsNullOrEmpty(exName))
                                        {
                                            orderMap[order] = exName;
                                        }
                                        order++;
                                    }
                                    planDataExerciseNames[dayNum] = orderMap;
                                }
                            }
                        }
                    }
                    catch { /* Ignore JSON parse errors */ }
                }

                List<UserAIPlanDayDto> dayGroups;

                if (planExercises.Any())
                {
                    // ── Path A: WorkoutPlanExercise rows exist → use them ──
                    dayGroups = planExercises
                        .GroupBy(pe => pe.DayNumber)
                        .OrderBy(g => g.Key)
                        .Select(g => new UserAIPlanDayDto
                        {
                            DayNumber = g.Key,
                            DayName = $"Day {g.Key}",
                            Exercises = g.Select(pe =>
                            {
                                var exEntity = exerciseEntities.TryGetValue(pe.ExerciseId, out var ex) ? ex : null;

                                var name = exEntity?.Name;
                                if (string.IsNullOrEmpty(name) || name == "Unknown Exercise" || name.StartsWith("AI_"))
                                {
                                    if (planDataExerciseNames.TryGetValue(pe.DayNumber, out var dayExNames) &&
                                        dayExNames.TryGetValue(pe.OrderInDay, out var pdName))
                                    {
                                        name = pdName;
                                    }
                                }
                                return new UserAIPlanExerciseDto
                                {
                                    WorkoutPlanExerciseId = pe.WorkoutPlanExerciseId,
                                    ExerciseId = pe.ExerciseId,
                                    ExerciseName = name ?? pe.Notes ?? "Exercise",
                                    DayNumber = pe.DayNumber,
                                    OrderInDay = pe.OrderInDay,
                                    Sets = pe.Sets,
                                    Reps = pe.Reps,
                                    RestSeconds = pe.RestSeconds,
                                    Notes = pe.Notes,
                                    EquipmentId = exEntity?.EquipmentId,
                                    EquipmentRequired = exEntity?.EquipmentRequired,
                                    MuscleGroup = exEntity?.MuscleGroup
                                };
                            }).ToList()
                        })
                        .ToList();

                    // Enrich day names from PlanData
                    if (!string.IsNullOrEmpty(plan.PlanData))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(plan.PlanData);
                            if (doc.RootElement.TryGetProperty("days", out var daysElement))
                            {
                                foreach (var dayEl in daysElement.EnumerateArray())
                                {
                                    if (dayEl.TryGetProperty("day_number", out var dayNumEl) &&
                                        dayEl.TryGetProperty("day_name", out var dayNameEl))
                                    {
                                        var dayNum = dayNumEl.GetInt32();
                                        var dayDto = dayGroups.FirstOrDefault(d => d.DayNumber == dayNum);
                                        if (dayDto != null)
                                        {
                                            dayDto.DayName = dayNameEl.GetString() ?? $"Day {dayNum}";
                                        }
                                    }
                                }
                            }
                        }
                        catch { /* Ignore JSON parse errors */ }
                    }
                }
                else if (!string.IsNullOrEmpty(plan.PlanData))
                {
                    // ── Path B: No WorkoutPlanExercise rows → reconstruct from PlanData JSON ──
                    dayGroups = new List<UserAIPlanDayDto>();
                    try
                    {
                        var planData = JsonSerializer.Deserialize<AIGeneratedPlanData>(plan.PlanData, _snakeCaseOptions);
                        if (planData?.Days != null)
                        {
                            foreach (var day in planData.Days)
                            {
                                var dayDto = new UserAIPlanDayDto
                                {
                                    DayNumber = day.DayNumber,
                                    DayName = day.DayName ?? $"Day {day.DayNumber}",
                                    Exercises = new List<UserAIPlanExerciseDto>()
                                };

                                if (day.Exercises != null)
                                {
                                    int order = 1;
                                    foreach (var ex in day.Exercises)
                                    {
                                        dayDto.Exercises.Add(new UserAIPlanExerciseDto
                                        {
                                            WorkoutPlanExerciseId = 0,
                                            ExerciseId = ex.ExerciseId ?? 0,
                                            ExerciseName = ex.Name ?? "Exercise",
                                            DayNumber = day.DayNumber,
                                            OrderInDay = order++,
                                            Sets = ex.Sets,
                                            Reps = ParseReps(ex.Reps ?? "10"),
                                            RestSeconds = ex.RestSeconds ?? ParseRestSeconds(ex.Rest ?? "60"),
                                            Notes = ex.Notes,
                                            MuscleGroup = ex.TargetMuscles?.FirstOrDefault()
                                        });
                                    }
                                }

                                dayGroups.Add(dayDto);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to reconstruct exercises from PlanData for plan {PlanId}", plan.PlanId);
                    }
                }
                else
                {
                    dayGroups = new List<UserAIPlanDayDto>();
                }

                result.Add(new UserAIWorkoutPlanDto
                {
                    PlanId = plan.PlanId,
                    PlanName = plan.PlanName,
                    Description = plan.Description,
                    FitnessLevel = plan.FitnessLevel,
                    Goal = plan.Goal,
                    DaysPerWeek = plan.DaysPerWeek,
                    DurationWeeks = plan.DurationWeeks,
                    PlanType = plan.PlanType,
                    Status = plan.Status,
                    IsActive = plan.IsActive,
                    ModelVersion = plan.ModelVersion,
                    GenerationLatencyMs = plan.GenerationLatencyMs,
                    PlanData = plan.PlanData,
                    CreatedAt = plan.CreatedAt,
                    UpdatedAt = plan.UpdatedAt,
                    Days = dayGroups
                });
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AI plans for user {UserId}", userId);
            return new List<UserAIWorkoutPlanDto>();
        }
    }

    /// <summary>
    /// Parse sets string like "3" or "3-4" to integer
    /// </summary>
    private static int ParseSets(string sets)
    {
        if (int.TryParse(sets, out var result))
            return result;

        // Handle range like "3-4", take first value
        if (sets.Contains("-"))
        {
            var parts = sets.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[0], out var first))
                return first;
        }

        return 3; // Default
    }

    /// <summary>
    /// Parse reps string like "8-12" to integer (take average or first value)
    /// </summary>
    private static int ParseReps(string reps)
    {
        if (int.TryParse(reps, out var result))
            return result;

        // Handle range like "8-12", take first value
        if (reps.Contains("-"))
        {
            var parts = reps.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[0], out var first))
                return first;
        }

        return 10; // Default
    }

    /// <summary>
    /// Parse rest string like "90 sec" or "1-2 min" to seconds
    /// </summary>
    private static int ParseRestSeconds(string rest)
    {
        var lower = rest.ToLower().Trim();

        // Extract first number
        var match = System.Text.RegularExpressions.Regex.Match(lower, @"\d+");
        if (!match.Success)
            return 90; // Default

        var value = int.Parse(match.Value);

        // Convert minutes to seconds
        if (lower.Contains("min"))
            return value * 60;

        return value; // Assume seconds
    }

    #endregion

    /// <summary>
    /// Helper class for parsing exercise feedback JSON
    /// </summary>
    private class ExerciseFeedbackJson
    {
        public int? ExerciseId { get; set; }
        public string? ExerciseName { get; set; }
        public decimal? WeightUsed { get; set; }
        public string? WeightFeeling { get; set; }
        public int? SetsCompleted { get; set; }
        public int? SetsPlanned { get; set; }
        public string? FormDifficulty { get; set; }
    }
}
