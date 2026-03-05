using IntelliFit.Shared.DTOs.User;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IActivityFeedService
    {
        Task<ActivityFeedDto> CreateActivityAsync(CreateActivityFeedDto dto);
        Task<IEnumerable<ActivityFeedDto>> GetUserActivitiesAsync(int userId, int limit = 50);
        Task<IEnumerable<ActivityFeedDto>> GetRecentActivitiesAsync(int limit = 100);
        Task DeleteActivityAsync(int activityId);
    }
}
