using Shared.DTOs.Exercise;

namespace ServiceAbstraction.Services
{
    public interface IExerciseService
    {
        Task<IEnumerable<ExerciseDto>> GetAllExercisesAsync();
        Task<IEnumerable<ExerciseDto>> GetActiveExercisesAsync();
        Task<ExerciseDto?> GetExerciseByIdAsync(int exerciseId);
        Task<IEnumerable<ExerciseDto>> GetExercisesByMuscleGroupAsync(string muscleGroup);
        Task<IEnumerable<ExerciseDto>> GetExercisesByDifficultyAsync(int difficultyLevel);
    }
}
