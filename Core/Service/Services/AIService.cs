using IntelliFit.ServiceAbstraction;
using Shared.DTOs;
using Shared.DTOs.Meal;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.ClientModel;

namespace IntelliFit.Service.Services;

/// <summary>
/// AI Service for generating workout and nutrition plans using Groq (llama-3.3-70b-versatile)
/// </summary>
public class AIService : IAIService
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<AIService> _logger;
    private readonly IConfiguration _configuration;
    private const int AI_GENERATION_TOKEN_COST = 50;

    public AIService(
        IConfiguration configuration,
        ILogger<AIService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var apiKey = _configuration["Groq:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new InvalidOperationException("Groq API key is not configured in appsettings.json");
        }

        // Create OpenAI-compatible client pointing to Groq
        var openAIClient = new OpenAI.OpenAIClient(
            new ApiKeyCredential(apiKey),
            new OpenAI.OpenAIClientOptions
            {
                Endpoint = new Uri("https://api.groq.com/openai/v1")
            });

        // Use llama-3.3-70b-versatile (fast and smart, 32K context)
        _chatClient = openAIClient.GetChatClient("llama-3.3-70b-versatile");
    }

    public async Task<WorkoutPlanGenerationResult> GenerateWorkoutPlanAsync(GenerateWorkoutPlanRequest request)
    {
        try
        {
            _logger.LogInformation("Generating AI workout plan for user {UserId} using Groq", request.UserId);

            var prompt = BuildWorkoutPrompt(request);

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage("You are an expert fitness coach. Generate workout plans in valid JSON format only. Do NOT include markdown code blocks or any text outside the JSON."),
                new UserChatMessage(prompt)
            };

            var chatCompletion = await _chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
            {
                Temperature = 0.7f,
                MaxOutputTokenCount = 2000,
                ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat()
            });

            var responseText = chatCompletion.Value.Content[0].Text;

            _logger.LogInformation("Received workout plan response from Groq");

            // Parse the JSON response
            var workoutPlanData = JsonSerializer.Deserialize<WorkoutPlanData>(responseText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
            });

            if (workoutPlanData == null || workoutPlanData.Exercises == null)
            {
                return new WorkoutPlanGenerationResult
                {
                    Success = false,
                    ErrorMessage = "Failed to parse AI response into workout plan"
                };
            }

            // Validate the workout plan
            workoutPlanData = ValidateWorkoutPlan(workoutPlanData);

            return new WorkoutPlanGenerationResult
            {
                Success = true,
                PlanName = $"{request.FitnessGoal} Workout - AI Generated",
                Schedule = workoutPlanData.Schedule,
                Exercises = workoutPlanData.Exercises?.Select(e => new ExerciseDayDto
                {
                    Day = e.Day,
                    Routines = e.Routines?.Select(r => new RoutineDto
                    {
                        Name = r.Name,
                        Sets = r.Sets,
                        Reps = r.Reps,
                        Duration = r.Duration,
                        Description = r.Description
                    }).ToList() ?? new List<RoutineDto>()
                }).ToList(),
                TokensSpent = AI_GENERATION_TOKEN_COST
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI workout plan for user {UserId}", request.UserId);
            return new WorkoutPlanGenerationResult
            {
                Success = false,
                ErrorMessage = $"Failed to generate workout plan: {ex.Message}"
            };
        }
    }

    public async Task<NutritionPlanGenerationResult> GenerateNutritionPlanAsync(GenerateNutritionPlanRequest request)
    {
        try
        {
            _logger.LogInformation("Generating AI nutrition plan for user {UserId} using Groq", request.UserId);

            var prompt = BuildNutritionPrompt(request);

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage("You are an expert nutritionist. Generate nutrition plans in valid JSON format only. Do NOT include markdown code blocks or any text outside the JSON."),
                new UserChatMessage(prompt)
            };

            var chatCompletion = await _chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
            {
                Temperature = 0.7f,
                MaxOutputTokenCount = 2000,
                ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat()
            });

            var responseText = chatCompletion.Value.Content[0].Text;

            _logger.LogInformation("Received nutrition plan response from Groq");

            // Parse the JSON response
            var nutritionPlanData = JsonSerializer.Deserialize<NutritionPlanData>(responseText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
            });

            if (nutritionPlanData == null || nutritionPlanData.Meals == null)
            {
                return new NutritionPlanGenerationResult
                {
                    Success = false,
                    ErrorMessage = "Failed to parse AI response into nutrition plan"
                };
            }

            // Validate the nutrition plan
            nutritionPlanData = ValidateNutritionPlan(nutritionPlanData);

            return new NutritionPlanGenerationResult
            {
                Success = true,
                PlanName = $"{request.FitnessGoal} Nutrition - AI Generated",
                DailyCalories = nutritionPlanData.DailyCalories,
                Meals = nutritionPlanData.Meals?.Select(m => new MealDto
                {
                    Name = m.Name,
                    MealType = m.Name,
                    Calories = m.Calories,
                    ProteinGrams = m.Protein,
                    CarbsGrams = m.Carbs,
                    FatGrams = m.Fats,
                    Description = m.Description,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }).ToList(),
                TokensSpent = AI_GENERATION_TOKEN_COST
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI nutrition plan for user {UserId}", request.UserId);
            return new NutritionPlanGenerationResult
            {
                Success = false,
                ErrorMessage = $"Failed to generate nutrition plan: {ex.Message}"
            };
        }
    }

    public async Task<string> ChatWithAIAsync(string userMessage, int userId)
    {
        try
        {
            _logger.LogInformation("AI chat request from user {UserId} using Groq", userId);

            var systemPrompt = @"You are an expert AI fitness coach for IntelliFit gym. 
Provide helpful, accurate, and motivating fitness advice.
Keep responses concise (2-3 paragraphs).
Be supportive and encouraging.";

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(userMessage)
            };

            var chatCompletion = await _chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
            {
                Temperature = 0.8f,
                MaxOutputTokenCount = 500
            });

            return chatCompletion.Value.Content[0].Text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AI chat for user {UserId}", userId);
            return "I apologize, but I'm having trouble responding right now. Please try again in a moment.";
        }
    }

    #region Private Helper Methods

    private string BuildWorkoutPrompt(GenerateWorkoutPlanRequest request)
    {
        return $@"Create a {request.WorkoutDaysPerWeek}-day workout plan for a {request.Age} year old, {request.FitnessLevel} level person.

User Profile:
- Height: {request.Height}
- Weight: {request.Weight}
- Fitness Goal: {request.FitnessGoal}
- Fitness Level: {request.FitnessLevel}
- Workout Days Per Week: {request.WorkoutDaysPerWeek}
- Injuries/Limitations: {request.Injuries ?? "None"}
- Equipment Access: {request.EquipmentAccess ?? "Full gym"}

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text
2. Sets and Reps MUST be numbers (integers), not strings
3. Use this exact structure:

{{
  ""schedule"": [""Monday"", ""Wednesday"", ""Friday""],
  ""exercises"": [
    {{
      ""day"": ""Monday"",
      ""routines"": [
        {{
          ""name"": ""Exercise Name"",
          ""sets"": 3,
          ""reps"": 10,
          ""duration"": """",
          ""description"": ""Brief description""
        }}
      ]
    }}
  ]
}}

Requirements:
- Progressive overload appropriate for {request.FitnessLevel} level
- Target {request.FitnessGoal}
- Respect injuries/limitations
- Include warm-up and cool-down
- Sets must be integers (e.g., 3, not ""3"" or ""3-4"")
- Reps must be integers (e.g., 10, not ""10"" or ""8-12"")

Generate the workout plan now:";
    }

    private string BuildNutritionPrompt(GenerateNutritionPlanRequest request)
    {
        return $@"Create a daily nutrition plan for a {request.Age} year old person.

User Profile:
- Height: {request.Height}
- Weight: {request.Weight}
- Fitness Goal: {request.FitnessGoal}
- Dietary Restrictions: {request.DietaryRestrictions ?? "None"}
- Food Allergies: {request.FoodAllergies ?? "None"}

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanatory text
2. All numeric values MUST be numbers, not strings
3. Use this exact structure:

{{
  ""dailyCalories"": 2500,
  ""meals"": [
    {{
      ""name"": ""Breakfast"",
      ""foods"": [""Food 1"", ""Food 2""],
      ""calories"": 600,
      ""protein"": 30,
      ""carbs"": 70,
      ""fats"": 20,
      ""description"": ""Brief description""
    }}
  ]
}}

Requirements:
- Calculate appropriate daily calories for {request.FitnessGoal}
- Respect dietary restrictions and allergies
- Balance macronutrients
- Include 3-5 meals
- All numeric fields (calories, protein, carbs, fats) must be integers

Generate the nutrition plan now:";
    }

    private WorkoutPlanData ValidateWorkoutPlan(WorkoutPlanData plan)
    {
        if (plan.Exercises == null) return plan;

        foreach (var day in plan.Exercises)
        {
            if (day.Routines == null) continue;

            foreach (var routine in day.Routines)
            {
                // Ensure sets and reps are valid numbers
                if (routine.Sets <= 0) routine.Sets = 3;
                if (routine.Reps <= 0) routine.Reps = 10;
            }
        }

        return plan;
    }

    private NutritionPlanData ValidateNutritionPlan(NutritionPlanData plan)
    {
        // Ensure daily calories is within reasonable range
        if (plan.DailyCalories < 1000) plan.DailyCalories = 1500;
        if (plan.DailyCalories > 5000) plan.DailyCalories = 3000;

        return plan;
    }

    #endregion

    #region Private Data Classes

    private class WorkoutPlanData
    {
        public List<string>? Schedule { get; set; }
        public List<ExerciseDayData>? Exercises { get; set; }
    }

    private class ExerciseDayData
    {
        public string Day { get; set; } = string.Empty;
        public List<RoutineData>? Routines { get; set; }
    }

    private class RoutineData
    {
        public string Name { get; set; } = string.Empty;
        public int Sets { get; set; }
        public int Reps { get; set; }

        [System.Text.Json.Serialization.JsonConverter(typeof(FlexibleStringConverter))]
        public string? Duration { get; set; }

        public string? Description { get; set; }
    }

    // Custom converter to handle duration as either string or number
    private class FlexibleStringConverter : System.Text.Json.Serialization.JsonConverter<string>
    {
        public override string? Read(ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            switch (reader.TokenType)
            {
                case System.Text.Json.JsonTokenType.String:
                    return reader.GetString();
                case System.Text.Json.JsonTokenType.Number:
                    return reader.GetInt32().ToString();
                case System.Text.Json.JsonTokenType.Null:
                    return null;
                default:
                    return null;
            }
        }

        public override void Write(System.Text.Json.Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value);
        }
    }

    private class NutritionPlanData
    {
        public int DailyCalories { get; set; }
        public List<MealData>? Meals { get; set; }
    }

    private class MealData
    {
        public string Name { get; set; } = string.Empty;
        public List<string>? Foods { get; set; }
        public int Calories { get; set; }
        public decimal Protein { get; set; }
        public decimal Carbs { get; set; }
        public decimal Fats { get; set; }
        public string? Description { get; set; }
    }

    #endregion
}
