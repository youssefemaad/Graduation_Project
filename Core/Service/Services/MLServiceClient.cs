using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// HTTP client for communicating with Python ML service (FastAPI on port 5300)
/// </summary>
public class MLServiceClient : IMLServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MLServiceClient> _logger;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public MLServiceClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MLServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["MLService:BaseUrl"] ?? "http://localhost:5300";

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(300); // Per-day generation: up to 5 model calls on CPU
    }

    /// <summary>
    /// Generate workout plan via ML service
    /// </summary>
    public async Task<MLWorkoutResponse?> GenerateWorkoutPlanAsync(MLWorkoutRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Sending workout generation request to ML service for user {UserId}",
                request.UserId);

            var response = await _httpClient.PostAsJsonAsync("/generate-direct", request, _jsonOptions);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "ML service returned error {StatusCode}: {Error}",
                    response.StatusCode, errorContent);

                return new MLWorkoutResponse
                {
                    IsValidJson = false,
                    Error = $"ML service error: {response.StatusCode} - {errorContent}"
                };
            }

            var result = await response.Content.ReadFromJsonAsync<MLWorkoutResponse>(_jsonOptions);

            _logger.LogInformation(
                "Received ML response: valid_json={IsValid}, latency={Latency}ms",
                result?.IsValidJson, result?.GenerationLatencyMs);

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to ML service at {BaseUrl}", _baseUrl);
            return new MLWorkoutResponse
            {
                IsValidJson = false,
                Error = $"ML service unavailable: {ex.Message}"
            };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "ML service request timed out");
            return new MLWorkoutResponse
            {
                IsValidJson = false,
                Error = "ML service request timed out"
            };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize ML service response");
            return new MLWorkoutResponse
            {
                IsValidJson = false,
                Error = $"Invalid response from ML service: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Check ML service health
    /// </summary>
    public async Task<MLHealthResponse?> CheckHealthAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/health");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "ML service health check failed with status {StatusCode}",
                    response.StatusCode);
                return null;
            }

            return await response.Content.ReadFromJsonAsync<MLHealthResponse>(_jsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML service health check failed");
            return null;
        }
    }
}
