using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using IntelliFit.Shared.DTOs.Payment;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/token-transactions")]
    public class TokenTransactionController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Create Transaction

        [HttpPost]
        public async Task<ActionResult<TokenTransactionDto>> CreateTransaction([FromBody] CreateTokenTransactionDto dto)
        {
            try
            {
                var userId = GetUserIdFromToken();
                var transaction = await _serviceManager.TokenTransactionService.CreateTransactionAsync(userId, dto);
                return Ok(transaction);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating the transaction", details = ex.Message });
            }
        }

        #endregion

        #region Get Transaction

        [HttpGet("{id}")]
        public async Task<ActionResult<TokenTransactionDto>> GetTransaction(int id)
        {
            var transaction = await _serviceManager.TokenTransactionService.GetTransactionByIdAsync(id);
            if (transaction == null) return NotFound();
            return Ok(transaction);
        }

        #endregion

        #region Get User Transactions

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<TokenTransactionDto>>> GetUserTransactions(int userId)
        {
            var transactions = await _serviceManager.TokenTransactionService.GetUserTransactionsAsync(userId);
            return Ok(transactions);
        }

        #endregion

        #region Get User Token Balance

        [HttpGet("user/{userId}/balance")]
        public async Task<ActionResult<int>> GetUserTokenBalance(int userId)
        {
            var balance = await _serviceManager.TokenTransactionService.GetUserTokenBalanceAsync(userId);
            return Ok(balance);
        }

        #endregion
    }
}
