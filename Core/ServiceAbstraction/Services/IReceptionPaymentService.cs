using Shared.DTOs.Reception;

namespace Core.ServiceAbstraction.Services;

public interface IReceptionPaymentService
{
    Task<PaymentListResponseDto> GetPaymentsAsync(PaymentFilterDto filter);
    Task<PaymentStatsDto> GetPaymentStatsAsync();
    Task<PaymentDto?> GetPaymentByIdAsync(int paymentId);
    Task<PaymentDto> ProcessPaymentAsync(PaymentCreateDto paymentDto);
    Task<bool> RefundPaymentAsync(int paymentId, string reason);
    Task<byte[]> GenerateInvoicePdfAsync(int paymentId);
    Task<bool> SendInvoiceEmailAsync(int paymentId);
}
