import { apiFetch, type ApiResponse } from './client';

export interface MemberStatsDto {
  userId: number;
  userName: string;
  tokenBalance: number;
  totalBookings: number;
  completedBookings: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  totalWorkoutsCompleted: number;
  inBodyMeasurements: number;
  currentWeight?: number;
  currentBodyFat?: number;
  latestBmi?: number;
  lastInBodyDate?: string;
  lastBookingDate?: string;
  activeSubscriptionId?: number;
  subscriptionEndDate?: string;
}

export interface CoachStatsDto {
  coachId: number;
  coachName: string;
  totalClients: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  averageRating: number;
  totalReviews: number;
  totalEarnings: number;
  tokensEarned: number;
  nextBookingDate?: string;
}

export interface ReceptionStatsDto {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  todayBookings: number;
  pendingBookings: number;
  availableEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  todayInBodyTests: number;
  todayRevenue: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
}

export const statsApi = {
  /**
   * Get member statistics
   */
  async getMemberStats(memberId: number): Promise<ApiResponse<MemberStatsDto>> {
    return apiFetch<MemberStatsDto>(`/stats/member/${memberId}`);
  },

  /**
   * Get coach statistics
   */
  async getCoachStats(coachId: number): Promise<ApiResponse<CoachStatsDto>> {
    return apiFetch<CoachStatsDto>(`/stats/coach/${coachId}`);
  },

  /**
   * Get reception statistics
   */
  async getReceptionStats(): Promise<ApiResponse<ReceptionStatsDto>> {
    return apiFetch<ReceptionStatsDto>('/stats/reception');
  },
};
