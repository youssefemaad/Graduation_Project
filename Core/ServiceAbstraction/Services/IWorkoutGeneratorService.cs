using Shared.DTOs;

namespace ServiceAbstraction.Services
{
    public interface IWorkoutGeneratorService
    {
        Task<WorkoutGeneratorPlan?> GenerateWorkoutPlanAsync(GenerateWorkoutRequest request);
    }
}
