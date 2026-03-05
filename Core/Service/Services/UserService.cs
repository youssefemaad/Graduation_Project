using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.User;
using System.Text.Json;

namespace Service.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == email);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            user.Name = updateDto.Name;
            user.Phone = updateDto.Phone;
            user.DateOfBirth = updateDto.DateOfBirth;
            user.Gender = updateDto.Gender.HasValue ? (GenderType)updateDto.Gender.Value : null;
            user.ProfileImageUrl = updateDto.ProfileImageUrl;
            user.Address = updateDto.Address;
            user.EmergencyContactName = updateDto.EmergencyContactName;
            user.EmergencyContactPhone = updateDto.EmergencyContactPhone;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return MapToUserDto(user);
        }

        public async Task<bool> DeactivateUserAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                return false;
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<int> GetTokenBalanceAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user?.TokenBalance ?? 0;
        }

        public async Task UpdateTokenBalanceAsync(int userId, int amount)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            user.TokenBalance += amount;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<UserDto>> GetCoachesListAsync()
        {
            // Get all users with Coach role
            var coaches = await _unitOfWork.Repository<User>()
                .FindAsync(u => u.Role == UserRole.Coach && u.IsActive);
            return coaches.Select(c => MapToUserDto(c));
        }

        public async Task<IEnumerable<CoachDto>> GetCoachesWithProfilesAsync()
        {
            // Get all users with Coach role
            var coaches = await _unitOfWork.Repository<User>()
                .FindAsync(u => u.Role == UserRole.Coach && u.IsActive);

            var coachDtos = new List<CoachDto>();
            foreach (var coach in coaches)
            {
                // Get the coach profile
                var coachProfile = await _unitOfWork.Repository<CoachProfile>()
                    .FirstOrDefaultAsync(cp => cp.UserId == coach.UserId);

                coachDtos.Add(new CoachDto
                {
                    UserId = coach.UserId,
                    Email = coach.Email,
                    Name = coach.Name,
                    Phone = coach.Phone,
                    DateOfBirth = coach.DateOfBirth,
                    Gender = coach.Gender.HasValue ? (int)coach.Gender.Value : null,
                    Role = coach.Role.ToString(),
                    ProfileImageUrl = coach.ProfileImageUrl,
                    Address = coach.Address,
                    TokenBalance = coach.TokenBalance,
                    IsActive = coach.IsActive,
                    EmailVerified = coach.EmailVerified,
                    LastLoginAt = coach.LastLoginAt,
                    CreatedAt = coach.CreatedAt,
                    // Coach profile fields
                    CoachProfileId = coachProfile?.Id ?? 0,
                    Specialization = coachProfile?.Specialization,
                    Certifications = coachProfile?.Certifications,
                    ExperienceYears = coachProfile?.ExperienceYears,
                    Bio = coachProfile?.Bio,
                    HourlyRate = coachProfile?.HourlyRate,
                    Rating = coachProfile?.Rating ?? 0,
                    TotalReviews = coachProfile?.TotalReviews ?? 0,
                    TotalClients = coachProfile?.TotalClients ?? 0,
                    AvailabilitySchedule = coachProfile?.AvailabilitySchedule,
                    IsAvailable = coachProfile?.IsAvailable ?? false
                });
            }

            return coachDtos;
        }

        private UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender.HasValue ? (int)user.Gender.Value : null,
                Role = user.Role.ToString(),
                ProfileImageUrl = user.ProfileImageUrl,
                Address = user.Address,
                TokenBalance = user.TokenBalance,
                IsActive = user.IsActive,
                EmailVerified = user.EmailVerified,
                LastLoginAt = user.LastLoginAt,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserMetricsDto?> GetUserMetricsAsync(int userId)
        {
            // Get user and their member profile
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null)
                return null;

            var memberProfile = await _unitOfWork.Repository<MemberProfile>()
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (memberProfile == null)
                return null;

            // Calculate BMI if height and weight are available
            decimal? bmi = null;
            if (memberProfile.CurrentWeight.HasValue && memberProfile.Height.HasValue && memberProfile.Height.Value > 0)
            {
                var heightInMeters = memberProfile.Height.Value / 100m;
                bmi = Math.Round(memberProfile.CurrentWeight.Value / (heightInMeters * heightInMeters), 2);
            }

            // Calculate age from DateOfBirth
            int? age = null;
            if (user.DateOfBirth.HasValue)
            {
                var today = DateTime.Today;
                age = today.Year - user.DateOfBirth.Value.Year;
                if (user.DateOfBirth.Value.Date > today.AddYears(-age.Value))
                    age--;
            }

            return new UserMetricsDto
            {
                UserId = userId,
                CurrentWeight = memberProfile.CurrentWeight,
                TargetWeight = memberProfile.TargetWeight,
                Height = memberProfile.Height,
                BMI = bmi,
                Age = age,
                FitnessGoal = memberProfile.FitnessGoal,
                FitnessLevel = memberProfile.FitnessLevel,
                Gender = user.Gender?.ToString()
            };
        }

        public async Task<UserWorkoutSummaryDto> GetUserWorkoutSummaryAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var workoutLogs = await _unitOfWork.Repository<WorkoutLog>()
                .FindAsync(w => w.UserId == userId && w.WorkoutDate >= start && w.WorkoutDate <= end);

            var logs = workoutLogs.ToList();
            var totalWorkouts = logs.Count;
            var totalDuration = logs.Sum(w => w.DurationMinutes ?? 0);
            var totalCalories = logs.Sum(w => w.CaloriesBurned ?? 0);
            var avgDuration = totalWorkouts > 0 ? (int)Math.Round((double)totalDuration / totalWorkouts) : 0;
            var avgCalories = totalWorkouts > 0 ? (int)Math.Round((double)totalCalories / totalWorkouts) : 0;

            // Calculate streak (consecutive days with workouts)
            var currentStreak = 0;
            var longestStreak = 0;
            if (logs.Any())
            {
                var sortedDates = logs.Select(w => w.WorkoutDate.Date).Distinct().OrderByDescending(d => d).ToList();
                var today = DateTime.UtcNow.Date;
                var yesterday = today.AddDays(-1);

                // Check if user worked out today or yesterday to count current streak
                if (sortedDates.Contains(today) || sortedDates.Contains(yesterday))
                {
                    currentStreak = 1;
                    var checkDate = sortedDates.Contains(today) ? today.AddDays(-1) : yesterday.AddDays(-1);

                    while (sortedDates.Contains(checkDate))
                    {
                        currentStreak++;
                        checkDate = checkDate.AddDays(-1);
                    }
                }

                // Calculate longest streak
                var tempStreak = 1;
                for (int i = 1; i < sortedDates.Count; i++)
                {
                    if ((sortedDates[i - 1] - sortedDates[i]).Days == 1)
                    {
                        tempStreak++;
                        longestStreak = Math.Max(longestStreak, tempStreak);
                    }
                    else
                    {
                        tempStreak = 1;
                    }
                }
                longestStreak = Math.Max(longestStreak, tempStreak);
            }

            // Calculate favorite exercises
