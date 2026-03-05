using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using AutoMapper;

namespace Service.Services
{
    /// <summary>
    /// Service for managing equipment time slots with real-time availability tracking.
    /// Uses memory cache for fast access and resets daily at 12:00 AM.
    /// </summary>
    public class EquipmentTimeSlotService : IEquipmentTimeSlotService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMemoryCache _cache;
        private readonly ILogger<EquipmentTimeSlotService> _logger;
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(5);
        private const int SlotDurationMinutes = 60; // 1 hour slots

        public EquipmentTimeSlotService(
            IUnitOfWork unitOfWork,
            IMemoryCache cache,
            ILogger<EquipmentTimeSlotService> logger)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
            _logger = logger;
        }

        public async Task<IEnumerable<EquipmentTimeSlotDto>> GetAvailableSlotsAsync(int equipmentId, DateTime date)
        {
            var allSlots = await GetAllSlotsAsync(equipmentId, date);
            return allSlots.Where(s => !s.IsBooked);
        }

        public async Task<IEnumerable<EquipmentTimeSlotDto>> GetBookedSlotsAsync(int equipmentId, DateTime date)
        {
            var allSlots = await GetAllSlotsAsync(equipmentId, date);
            return allSlots.Where(s => s.IsBooked);
        }

        public async Task<IEnumerable<EquipmentTimeSlotDto>> GetAllSlotsAsync(int equipmentId, DateTime date)
        {
            var cacheKey = GetCacheKey(equipmentId, date);

            if (_cache.TryGetValue(cacheKey, out IEnumerable<EquipmentTimeSlotDto>? cachedSlots) && cachedSlots != null)
            {
                return cachedSlots;
            }

            var dateOnly = date.Date;
            var slots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                .FindAsync(s => s.EquipmentId == equipmentId && s.SlotDate == dateOnly);

            var slotList = slots.ToList();

            // If no slots exist for this date, generate them
            if (!slotList.Any())
            {
                await GenerateDailySlotsForEquipmentAsync(equipmentId, dateOnly);
                slots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                    .FindAsync(s => s.EquipmentId == equipmentId && s.SlotDate == dateOnly);
                slotList = slots.ToList();
            }

            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            var dtos = new List<EquipmentTimeSlotDto>();

            foreach (var slot in slotList.OrderBy(s => s.StartTime))
            {
                var dto = new EquipmentTimeSlotDto
                {
                    SlotId = slot.SlotId,
                    EquipmentId = slot.EquipmentId,
                    EquipmentName = equipment?.Name ?? "Unknown",
                    SlotDate = slot.SlotDate,
                    StartTime = slot.StartTime,
                    EndTime = slot.EndTime,
                    IsBooked = slot.IsBooked,
                    BookedByUserId = slot.BookedByUserId,
                    BookingId = slot.BookingId,
                    IsCoachSession = slot.IsCoachSession,
                    BookedAt = slot.BookedAt
                };

                if (slot.BookedByUserId.HasValue)
                {
                    var user = await _unitOfWork.Repository<User>().GetByIdAsync(slot.BookedByUserId.Value);
                    dto.BookedByUserName = user?.Name;
                }

                dtos.Add(dto);
            }

            _cache.Set(cacheKey, dtos, _cacheExpiration);
            return dtos;
        }

        public async Task<bool> IsTimeRangeAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime)
        {
            var date = startTime.Date;
            var allSlots = await GetAllSlotsAsync(equipmentId, date);

            var startTimeOfDay = startTime.TimeOfDay;
            var endTimeOfDay = endTime.TimeOfDay;

            // Check if any slot in the time range is already booked
            var overlappingSlots = allSlots.Where(s =>
                (s.StartTime < endTimeOfDay && s.EndTime > startTimeOfDay));

            return !overlappingSlots.Any(s => s.IsBooked);
        }

        public async Task<EquipmentTimeSlotDto> BookSlotAsync(int equipmentId, int userId, DateTime startTime, DateTime endTime, int bookingId, bool isCoachSession = false)
        {
            var date = startTime.Date;
            var startTimeOfDay = startTime.TimeOfDay;
            var endTimeOfDay = endTime.TimeOfDay;

            // Find all slots that overlap with the requested time range
            var slots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                .FindAsync(s => s.EquipmentId == equipmentId &&
                               s.SlotDate == date &&
                               s.StartTime < endTimeOfDay &&
                               s.EndTime > startTimeOfDay);

            var slotList = slots.ToList();

            if (!slotList.Any())
            {
                // Generate slots if they don't exist
                await GenerateDailySlotsForEquipmentAsync(equipmentId, date);
                slots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                    .FindAsync(s => s.EquipmentId == equipmentId &&
                                   s.SlotDate == date &&
                                   s.StartTime < endTimeOfDay &&
                                   s.EndTime > startTimeOfDay);
                slotList = slots.ToList();
            }

            // Book all overlapping slots
            foreach (var slot in slotList)
            {
                if (slot.IsBooked)
                {
                    throw new InvalidOperationException($"Time slot {slot.StartTime}-{slot.EndTime} is already booked");
                }

                slot.IsBooked = true;
                slot.BookedByUserId = userId;
                slot.BookingId = bookingId;
                slot.IsCoachSession = isCoachSession;
                slot.BookedAt = DateTime.UtcNow;

                _unitOfWork.Repository<EquipmentTimeSlot>().Update(slot);
            }

            await _unitOfWork.SaveChangesAsync();

            // Invalidate cache
            InvalidateCache(equipmentId, date);

            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            // Return the first slot as representative
            var firstSlot = slotList.First();
            return new EquipmentTimeSlotDto
            {
                SlotId = firstSlot.SlotId,
                EquipmentId = equipmentId,
                EquipmentName = equipment?.Name ?? "Unknown",
                SlotDate = date,
                StartTime = startTimeOfDay,
                EndTime = endTimeOfDay,
                IsBooked = true,
                BookedByUserId = userId,
                BookedByUserName = user?.Name,
                BookingId = bookingId,
                IsCoachSession = isCoachSession,
                BookedAt = DateTime.UtcNow
            };
        }

        public async Task CancelSlotAsync(int slotId)
        {
            var slot = await _unitOfWork.Repository<EquipmentTimeSlot>().GetByIdAsync(slotId);

            if (slot == null)
            {
                throw new KeyNotFoundException($"Time slot with ID {slotId} not found");
            }

            slot.IsBooked = false;
            slot.BookedByUserId = null;
            slot.BookingId = null;
            slot.IsCoachSession = false;
            slot.BookedAt = null;

            _unitOfWork.Repository<EquipmentTimeSlot>().Update(slot);
            await _unitOfWork.SaveChangesAsync();

            InvalidateCache(slot.EquipmentId, slot.SlotDate);
        }

        public async Task GenerateDailySlotsAsync(DateTime date)
        {
            var allEquipment = await _unitOfWork.Repository<Equipment>()
                .FindAsync(e => e.IsActive && e.Status == EquipmentStatus.Available);

            foreach (var equipment in allEquipment)
            {
                await GenerateDailySlotsForEquipmentAsync(equipment.EquipmentId, date);
            }

            _logger.LogInformation("Generated daily time slots for {Count} equipment on {Date}",
                allEquipment.Count(), date.ToShortDateString());
        }

        private async Task GenerateDailySlotsForEquipmentAsync(int equipmentId, DateTime date)
        {
            var dateOnly = date.Date;

            // Check if slots already exist for this equipment and date
            var existingSlots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                .AnyAsync(s => s.EquipmentId == equipmentId && s.SlotDate == dateOnly);

            if (existingSlots)
            {
                return; // Slots already exist
            }

            var equipment = await _unitOfWork.Repository<Equipment>().GetByIdAsync(equipmentId);
            if (equipment == null || !equipment.IsActive)
            {
                return;
            }

            // Generate hourly slots from 6 AM to 10 PM (16 hours = 16 slots)
            var startHour = 6;
            var endHour = 22;

            var slotsToAdd = new List<EquipmentTimeSlot>();

            for (int hour = startHour; hour < endHour; hour++)
            {
                var slot = new EquipmentTimeSlot
                {
                    EquipmentId = equipmentId,
                    SlotDate = dateOnly,
                    StartTime = new TimeSpan(hour, 0, 0),
                    EndTime = new TimeSpan(hour + 1, 0, 0),
                    IsBooked = false,
                    CreatedAt = DateTime.UtcNow
                };

                slotsToAdd.Add(slot);
            }

            foreach (var slot in slotsToAdd)
            {
                await _unitOfWork.Repository<EquipmentTimeSlot>().AddAsync(slot);
            }

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Generated {Count} time slots for equipment {EquipmentId} on {Date}",
                slotsToAdd.Count, equipmentId, dateOnly.ToShortDateString());
        }

        public async Task ClearExpiredSlotsAsync()
        {
            var yesterday = DateTime.UtcNow.Date.AddDays(-1);

            var expiredSlots = await _unitOfWork.Repository<EquipmentTimeSlot>()
                .FindAsync(s => s.SlotDate < yesterday);

            foreach (var slot in expiredSlots)
            {
                _unitOfWork.Repository<EquipmentTimeSlot>().Remove(slot);
            }

            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Cleared {Count} expired time slots before {Date}",
                expiredSlots.Count(), yesterday.ToShortDateString());
        }

        public async Task<IEnumerable<EquipmentAvailabilitySummaryDto>> GetEquipmentAvailabilitySummaryAsync(DateTime startDate, DateTime endDate)
        {
            var summaries = new List<EquipmentAvailabilitySummaryDto>();

            var allEquipment = await _unitOfWork.Repository<Equipment>()
                .FindAsync(e => e.IsActive && e.Status == EquipmentStatus.Available);

            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                foreach (var equipment in allEquipment)
                {
                    var slots = await GetAllSlotsAsync(equipment.EquipmentId, date);
                    var slotList = slots.ToList();

                    var summary = new EquipmentAvailabilitySummaryDto
                    {
                        EquipmentId = equipment.EquipmentId,
                        EquipmentName = equipment.Name,
                        Date = date,
                        TotalSlots = slotList.Count,
                        AvailableSlots = slotList.Count(s => !s.IsBooked),
                        BookedSlots = slotList.Count(s => s.IsBooked),
                        AvailableTimeSlots = slotList.Where(s => !s.IsBooked)
                            .Select(s => new TimeSlotInfo
                            {
                                StartTime = s.StartTime,
                                EndTime = s.EndTime,
                                IsCoachSession = false
                            }).ToList(),
                        BookedTimeSlots = slotList.Where(s => s.IsBooked)
                            .Select(s => new TimeSlotInfo
                            {
                                StartTime = s.StartTime,
                                EndTime = s.EndTime,
                                IsCoachSession = s.IsCoachSession,
                                BookedByUserName = s.BookedByUserName
                            }).ToList()
                    };

                    summaries.Add(summary);
                }
            }

            return summaries;
        }

        private string GetCacheKey(int equipmentId, DateTime date) =>
            $"EquipmentSlots_{equipmentId}_{date:yyyy-MM-dd}";

        private void InvalidateCache(int equipmentId, DateTime date)
        {
            var cacheKey = GetCacheKey(equipmentId, date);
            _cache.Remove(cacheKey);
        }
    }
}
