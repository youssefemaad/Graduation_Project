using Shared.DTOs.WorkoutPlan;

namespace ServiceAbstraction.Services
{
    public interface IWorkoutPlanService
    {
        Task<IEnumerable<WorkoutPlanDto>> GetAllTemplatesAsync();
        Task<WorkoutPlanDto?> GetPlanByIdAsync(int planId);
        Task<IEnumerable<MemberWorkoutPlanDto>> GetMemberPlansAsync(int memberId);
        Task<MemberWorkoutPlanDto?> GetMemberPlanDetailsAsync(int memberPlanId);
        Task<MemberWorkoutPlanDto> AssignPlanToMemberAsync(AssignWorkoutPlanDto assignDto);
        Task<MemberWorkoutPlanDto> UpdateProgressAsync(int memberPlanId, UpdateProgressDto progressDto);
        Task<MemberWorkoutPlanDto> CompletePlanAsync(int memberPlanId);
    }
}
