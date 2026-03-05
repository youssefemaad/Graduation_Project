using Shared.DTOs.Stats;

namespace ServiceAbstraction.Services
{
    public interface IStatsService
    {
        Task<MemberStatsDto> GetMemberStatsAsync(int userId);
        Task<CoachStatsDto> GetCoachStatsAsync(int coachId);
        Task<ReceptionStatsDto> GetReceptionStatsAsync();
    }
}
