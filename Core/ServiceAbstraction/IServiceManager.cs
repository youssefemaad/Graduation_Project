using ServiceAbstraction.Services;
using Core.ServiceAbstraction.Services;
using IntelliFit.ServiceAbstraction;
using IntelliFit.ServiceAbstraction.Services;

namespace ServiceAbstraction
{
    public interface IServiceManager
    {
        public IAuthService AuthService { get; }
        public IUserService UserService { get; }
        public IBookingService BookingService { get; }
        public ISubscriptionService SubscriptionService { get; }
        public IPaymentService PaymentService { get; }
        public IExerciseService ExerciseService { get; }
        public IEquipmentService EquipmentService { get; }
        public IWorkoutPlanService WorkoutPlanService { get; }
        public INutritionPlanService NutritionPlanService { get; }
        public IInBodyService InBodyService { get; }
        public IStatsService StatsService { get; }
        public IMealService MealService { get; }
        public IAIChatService AIChatService { get; }
        public INotificationService NotificationService { get; }
        public IAIService AIService { get; }
        public IWorkoutLogService WorkoutLogService { get; }
        public ICoachReviewService CoachReviewService { get; }
        public ITokenTransactionService TokenTransactionService { get; }
        public IActivityFeedService ActivityFeedService { get; }
        public IUserMilestoneService UserMilestoneService { get; }
        public IWorkoutTemplateService WorkoutTemplateService { get; }
        public IAuditLogService AuditLogService { get; }
        public IReceptionService ReceptionService { get; }
        public IReceptionPaymentService ReceptionPaymentService { get; }

    }
}
