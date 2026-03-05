using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutPlan;

namespace Service.Services
{
    public class WorkoutPlanService : IWorkoutPlanService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WorkoutPlanService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<WorkoutPlanDto>> GetAllTemplatesAsync()
        {
            var templates = await _unitOfWork.Repository<WorkoutTemplate>().GetAllAsync();

            return templates
                .Where(t => t.IsActive && t.IsPublic)
                .Select(MapTemplateToDto);
        }

        public async Task<WorkoutPlanDto?> GetPlanByIdAsync(int planId)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(planId);
            return template == null ? null : MapTemplateToDto(template);
        }

        public async Task<IEnumerable<MemberWorkoutPlanDto>> GetMemberPlansAsync(int memberId)
        {
            var plans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            var userPlans = plans.Where(p => p.UserId == memberId && p.IsActive);

            var result = new List<MemberWorkoutPlanDto>();
            var member = await _unitOfWork.Repository<User>().GetByIdAsync(memberId);

            foreach (var plan in userPlans)
            {
                var logs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
                var completedWorkouts = logs.Count(l => l.PlanId == plan.PlanId && l.Completed);
                var totalWorkouts = (plan.DurationWeeks ?? 4) * 3;

                string? coachName = null;
                if (plan.GeneratedByCoachId.HasValue)
                {
                    var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(plan.GeneratedByCoachId.Value);
                    if (coach != null)
                    {
                        var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                        coachName = coachUser?.Name;
                    }
                }

                result.Add(new MemberWorkoutPlanDto
                {
                    MemberPlanId = plan.PlanId,
                    MemberId = memberId,
                    MemberName = member?.Name ?? "Unknown",
                    PlanId = plan.PlanId,
                    PlanName = plan.PlanName,
                    AssignedByCoachId = plan.GeneratedByCoachId,
                    CoachName = coachName,
                    StartDate = plan.StartDate ?? DateTime.Today,
                    EndDate = plan.EndDate,
                    Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                    StatusText = plan.Status,
                    CompletedWorkouts = completedWorkouts,
                    TotalWorkouts = totalWorkouts,
                    Notes = null,
                    CreatedAt = plan.CreatedAt
                });
            }

            return result;
        }

        public async Task<MemberWorkoutPlanDto?> GetMemberPlanDetailsAsync(int memberPlanId)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null) return null;

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(plan.UserId);
            var logs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var completedWorkouts = logs.Count(l => l.PlanId == plan.PlanId && l.Completed);
            var totalWorkouts = (plan.DurationWeeks ?? 4) * 3;

            string? coachName = null;
            if (plan.GeneratedByCoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(plan.GeneratedByCoachId.Value);
                if (coach != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                    coachName = coachUser?.Name;
                }
            }

            return new MemberWorkoutPlanDto
            {
                MemberPlanId = plan.PlanId,
                MemberId = plan.UserId,
                MemberName = member?.Name ?? "Unknown",
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                AssignedByCoachId = plan.GeneratedByCoachId,
                CoachName = coachName,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                StatusText = plan.Status,
                CompletedWorkouts = completedWorkouts,
                TotalWorkouts = totalWorkouts,
                Notes = null,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<MemberWorkoutPlanDto> AssignPlanToMemberAsync(AssignWorkoutPlanDto assignDto)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(assignDto.PlanId);
            if (template == null)
            {
                throw new KeyNotFoundException($"Workout template with ID {assignDto.PlanId} not found");
            }

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(assignDto.MemberId);
            if (member == null)
            {
                throw new KeyNotFoundException($"User with ID {assignDto.MemberId} not found");
            }

            var plan = new WorkoutPlan
            {
                UserId = assignDto.MemberId,
                PlanName = template.TemplateName,
                Description = template.Description,
                PlanType = "Coach Assigned",
                DifficultyLevel = template.DifficultyLevel,
                DurationWeeks = template.DurationWeeks,
                Schedule = $"{template.WorkoutsPerWeek} workouts per week",
                GeneratedByCoachId = assignDto.AssignedByCoachId,
                Status = "Active",
                // Explicitly set IsActive = true when assigning a plan to a member
                // The model default is false for safety, but assigned plans should be active
                IsActive = true,
                StartDate = assignDto.StartDate,
                EndDate = assignDto.EndDate ?? assignDto.StartDate.AddDays(template.DurationWeeks * 7),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WorkoutPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            string? coachName = null;
            if (assignDto.AssignedByCoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(assignDto.AssignedByCoachId.Value);
                if (coach != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                    coachName = coachUser?.Name;
                }
            }

            return new MemberWorkoutPlanDto
            {
                MemberPlanId = plan.PlanId,
                MemberId = assignDto.MemberId,
                MemberName = member.Name,
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                AssignedByCoachId = assignDto.AssignedByCoachId,
                CoachName = coachName,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                Status = 1,
                StatusText = "Active",
                CompletedWorkouts = 0,
                TotalWorkouts = template.DurationWeeks * template.WorkoutsPerWeek,
                Notes = assignDto.Notes,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<MemberWorkoutPlanDto> UpdateProgressAsync(int memberPlanId, UpdateProgressDto progressDto)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Workout plan with ID {memberPlanId} not found");
            }

            // Simply update completed workouts count - frontend tracks this
            plan.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetMemberPlanDetailsAsync(memberPlanId))!;
        }

        public async Task<MemberWorkoutPlanDto> CompletePlanAsync(int memberPlanId)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Workout plan with ID {memberPlanId} not found");
            }

            plan.Status = "Completed";
            plan.EndDate = DateTime.Today;
            plan.IsActive = false;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetMemberPlanDetailsAsync(memberPlanId))!;
        }

        private WorkoutPlanDto MapTemplateToDto(WorkoutTemplate template)
        {
            // Map difficulty level string to int
            int difficultyInt = template.DifficultyLevel?.ToLower() switch
            {
                "beginner" => 1,
                "intermediate" => 2,
                "advanced" => 3,
                _ => 2 // Default to intermediate
            };

            return new WorkoutPlanDto
            {
                PlanId = template.TemplateId,
                PlanName = template.TemplateName,
                Description = template.Description,
                CreatedByCoachId = template.CreatedByCoachId,
                CoachName = null, // Could resolve if needed
                DurationWeeks = template.DurationWeeks,
                DifficultyLevel = difficultyInt,
                Goals = null,
                IsTemplate = true,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt
            };
        }
    }
}
