using ServiceAbstraction;
using ServiceAbstraction.Services;
using Core.ServiceAbstraction.Services;
using IntelliFit.ServiceAbstraction;
using IntelliFit.ServiceAbstraction.Services;
using DomainLayer.Contracts;
using Service.Services;
using IntelliFit.Service.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using IntelliFit.Presentation.Hubs;
using AutoMapper;
using Microsoft.Extensions.Caching.Memory;

namespace Service
{
    public class ServiceManager : IServiceManager
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIService> _aiLogger;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _memoryCache;
        private readonly ILoggerFactory _loggerFactory;

        // Lazy-loaded services
        private readonly Lazy<IAuthService> _lazyAuthService;
        private readonly Lazy<IUserService> _lazyUserService;
        private readonly Lazy<ITokenTransactionService> _lazyTokenTransactionService;
        private readonly Lazy<IEquipmentTimeSlotService> _lazyEquipmentTimeSlotService;
        private Lazy<IBookingService>? _lazyBookingService;
        private readonly Lazy<ISubscriptionService> _lazySubscriptionService;
        private readonly Lazy<IPaymentService> _lazyPaymentService;
        private readonly Lazy<IExerciseService> _lazyExerciseService;
        private readonly Lazy<IEquipmentService> _lazyEquipmentService;
        private readonly Lazy<IWorkoutPlanService> _lazyWorkoutPlanService;
        private readonly Lazy<INutritionPlanService> _lazyNutritionPlanService;
        private readonly Lazy<IInBodyService> _lazyInBodyService;
        private readonly Lazy<IStatsService> _lazyStatsService;
        private readonly Lazy<IMealService> _lazyMealService;
        private readonly Lazy<IAIChatService> _lazyAIChatService;
        private readonly Lazy<INotificationService> _lazyNotificationService;
        private readonly Lazy<IAIService> _lazyAIService;
        private readonly Lazy<IWorkoutLogService> _lazyWorkoutLogService;
        private readonly Lazy<ICoachReviewService> _lazyCoachReviewService;
        private readonly Lazy<IActivityFeedService> _lazyActivityFeedService;
        private readonly Lazy<IUserMilestoneService> _lazyUserMilestoneService;
        private readonly Lazy<IWorkoutTemplateService> _lazyWorkoutTemplateService;
        private readonly Lazy<IAuditLogService> _lazyAuditLogService;
        private readonly Lazy<IReceptionService> _lazyReceptionService;
        private readonly Lazy<IReceptionPaymentService> _lazyReceptionPaymentService;

