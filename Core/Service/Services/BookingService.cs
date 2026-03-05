using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Booking;
using IntelliFit.Shared.Constants;
using IntelliFit.Shared.DTOs.Payment;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using IntelliFit.ServiceAbstraction.Services;
using Microsoft.Extensions.Logging;

namespace Service.Services
{
    /// <summary>
    /// Booking Service - Implements Clean Architecture booking business logic
    /// 
    /// 🎯 UPDATED CORE BOOKING RULES:
    /// 
    /// RULE 1 - Coach Session Equipment Auto-Booking:
    ///   ✅ When user books a coach session, equipment is auto-booked based on workout plan
    ///   ❌ User CANNOT manually book equipment if they have an active coach session at that time
    ///   ✅ Auto-booked equipment is linked to the coach session and shows as "Coach Session"
    /// 
    /// RULE 2 - No Coach Session Equipment Booking:
    ///   ✅ If user doesn't have a coach session, they can book equipment manually
    ///   ✅ AI can suggest equipment based on workout plan (feature flag controlled)
    ///   ✅ Equipment bookings are visible to all users showing availability
    /// 
    /// RULE 3 - Equipment Time Slots:
    ///   ✅ Equipment has hourly time slots from 6 AM to 10 PM
    ///   ✅ Slots reset daily at 12:00 AM (via background service)
    ///   ✅ All users can see booked and available slots in real-time
    /// 
    /// RULE 4 - Equipment Availability:
    ///   ✅ Equipment must be available for the requested time slot
    ///   ❌ Cannot book equipment if already booked by another user
    ///   ✅ Each equipment can only be booked by one user at a time
    /// 
    /// RULE 5 - Time Validation:
    ///   ✅ User selects start date and start time
    ///   ✅ User selects end date and end time
    ///   ✅ System validates: start time < end time
    ///   ❌ Cannot book in the past
    /// </summary>
    public class BookingService : IBookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ITokenTransactionService _tokenTransactionService;
        private readonly IEquipmentTimeSlotService _equipmentTimeSlotService;
        private readonly ILogger<BookingService> _logger;

        // Feature flag for AI-based equipment booking (set to false until AI is implemented)
        private const bool EnableAiEquipmentBooking = false;

