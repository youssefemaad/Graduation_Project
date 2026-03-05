using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.Payment;
using AutoMapper;

namespace Service.Services
{
    public class TokenTransactionService : ITokenTransactionService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public TokenTransactionService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<TokenTransactionDto> CreateTransactionAsync(int userId, CreateTokenTransactionDto dto)
        {
            // Use explicit transaction for atomicity
            using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
                if (user == null) throw new InvalidOperationException("User not found");

                // Validate sufficient balance for deductions
                if (dto.Amount < 0 && user.TokenBalance + dto.Amount < 0)
                {
                    throw new InvalidOperationException("Insufficient token balance");
                }

                var balanceBefore = user.TokenBalance;
                var balanceAfter = balanceBefore + dto.Amount;

                // Parse TransactionType enum from string
                if (!Enum.TryParse<TransactionType>(dto.TransactionType, ignoreCase: true, out var transactionType))
                {
                    throw new ArgumentException($"Invalid transaction type: {dto.TransactionType}");
                }

                var tokenTransaction = new TokenTransaction
                {
                    UserId = userId,
                    Amount = dto.Amount,
                    TransactionType = transactionType,
                    Description = dto.Description,
                    ReferenceType = dto.ReferenceType,
                    ReferenceId = dto.ReferenceId,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    CreatedAt = DateTime.UtcNow
                };

                // Update user balance
                user.TokenBalance = balanceAfter;
                user.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<User>().Update(user);

                await _unitOfWork.Repository<TokenTransaction>().AddAsync(tokenTransaction);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return _mapper.Map<TokenTransactionDto>(tokenTransaction);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<IEnumerable<TokenTransactionDto>> GetUserTransactionsAsync(int userId)
        {
            var transactions = await _unitOfWork.Repository<TokenTransaction>().GetAllAsync();
            var userTransactions = transactions.Where(t => t.UserId == userId)
                                              .OrderByDescending(t => t.CreatedAt);
            return userTransactions.Select(t => _mapper.Map<TokenTransactionDto>(t));
        }

        public async Task<int> GetUserTokenBalanceAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user?.TokenBalance ?? 0;
        }

        public async Task<TokenTransactionDto?> GetTransactionByIdAsync(int transactionId)
        {
            var transaction = await _unitOfWork.Repository<TokenTransaction>().GetByIdAsync(transactionId);
            return transaction != null ? _mapper.Map<TokenTransactionDto>(transaction) : null;
        }
    }
}
