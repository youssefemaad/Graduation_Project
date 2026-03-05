using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.WorkoutPlan;
using AutoMapper;

namespace Service.Services
{
    public class WorkoutTemplateService : IWorkoutTemplateService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public WorkoutTemplateService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<WorkoutTemplateDto> CreateTemplateAsync(int coachId, CreateWorkoutTemplateDto dto)
        {
            var template = _mapper.Map<WorkoutTemplate>(dto);
            template.CreatedByCoachId = coachId;
            template.IsActive = true;

            await _unitOfWork.Repository<WorkoutTemplate>().AddAsync(template);
            await _unitOfWork.SaveChangesAsync();

            // Add exercises
            if (dto.Exercises != null && dto.Exercises.Any())
            {
                foreach (var exerciseDto in dto.Exercises)
                {
                    var templateExercise = _mapper.Map<WorkoutTemplateExercise>(exerciseDto);
                    templateExercise.TemplateId = template.TemplateId;
                    await _unitOfWork.Repository<WorkoutTemplateExercise>().AddAsync(templateExercise);
                }
                await _unitOfWork.SaveChangesAsync();
            }

            return await MapToDtoAsync(template);
        }

        public async Task<WorkoutTemplateDto?> GetTemplateByIdAsync(int templateId)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(templateId);
            return template != null ? await MapToDtoAsync(template) : null;
        }

        public async Task<IEnumerable<WorkoutTemplateDto>> GetCoachTemplatesAsync(int coachId)
        {
            var templates = await _unitOfWork.Repository<WorkoutTemplate>().GetAllAsync();
            var coachTemplates = templates.Where(t => t.CreatedByCoachId == coachId)
                                         .OrderByDescending(t => t.CreatedAt);

            var templateDtos = new List<WorkoutTemplateDto>();
            foreach (var template in coachTemplates)
            {
                templateDtos.Add(await MapToDtoAsync(template));
            }
            return templateDtos;
        }

        public async Task<IEnumerable<WorkoutTemplateDto>> GetPublicTemplatesAsync()
        {
            var templates = await _unitOfWork.Repository<WorkoutTemplate>().GetAllAsync();
            var publicTemplates = templates.Where(t => t.IsPublic && t.IsActive)
                                          .OrderByDescending(t => t.CreatedAt);

            var templateDtos = new List<WorkoutTemplateDto>();
            foreach (var template in publicTemplates)
            {
                templateDtos.Add(await MapToDtoAsync(template));
            }
            return templateDtos;
        }

        public async Task<WorkoutTemplateDto?> UpdateTemplateAsync(int templateId, int coachId, UpdateWorkoutTemplateDto dto)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(templateId);
            if (template == null || template.CreatedByCoachId != coachId) return null;

            _mapper.Map(dto, template);
            template.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<WorkoutTemplate>().Update(template);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(template);
        }

        public async Task DeleteTemplateAsync(int templateId, int coachId)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(templateId);
            if (template == null || template.CreatedByCoachId != coachId) return;

            // Delete associated exercises
            var exercises = await _unitOfWork.Repository<WorkoutTemplateExercise>().GetAllAsync();
            var templateExercises = exercises.Where(e => e.TemplateId == templateId);
            foreach (var exercise in templateExercises)
            {
                _unitOfWork.Repository<WorkoutTemplateExercise>().Remove(exercise);
            }

            _unitOfWork.Repository<WorkoutTemplate>().Remove(template);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<WorkoutTemplateDto> MapToDtoAsync(WorkoutTemplate template)
        {
            var coach = await _unitOfWork.Repository<User>().GetByIdAsync(template.CreatedByCoachId);
            var templateExercises = await _unitOfWork.Repository<WorkoutTemplateExercise>().GetAllAsync();
            var exercises = templateExercises.Where(e => e.TemplateId == template.TemplateId)
                                            .OrderBy(e => e.WeekNumber)
                                            .ThenBy(e => e.DayNumber)
                                            .ThenBy(e => e.OrderInDay);

            var dto = _mapper.Map<WorkoutTemplateDto>(template);
            dto.CoachName = coach?.Name ?? "Unknown";

            var exerciseDtos = new List<WorkoutTemplateExerciseDto>();
            foreach (var exercise in exercises)
            {
                var exerciseDetails = await _unitOfWork.Repository<Exercise>().GetByIdAsync(exercise.ExerciseId);
                var exerciseDto = _mapper.Map<WorkoutTemplateExerciseDto>(exercise);
                exerciseDto.ExerciseName = exerciseDetails?.Name;
                exerciseDtos.Add(exerciseDto);
            }
            dto.Exercises = exerciseDtos;

            return dto;
        }
    }
}
