import { apiFetch, type ApiResponse } from './client';

// Matches backend: IntelliFit.Shared.DTOs.User.UserMilestoneDto
export interface UserMilestoneDto {
  userMilestoneId: number;
  userId: number;
  milestoneId: number;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  milestoneName?: string;
  milestoneDescription?: string;
  milestoneTarget?: number;
}

export interface UpdateUserMilestoneProgressDto {
  milestoneId: number;
  currentProgress: number;
}

export interface CompleteMilestoneDto {
  milestoneId: number;
}

export const milestonesApi = {
  /**
   * Get user milestone
   */
  async getUserMilestone(userId: number, milestoneId: number): Promise<ApiResponse<UserMilestoneDto>> {
    return apiFetch<UserMilestoneDto>(`/user-milestones/user/${userId}/milestone/${milestoneId}`);
  },

  /**
   * Get user's milestones
   */
  async getUserMilestones(userId: number): Promise<ApiResponse<UserMilestoneDto[]>> {
    return apiFetch<UserMilestoneDto[]>(`/user-milestones/user/${userId}`);
  },

  /**
   * Update milestone progress
   */
  async updateMilestoneProgress(userId: number, data: UpdateUserMilestoneProgressDto): Promise<ApiResponse<UserMilestoneDto>> {
    return apiFetch<UserMilestoneDto>(`/user-milestones/user/${userId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete milestone
   */
  async completeMilestone(userId: number, data: CompleteMilestoneDto): Promise<ApiResponse<UserMilestoneDto>> {
    return apiFetch<UserMilestoneDto>(`/user-milestones/user/${userId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
