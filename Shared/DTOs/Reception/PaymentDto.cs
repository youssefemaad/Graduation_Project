namespace Shared.DTOs.Reception;

public class PaymentDto
{
    public int PaymentId { get; set; }
    public int UserId { get; set; }
    public string MemberName { get; set; } = string.Empty;
    public string MemberNumber { get; set; } = string.Empty;
    public string? MemberPhoto { get; set; }
    public string PlanOrService { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? CardLastFour { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Status { get; set; } = string.Empty; // Completed, Pending, Refunded
    public string? Notes { get; set; }
}

public class PaymentStatsDto
{
    public decimal TodayRevenue { get; set; }
    public decimal TodayRevenueChange { get; set; }
    public decimal WeeklyRevenue { get; set; }
    public decimal WeeklyRevenueChange { get; set; }
    public decimal MonthlyGrowth { get; set; }
    public decimal MonthlyGrowthChange { get; set; }
}

public class PaymentFilterDto
{
    public string? SearchQuery { get; set; }
    public string? Status { get; set; } // All, Pending, Refunded
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PaymentCreateDto
{
    public int UserId { get; set; }
    public string PlanOrService { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? CardLastFour { get; set; }
    public string? Notes { get; set; }
}

public class PaymentListResponseDto
{
    public List<PaymentDto> Payments { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
}
