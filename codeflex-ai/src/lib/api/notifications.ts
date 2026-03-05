import { apiFetch, type ApiResponse } from './client';

export interface NotificationDto {
  notificationId: number;
  userId: number;
  priority: number;
  type: string;
  title: string;
  message: string;
  category: string;
  relatedEntityId?: number;
  isRead: boolean;
  scheduledFor?: string;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDto {
  userId: number;
  priority?: number;
  type: string;
  title: string;
  message: string;
  category?: string;
  relatedEntityId?: number;
  scheduledFor?: string;
}

export const notificationsApi = {
  /**
   * Create notification
   */
  async createNotification(data: CreateNotificationDto): Promise<ApiResponse<NotificationDto>> {
    return apiFetch<NotificationDto>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get notification by ID
   */
  async getNotification(id: number): Promise<ApiResponse<NotificationDto>> {
    return apiFetch<NotificationDto>(`/notifications/${id}`);
  },

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: number, unreadOnly: boolean = false): Promise<ApiResponse<NotificationDto[]>> {
    return apiFetch<NotificationDto[]>(`/notifications/user/${userId}?unreadOnly=${unreadOnly}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: number): Promise<ApiResponse<number>> {
    return apiFetch<number>(`/notifications/user/${userId}/unread-count`);
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<ApiResponse<NotificationDto>> {
    return apiFetch<NotificationDto>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/notifications/user/${userId}/read-all`, {
      method: 'PUT',
    });
  },

  /**
   * Delete notification
   */
  async deleteNotification(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
