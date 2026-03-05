using IntelliFit.Shared.DTOs.WorkoutPlan;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IWorkoutTemplateService
    {
        Task<WorkoutTemplateDto> CreateTemplateAsync(int coachId, CreateWorkoutTemplateDto dto);
        Task<WorkoutTemplateDto> GetTemplateByIdAsync(int templateId);
        Task<IEnumerable<WorkoutTemplateDto>> GetCoachTemplatesAsync(int coachId);
        Task<IEnumerable<WorkoutTemplateDto>> GetPublicTemplatesAsync();
        Task<WorkoutTemplateDto> UpdateTemplateAsync(int templateId, int coachId, UpdateWorkoutTemplateDto dto);
        Task DeleteTemplateAsync(int templateId, int coachId);
    }
}
