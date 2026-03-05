using IntelliFit.Shared.DTOs.Payment;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface ITokenTransactionService
    {
        Task<TokenTransactionDto> CreateTransactionAsync(int userId, CreateTokenTransactionDto dto);
        Task<IEnumerable<TokenTransactionDto>> GetUserTransactionsAsync(int userId);
        Task<int> GetUserTokenBalanceAsync(int userId);
        Task<TokenTransactionDto?> GetTransactionByIdAsync(int transactionId);
    }
}
