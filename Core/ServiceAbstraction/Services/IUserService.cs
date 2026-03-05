using Shared.DTOs.User;

namespace ServiceAbstraction.Services
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(int userId);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto);
        Task<bool> DeactivateUserAsync(int userId);
        Task<int> GetTokenBalanceAsync(int userId);
        Task UpdateTokenBalanceAsync(int userId, int amount);
        Task<IEnumerable<UserDto>> GetCoachesListAsync();
        Task<IEnumerable<CoachDto>> GetCoachesWithProfilesAsync();

        /// <summary>
        /// Get user fitness metrics for AI context
        /// </summary>
        Task<UserMetricsDto?> GetUserMetricsAsync(int userId);

        /// <summary>
        /// Get user workout statistics summary over a time period
        /// </summary>
        Task<UserWorkoutSummaryDto> GetUserWorkoutSummaryAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);

        /// <summary>
        /// Get user's recent workouts summary for AI context
        /// </summary>
        Task<IEnumerable<WorkoutSummaryDto>> GetUserRecentWorkoutsAsync(int userId, int limit = 10);

        /// <summary>
        /// Get complete user context for AI (metrics + recent workouts)
        /// </summary>
        Task<UserAIContextDto> GetUserAIContextAsync(int userId);
    }
}
