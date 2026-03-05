import { apiFetch } from './client';

// Chat message DTO
export interface ChatMessageDto {
  chatMessageId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  conversationId: string;
  createdAt: string;
  isPermanent: boolean;
}

// Conversation DTO
export interface ConversationDto {
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
}

/**
 * Get chat history with another user
 */
export async function getChatHistory(
  otherUserId: number, 
  limit: number = 50,
  beforeDate?: Date
): Promise<ChatMessageDto[]> {
  let endpoint = `/chat/history/${otherUserId}?limit=${limit}`;
  if (beforeDate) {
    endpoint += `&beforeDate=${beforeDate.toISOString()}`;
  }
  
  const response = await apiFetch<ChatMessageDto[]>(endpoint);
  return response.data || [];
}

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<ConversationDto[]> {
  const response = await apiFetch<ConversationDto[]>('/chat/conversations');
  return response.data || [];
}

/**
 * Get unread message count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiFetch<number>('/chat/unread-count');
  return response.data || 0;
}

/**
 * Mark messages from a user as read
 */
export async function markMessagesAsRead(otherUserId: number): Promise<void> {
  await apiFetch(`/chat/mark-read/${otherUserId}`, {
    method: 'POST'
  });
}
