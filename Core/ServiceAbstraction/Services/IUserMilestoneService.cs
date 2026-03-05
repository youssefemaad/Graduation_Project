using IntelliFit.Shared.DTOs.User;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IUserMilestoneService
    {
        Task<UserMilestoneDto?> GetUserMilestoneAsync(int userId, int milestoneId);
        Task<IEnumerable<UserMilestoneDto>> GetUserMilestonesAsync(int userId);
        Task<UserMilestoneDto?> UpdateMilestoneProgressAsync(int userId, UpdateUserMilestoneProgressDto dto);
        Task<UserMilestoneDto?> CompleteMilestoneAsync(int userId, CompleteMilestoneDto dto);
    }
}
