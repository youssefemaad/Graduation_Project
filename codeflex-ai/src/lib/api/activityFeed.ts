import { apiFetch, type ApiResponse } from './client';

export interface ActivityFeedDto {
  activityId: number;
  userId: number;
  userName: string;
  activityType: string;
  title: string;
  description: string;
  category: string;
  relatedEntityId?: number;
  createdAt: string;
}

export interface CreateActivityFeedDto {
  userId: number;
  activityType: string;
  title: string;
  description: string;
  category?: string;
  relatedEntityId?: number;
}

export const activityFeedApi = {
  /**
   * Create activity
   */
  async createActivity(data: CreateActivityFeedDto): Promise<ApiResponse<ActivityFeedDto>> {
    return apiFetch<ActivityFeedDto>('/activity-feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user's activities
   */
  async getUserActivities(userId: number, limit: number = 50): Promise<ApiResponse<ActivityFeedDto[]>> {
    return apiFetch<ActivityFeedDto[]>(`/activity-feed/user/${userId}?limit=${limit}`);
  },

  /**
   * Get recent activities (all users - for social feed)
   */
  async getRecentActivities(limit: number = 100): Promise<ApiResponse<ActivityFeedDto[]>> {
    return apiFetch<ActivityFeedDto[]>(`/activity-feed/recent?limit=${limit}`);
  },

  /**
   * Delete activity
   */
  async deleteActivity(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/activity-feed/${id}`, {
      method: 'DELETE',
    });
  },
};
