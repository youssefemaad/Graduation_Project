using IntelliFit.Shared.DTOs.WorkoutPlan;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IWorkoutLogService
    {
        Task<WorkoutLogDto> CreateWorkoutLogAsync(int userId, CreateWorkoutLogDto dto);
        Task<WorkoutLogDto> GetWorkoutLogByIdAsync(int logId);
        Task<IEnumerable<WorkoutLogDto>> GetUserWorkoutLogsAsync(int userId);
        Task<IEnumerable<WorkoutLogDto>> GetWorkoutLogsByPlanAsync(int planId);
        Task<WorkoutLogDto> UpdateWorkoutLogAsync(int logId, UpdateWorkoutLogDto dto);
        Task DeleteWorkoutLogAsync(int logId);
    }
}
