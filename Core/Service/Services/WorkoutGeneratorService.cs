using System.Text;
using System.Text.Json;
using Shared.DTOs;
using ServiceAbstraction.Services;
using Microsoft.Extensions.Logging;

namespace Service.Services
{
    public class WorkoutGeneratorService : IWorkoutGeneratorService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WorkoutGeneratorService> _logger;

        public WorkoutGeneratorService(
            HttpClient httpClient,
            ILogger<WorkoutGeneratorService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<WorkoutGeneratorPlan?> GenerateWorkoutPlanAsync(GenerateWorkoutRequest request)
        {
            try
            {
                // Build the prompt from the request
                var prompt = BuildPrompt(request);

                // Create the API request
                var apiRequest = new WorkoutApiRequest
                {
                    Prompt = prompt,
                    MaxLength = 1024
                };

                // Add coach feedback if regenerating
                string json;
                if (!string.IsNullOrEmpty(request.CoachFeedback))
                {
                    var feedbackJson = new
                    {
                        prompt = prompt,
                        max_length = 1024,
                        coach_feedback = request.CoachFeedback
                    };
                    json = JsonSerializer.Serialize(feedbackJson);
                }
                else
                {
                    json = JsonSerializer.Serialize(apiRequest);
                }
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Calling Python API at {BaseUrl} with prompt: {Prompt}",
                    _httpClient.BaseAddress, prompt);

                var response = await _httpClient.PostAsync("generate", content);

                _logger.LogInformation("Python API responded with status: {StatusCode}", response.StatusCode);

                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("Python API response: {Response}",
                    responseJson.Length > 500 ? responseJson.Substring(0, 500) + "..." : responseJson);

                var apiResponse = JsonSerializer.Deserialize<WorkoutApiResponse>(responseJson);

                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to generate workout plan: {Error}", apiResponse?.Error);
                    return null;
                }

                return apiResponse.Plan;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling workout generator API. Is the Python API running on port 8000?");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling workout generator API");
                return null;
            }
        }

        private string BuildPrompt(GenerateWorkoutRequest request)
        {
            var promptBuilder = new StringBuilder();
            promptBuilder.Append($"Generate a {request.Days}-day workout plan for {request.Level} lifter, ");
            promptBuilder.Append($"goal is {request.Goal}");

            if (request.Equipment != null && request.Equipment.Any())
            {
                promptBuilder.Append($", has access to {string.Join(", ", request.Equipment)}");
            }

            promptBuilder.Append(".");

            return promptBuilder.ToString();
        }
    }
}
