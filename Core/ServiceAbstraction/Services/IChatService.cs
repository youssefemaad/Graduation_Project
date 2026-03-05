using Shared.DTOs.Chat;

namespace ServiceAbstraction.Services
{
    /// <summary>
    /// Service interface for chat operations including message persistence and history
    /// </summary>
    public interface IChatService
    {
        /// <summary>
        /// Save a new chat message to the database and cache
        /// </summary>
        Task<ChatMessageDto> SaveMessageAsync(int senderId, int receiverId, string message);

        /// <summary>
        /// Get chat history between two users
        /// </summary>
        /// <param name="userId1">First user ID</param>
        /// <param name="userId2">Second user ID</param>
        /// <param name="limit">Maximum number of messages to return</param>
        /// <param name="beforeDate">Only return messages before this date (for pagination)</param>
        Task<IEnumerable<ChatMessageDto>> GetChatHistoryAsync(
            int userId1,
            int userId2,
            int limit = 50,
            DateTime? beforeDate = null);

        /// <summary>
        /// Mark messages as read
        /// </summary>
        Task MarkMessagesAsReadAsync(int conversationUserId, int readerUserId);

        /// <summary>
        /// Get unread message count for a user
        /// </summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>
        /// Get all conversations for a user with last message info
        /// </summary>
        Task<IEnumerable<ConversationDto>> GetConversationsAsync(int userId);

        /// <summary>
        /// Delete expired messages (older than 1 month and not permanent)
        /// </summary>
        Task<int> CleanupExpiredMessagesAsync();

        /// <summary>
        /// Mark a message as permanent (will not be deleted after expiry)
        /// </summary>
        Task MarkAsPermanentAsync(int messageId);
    }
}
