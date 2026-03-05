using AutoMapper;
using Core.ServiceAbstraction.Services;
using DomainLayer.Contracts;
using IntelliFit.Domain.Enums;
using IntelliFit.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Shared.DTOs.Reception;

namespace Service.Services;

public class ReceptionPaymentService : IReceptionPaymentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ReceptionPaymentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PaymentListResponseDto> GetPaymentsAsync(PaymentFilterDto filter)
    {
        var allPayments = await _unitOfWork.Repository<Payment>().GetAllAsync();
        
        var query = allPayments.AsQueryable();

        // Apply status filter
        if (!string.IsNullOrEmpty(filter.Status) && filter.Status != "All")
        {
            if (filter.Status == "Pending")
                query = query.Where(p => p.Status == PaymentStatus.Pending);
            else if (filter.Status == "Completed")
                query = query.Where(p => p.Status == PaymentStatus.Completed);
            else if (filter.Status == "Refunded")
                query = query.Where(p => p.Status == PaymentStatus.Refunded);
        }

        // Apply search filter
        if (!string.IsNullOrEmpty(filter.SearchQuery))
        {
            var searchLower = filter.SearchQuery.ToLower();
            query = query.Where(p =>
                (p.User.Name != null && p.User.Name.ToLower().Contains(searchLower)) ||
                (p.User.Email != null && p.User.Email.ToLower().Contains(searchLower)) ||
                p.UserId.ToString().Contains(searchLower)
            );
        }

        // Apply date range filter
        if (filter.StartDate.HasValue)
            query = query.Where(p => p.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(p => p.CreatedAt <= filter.EndDate.Value);

        // Get total count
        var totalCount = query.Count();

        // Apply pagination
        var payments = query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        var paymentDtos = payments.Select(p => new PaymentDto
        {
            PaymentId = p.PaymentId,
            UserId = p.UserId,
            MemberName = p.User?.Name ?? "Unknown",
            MemberNumber = $"#PG-{p.UserId:D4}",
            MemberPhoto = p.User?.ProfileImageUrl,
            PlanOrService = p.PaymentType ?? "N/A",
            Amount = p.Amount,
            PaymentMethod = p.PaymentMethod ?? "N/A",
            CardLastFour = ExtractCardLastFour(p.PaymentMethod ?? ""),
            PaymentDate = p.CreatedAt,
            Status = p.Status.ToString(),
            Notes = p.GatewayResponse
        }).ToList();

        return new PaymentListResponseDto
        {
            Payments = paymentDtos,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
            CurrentPage = filter.PageNumber
        };
    }

    public async Task<PaymentStatsDto> GetPaymentStatsAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = now.AddDays(-(int)now.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var lastMonthStart = monthStart.AddMonths(-1);

        var allPayments = await _unitOfWork.Repository<Payment>().GetAllAsync();
        var completedPayments = allPayments.Where(p => p.Status == PaymentStatus.Completed);

        // Today's revenue
        var todayRevenue = completedPayments
            .Where(p => p.CreatedAt >= todayStart)
            .Sum(p => p.Amount);

        var yesterdayRevenue = completedPayments
            .Where(p => p.CreatedAt >= todayStart.AddDays(-1) && p.CreatedAt < todayStart)
            .Sum(p => p.Amount);

        var todayChange = yesterdayRevenue > 0 
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
            : 0;

        // Weekly revenue
        var weeklyRevenue = completedPayments
            .Where(p => p.CreatedAt >= weekStart)
            .Sum(p => p.Amount);

        var lastWeekRevenue = completedPayments
            .Where(p => p.CreatedAt >= weekStart.AddDays(-7) && p.CreatedAt < weekStart)
            .Sum(p => p.Amount);

        var weeklyChange = lastWeekRevenue > 0 
            ? ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
            : 0;

        // Monthly growth
        var thisMonthRevenue = completedPayments
            .Where(p => p.CreatedAt >= monthStart)
            .Sum(p => p.Amount);

        var lastMonthRevenue = completedPayments
            .Where(p => p.CreatedAt >= lastMonthStart && p.CreatedAt < monthStart)
            .Sum(p => p.Amount);

        var monthlyGrowth = lastMonthRevenue > 0 
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 0;

        var monthlyGrowthChange = monthlyGrowth; // Simplified for now

        return new PaymentStatsDto
        {
            TodayRevenue = todayRevenue,
            TodayRevenueChange = todayChange,
            WeeklyRevenue = weeklyRevenue,
            WeeklyRevenueChange = weeklyChange,
            MonthlyGrowth = monthlyGrowth,
            MonthlyGrowthChange = monthlyGrowthChange
        };
    }

    public async Task<PaymentDto?> GetPaymentByIdAsync(int paymentId)
    {
        var payment = await _unitOfWork.Repository<Payment>()
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

        if (payment == null)
            return null;

        return new PaymentDto
        {
            PaymentId = payment.PaymentId,
            UserId = payment.UserId,
            MemberName = payment.User?.Name ?? "Unknown",
            MemberNumber = $"#PG-{payment.UserId:D4}",
            MemberPhoto = payment.User?.ProfileImageUrl,
            PlanOrService = payment.PaymentType ?? "N/A",
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod ?? "N/A",
            CardLastFour = ExtractCardLastFour(payment.PaymentMethod ?? ""),
            PaymentDate = payment.CreatedAt,
            Status = payment.Status.ToString(),
            Notes = payment.GatewayResponse
        };
    }

    public async Task<PaymentDto> ProcessPaymentAsync(PaymentCreateDto paymentDto)
    {
        var user = await _unitOfWork.Repository<User>()
            .FirstOrDefaultAsync(u => u.UserId == paymentDto.UserId);

        if (user == null)
            throw new Exception("User not found");

        var payment = new Payment
        {
            UserId = paymentDto.UserId,
            Amount = paymentDto.Amount,
            PaymentMethod = BuildPaymentMethod(paymentDto.PaymentMethod, paymentDto.CardLastFour),
            PaymentType = paymentDto.PlanOrService,
            Status = PaymentStatus.Completed,
            InvoiceNumber = GenerateInvoiceNumber(),
            GatewayResponse = paymentDto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Repository<Payment>().AddAsync(payment);
        await _unitOfWork.SaveChangesAsync();

        return new PaymentDto
        {
            PaymentId = payment.PaymentId,
            UserId = payment.UserId,
            MemberName = user.Name,
            MemberNumber = $"#PG-{user.UserId:D4}",
            MemberPhoto = user.ProfileImageUrl,
            PlanOrService = payment.PaymentType,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod ?? "N/A",
            CardLastFour = paymentDto.CardLastFour,
            PaymentDate = payment.CreatedAt,
            Status = payment.Status.ToString(),
            Notes = payment.GatewayResponse
        };
    }

    public async Task<bool> RefundPaymentAsync(int paymentId, string reason)
    {
        var payment = await _unitOfWork.Repository<Payment>()
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

        if (payment == null || payment.Status != PaymentStatus.Completed)
            return false;

        payment.Status = PaymentStatus.Refunded;
        payment.GatewayResponse = reason;
        payment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Repository<Payment>().Update(payment);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(int paymentId)
    {
        // Simplified implementation - return empty PDF for now
        // In production, use a PDF library like QuestPDF or iTextSharp
        return Array.Empty<byte>();
    }

    public async Task<bool> SendInvoiceEmailAsync(int paymentId)
    {
        // Simplified implementation
        // In production, integrate with email service
        await Task.CompletedTask;
        return true;
    }

    private string? ExtractCardLastFour(string paymentMethod)
    {
        // Extract last 4 digits from payment method string
        if (paymentMethod.Contains("••••"))
        {
            var parts = paymentMethod.Split("••••");
            if (parts.Length > 1)
                return parts[1].Trim();
        }
        return null;
    }

    private string BuildPaymentMethod(string method, string? cardLastFour)
    {
        if (string.IsNullOrEmpty(cardLastFour))
            return method;

        return $"{method} •••• {cardLastFour}";
    }

    private string GenerateInvoiceNumber()
    {
        return $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
    }
}