        public BookingService(
            IUnitOfWork unitOfWork, 
            IMapper mapper, 
            ITokenTransactionService tokenTransactionService,
            IEquipmentTimeSlotService equipmentTimeSlotService,
            ILogger<BookingService> logger)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _tokenTransactionService = tokenTransactionService;
            _equipmentTimeSlotService = equipmentTimeSlotService;
            _logger = logger;
        }

        public async Task<BookingDto> CreateBookingAsync(CreateBookingDto createDto)
        {
            // ========== VALIDATION PHASE ==========
            
            // 1. Basic time validation
            if (createDto.StartTime >= createDto.EndTime)
            {
                throw new InvalidOperationException("Start time must be before end time");
            }

            if (createDto.StartTime < DateTime.UtcNow)
            {
                throw new InvalidOperationException("Cannot book a time slot in the past");
            }

            // 2. InBody bookings (special case - no equipment/coach needed)
            if (createDto.BookingType == BookingTypes.InBody)
            {
                if (createDto.EquipmentId.HasValue || createDto.CoachId.HasValue)
                {
                    throw new InvalidOperationException("InBody booking should not have equipment or coach");
                }
                return await CreateInBodyBookingAsync(createDto);
            }

            // 3. Validate XOR: Either Equipment OR Coach, not both, not neither
            if ((createDto.EquipmentId.HasValue && createDto.CoachId.HasValue) ||
                (!createDto.EquipmentId.HasValue && !createDto.CoachId.HasValue))
            {
                throw new InvalidOperationException("Booking must be either for Equipment or Coach, not both or neither");
            }

            // 4. Handle Coach Session Booking
            if (createDto.CoachId.HasValue)
            {
                return await CreateCoachSessionBookingAsync(createDto);
            }

            // 5. Handle Equipment Booking
            if (createDto.EquipmentId.HasValue)
            {
                return await CreateEquipmentBookingAsync(createDto);
            }

            throw new InvalidOperationException("Invalid booking request");
        }

        /// <summary>
        /// Create a coach session booking and auto-book required equipment
        /// </summary>
        private async Task<BookingDto> CreateCoachSessionBookingAsync(CreateBookingDto createDto)
        {
            if (createDto.BookingType != BookingTypes.Session)
            {
                throw new InvalidOperationException("Coach booking must have BookingType 'Session'");
            }

            // Convert User ID to CoachProfile ID
            var coachProfile = await _unitOfWork.Repository<CoachProfile>()
                .FirstOrDefaultAsync(cp => cp.UserId == createDto.CoachId!.Value);

            if (coachProfile == null)
            {
                throw new InvalidOperationException("Coach profile not found");
            }

            if (!await IsCoachAvailableAsync(coachProfile.Id, createDto.StartTime, createDto.EndTime))
            {
                throw new InvalidOperationException("Coach is not available for the selected time slot. They may be booked with another client.");
            }

            // Calculate token cost for coach session
            int tokensCost = (int)(coachProfile.HourlyRate ?? 30);

            // Validate user has sufficient tokens
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            if (user.TokenBalance < tokensCost)
            {
                throw new InvalidOperationException($"Insufficient tokens. Required: {tokensCost}, Available: {user.TokenBalance}");
            }

            // Create the coach session booking
            var coachBooking = new Booking
            {
                UserId = createDto.UserId,
                CoachId = coachProfile.Id,
                BookingType = BookingTypes.Session,
                StartTime = createDto.StartTime,
                EndTime = createDto.EndTime,
                Status = BookingStatus.Pending,
                TokensCost = tokensCost,
                Notes = createDto.Notes,
                IsAutoBookedForCoachSession = false,
                IsAiGenerated = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Booking>().AddAsync(coachBooking);
            await _unitOfWork.SaveChangesAsync();

            // Deduct tokens for coach session
            var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coachProfile.UserId);
            await _tokenTransactionService.CreateTransactionAsync(createDto.UserId, new CreateTokenTransactionDto
            {
                Amount = -tokensCost,
                TransactionType = "Deduction",
                Description = $"Personal Training Session with {coachUser?.Name ?? "Coach"} - {(createDto.EndTime - createDto.StartTime).TotalHours:0.#}h"
            });

            // ========== AUTO-BOOK EQUIPMENT BASED ON WORKOUT PLAN ==========
            await AutoBookEquipmentForCoachSessionAsync(coachBooking, createDto.UserId, createDto.StartTime, createDto.EndTime);

            _logger.LogInformation("Created coach session booking {BookingId} for user {UserId} with coach {CoachId}",
                coachBooking.BookingId, createDto.UserId, coachProfile.Id);

            return await GetBookingDtoAsync(coachBooking.BookingId);
        }

        /// <summary>
        /// Auto-book equipment based on user's active workout plan for the coach session
        /// </summary>
        private async Task AutoBookEquipmentForCoachSessionAsync(Booking coachBooking, int userId, DateTime startTime, DateTime endTime)
        {
            try
            {
                // Get user's active workout plan
                var activeWorkoutPlan = await _unitOfWork.Repository<WorkoutPlan>()
                    .FirstOrDefaultAsync(wp => wp.UserId == userId && wp.IsActive && wp.Status == "Approved");

                if (activeWorkoutPlan == null)
                {
                    _logger.LogInformation("No active approved workout plan found for user {UserId}, skipping equipment auto-booking", userId);
                    return;
                }

                // Get today's day number in the workout plan
                var dayNumber = ((DateTime.UtcNow.Date - (activeWorkoutPlan.StartDate ?? DateTime.UtcNow.Date)).Days % 7) + 1;

                // Get exercises for today from the workout plan
                var todayExercises = await _unitOfWork.Repository<WorkoutPlanExercise>()
                    .FindAsync(wpe => wpe.WorkoutPlanId == activeWorkoutPlan.PlanId && wpe.DayNumber == dayNumber);

                var exerciseList = todayExercises.ToList();

                if (!exerciseList.Any())
                {
                    _logger.LogInformation("No exercises found for day {DayNumber} in workout plan {PlanId}", dayNumber, activeWorkoutPlan.PlanId);
                    return;
                }

                // Get unique equipment IDs from exercises
                var equipmentIds = new HashSet<int>();

                foreach (var wpe in exerciseList)
                {
                    var exercise = await _unitOfWork.Repository<Exercise>().GetByIdAsync(wpe.ExerciseId);
                    if (exercise?.EquipmentId.HasValue == true)
                    {
                        equipmentIds.Add(exercise.EquipmentId.Value);
                    }
                }

                if (!equipmentIds.Any())
                {
                    _logger.LogInformation("No equipment linked to today's exercises for user {UserId}", userId);
                    return;
                }

                // Book each piece of equipment for the coach session duration
                foreach (var equipmentId in equipmentIds)
                {
                    try
                    {
                        // Check if equipment is available
                        if (!await _equipmentTimeSlotService.IsTimeRangeAvailableAsync(equipmentId, startTime, endTime))
                        {
                            _logger.LogWarning("Equipment {EquipmentId} is not available for coach session {BookingId}, skipping",
                                equipmentId, coachBooking.BookingId);
                            continue;
                        }

                        var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
                        if (equipment == null || !equipment.IsActive)
                        {
                            continue;
                        }

                        // Create equipment booking linked to coach session (FREE for coach session - included in coach fee)
                        var equipmentBooking = new Booking
                        {
                            UserId = userId,
                            EquipmentId = equipmentId,
                            BookingType = BookingTypes.Equipment,
                            StartTime = startTime,
                            EndTime = endTime,
                            Status = BookingStatus.Pending,
                            TokensCost = 0, // Equipment is included in coach session cost
                            Notes = $"Auto-booked for coach session #{coachBooking.BookingId}",
                            IsAutoBookedForCoachSession = true,
                            ParentCoachBookingId = coachBooking.BookingId,
                            IsAiGenerated = false,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        await _unitOfWork.Repository<Booking>().AddAsync(equipmentBooking);
                        await _unitOfWork.SaveChangesAsync();

                        // Book the time slot
                        await _equipmentTimeSlotService.BookSlotAsync(
                            equipmentId, userId, startTime, endTime, equipmentBooking.BookingId, isCoachSession: true);

                        // Create coach session equipment link
                        var wpeForEquipment = exerciseList.FirstOrDefault(e => 
                        {
                            var ex = _unitOfWork.Repository<Exercise>().GetByIdAsync(e.ExerciseId).Result;
                            return ex?.EquipmentId == equipmentId;
                        });

                        var sessionEquipment = new CoachSessionEquipment
                        {
                            CoachBookingId = coachBooking.BookingId,
                            EquipmentBookingId = equipmentBooking.BookingId,
                            EquipmentId = equipmentId,
                            WorkoutPlanExerciseId = wpeForEquipment?.WorkoutPlanExerciseId,
                            IsApprovedByCoach = true, // Auto-approved based on workout plan
                            Notes = "Auto-booked based on workout plan",
                            CreatedAt = DateTime.UtcNow
                        };

                        await _unitOfWork.Repository<CoachSessionEquipment>().AddAsync(sessionEquipment);
                        await _unitOfWork.SaveChangesAsync();

                        _logger.LogInformation("Auto-booked equipment {EquipmentId} ({EquipmentName}) for coach session {BookingId}",
                            equipmentId, equipment.Name, coachBooking.BookingId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to auto-book equipment {EquipmentId} for coach session {BookingId}",
                            equipmentId, coachBooking.BookingId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-book equipment for coach session {BookingId}", coachBooking.BookingId);
            }
        }

        /// <summary>
        /// Create an equipment booking (manual booking when no coach session)
        /// </summary>
        private async Task<BookingDto> CreateEquipmentBookingAsync(CreateBookingDto createDto)
        {
            if (createDto.BookingType != BookingTypes.Equipment)
            {
                throw new InvalidOperationException("Equipment booking must have BookingType 'Equipment'");
            }

            // ========== CHECK IF USER HAS ACTIVE COACH SESSION ==========
            // If user has an active coach session at this time, they cannot manually book equipment
            var hasCoachSession = await UserHasActiveCoachBookingAsync(createDto.UserId, createDto.StartTime, createDto.EndTime);
            if (hasCoachSession)
            {
                throw new InvalidOperationException(
                    "You cannot manually book equipment when you have an active coach session. " +
                    "Equipment for your session is automatically booked based on your workout plan.");
            }

            // ========== EQUIPMENT AVAILABILITY CHECK ==========
            var equipmentId = createDto.EquipmentId!.Value;
            
            // Check equipment exists and is active
            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            if (equipment == null || !equipment.IsActive)
            {
                throw new InvalidOperationException("Equipment not found or is not available");
            }

            // Check time slot availability
            if (!await _equipmentTimeSlotService.IsTimeRangeAvailableAsync(equipmentId, createDto.StartTime, createDto.EndTime))
            {
                throw new InvalidOperationException("Equipment is not available for the selected time slot. It may be booked by another user.");
            }

            // Calculate token cost
            int tokensCost = equipment.BookingCostTokens;

            // Validate user has sufficient tokens
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            if (tokensCost > 0 && user.TokenBalance < tokensCost)
            {
                throw new InvalidOperationException($"Insufficient tokens. Required: {tokensCost}, Available: {user.TokenBalance}");
            }

            // Create the booking
            var booking = new Booking
            {
                UserId = createDto.UserId,
                EquipmentId = equipmentId,
                BookingType = BookingTypes.Equipment,
                StartTime = createDto.StartTime,
                EndTime = createDto.EndTime,
                Status = BookingStatus.Pending,
                TokensCost = tokensCost,
                Notes = createDto.Notes,
                IsAutoBookedForCoachSession = false,
                IsAiGenerated = EnableAiEquipmentBooking, // Mark if AI suggested this
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Booking>().AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();

            // Book the time slot
            await _equipmentTimeSlotService.BookSlotAsync(
                equipmentId, createDto.UserId, createDto.StartTime, createDto.EndTime, booking.BookingId, isCoachSession: false);

            // Deduct tokens
            if (tokensCost > 0)
            {
                await _tokenTransactionService.CreateTransactionAsync(createDto.UserId, new CreateTokenTransactionDto
                {
                    Amount = -tokensCost,
                    TransactionType = "Deduction",
                    Description = $"Booked {equipment.Name} - {(createDto.EndTime - createDto.StartTime).TotalHours:0.#}h"
                });
            }

            _logger.LogInformation("Created equipment booking {BookingId} for user {UserId} for equipment {EquipmentId}",
                booking.BookingId, createDto.UserId, equipmentId);

            return await GetBookingDtoAsync(booking.BookingId);
        }

        /// <summary>
        /// Create an InBody booking
        /// </summary>
        private async Task<BookingDto> CreateInBodyBookingAsync(CreateBookingDto createDto)
        {
            var booking = new Booking
            {
                UserId = createDto.UserId,
                BookingType = BookingTypes.InBody,
                StartTime = createDto.StartTime,
                EndTime = createDto.EndTime,
                Status = BookingStatus.Pending,
                TokensCost = 0,
                Notes = createDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Booking>().AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(booking.BookingId);
        }

        public async Task<BookingDto?> GetBookingByIdAsync(int bookingId)
        {
            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.UserId == userId);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetAllBookingsAsync()
        {
            var bookings = await _unitOfWork.Repository<Booking>().GetAllAsync();

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetBookingsByStatusAsync(string status)
        {
            BookingStatus bookingStatus;
            if (!Enum.TryParse<BookingStatus>(status, true, out bookingStatus))
            {
                throw new ArgumentException($"Invalid booking status: {status}");
            }

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.Status == bookingStatus);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderByDescending(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetTodaysBookingsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.StartTime >= today && b.StartTime < tomorrow);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderBy(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetEquipmentBookingsAsync(int equipmentId, DateTime startDate, DateTime endDate)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.EquipmentId == equipmentId &&
                               b.StartTime >= startDate &&
                               b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<IEnumerable<BookingDto>> GetCoachBookingsAsync(int coachId, DateTime startDate, DateTime endDate)
        {
            // Convert User ID to CoachProfile ID
            var coachProfile = await _unitOfWork.Repository<CoachProfile>()
                .FirstOrDefaultAsync(cp => cp.UserId == coachId);

            if (coachProfile == null)
            {
                return new List<BookingDto>();
            }

            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.CoachId == coachProfile.Id &&
                               b.StartTime >= startDate &&
                               b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        public async Task<BookingDto> CancelBookingAsync(int bookingId, string cancellationReason)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            // Refund Tokens if applicable
            if (booking.TokensCost > 0 && booking.Status != BookingStatus.Cancelled)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
                if (user != null)
                {
                    user.TokenBalance += booking.TokensCost;
                    _unitOfWork.Repository<User>().Update(user);

                    // Create refund transaction
                    await _tokenTransactionService.CreateTransactionAsync(booking.UserId, new CreateTokenTransactionDto
                    {
                        Amount = booking.TokensCost,
                        TransactionType = "Refund",
                        Description = $"Booking cancelled: {cancellationReason}"
                    });
                }
            }

            // Cancel equipment time slots
            if (booking.EquipmentId.HasValue)
            {
                var slots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                    .FindAsync(s => s.BookingId == bookingId);

                foreach (var slot in slots)
                {
                    await _equipmentTimeSlotService.CancelSlotAsync(slot.SlotId);
                }
            }

            // If this is a coach session, cancel all child equipment bookings
            if (booking.BookingType == BookingTypes.Session)
            {
                var childBookings = await _unitOfWork.Repository<Booking>()
                    .FindAsync(b => b.ParentCoachBookingId == bookingId);

                foreach (var childBooking in childBookings)
                {
                    childBooking.Status = BookingStatus.Cancelled;
                    childBooking.CancellationReason = $"Parent coach session #{bookingId} was cancelled";
                    childBooking.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.Repository<Booking>().Update(childBooking);

                    // Cancel equipment slots for child booking
                    if (childBooking.EquipmentId.HasValue)
                    {
                        var childSlots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                            .FindAsync(s => s.BookingId == childBooking.BookingId);

                        foreach (var slot in childSlots)
                        {
                            await _equipmentTimeSlotService.CancelSlotAsync(slot.SlotId);
                        }
                    }
                }
            }

            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = cancellationReason;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> ConfirmBookingAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.Status = BookingStatus.Confirmed;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            // If this is a coach session, confirm child equipment bookings too
            if (booking.BookingType == BookingTypes.Session)
            {
                var childBookings = await _unitOfWork.Repository<Booking>()
                    .FindAsync(b => b.ParentCoachBookingId == bookingId);

                foreach (var childBooking in childBookings)
                {
                    childBooking.Status = BookingStatus.Confirmed;
                    childBooking.UpdatedAt = DateTime.UtcNow;
                    _unitOfWork.Repository<Booking>().Update(childBooking);
                }
                await _unitOfWork.SaveChangesAsync();
            }

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> CheckInAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.CheckInTime = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<BookingDto> CheckOutAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            booking.CheckOutTime = DateTime.UtcNow;
            booking.Status = BookingStatus.Completed;
            booking.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Booking>().Update(booking);
            await _unitOfWork.SaveChangesAsync();

            return await GetBookingDtoAsync(bookingId);
        }

        public async Task<bool> IsEquipmentAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime)
        {
            return await _equipmentTimeSlotService.IsTimeRangeAvailableAsync(equipmentId, startTime, endTime);
        }

        public async Task<bool> IsCoachAvailableAsync(int coachId, DateTime startTime, DateTime endTime)
        {
            var overlappingBookings = await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.CoachId == coachId &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));

            return !overlappingBookings;
        }

        /// <summary>
        /// Get equipment availability with booked time slots for a specific date range
        /// </summary>
        public async Task<IEnumerable<BookingDto>> GetEquipmentBookedSlotsAsync(int equipmentId, DateTime startDate, DateTime endDate)
        {
            var bookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.EquipmentId == equipmentId &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              b.StartTime >= startDate &&
                              b.EndTime <= endDate);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings.OrderBy(b => b.StartTime))
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        /// <summary>
        /// Check if user has any active coach bookings during the specified time
        /// This is used to block manual equipment booking when user has coach session
        /// </summary>
        public async Task<bool> UserHasActiveCoachBookingAsync(int userId, DateTime startTime, DateTime endTime)
        {
            return await _unitOfWork.Repository<Booking>()
                .AnyAsync(b => b.UserId == userId &&
                              b.CoachId.HasValue &&
                              b.Status != BookingStatus.Cancelled &&
                              b.Status != BookingStatus.Completed &&
                              ((b.StartTime < endTime && b.EndTime > startTime)));
        }

        /// <summary>
        /// Get all auto-booked equipment for a coach session
        /// </summary>
        public async Task<IEnumerable<BookingDto>> GetCoachSessionEquipmentAsync(int coachBookingId)
        {
            var equipmentBookings = await _unitOfWork.Repository<Booking>()
                .FindAsync(b => b.ParentCoachBookingId == coachBookingId);

            var bookingDtos = new List<BookingDto>();
            foreach (var booking in equipmentBookings)
            {
                var dto = await GetBookingDtoAsync(booking.BookingId);
                if (dto != null)
                {
                    bookingDtos.Add(dto);
                }
            }

            return bookingDtos;
        }

        private async Task<BookingDto> GetBookingDtoAsync(int bookingId)
        {
            var booking = await _unitOfWork.Repository<Booking>().GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException($"Booking with ID {bookingId} not found");
            }

            var dto = _mapper.Map<BookingDto>(booking);

            // Manually set navigation property names
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
            dto.UserName = user?.Name ?? "Unknown";

            if (booking.EquipmentId.HasValue)
            {
                var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(booking.EquipmentId.Value);
                dto.EquipmentName = equipment?.Name;
            }

            if (booking.CoachId.HasValue)
            {
                var coachProfile = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(booking.CoachId.Value);
                if (coachProfile != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coachProfile.UserId);
                    dto.CoachName = coachUser?.Name;
                    dto.CoachUserId = coachProfile.UserId; // User ID for chat functionality
                }
            }

            // Set the new properties
            dto.IsAutoBookedForCoachSession = booking.IsAutoBookedForCoachSession;
            dto.ParentCoachBookingId = booking.ParentCoachBookingId;
            dto.IsAiGenerated = booking.IsAiGenerated;

            return dto;
        }
    }
}
