using Shared.DTOs.AI;

namespace ServiceAbstraction.Services
{
    public interface IAIChatService
    {
        Task<AIChatResponseDto> SendMessageAsync(AIChatRequestDto request);
        Task<IEnumerable<object>> GetChatHistoryAsync(int userId, int limit = 50);

        /// <summary>
        /// Save a chat interaction (both user message and AI response) to the database
        /// </summary>
        Task SaveChatInteractionAsync(int userId, string userMessage, string aiResponse, int tokensUsed, int responseTimeMs, int sessionId);

        /// <summary>
        /// Get all chat sessions for a user with preview
        /// </summary>
        Task<IEnumerable<object>> GetChatSessionsAsync(int userId);

        /// <summary>
        /// Get all messages for a specific session
        /// </summary>
        Task<IEnumerable<object>> GetSessionMessagesAsync(int userId, int sessionId);
    }
}
