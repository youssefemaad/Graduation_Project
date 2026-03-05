using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Exercise;

namespace Service.Services
{
    public class ExerciseService : IExerciseService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ExerciseService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<ExerciseDto>> GetAllExercisesAsync()
        {
            var exercises = await _unitOfWork.Repository<Exercise>().GetAllAsync();
            return exercises.Select(MapToExerciseDto);
        }

        public async Task<IEnumerable<ExerciseDto>> GetActiveExercisesAsync()
        {
            var exercises = await _unitOfWork.Repository<Exercise>()
                .FindAsync(e => e.IsActive);
            return exercises.Select(MapToExerciseDto);
        }

        public async Task<ExerciseDto?> GetExerciseByIdAsync(int exerciseId)
        {
            var exercise = await _unitOfWork.Repository<Exercise>().GetByIdAsync(exerciseId);
            return exercise == null ? null : MapToExerciseDto(exercise);
        }

        public async Task<IEnumerable<ExerciseDto>> GetExercisesByMuscleGroupAsync(string muscleGroup)
        {
            var exercises = await _unitOfWork.Repository<Exercise>()
                .FindAsync(e => e.MuscleGroup == muscleGroup && e.IsActive);
            return exercises.Select(MapToExerciseDto);
        }

        public async Task<IEnumerable<ExerciseDto>> GetExercisesByDifficultyAsync(int difficultyLevel)
        {
            var difficultyLevelStr = difficultyLevel switch
            {
                1 => "Beginner",
                2 => "Intermediate",
                3 => "Advanced",
                _ => null
            };

            if (difficultyLevelStr == null)
                return new List<ExerciseDto>();

            var exercises = await _unitOfWork.Repository<Exercise>()
                .FindAsync(e => e.DifficultyLevel == difficultyLevelStr && e.IsActive);
            return exercises.Select(MapToExerciseDto);
        }

        private ExerciseDto MapToExerciseDto(Exercise exercise)
        {
            return new ExerciseDto
            {
                ExerciseId = exercise.ExerciseId,
                Name = exercise.Name,
                Description = exercise.Description,
                TargetMuscleGroup = exercise.MuscleGroup,
                DifficultyLevel = exercise.DifficultyLevel switch
                {
                    "Beginner" => 1,
                    "Intermediate" => 2,
                    "Advanced" => 3,
                    _ => null
                },
                VideoUrl = exercise.VideoUrl,
                CaloriesBurnedPerMinute = exercise.CaloriesPerMinute,
                IsActive = exercise.IsActive
            };
        }
    }
}