        public ServiceManager(
            IUnitOfWork unitOfWork,
            ITokenService tokenService,
            IConfiguration configuration,
            ILogger<AIService> aiLogger,
            IHubContext<NotificationHub> hubContext,
            IMapper mapper,
            IMemoryCache memoryCache,
            ILoggerFactory loggerFactory)
        {
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
            _configuration = configuration;
            _aiLogger = aiLogger;
            _hubContext = hubContext;
            _mapper = mapper;
            _memoryCache = memoryCache;
            _loggerFactory = loggerFactory;

            // Initialize lazy services
            _lazyAuthService = new Lazy<IAuthService>(() => new AuthService(_unitOfWork, _tokenService));
            _lazyUserService = new Lazy<IUserService>(() => new UserService(_unitOfWork));
            _lazyTokenTransactionService = new Lazy<ITokenTransactionService>(() => new TokenTransactionService(_unitOfWork, _mapper));
            _lazyEquipmentTimeSlotService = new Lazy<IEquipmentTimeSlotService>(() => 
                new EquipmentTimeSlotService(_unitOfWork, _memoryCache, _loggerFactory.CreateLogger<EquipmentTimeSlotService>()));
            _lazySubscriptionService = new Lazy<ISubscriptionService>(() => new SubscriptionService(_unitOfWork));
            _lazyPaymentService = new Lazy<IPaymentService>(() => new PaymentService(_unitOfWork, _mapper));
            _lazyExerciseService = new Lazy<IExerciseService>(() => new ExerciseService(_unitOfWork));
            _lazyEquipmentService = new Lazy<IEquipmentService>(() => new EquipmentService(_unitOfWork));
            _lazyWorkoutPlanService = new Lazy<IWorkoutPlanService>(() => new WorkoutPlanService(_unitOfWork));
            _lazyNutritionPlanService = new Lazy<INutritionPlanService>(() => new NutritionPlanService(_unitOfWork));
            _lazyInBodyService = new Lazy<IInBodyService>(() => new InBodyService(_unitOfWork));
            _lazyStatsService = new Lazy<IStatsService>(() => new StatsService(_unitOfWork));
            _lazyMealService = new Lazy<IMealService>(() => new MealService(_unitOfWork));
            _lazyAIChatService = new Lazy<IAIChatService>(() => new AIChatService(_unitOfWork));
            _lazyNotificationService = new Lazy<INotificationService>(() => new NotificationService(_hubContext, _unitOfWork, _mapper));
            _lazyAIService = new Lazy<IAIService>(() => new AIService(_configuration, _aiLogger));
            _lazyWorkoutLogService = new Lazy<IWorkoutLogService>(() => new WorkoutLogService(_unitOfWork, _mapper));
            _lazyCoachReviewService = new Lazy<ICoachReviewService>(() => new CoachReviewService(_unitOfWork, _mapper));
            _lazyActivityFeedService = new Lazy<IActivityFeedService>(() => new ActivityFeedService(_unitOfWork, _mapper));
            _lazyUserMilestoneService = new Lazy<IUserMilestoneService>(() => new UserMilestoneService(_unitOfWork, _mapper));
            _lazyWorkoutTemplateService = new Lazy<IWorkoutTemplateService>(() => new WorkoutTemplateService(_unitOfWork, _mapper));
            _lazyAuditLogService = new Lazy<IAuditLogService>(() => new AuditLogService(_unitOfWork, _mapper));
            _lazyReceptionService = new Lazy<IReceptionService>(() => new ReceptionService(_unitOfWork, _mapper));
            _lazyReceptionPaymentService = new Lazy<IReceptionPaymentService>(() => new ReceptionPaymentService(_unitOfWork, _mapper));
        }

        // BookingService needs TokenTransactionService and EquipmentTimeSlotService - initialize with factory getter
        private Lazy<IBookingService> LazyBookingService => 
            _lazyBookingService ??= new Lazy<IBookingService>(() => 
                new BookingService(
                    _unitOfWork, 
                    _mapper, 
                    _lazyTokenTransactionService.Value, 
                    _lazyEquipmentTimeSlotService.Value,
                    _loggerFactory.CreateLogger<BookingService>()));

        // Public service properties
        public IAuthService AuthService => _lazyAuthService.Value;
        public IUserService UserService => _lazyUserService.Value;
        public IBookingService BookingService => LazyBookingService.Value;
        public ISubscriptionService SubscriptionService => _lazySubscriptionService.Value;
        public IPaymentService PaymentService => _lazyPaymentService.Value;
        public IExerciseService ExerciseService => _lazyExerciseService.Value;
        public IEquipmentService EquipmentService => _lazyEquipmentService.Value;
        public IWorkoutPlanService WorkoutPlanService => _lazyWorkoutPlanService.Value;
        public INutritionPlanService NutritionPlanService => _lazyNutritionPlanService.Value;
        public IInBodyService InBodyService => _lazyInBodyService.Value;
        public IStatsService StatsService => _lazyStatsService.Value;
        public IMealService MealService => _lazyMealService.Value;
        public IAIChatService AIChatService => _lazyAIChatService.Value;
        public INotificationService NotificationService => _lazyNotificationService.Value;
        public IAIService AIService => _lazyAIService.Value;
        public IWorkoutLogService WorkoutLogService => _lazyWorkoutLogService.Value;
        public ICoachReviewService CoachReviewService => _lazyCoachReviewService.Value;
        public ITokenTransactionService TokenTransactionService => _lazyTokenTransactionService.Value;
        public IActivityFeedService ActivityFeedService => _lazyActivityFeedService.Value;
        public IUserMilestoneService UserMilestoneService => _lazyUserMilestoneService.Value;
        public IWorkoutTemplateService WorkoutTemplateService => _lazyWorkoutTemplateService.Value;
        public IAuditLogService AuditLogService => _lazyAuditLogService.Value;
        public IReceptionService ReceptionService => _lazyReceptionService.Value;
        public IReceptionPaymentService ReceptionPaymentService => _lazyReceptionPaymentService.Value;
    }
}

