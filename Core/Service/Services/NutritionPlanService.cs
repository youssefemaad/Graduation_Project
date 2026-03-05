using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.NutritionPlan;

namespace Service.Services
{
    public class NutritionPlanService : INutritionPlanService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NutritionPlanService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<NutritionPlanDto>> GetMemberPlansAsync(int memberId)
        {
            var plans = await _unitOfWork.Repository<NutritionPlan>().GetAllAsync();
            var member = await _unitOfWork.Repository<User>().GetByIdAsync(memberId);

            var result = new List<NutritionPlanDto>();

            foreach (var plan in plans.Where(p => p.UserId == memberId && p.IsActive))
            {
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

                result.Add(new NutritionPlanDto
                {
                    PlanId = plan.PlanId,
                    MemberId = memberId,
                    MemberName = member?.Name ?? "Unknown",
                    PlanName = plan.PlanName,
                    Description = plan.Description,
                    CreatedByCoachId = plan.GeneratedByCoachId,
                    CoachName = coachName,
                    CreatedByAiAgentId = null,
                    StartDate = plan.StartDate ?? DateTime.Today,
                    EndDate = plan.EndDate,
                    DailyCalories = plan.DailyCalories,
                    ProteinGrams = plan.ProteinGrams,
                    CarbsGrams = plan.CarbsGrams,
                    FatGrams = plan.FatsGrams,
                    Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                    StatusText = plan.Status,
                    IsActive = plan.IsActive,
                    CreatedAt = plan.CreatedAt
                });
            }

            return result;
        }

        public async Task<NutritionPlanDto?> GetPlanDetailsAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null) return null;

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(plan.UserId);

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

            return new NutritionPlanDto
            {
                PlanId = plan.PlanId,
                MemberId = plan.UserId,
                MemberName = member?.Name ?? "Unknown",
                PlanName = plan.PlanName,
                Description = plan.Description,
                CreatedByCoachId = plan.GeneratedByCoachId,
                CoachName = coachName,
                CreatedByAiAgentId = null,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                DailyCalories = plan.DailyCalories,
                ProteinGrams = plan.ProteinGrams,
                CarbsGrams = plan.CarbsGrams,
                FatGrams = plan.FatsGrams,
                Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                StatusText = plan.Status,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<NutritionPlanDto> GeneratePlanAsync(GenerateNutritionPlanDto generateDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(generateDto.MemberId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {generateDto.MemberId} not found");
            }

            var plan = new NutritionPlan
            {
                UserId = generateDto.MemberId,
                PlanName = generateDto.PlanName,
                Description = generateDto.Description ?? $"Generated based on goal: {generateDto.FitnessGoal}",
                DailyCalories = generateDto.DailyCalories ?? 2000,
                ProteinGrams = generateDto.ProteinGrams ?? 150,
                CarbsGrams = generateDto.CarbsGrams ?? 200,
                FatsGrams = generateDto.FatGrams ?? 65,
                GeneratedByCoachId = generateDto.CreatedByCoachId,
                AiPrompt = $"Goal: {generateDto.FitnessGoal}, Restrictions: {generateDto.DietaryRestrictions}",
                Status = "Active",
                IsActive = true,
                StartDate = generateDto.StartDate,
                EndDate = generateDto.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<NutritionPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetPlanDetailsAsync(plan.PlanId))!;
        }

        public async Task<NutritionPlanDto> UpdatePlanAsync(int planId, GenerateNutritionPlanDto updateDto)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Nutrition plan with ID {planId} not found");
            }

            plan.PlanName = updateDto.PlanName;
            plan.Description = updateDto.Description ?? plan.Description;
            plan.DailyCalories = updateDto.DailyCalories ?? plan.DailyCalories;
            plan.ProteinGrams = updateDto.ProteinGrams ?? plan.ProteinGrams;
            plan.CarbsGrams = updateDto.CarbsGrams ?? plan.CarbsGrams;
            plan.FatsGrams = updateDto.FatGrams ?? plan.FatsGrams;
            plan.AiPrompt = $"Goal: {updateDto.FitnessGoal}, Restrictions: {updateDto.DietaryRestrictions}";
            plan.StartDate = updateDto.StartDate;
            plan.EndDate = updateDto.EndDate;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<NutritionPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetPlanDetailsAsync(planId))!;
        }

        public async Task<NutritionPlanDto> DeactivatePlanAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Nutrition plan with ID {planId} not found");
            }

            plan.IsActive = false;
            plan.Status = "Inactive";
            plan.EndDate = DateTime.Today;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<NutritionPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetPlanDetailsAsync(planId))!;
        }
    }
}
