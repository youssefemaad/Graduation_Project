using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.Chat;
using System.Collections.Concurrent;

namespace IntelliFit.Presentation.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;
        private readonly IChatService _chatService;

        // Track user connections for deduplication (userId -> ConnectionIds)
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

        // Track processed message IDs to prevent duplicates (messageId -> timestamp)
        private static readonly ConcurrentDictionary<int, DateTime> _processedMessages = new();

        public ChatHub(ILogger<ChatHub> logger, IChatService chatService)
        {
            _logger = logger;
            _chatService = chatService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Track connection for this user
                _userConnections.AddOrUpdate(
                    userId,
                    new HashSet<string> { Context.ConnectionId },
                    (key, existing) => { existing.Add(Context.ConnectionId); return existing; }
                );

                // Add user to their personal chat room
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation("User {UserId} connected to chat hub (ConnectionId: {ConnectionId}, Total connections: {Count})",
                    userId, Context.ConnectionId, _userConnections[userId].Count);
            }
            else
            {
                _logger.LogWarning("User connected but userId claim not found");
            }

            await base.OnConnectedAsync();

            // Cleanup old processed messages (older than 5 minutes)
            CleanupProcessedMessages();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Remove this connection from tracking
                if (_userConnections.TryGetValue(userId, out var connections))
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);
                    }
                }

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation("User {UserId} disconnected from chat hub (ConnectionId: {ConnectionId})",
                    userId, Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Check if a message has already been processed (for deduplication)
        /// </summary>
        private bool IsMessageDuplicate(int messageId)
        {
            if (_processedMessages.ContainsKey(messageId))
            {
                return true;
            }

            _processedMessages.TryAdd(messageId, DateTime.UtcNow);
            return false;
        }

        /// <summary>
        /// Cleanup processed messages older than 5 minutes
        /// </summary>
        private void CleanupProcessedMessages()
        {
            var cutoff = DateTime.UtcNow.AddMinutes(-5);
            foreach (var kvp in _processedMessages)
            {
                if (kvp.Value < cutoff)
                {
                    _processedMessages.TryRemove(kvp.Key, out _);
                }
            }
        }

        /// <summary>
        /// Get chat history with another user
        /// </summary>
        public async Task GetChatHistory(int otherUserId, int limit = 50)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                _logger.LogWarning("GetChatHistory called without valid userId");
                return;
            }

            var messages = await _chatService.GetChatHistoryAsync(int.Parse(userId), otherUserId, limit);
            await Clients.Caller.SendAsync("ChatHistory", messages);
        }

        /// <summary>
        /// Send AI chat message
        /// </summary>
        public async Task SendAIMessage(string message)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            // Echo user message back
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                sender = "user",
                message,
                timestamp = DateTime.UtcNow
            });

            // Simulate AI processing (in real implementation, this would call AI service)
            await Task.Delay(1000);

            // Send AI response
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                sender = "ai",
                message = "This is an AI response. Integration with actual AI service pending.",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Send message to coach (for coach-member chat)
        /// </summary>
        public async Task SendMessageToCoach(int coachId, string message)
        {
            var userId = GetCurrentUserId();
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "User";

            if (userId == null)
            {
                _logger.LogWarning("SendMessageToCoach called without valid userId");
                return;
            }

            var senderId = int.Parse(userId);

            _logger.LogInformation("Member {UserId} ({UserName}) sending message to coach {CoachId}: {Message}",
                userId, userName, coachId, message);

            // Save message to database
            var savedMessage = await _chatService.SaveMessageAsync(senderId, coachId, message);

            _logger.LogInformation("Message saved with ID {MessageId}", savedMessage.ChatMessageId);

            // Create payload with message ID for client-side deduplication
            var messagePayload = new ChatMessagePayload
            {
                MessageId = savedMessage.ChatMessageId,
                SenderId = senderId,
                SenderName = userName,
                Message = message,
                Timestamp = DateTime.UtcNow,
                ConversationId = savedMessage.ConversationId
            };

            // Send to coach (excluding sender's current connection to prevent echo)
            await Clients.GroupExcept($"user_{coachId}", Context.ConnectionId).SendAsync("ReceiveMessage", messagePayload);

            // Also send back to sender for confirmation (only to current connection)
            await Clients.Caller.SendAsync("MessageSent", messagePayload);

            _logger.LogInformation("Message sent to group user_{CoachId}", coachId);
        }

        /// <summary>
        /// Send message to member (for coach-member chat)
        /// </summary>
        public async Task SendMessageToMember(int memberId, string message)
        {
            var userId = GetCurrentUserId();
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "Coach";

            if (userId == null)
            {
                _logger.LogWarning("SendMessageToMember called without valid userId");
                return;
            }

            var senderId = int.Parse(userId);

            _logger.LogInformation("Coach {UserId} ({UserName}) sending message to member {MemberId}: {Message}",
                userId, userName, memberId, message);

            // Save message to database
            var savedMessage = await _chatService.SaveMessageAsync(senderId, memberId, message);

            _logger.LogInformation("Message saved with ID {MessageId}", savedMessage.ChatMessageId);

            // Create payload with message ID for client-side deduplication
            var messagePayload = new ChatMessagePayload
            {
                MessageId = savedMessage.ChatMessageId,
                SenderId = senderId,
                SenderName = userName,
                Message = message,
                Timestamp = DateTime.UtcNow,
                ConversationId = savedMessage.ConversationId
            };

            // Send to member (excluding sender's current connection to prevent echo)
            await Clients.GroupExcept($"user_{memberId}", Context.ConnectionId).SendAsync("ReceiveMessage", messagePayload);

            // Also send back to sender for confirmation (only to current connection)
            await Clients.Caller.SendAsync("MessageSent", messagePayload);

            _logger.LogInformation("Message sent to group user_{MemberId}", memberId);
        }

        /// <summary>
        /// Mark messages as read
        /// </summary>
        public async Task MarkAsRead(int otherUserId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return;

            await _chatService.MarkMessagesAsReadAsync(otherUserId, int.Parse(userId));

            // Notify the other user that messages were read
            await Clients.Group($"user_{otherUserId}").SendAsync("MessagesRead", new
            {
                readByUserId = int.Parse(userId),
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// User is typing indicator
        /// </summary>
        public async Task UserTyping(int recipientId)
        {
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "User";
            await Clients.Group($"user_{recipientId}").SendAsync("UserTyping", userName);
        }

        /// <summary>
        /// User stopped typing
        /// </summary>
        public async Task UserStoppedTyping(int recipientId)
        {
            await Clients.Group($"user_{recipientId}").SendAsync("UserStoppedTyping");
        }

        private string? GetCurrentUserId()
        {
            return Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                   ?? Context.User?.FindFirst("sub")?.Value;
        }
    }
}
