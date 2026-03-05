using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Chat;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/chat")]
    public class ChatController : ApiControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        #region Get Chat History

        /// <summary>
        /// Get chat history with another user
        /// </summary>
        [HttpGet("history/{otherUserId}")]
        public async Task<ActionResult<IEnumerable<ChatMessageDto>>> GetChatHistory(
            int otherUserId,
            [FromQuery] int limit = 50,
            [FromQuery] DateTime? beforeDate = null)
        {
            var userId = GetUserIdFromToken();
            var messages = await _chatService.GetChatHistoryAsync(userId, otherUserId, limit, beforeDate);
            return Ok(messages);
        }

        #endregion

        #region Get Conversations

        /// <summary>
        /// Get all conversations for the current user
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<ConversationDto>>> GetConversations()
        {
            var userId = GetUserIdFromToken();
            var conversations = await _chatService.GetConversationsAsync(userId);
            return Ok(conversations);
        }

        #endregion

        #region Get Unread Count

        /// <summary>
        /// Get unread message count for current user
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userId = GetUserIdFromToken();
            var count = await _chatService.GetUnreadCountAsync(userId);
            return Ok(count);
        }

        #endregion

        #region Mark Messages as Read

        /// <summary>
        /// Mark all messages from a specific user as read
        /// </summary>
        [HttpPost("mark-read/{otherUserId}")]
        public async Task<ActionResult<object>> MarkAsRead(int otherUserId)
        {
            var userId = GetUserIdFromToken();
            await _chatService.MarkMessagesAsReadAsync(otherUserId, userId);
            return Ok(new { success = true, message = "Messages marked as read" });
        }

        #endregion
    }
}
