using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;

namespace Service.BackgroundServices
{
    /// <summary>
    /// Background service that:
    /// 1. Runs at 12:00 AM daily to generate new equipment time slots
    /// 2. Clears expired time slots from previous days
    /// 3. Marks expired bookings as completed or cancelled
    /// 4. Refunds tokens for no-show bookings
    /// </summary>
    public class BookingCleanupService : BackgroundService
    {
        private readonly ILogger<BookingCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        
        // Calculate delay until next midnight
        private TimeSpan GetDelayUntilMidnight()
        {
            var now = DateTime.UtcNow;
            var tomorrow = now.Date.AddDays(1);
            return tomorrow - now;
        }

        public BookingCleanupService(
            ILogger<BookingCleanupService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking Cleanup Service started");

            // Run immediately on startup
            await RunDailyTasksAsync();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Calculate delay until next midnight
                    var delayUntilMidnight = GetDelayUntilMidnight();
                    _logger.LogInformation("Next daily cleanup scheduled at midnight (in {Hours}h {Minutes}m)",
                        (int)delayUntilMidnight.TotalHours, delayUntilMidnight.Minutes);

                    // Wait until midnight
                    await Task.Delay(delayUntilMidnight, stoppingToken);

                    // Run daily tasks at midnight
                    await RunDailyTasksAsync();
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Booking Cleanup Service is stopping");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in daily booking cleanup");
                    // Wait 1 hour before retrying on error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task RunDailyTasksAsync()
        {
            _logger.LogInformation("Running daily booking cleanup tasks at {Time}", DateTime.UtcNow);

            using var scope = _serviceProvider.CreateScope();

            try
            {
                // 1. Generate new time slots for today and tomorrow (7 days ahead)
                await GenerateEquipmentTimeSlotsAsync(scope);

                // 2. Clean up expired bookings
                await CleanupExpiredBookingsAsync(scope);

                // 3. Clear old time slots
                await ClearExpiredTimeSlotsAsync(scope);

                _logger.LogInformation("Daily booking cleanup tasks completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily booking tasks");
            }
        }

        private async Task GenerateEquipmentTimeSlotsAsync(IServiceScope scope)
        {
            try
            {
                var equipmentTimeSlotService = scope.ServiceProvider.GetRequiredService<IEquipmentTimeSlotService>();

                // Generate slots for the next 7 days
                for (int i = 0; i < 7; i++)
                {
                    var date = DateTime.UtcNow.Date.AddDays(i);
                    await equipmentTimeSlotService.GenerateDailySlotsAsync(date);
                }

                _logger.LogInformation("Generated equipment time slots for the next 7 days");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating equipment time slots");
            }
        }

        private async Task CleanupExpiredBookingsAsync(IServiceScope scope)
        {
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            try
            {
                var now = DateTime.UtcNow;
                _logger.LogInformation("Starting booking cleanup at {Time}", now);

                // Get all bookings that have passed their end time but are still pending/confirmed
                var expiredBookings = await unitOfWork.Repository<Booking>()
                    .FindAsync(b => b.EndTime < now &&
                                   (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed));

                var expiredList = expiredBookings.ToList();
                _logger.LogInformation("Found {Count} expired bookings to process", expiredList.Count);

                int completedCount = 0;
                int missedCount = 0;

                foreach (var booking in expiredList)
                {
                    // If user checked in, mark as completed
                    if (booking.CheckInTime.HasValue)
                    {
                        booking.Status = BookingStatus.Completed;
                        completedCount++;
                    }
                    else
                    {
                        // User didn't show up - mark as cancelled and refund tokens if applicable
                        booking.Status = BookingStatus.Cancelled;
                        booking.CancellationReason = "No-show: Booking expired without check-in";

                        // Refund tokens for no-shows (only for non-auto-booked equipment)
                        if (booking.TokensCost > 0 && !booking.IsAutoBookedForCoachSession)
                        {
                            var user = await unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
                            if (user != null)
                            {
                                user.TokenBalance += booking.TokensCost;
                                unitOfWork.Repository<User>().Update(user);
                                _logger.LogInformation("Refunded {Tokens} tokens to user {UserId} for missed booking {BookingId}",
                                    booking.TokensCost, user.UserId, booking.BookingId);
                            }
                        }

                        missedCount++;
                    }

                    booking.UpdatedAt = now;
                    unitOfWork.Repository<Booking>().Update(booking);
                }

                await unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Booking cleanup completed: {Completed} marked as completed, {Missed} marked as missed/cancelled",
                    completedCount, missedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during booking cleanup");
                throw;
            }
        }

        private async Task ClearExpiredTimeSlotsAsync(IServiceScope scope)
        {
            try
            {
                var equipmentTimeSlotService = scope.ServiceProvider.GetRequiredService<IEquipmentTimeSlotService>();
                await equipmentTimeSlotService.ClearExpiredSlotsAsync();
                _logger.LogInformation("Cleared expired equipment time slots");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing expired time slots");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking Cleanup Service is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}
