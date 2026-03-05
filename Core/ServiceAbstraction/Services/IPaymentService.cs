using Shared.DTOs.Payment;

namespace ServiceAbstraction.Services
{
    public interface IPaymentService
    {
        Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto createDto);
        Task<PaymentDto?> GetPaymentByIdAsync(int paymentId);
        Task<IEnumerable<PaymentDto>> GetUserPaymentsAsync(int userId);
        Task<PaymentDto> UpdatePaymentStatusAsync(int paymentId, int status, string? transactionId = null);
    }
}
