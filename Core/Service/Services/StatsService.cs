using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Stats;

namespace Service.Services
{
    public class StatsService : IStatsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public StatsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<MemberStatsDto> GetMemberStatsAsync(int memberId)
        {
            var member = await _unitOfWork.Repository<User>().GetByIdAsync(memberId);
            if (member == null)
            {
                throw new KeyNotFoundException($"User with ID {memberId} not found");
            }

            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var workoutLogs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var workoutPlans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            var nutritionPlans = await _unitOfWork.Repository<NutritionPlan>().GetAllAsync();
            var inBodyMeasurements = await _unitOfWork.Repository<InBodyMeasurement>().GetAllAsync();

            var memberBookings = bookings.Where(b => b.UserId == memberId).ToList();
            var memberLogs = workoutLogs.Where(w => w.UserId == memberId).ToList();
            var memberWorkoutPlans = workoutPlans.Where(p => p.UserId == memberId && p.IsActive).ToList();
            var memberNutritionPlans = nutritionPlans.Where(p => p.UserId == memberId && p.IsActive).ToList();
            var memberMeasurements = inBodyMeasurements.Where(m => m.UserId == memberId).OrderByDescending(m => m.MeasurementDate).ToList();

            var latestMeasurement = memberMeasurements.FirstOrDefault();
            decimal? latestBmi = null;
            if (latestMeasurement != null && latestMeasurement.Height.HasValue && latestMeasurement.Height.Value > 0)
            {
                latestBmi = (decimal)((double)latestMeasurement.Weight / Math.Pow((double)latestMeasurement.Height.Value / 100.0, 2));
            }

            return new MemberStatsDto
            {
                UserId = memberId,
                UserName = member.Name,
                TokenBalance = member.TokenBalance,
                TotalBookings = memberBookings.Count,
                CompletedBookings = memberBookings.Count(b => b.Status == BookingStatus.Completed),
                ActiveWorkoutPlans = memberWorkoutPlans.Count,
                ActiveNutritionPlans = memberNutritionPlans.Count,
                TotalWorkoutsCompleted = memberLogs.Count(w => w.Completed),
                InBodyMeasurements = memberMeasurements.Count,
                CurrentWeight = latestMeasurement?.Weight,
                CurrentBodyFat = latestMeasurement?.BodyFatPercentage,
                LatestBmi = latestBmi,
                LastInBodyDate = latestMeasurement?.MeasurementDate,
                LastBookingDate = memberBookings.OrderByDescending(b => b.StartTime).FirstOrDefault()?.StartTime,
                ActiveSubscriptionId = null, // Subscription logic can be added later
                SubscriptionEndDate = null
            };
        }

        public async Task<CoachStatsDto> GetCoachStatsAsync(int coachId)
        {
            var coachProfile = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(coachId);
            if (coachProfile == null)
            {
                throw new KeyNotFoundException($"Coach profile with ID {coachId} not found");
            }

            var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coachProfile.UserId);
            var workoutPlans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            var nutritionPlans = await _unitOfWork.Repository<NutritionPlan>().GetAllAsync();
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var reviews = await _unitOfWork.Repository<CoachReview>().GetAllAsync();

            var coachWorkoutPlans = workoutPlans.Where(p => p.GeneratedByCoachId == coachId).ToList();
            var coachNutritionPlans = nutritionPlans.Where(p => p.GeneratedByCoachId == coachId).ToList();
            var coachBookings = bookings.Where(b => b.CoachId == coachId).ToList();
            var coachReviews = reviews.Where(r => r.CoachId == coachId).ToList();

            var totalClients = workoutPlans.Where(p => p.GeneratedByCoachId == coachId).Select(p => p.UserId).Distinct().Count();
            var avgRating = coachReviews.Any() ? (decimal)coachReviews.Average(r => r.Rating) : 0m;
            var nextBooking = coachBookings.Where(b => b.StartTime > DateTime.UtcNow && b.Status == BookingStatus.Confirmed).OrderBy(b => b.StartTime).FirstOrDefault();

            return new CoachStatsDto
            {
                CoachId = coachId,
                CoachName = coachUser?.Name ?? "Unknown",
                TotalClients = totalClients,
                ActiveWorkoutPlans = coachWorkoutPlans.Count(p => p.IsActive),
                ActiveNutritionPlans = coachNutritionPlans.Count(p => p.IsActive),
                TotalBookings = coachBookings.Count,
                CompletedBookings = coachBookings.Count(b => b.Status == BookingStatus.Completed),
                UpcomingBookings = coachBookings.Count(b => b.StartTime > DateTime.UtcNow && b.Status == BookingStatus.Confirmed),
                AverageRating = avgRating,
                TotalReviews = coachReviews.Count,
                TotalEarnings = 0m, // Can be calculated from bookings/tokens
                TokensEarned = coachBookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TokensCost),
                NextBookingDate = nextBooking?.StartTime
            };
        }

        public async Task<ReceptionStatsDto> GetReceptionStatsAsync()
        {
            var users = await _unitOfWork.Repository<User>().GetAllAsync();
            var members = users.Where(u => u.Role == UserRole.Member).ToList();
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var equipment = await _unitOfWork.Repository<Equipment>().GetAllAsync();
            var inBodyMeasurements = await _unitOfWork.Repository<InBodyMeasurement>().GetAllAsync();
            var payments = await _unitOfWork.Repository<Payment>().GetAllAsync();

            var today = DateTime.Today;
            var todayBookings = bookings.Where(b => b.StartTime.Date == today).ToList();
            var totalMembers = members.Count();
            var activeMembers = members.Count(m => m.IsActive);
            var availableEquipment = equipment.Count(e => e.Status == EquipmentStatus.Available);
            var inUseEquipment = equipment.Count(e => e.Status == EquipmentStatus.InUse);
            var maintenanceEquipment = equipment.Count(e => e.Status == EquipmentStatus.UnderMaintenance);
            var todayInBodyTests = inBodyMeasurements.Count(m => m.MeasurementDate.Date == today);

            var todayPayments = payments.Where(p => p.CreatedAt.Date == today && p.Status == PaymentStatus.Completed);
            var todayRevenue = todayPayments.Sum(p => p.Amount);

            return new ReceptionStatsDto
            {
                TotalMembers = totalMembers,
                ActiveMembers = activeMembers,
                TodayCheckIns = todayBookings.Count(b => b.CheckInTime.HasValue),
                TodayBookings = todayBookings.Count,
                PendingBookings = bookings.Count(b => b.Status == BookingStatus.Pending),
                AvailableEquipment = availableEquipment,
                InUseEquipment = inUseEquipment,
                MaintenanceEquipment = maintenanceEquipment,
                TodayInBodyTests = todayInBodyTests,
                TodayRevenue = todayRevenue,
                ActiveSubscriptions = 0, // Can be added when subscription entity is available
                ExpiringSubscriptions = 0
            };
        }
    }
}
