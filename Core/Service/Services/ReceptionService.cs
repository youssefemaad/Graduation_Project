using AutoMapper;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using Shared.DTOs.Reception;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace Service.Services
{
    public class ReceptionService : IReceptionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReceptionService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<CheckInDto?> GetMemberForCheckInAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null || user.Role != IntelliFit.Domain.Enums.UserRole.Member || !user.IsActive)
                return null;

            var memberProfile = await _unitOfWork.Repository<MemberProfile>()
                .GetAllAsync();
            var profile = memberProfile.FirstOrDefault(m => m.UserId == userId);

            // Get active subscription
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var activeSubscription = subscriptions
                .Where(s => s.UserId == userId && s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            string? planName = null;
            if (activeSubscription != null)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSubscription.PlanId);
                planName = plan?.PlanName;
            }

            // Get last visit from bookings
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var lastCheckIn = bookings
                .Where(b => b.UserId == userId && b.CheckInTime.HasValue)
                .OrderByDescending(b => b.CheckInTime)
                .FirstOrDefault();

            // Calculate streak (simplified)
            int currentStreak = await CalculateStreakAsync(userId);
            bool hasActiveStreak = currentStreak > 0;

            // Get today's session
            var today = DateTime.UtcNow.Date;
            var todaySession = bookings
                .Where(b => b.UserId == userId &&
                           b.StartTime.Date == today &&
                           b.CoachId.HasValue &&
                           b.Status != IntelliFit.Domain.Enums.BookingStatus.Cancelled)
                .OrderBy(b => b.StartTime)
                .FirstOrDefault();

            TodaySessionDto? sessionDto = null;
            if (todaySession != null && todaySession.CoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<User>().GetByIdAsync(todaySession.CoachId.Value);
                sessionDto = new TodaySessionDto
                {
                    BookingId = todaySession.BookingId,
                    SessionType = "PT Session",
                    CoachName = coach?.Name ?? "Unknown Coach",
                    StartTime = todaySession.StartTime
                };
            }

            return new CheckInDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                ProfileImageUrl = user.ProfileImageUrl,
                MemberNumber = $"#{user.UserId:D5}",
                SubscriptionPlan = planName,
                IsActive = user.IsActive,
                LastVisit = lastCheckIn?.CheckInTime,
                CurrentStreak = currentStreak,
                HasActiveStreak = hasActiveStreak,
                TodaySession = sessionDto
            };
        }

        public async Task<CheckInDto?> GetMemberByQRCodeAsync(string qrCode)
        {
            // QR code format: "MEMBER-{userId}"
            if (string.IsNullOrEmpty(qrCode) || !qrCode.StartsWith("MEMBER-"))
                return null;

            if (int.TryParse(qrCode.Replace("MEMBER-", ""), out int userId))
            {
                return await GetMemberForCheckInAsync(userId);
            }

            return null;
        }

        public async Task<IEnumerable<MemberSearchDto>> SearchMembersAsync(string searchTerm)
        {
            var users = await _unitOfWork.Repository<User>().GetAllAsync();
            var members = users.Where(u => u.Role == IntelliFit.Domain.Enums.UserRole.Member && u.IsActive);

            // If no search term, return all active members (limited to 10)
            IEnumerable<User> filtered;
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                filtered = members.Take(10);
            }
            else
            {
                // Search by name, email, or member ID
                filtered = members.Where(u =>
                    u.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                    (u.Email != null && u.Email.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)) ||
                    u.UserId.ToString().Contains(searchTerm)
                ).Take(10);
            }

            var result = new List<MemberSearchDto>();
            foreach (var member in filtered)
            {
                var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
                var activeSubscription = subscriptions
                    .Where(s => s.UserId == member.UserId && s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active)
                    .OrderByDescending(s => s.EndDate)
                    .FirstOrDefault();

                string? planName = null;
                if (activeSubscription != null)
                {
                    var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSubscription.PlanId);
                    planName = plan?.PlanName;
                }

                result.Add(new MemberSearchDto
                {
                    UserId = member.UserId,
                    Name = member.Name,
                    Email = member.Email,
                    MemberNumber = $"#{member.UserId:D5}",
                    ProfileImageUrl = member.ProfileImageUrl,
                    SubscriptionPlan = planName,
                    IsActive = member.IsActive
                });
            }

            return result;
        }

        public async Task<IEnumerable<MemberListDto>> GetAllMembersAsync()
        {
            var users = await _unitOfWork.Repository<User>().GetAllAsync();
            var members = users.Where(u => u.Role == IntelliFit.Domain.Enums.UserRole.Member).ToList();

            var result = new List<MemberListDto>();
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var activityFeeds = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();

            foreach (var member in members)
            {
                // Get active subscription
                var activeSubscription = subscriptions
                    .Where(s => s.UserId == member.UserId && s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active)
                    .OrderByDescending(s => s.EndDate)
                    .FirstOrDefault();

                string? planName = null;
                string status = "Active";
                DateTime? membershipEndDate = null;

                if (activeSubscription != null)
                {
                    var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSubscription.PlanId);
                    planName = plan?.PlanName;
                    membershipEndDate = activeSubscription.EndDate;

                    // Determine status based on end date
                    if (membershipEndDate < DateTime.UtcNow)
                    {
                        status = "Expired";
                    }
                    else if (membershipEndDate < DateTime.UtcNow.AddDays(7))
                    {
                        status = "Expiring";
                    }
                }
                else
                {
                    status = member.IsActive ? "Expired" : "Frozen";
                }

                // Get last visit from activity feed
                var lastActivity = activityFeeds
                    .Where(a => a.UserId == member.UserId && a.ActivityType == "Workout")
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefault();

                result.Add(new MemberListDto
                {
                    UserId = member.UserId,
                    Name = member.Name,
                    Email = member.Email ?? string.Empty,
                    Phone = member.Phone ?? string.Empty,
                    MemberNumber = $"#{member.UserId:D5}",
                    ProfileImageUrl = member.ProfileImageUrl,
                    Status = status,
                    MembershipPlan = planName,
                    JoinDate = member.CreatedAt,
                    LastVisit = lastActivity?.CreatedAt
                });
            }

            return result.OrderBy(m => m.Name);
        }

        public async Task<MemberDetailsDto?> GetMemberDetailsAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            // Debug logging
            Console.WriteLine($"[GetMemberDetailsAsync] UserId: {userId}");
            Console.WriteLine($"[GetMemberDetailsAsync] User found: {user != null}");
            if (user != null)
            {
                Console.WriteLine($"[GetMemberDetailsAsync] User.Role: {user.Role}");
                Console.WriteLine($"[GetMemberDetailsAsync] Role as int: {(int)user.Role}");
                Console.WriteLine($"[GetMemberDetailsAsync] Expected Member: {IntelliFit.Domain.Enums.UserRole.Member}");
                Console.WriteLine($"[GetMemberDetailsAsync] Expected Member as int: {(int)IntelliFit.Domain.Enums.UserRole.Member}");
            }

            if (user == null || user.Role != IntelliFit.Domain.Enums.UserRole.Member)
                return null;

            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var payments = await _unitOfWork.Repository<Payment>().GetAllAsync();
            var activityFeeds = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();

            // Get active subscription
            var activeSubscription = subscriptions
                .Where(s => s.UserId == userId && s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            MembershipDetailsDto? membershipDetails = null;
            if (activeSubscription != null)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSubscription.PlanId);
                if (plan != null)
                {
                    var daysRemaining = (int)(activeSubscription.EndDate - DateTime.UtcNow).TotalDays;
                    membershipDetails = new MembershipDetailsDto
                    {
                        PlanName = plan.PlanName,
                        StartDate = activeSubscription.StartDate,
                        EndDate = activeSubscription.EndDate,
                        DaysRemaining = daysRemaining > 0 ? daysRemaining : 0,
                        VisitsLeft = "Unlimited",
                        Status = daysRemaining > 7 ? "Active" : daysRemaining > 0 ? "Expiring" : "Expired"
                    };
                }
            }

            // Get payment summary
            var userPayments = payments.Where(p => p.UserId == userId).OrderByDescending(p => p.CreatedAt).ToList();
            var lastPayment = userPayments.FirstOrDefault();

            PaymentSummaryDto? paymentSummary = null;
            if (lastPayment != null)
            {
                paymentSummary = new PaymentSummaryDto
                {
                    LastAmount = lastPayment.Amount,
                    LastPaymentDate = lastPayment.CreatedAt,
                    PaymentMethod = lastPayment.PaymentMethod.ToString(),
                    OutstandingBalance = 0
                };
            }

            // Get activity history
            var userActivities = activityFeeds
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new ActivityItemDto
                {
                    Id = a.ActivityId,
                    Type = a.ActivityType.ToLower(),
                    Description = a.Description,
                    Timestamp = a.CreatedAt
                })
                .ToList();

            // Add payment activities
            foreach (var payment in userPayments.Take(5))
            {
                userActivities.Add(new ActivityItemDto
                {
                    Id = payment.PaymentId,
                    Type = "payment",
                    Description = $"Payment received - ${payment.Amount}",
                    Timestamp = payment.CreatedAt
                });
            }
            userActivities = userActivities.OrderByDescending(a => a.Timestamp).Take(10).ToList();

            // Determine status
            string status = "Active";
            bool isCurrentlyInside = false;
            DateTime? checkInTime = null;
            DateTime? lastVisit = null;

            var lastActivity = activityFeeds
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefault();

            if (lastActivity != null)
            {
                lastVisit = lastActivity.CreatedAt;
            }

            if (activeSubscription == null || activeSubscription.EndDate < DateTime.UtcNow)
            {
                status = "Expired";
            }
            else if (!user.IsActive)
            {
                status = "Frozen";
            }

            // Build alerts
            var alerts = new List<AlertItemDto>();
            if (membershipDetails != null)
            {
                if (membershipDetails.DaysRemaining <= 7 && membershipDetails.DaysRemaining > 0)
                {
                    alerts.Add(new AlertItemDto
                    {
                        Type = "warning",
                        Message = $"Membership expiring in {membershipDetails.DaysRemaining} days"
                    });
                }
                else if (membershipDetails.DaysRemaining <= 0)
                {
                    alerts.Add(new AlertItemDto
                    {
                        Type = "danger",
                        Message = "Membership has expired"
                    });
                }
            }

            return new MemberDetailsDto
            {
                UserId = user.UserId,
                Name = user.Name,
                MemberNumber = $"#{user.UserId:D5}",
                Email = user.Email ?? string.Empty,
                Phone = user.Phone ?? string.Empty,
                Gender = user.Gender.ToString(),
                DateOfBirth = user.DateOfBirth,
                ProfileImageUrl = user.ProfileImageUrl,
                Status = status,
                IsCurrentlyInside = isCurrentlyInside,
                CheckInTime = checkInTime,
                LastVisit = lastVisit,
                Membership = membershipDetails,
                Payments = paymentSummary,
                Activities = userActivities,
                Notes = new List<string>(),
                Alerts = alerts
            };
        }

        public async Task<bool> CheckInMemberAsync(CheckInRequestDto request)
        {
            // Create activity feed entry
            var activity = new ActivityFeed
            {
                UserId = request.UserId,
                ActivityType = "CheckIn",
                Title = "Checked In",
                Description = string.IsNullOrEmpty(request.AccessArea)
                    ? "Checked In • General Access"
                    : $"Checked In • {request.AccessArea}",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<ActivityFeed>().AddAsync(activity);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CheckOutMemberAsync(CheckOutRequestDto request)
        {
            // Create activity feed entry
            var activity = new ActivityFeed
            {
                UserId = request.UserId,
                ActivityType = "CheckOut",
                Title = "Checked Out",
                Description = "Checked Out",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<ActivityFeed>().AddAsync(activity);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<LiveActivityDto>> GetLiveActivitiesAsync(int limit = 20)
        {
            var activities = await _unitOfWork.Repository<ActivityFeed>().GetAllAsync();
            var recentActivities = activities
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit);

            var result = new List<LiveActivityDto>();
            foreach (var activity in recentActivities)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(activity.UserId);
                if (user != null)
                {
                    result.Add(new LiveActivityDto
                    {
                        ActivityId = activity.ActivityId,
                        UserId = activity.UserId,
                        UserName = user.Name,
                        UserImageUrl = user.ProfileImageUrl,
                        ActivityType = activity.ActivityType,
                        Description = activity.Description ?? activity.Title,
                        CreatedAt = activity.CreatedAt,
                        TimeAgo = GetTimeAgo(activity.CreatedAt)
                    });
                }
            }

            return result;
        }

        public async Task<IEnumerable<AlertDto>> GetActiveAlertsAsync()
        {
            // For now, return mock alerts based on bookings
            var alerts = new List<AlertDto>();

            // Check for late check-outs (bookings that should have ended but no checkout time)
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var lateCheckouts = bookings
                .Where(b => b.CheckInTime.HasValue &&
                           !b.CheckOutTime.HasValue &&
                           b.EndTime < DateTime.UtcNow.AddHours(-1))
                .Take(5);

            int alertId = 1;
            foreach (var booking in lateCheckouts)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
                alerts.Add(new AlertDto
                {
                    AlertId = alertId++,
                    Type = "LateCheckout",
                    Title = "Late Check-out",
                    Description = $"Locker #{booking.BookingId % 100} key not returned (User: {user?.Name ?? "Unknown"})",
                    Severity = "warning",
                    IsRead = false,
                    CreatedAt = booking.EndTime
                });
            }

            return alerts;
        }

        private async Task<int> CalculateStreakAsync(int userId)
        {
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();
            var checkIns = bookings
                .Where(b => b.UserId == userId && b.CheckInTime.HasValue)
                .OrderByDescending(b => b.CheckInTime)
                .Select(b => b.CheckInTime!.Value.Date)
                .Distinct()
                .ToList();

            if (!checkIns.Any())
                return 0;

            int streak = 0;
            var today = DateTime.UtcNow.Date;
            var currentDate = today;

            foreach (var checkInDate in checkIns)
            {
                if (checkInDate == currentDate || checkInDate == currentDate.AddDays(-1))
                {
                    streak++;
                    currentDate = checkInDate.AddDays(-1);
                }
                else
                {
                    break;
                }
            }

            return streak;
        }

        private string GetTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;

            if (timeSpan.TotalMinutes < 1)
                return "just now";
            if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes}m ago";
            if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours}h ago";
            if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays}d ago";

            return dateTime.ToString("MMM dd");
        }

        public async Task<CreateMemberResponseDto> CreateMemberAsync(CreateMemberDto createDto)
        {
            // Check if email already exists
            var existingUser = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == createDto.Email);
            if (existingUser != null)
                throw new InvalidOperationException("A user with this email already exists");

            // Validate plan exists
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(createDto.PlanId);
            if (plan == null)
                throw new KeyNotFoundException($"Subscription plan with ID {createDto.PlanId} not found");

            // 1. Create user (password = nationalId)
            var user = new User
            {
                Email = createDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createDto.NationalId),
                Name = createDto.Name,
                Phone = createDto.Phone,
                DateOfBirth = createDto.DateOfBirth.HasValue
                    ? DateTime.SpecifyKind(createDto.DateOfBirth.Value, DateTimeKind.Utc)
                    : null,
                Gender = createDto.Gender.HasValue
                    ? (IntelliFit.Domain.Enums.GenderType)createDto.Gender.Value
                    : null,
                Address = createDto.Address,
                EmergencyContactName = createDto.EmergencyContactName,
                EmergencyContactPhone = createDto.EmergencyContactPhone,
                Role = IntelliFit.Domain.Enums.UserRole.Member,
                IsActive = true,
                MustChangePassword = true,
                IsFirstLogin = true,
                TokenBalance = plan.TokensIncluded,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // 2. Create member profile
            var memberProfile = new MemberProfile
            {
                UserId = user.UserId,
                SubscriptionPlanId = plan.PlanId,
                MembershipStartDate = DateTime.UtcNow,
                MembershipEndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<MemberProfile>().AddAsync(memberProfile);
            await _unitOfWork.SaveChangesAsync();

            // 3. Create payment record
            var payment = new Payment
            {
                UserId = user.UserId,
                Amount = createDto.Amount,
                PaymentMethod = createDto.PaymentMethod,
                PaymentType = "Subscription",
                Status = IntelliFit.Domain.Enums.PaymentStatus.Completed,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Payment>().AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            // 4. Create subscription
            var subscription = new UserSubscription
            {
                UserId = user.UserId,
                PlanId = plan.PlanId,
                PaymentId = payment.PaymentId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                Status = IntelliFit.Domain.Enums.SubscriptionStatus.Active,
                AutoRenew = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserSubscription>().AddAsync(subscription);
            await _unitOfWork.SaveChangesAsync();

            return new CreateMemberResponseDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                MemberNumber = $"#{user.UserId:D5}",
                SubscriptionPlan = plan.PlanName,
                SubscriptionEndDate = subscription.EndDate,
                Message = "Member created successfully"
            };
        }
    }
}
