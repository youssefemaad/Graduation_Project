using AutoMapper;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using IntelliFit.Shared.DTOs.WorkoutPlan;
using IntelliFit.Shared.DTOs.User;
using IntelliFit.Shared.DTOs.Payment;
using Shared.DTOs.Booking;
using Shared.DTOs.Payment;

namespace Service.MappingProfiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // WorkoutLog mappings
            CreateMap<WorkoutLog, WorkoutLogDto>()
                .ForMember(dest => dest.PlanId, opt => opt.MapFrom(src => src.PlanId ?? 0))
                .ForMember(dest => dest.DurationMinutes, opt => opt.MapFrom(src => src.DurationMinutes ?? 0))
                .ForMember(dest => dest.CaloriesBurned, opt => opt.MapFrom(src => src.CaloriesBurned ?? 0));

            CreateMap<CreateWorkoutLogDto, WorkoutLog>()
                .ForMember(dest => dest.LogId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateWorkoutLogDto, WorkoutLog>()
                .ForMember(dest => dest.LogId, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // CoachReview mappings
            CreateMap<CoachReview, CoachReviewDto>();

            CreateMap<CreateCoachReviewDto, CoachReview>()
                .ForMember(dest => dest.ReviewId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateCoachReviewDto, CoachReview>()
                .ForMember(dest => dest.ReviewId, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CoachId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Notification mappings with enum conversion
            CreateMap<Notification, NotificationDto>()
                .ForMember(dest => dest.NotificationType, opt => opt.MapFrom(src => src.NotificationType.ToString()));

            CreateMap<CreateNotificationDto, Notification>()
                .ForMember(dest => dest.NotificationId, opt => opt.Ignore())
                .ForMember(dest => dest.NotificationType, opt => opt.MapFrom(src => Enum.Parse<NotificationType>(src.NotificationType)))
                .ForMember(dest => dest.IsRead, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // TokenTransaction mappings with enum conversion
            CreateMap<TokenTransaction, TokenTransactionDto>()
                .ForMember(dest => dest.TransactionType, opt => opt.MapFrom(src => src.TransactionType.ToString()));

            CreateMap<CreateTokenTransactionDto, TokenTransaction>()
                .ForMember(dest => dest.TransactionId, opt => opt.Ignore())
                .ForMember(dest => dest.TransactionType, opt => opt.MapFrom(src => Enum.Parse<TransactionType>(src.TransactionType)))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // ActivityFeed mappings
            CreateMap<ActivityFeed, ActivityFeedDto>()
                .ForMember(dest => dest.UserName, opt => opt.Ignore()); // Will be set manually

            CreateMap<CreateActivityFeedDto, ActivityFeed>()
                .ForMember(dest => dest.ActivityId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // UserMilestone mappings
            CreateMap<UserMilestone, UserMilestoneDto>();

            CreateMap<UpdateUserMilestoneProgressDto, UserMilestone>()
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.MilestoneId, opt => opt.Ignore())
                .ForMember(dest => dest.UserMilestoneId, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<CompleteMilestoneDto, UserMilestone>()
                .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.IsCompleted, opt => opt.MapFrom(src => true));

            // WorkoutTemplate mappings
            CreateMap<WorkoutTemplate, WorkoutTemplateDto>()
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description ?? string.Empty))
                .ForMember(dest => dest.DifficultyLevel, opt => opt.MapFrom(src => src.DifficultyLevel ?? string.Empty))
                .ForMember(dest => dest.CoachName, opt => opt.Ignore()) // Will be set manually
                .ForMember(dest => dest.Exercises, opt => opt.Ignore()); // Will be set manually

            CreateMap<CreateWorkoutTemplateDto, WorkoutTemplate>()
                .ForMember(dest => dest.TemplateId, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateWorkoutTemplateDto, WorkoutTemplate>()
                .ForMember(dest => dest.TemplateId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByCoachId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<WorkoutTemplateExercise, WorkoutTemplateExerciseDto>();
            CreateMap<WorkoutTemplateExerciseDto, WorkoutTemplateExercise>();

            // AuditLog mappings
            CreateMap<AuditLog, AuditLogDto>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId ?? 0))
                .ForMember(dest => dest.RecordId, opt => opt.MapFrom(src => src.RecordId ?? 0))
                .ForMember(dest => dest.UserName, opt => opt.Ignore()); // Will be set manually

            CreateMap<CreateAuditLogDto, AuditLog>()
                .ForMember(dest => dest.LogId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // Booking mappings
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.UserName, opt => opt.Ignore()) // Will be set manually
                .ForMember(dest => dest.EquipmentName, opt => opt.Ignore()) // Will be set manually
                .ForMember(dest => dest.CoachName, opt => opt.Ignore()) // Will be set manually
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => (int)src.Status))
                .ForMember(dest => dest.StatusText, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.BookingId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => BookingStatus.Confirmed))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // Payment mappings
            CreateMap<Payment, PaymentDto>()
                .ForMember(dest => dest.UserName, opt => opt.Ignore()) // Will be set manually
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => (int)src.Status))
                .ForMember(dest => dest.StatusText, opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<CreatePaymentDto, Payment>()
                .ForMember(dest => dest.PaymentId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => PaymentStatus.Completed))
                .ForMember(dest => dest.TransactionReference, opt => opt.MapFrom(src => src.TransactionId))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        }
    }
}
