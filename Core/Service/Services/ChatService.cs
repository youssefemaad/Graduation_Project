using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Chat;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Service.Services
{
    public class ChatService : IChatService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDistributedCache _cache;
        private readonly ILogger<ChatService> _logger;

        // Cache key prefixes
        private const string CHAT_HISTORY_KEY = "chat:history:";
        private const string UNREAD_COUNT_KEY = "chat:unread:";
        private const string CONVERSATIONS_KEY = "chat:conversations:";

        // Cache expiration (1 hour for frequently accessed data)
        private static readonly TimeSpan CacheExpiration = TimeSpan.FromHours(1);

        public ChatService(
            IUnitOfWork unitOfWork,
            IDistributedCache cache,
            ILogger<ChatService> logger)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
            _logger = logger;
        }

        public async Task<ChatMessageDto> SaveMessageAsync(int senderId, int receiverId, string message)
        {
            var conversationId = ChatMessage.GenerateConversationId(senderId, receiverId);

            // Get sender name
            var sender = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.UserId == senderId);
            var senderName = sender?.Name ?? "Unknown";

            // Get receiver name
            var receiver = await _unitOfWork.Repository<User>().FirstOrDefaultAsync(u => u.UserId == receiverId);
            var receiverName = receiver?.Name ?? "Unknown";

            var chatMessage = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                ConversationId = conversationId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMonths(1),
                IsRead = false,
                IsPermanent = false
            };

            await _unitOfWork.Repository<ChatMessage>().AddAsync(chatMessage);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Message saved: {MessageId} from {SenderId} to {ReceiverId}",
                chatMessage.ChatMessageId, senderId, receiverId);

            // Invalidate caches
            await InvalidateCachesAsync(senderId, receiverId, conversationId);

            return new ChatMessageDto
            {
                ChatMessageId = chatMessage.ChatMessageId,
                SenderId = senderId,
                SenderName = senderName,
                ReceiverId = receiverId,
                ReceiverName = receiverName,
                Message = message,
                IsRead = false,
                ConversationId = conversationId,
                CreatedAt = chatMessage.CreatedAt,
                IsPermanent = false
            };
        }

        public async Task<IEnumerable<ChatMessageDto>> GetChatHistoryAsync(
            int userId1,
            int userId2,
            int limit = 50,
            DateTime? beforeDate = null)
        {
            var conversationId = ChatMessage.GenerateConversationId(userId1, userId2);
            var cacheKey = $"{CHAT_HISTORY_KEY}{conversationId}:{limit}:{beforeDate?.Ticks ?? 0}";

            // Try to get from cache
            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                return JsonSerializer.Deserialize<List<ChatMessageDto>>(cached) ?? new List<ChatMessageDto>();
            }

            // Query from database
            var allMessages = await _unitOfWork.Repository<ChatMessage>()
                .FindAsync(m => m.ConversationId == conversationId);

            var query = allMessages.AsQueryable();

            if (beforeDate.HasValue)
            {
                query = query.Where(m => m.CreatedAt < beforeDate.Value);
            }

            var messages = query
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .ToList();

            // Get user names for mapping
            var userIds = messages.SelectMany(m => new[] { m.SenderId, m.ReceiverId }).Distinct().ToList();
            var users = await _unitOfWork.Repository<User>().FindAsync(u => userIds.Contains(u.UserId));
            var userDict = users.ToDictionary(u => u.UserId, u => u.Name);

            var result = messages.Select(m => new ChatMessageDto
            {
                ChatMessageId = m.ChatMessageId,
                SenderId = m.SenderId,
                SenderName = userDict.GetValueOrDefault(m.SenderId, "Unknown"),
                ReceiverId = m.ReceiverId,
                ReceiverName = userDict.GetValueOrDefault(m.ReceiverId, "Unknown"),
                Message = m.Message,
                IsRead = m.IsRead,
                ReadAt = m.ReadAt,
                ConversationId = m.ConversationId,
                CreatedAt = m.CreatedAt,
                IsPermanent = m.IsPermanent
            }).ToList();

            // Reverse to show oldest first
            result.Reverse();

            // Cache the result
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheExpiration
            });

            return result;
        }

        public async Task MarkMessagesAsReadAsync(int conversationUserId, int readerUserId)
        {
            var conversationId = ChatMessage.GenerateConversationId(conversationUserId, readerUserId);

            // Get unread messages sent to readerUserId
            var unreadMessages = await _unitOfWork.Repository<ChatMessage>()
                .FindAsync(m => m.ConversationId == conversationId
                             && m.ReceiverId == readerUserId
                             && !m.IsRead);

            var messageList = unreadMessages.ToList();
            if (messageList.Any())
            {
                foreach (var message in messageList)
                {
                    message.IsRead = true;
                    message.ReadAt = DateTime.UtcNow;
                    _unitOfWork.Repository<ChatMessage>().Update(message);
                }

                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Marked {Count} messages as read for user {UserId} in conversation {ConversationId}",
                    messageList.Count, readerUserId, conversationId);

                // Invalidate caches
                await InvalidateCachesAsync(conversationUserId, readerUserId, conversationId);
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            var cacheKey = $"{UNREAD_COUNT_KEY}{userId}";

            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached) && int.TryParse(cached, out var count))
            {
                return count;
            }

            var unreadCount = await _unitOfWork.Repository<ChatMessage>()
                .CountAsync(m => m.ReceiverId == userId && !m.IsRead);

            await _cache.SetStringAsync(cacheKey, unreadCount.ToString(), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });

            return unreadCount;
        }

        public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(int userId)
        {
            var cacheKey = $"{CONVERSATIONS_KEY}{userId}";

            var cached = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cached))
            {
                return JsonSerializer.Deserialize<List<ConversationDto>>(cached) ?? new List<ConversationDto>();
            }

            // Get all messages where user is sender or receiver
            var allMessages = await _unitOfWork.Repository<ChatMessage>()
                .FindAsync(m => m.SenderId == userId || m.ReceiverId == userId);

            // Get user names
            var userIds = allMessages.SelectMany(m => new[] { m.SenderId, m.ReceiverId }).Distinct().ToList();
            var users = await _unitOfWork.Repository<User>().FindAsync(u => userIds.Contains(u.UserId));
            var userDict = users.ToDictionary(u => u.UserId, u => u.Name);

            // Group by conversation
            var conversations = allMessages
                .GroupBy(m => m.ConversationId)
                .Select(g =>
                {
                    var lastMessage = g.OrderByDescending(m => m.CreatedAt).First();
                    var otherUserId = lastMessage.SenderId == userId
                        ? lastMessage.ReceiverId
                        : lastMessage.SenderId;
                    var unreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead);

                    return new ConversationDto
                    {
                        ConversationId = g.Key,
                        OtherUserId = otherUserId,
                        OtherUserName = userDict.GetValueOrDefault(otherUserId, "Unknown"),
                        LastMessage = lastMessage.Message.Length > 50
                            ? lastMessage.Message.Substring(0, 50) + "..."
                            : lastMessage.Message,
                        LastMessageAt = lastMessage.CreatedAt,
                        UnreadCount = unreadCount,
                        IsOnline = false
                    };
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToList();

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(conversations), new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CacheExpiration
            });

            return conversations;
        }

        public async Task<int> CleanupExpiredMessagesAsync()
        {
            var expiredMessages = await _unitOfWork.Repository<ChatMessage>()
                .FindAsync(m => m.ExpiresAt < DateTime.UtcNow && !m.IsPermanent);

            var messageList = expiredMessages.ToList();
            if (messageList.Any())
            {
                foreach (var message in messageList)
                {
                    _unitOfWork.Repository<ChatMessage>().Remove(message);
                }

                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Cleaned up {Count} expired chat messages", messageList.Count);
            }

            return messageList.Count;
        }

        public async Task MarkAsPermanentAsync(int messageId)
        {
            var message = await _unitOfWork.Repository<ChatMessage>()
                .FirstOrDefaultAsync(m => m.ChatMessageId == messageId);

            if (message != null)
            {
                message.IsPermanent = true;
                _unitOfWork.Repository<ChatMessage>().Update(message);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation("Message {MessageId} marked as permanent", messageId);
            }
        }

        private async Task InvalidateCachesAsync(int userId1, int userId2, string conversationId)
        {
            try
            {
                // Remove conversation history cache (pattern match would be ideal)
                await _cache.RemoveAsync($"{CHAT_HISTORY_KEY}{conversationId}:50:0");

                // Remove unread counts
                await _cache.RemoveAsync($"{UNREAD_COUNT_KEY}{userId1}");
                await _cache.RemoveAsync($"{UNREAD_COUNT_KEY}{userId2}");

                // Remove conversation lists
                await _cache.RemoveAsync($"{CONVERSATIONS_KEY}{userId1}");
                await _cache.RemoveAsync($"{CONVERSATIONS_KEY}{userId2}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to invalidate cache");
            }
        }
    }
}
