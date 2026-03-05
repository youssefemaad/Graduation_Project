using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Subscription;

namespace Service.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubscriptionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<SubscriptionPlanDto>> GetAllPlansAsync()
        {
            var plans = await _unitOfWork.Repository<SubscriptionPlan>().GetAllAsync();
            return plans.Select(MapToPlanDto);
        }

        public async Task<SubscriptionPlanDto?> GetPlanByIdAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            return plan == null ? null : MapToPlanDto(plan);
        }

        public async Task<IEnumerable<SubscriptionPlanDto>> GetActivePlansAsync()
        {
            var plans = await _unitOfWork.Repository<SubscriptionPlan>()
                .FindAsync(p => p.IsActive);
            return plans.Select(MapToPlanDto);
        }

        public async Task CreateUserSubscriptionAsync(CreateSubscriptionDto createDto)
        {
            // Verify plan exists
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(createDto.PlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Subscription plan with ID {createDto.PlanId} not found");
            }

            // Verify payment exists
            var payment = await _unitOfWork.Repository<Payment>().GetByIdAsync(createDto.PaymentId);
            if (payment == null)
            {
                throw new KeyNotFoundException($"Payment with ID {createDto.PaymentId} not found");
            }

            var subscription = new UserSubscription
            {
                UserId = createDto.UserId,
                PlanId = createDto.PlanId,
                PaymentId = createDto.PaymentId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                Status = IntelliFit.Domain.Enums.SubscriptionStatus.Active,
                AutoRenew = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserSubscription>().AddAsync(subscription);
            await _unitOfWork.SaveChangesAsync();

            // Add tokens to user balance
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user != null)
            {
                user.TokenBalance += plan.TokensIncluded;
                _unitOfWork.Repository<User>().Update(user);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task<bool> HasActiveSubscriptionAsync(int userId)
        {
            return await _unitOfWork.Repository<UserSubscription>()
                .AnyAsync(s => s.UserId == userId &&
                              s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                              s.EndDate > DateTime.UtcNow);
        }

        public async Task<UserSubscriptionDetailsDto?> GetUserSubscriptionDetailsAsync(int userId)
        {
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var activeSub = subscriptions
                .Where(s => s.UserId == userId &&
                           s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                           s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            if (activeSub == null) return null;

            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSub.PlanId);
            if (plan == null) return null;

            return new UserSubscriptionDetailsDto
            {
                SubscriptionId = activeSub.SubscriptionId,
                UserId = activeSub.UserId,
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                Description = plan.Description,
                Features = plan.Features,
                Price = plan.Price,
                TokensIncluded = plan.TokensIncluded,
                StartDate = activeSub.StartDate,
                EndDate = activeSub.EndDate,
                DaysRemaining = Math.Max(0, (activeSub.EndDate - DateTime.UtcNow).Days),
                Status = activeSub.Status.ToString(),
                AutoRenew = activeSub.AutoRenew
            };
        }

        private SubscriptionPlanDto MapToPlanDto(SubscriptionPlan plan)
        {
            return new SubscriptionPlanDto
            {
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                Price = plan.Price,
                DurationDays = plan.DurationDays,
                Description = plan.Description,
                TokensIncluded = plan.TokensIncluded,
                Features = plan.Features,
                MaxBookingsPerDay = plan.MaxBookingsPerDay,
                IsPopular = plan.IsPopular,
                IsActive = plan.IsActive
            };
        }
    }
}
