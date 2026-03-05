using Shared.DTOs.Subscription;

namespace ServiceAbstraction.Services
{
    public interface ISubscriptionService
    {
        Task<IEnumerable<SubscriptionPlanDto>> GetAllPlansAsync();
        Task<SubscriptionPlanDto?> GetPlanByIdAsync(int planId);
        Task<IEnumerable<SubscriptionPlanDto>> GetActivePlansAsync();
        Task CreateUserSubscriptionAsync(CreateSubscriptionDto createDto);
        Task<bool> HasActiveSubscriptionAsync(int userId);
        Task<UserSubscriptionDetailsDto?> GetUserSubscriptionDetailsAsync(int userId);
    }
}