#pragma warning disable CS0618
            var exerciseCounts = logs
                .Where(w => !string.IsNullOrEmpty(w.ExercisesCompleted))
                .SelectMany(w =>
                {
                    try
                    {
                        var exercises = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(w.ExercisesCompleted!);
                        return exercises?.Select(e => e.ContainsKey("name") ? e["name"]?.ToString() : null)
                            .Where(n => !string.IsNullOrEmpty(n)) ?? Enumerable.Empty<string?>();
                    }
                    catch { return Enumerable.Empty<string?>(); }
                })
#pragma warning restore CS0618
                .Where(e => e != null)
                .GroupBy(e => e!)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => g.Key)
                .ToList();

            var lastWorkout = logs.OrderByDescending(w => w.WorkoutDate).FirstOrDefault();

            return new UserWorkoutSummaryDto
            {
                UserId = userId,
                TotalWorkouts = totalWorkouts,
                TotalDurationMinutes = totalDuration,
                TotalCaloriesBurned = totalCalories,
                AverageWorkoutDuration = avgDuration,
                AverageCaloriesPerWorkout = avgCalories,
                CurrentStreak = currentStreak,
                LongestStreak = longestStreak,
                FavoriteExercises = exerciseCounts!,
                LastWorkoutDate = lastWorkout?.WorkoutDate,
                PeriodStart = start,
                PeriodEnd = end
            };
        }

        public async Task<UserAIContextDto> GetUserAIContextAsync(int userId)
        {
            var metrics = await GetUserMetricsAsync(userId);
            var workoutSummary = await GetUserWorkoutSummaryAsync(userId, DateTime.UtcNow.AddMonths(-3), DateTime.UtcNow);

            // Get recent workout logs for detailed history
            var recentLogs = await _unitOfWork.Repository<WorkoutLog>()
                .FindAsync(w => w.UserId == userId && w.WorkoutDate >= DateTime.UtcNow.AddDays(-30));

            var recentWorkouts = recentLogs
                .OrderByDescending(w => w.WorkoutDate)
                .Take(10)
                .Select(w => new RecentWorkoutDto
                {
                    Date = w.WorkoutDate,
                    Type = null,
                    DurationMinutes = w.DurationMinutes ?? 0,
                    CaloriesBurned = w.CaloriesBurned ?? 0,
                    Intensity = null,
                    Notes = w.Notes
                })
                .ToList();

            // Get health conditions and dietary preferences from MemberProfile
            var memberProfile = await _unitOfWork.Repository<MemberProfile>()
                .FirstOrDefaultAsync(m => m.UserId == userId);

            var healthConditions = new List<string>();
            var dietaryPreferences = new List<string>();

            if (memberProfile != null)
            {
                if (!string.IsNullOrEmpty(memberProfile.MedicalConditions))
                    healthConditions.Add(memberProfile.MedicalConditions);
                if (!string.IsNullOrEmpty(memberProfile.Allergies))
                    dietaryPreferences.Add(memberProfile.Allergies);
            }

            return new UserAIContextDto
            {
                Metrics = metrics,
                WorkoutSummary = workoutSummary,
                RecentWorkouts = recentWorkouts,
                HealthConditions = healthConditions,
                DietaryPreferences = dietaryPreferences
            };
        }

        public async Task<IEnumerable<WorkoutSummaryDto>> GetUserRecentWorkoutsAsync(int userId, int limit = 10)
        {
            var recentLogs = await _unitOfWork.Repository<WorkoutLog>()
                .FindAsync(w => w.UserId == userId);

            return recentLogs
                .OrderByDescending(w => w.WorkoutDate)
                .Take(limit)
                .Select(w => new WorkoutSummaryDto
                {
                    LogId = w.LogId,
                    WorkoutDate = w.WorkoutDate,
                    DurationMinutes = w.DurationMinutes,
                    CaloriesBurned = w.CaloriesBurned,
#pragma warning disable CS0618
                    ExercisesCompleted = w.ExercisesCompleted,
#pragma warning restore CS0618
                    FeelingRating = w.FeelingRating,
                    Notes = w.Notes,
                    PlanName = w.Plan?.PlanName
                })
                .ToList();
        }
    }
}
