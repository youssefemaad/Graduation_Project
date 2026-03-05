using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Payment;
using AutoMapper;

namespace Service.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public PaymentService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto createDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {createDto.UserId} not found");
            }

            var payment = new Payment
            {
                UserId = createDto.UserId,
                Amount = createDto.Amount,
                PaymentMethod = createDto.PaymentMethod,
                PaymentType = createDto.PaymentType,
                Status = PaymentStatus.Completed,
                TransactionReference = createDto.TransactionId,
                PackageId = createDto.PackageId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Payment>().AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            return await GetPaymentDtoAsync(payment.PaymentId);
        }

        public async Task<PaymentDto?> GetPaymentByIdAsync(int paymentId)
        {
            return await GetPaymentDtoAsync(paymentId);
        }

        public async Task<IEnumerable<PaymentDto>> GetUserPaymentsAsync(int userId)
        {
            var payments = await _unitOfWork.Repository<Payment>()
                .FindAsync(p => p.UserId == userId);

            var paymentDtos = new List<PaymentDto>();
            foreach (var payment in payments)
            {
                var dto = await GetPaymentDtoAsync(payment.PaymentId);
                if (dto != null)
                {
                    paymentDtos.Add(dto);
                }
            }

            return paymentDtos;
        }

        public async Task<PaymentDto> UpdatePaymentStatusAsync(int paymentId, int status, string? transactionId = null)
        {
            var payment = await _unitOfWork.Repository<Payment>().GetByIdAsync(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException($"Payment with ID {paymentId} not found");
            }

            payment.Status = (PaymentStatus)status;
            if (!string.IsNullOrEmpty(transactionId))
            {
                payment.TransactionReference = transactionId;
            }
            payment.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Payment>().Update(payment);
            await _unitOfWork.SaveChangesAsync();

            return await GetPaymentDtoAsync(paymentId);
        }

        private async Task<PaymentDto> GetPaymentDtoAsync(int paymentId)
        {
            var payment = await _unitOfWork.Repository<Payment>().GetByIdAsync(paymentId);

            if (payment == null)
            {
                throw new KeyNotFoundException($"Payment with ID {paymentId} not found");
            }

            var dto = _mapper.Map<PaymentDto>(payment);

            // Manually set navigation property name
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(payment.UserId);
            dto.UserName = user?.Name ?? "Unknown";

            return dto;
        }
    }
}
