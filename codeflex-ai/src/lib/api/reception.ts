import { apiFetch, type ApiResponse } from "./client";

// DTOs
export interface CheckInDto {
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  memberNumber: string;
  subscriptionPlan?: string;
  isActive: boolean;
  lastVisit?: string;
  currentStreak: number;
  hasActiveStreak: boolean;
  todaySession?: TodaySessionDto;
}

export interface TodaySessionDto {
  bookingId: number;
  sessionType: string;
  coachName: string;
  startTime: string;
}

export interface MemberSearchDto {
  userId: number;
  name: string;
  email?: string;
  memberNumber: string;
  profileImageUrl?: string;
  subscriptionPlan?: string;
  isActive: boolean;
}

export interface MemberListDto {
  userId: number;
  name: string;
  email: string;
  phone: string;
  memberNumber: string;
  profileImageUrl?: string;
  status: string; // "Active", "Expired", "Frozen"
  membershipPlan?: string;
  joinDate: string;
  lastVisit?: string;
}

export interface MemberDetailsDto {
  userId: number;
  name: string;
  memberNumber: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  profileImageUrl?: string;
  status: string;
  isCurrentlyInside: boolean;
  checkInTime?: string;
  lastVisit?: string;
  membership?: {
    planName: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    visitsLeft: string;
    status: string;
  };
  payments?: {
    lastAmount: number;
    lastPaymentDate: string;
    paymentMethod: string;
    outstandingBalance: number;
  };
  activities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }>;
  notes: string[];
  alerts: Array<{
    type: string;
    message: string;
  }>;
}

export interface LiveActivityDto {
  activityId: number;
  userId: number;
  userName: string;
  userImageUrl?: string;
  activityType: string;
  description: string;
  createdAt: string;
  timeAgo: string;
}

export interface AlertDto {
  alertId: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

export interface CheckInRequestDto {
  userId: number;
  accessArea?: string;
  notes?: string;
}

export interface CheckOutRequestDto {
  userId: number;
  notes?: string;
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

export interface CreateMemberDto {
  email: string;
  name: string;
  nationalId: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  planId: number;
  paymentMethod: string;
  amount: number;
}

export interface CreateMemberResponseDto {
  userId: number;
  name: string;
  email: string;
  memberNumber: string;
  subscriptionPlan: string;
  subscriptionEndDate: string;
  message: string;
}

export const receptionApi = {
  /**
   * Get member details for check-in by user ID
   */
  async getMemberForCheckIn(userId: number): Promise<ApiResponse<CheckInDto>> {
    return apiFetch<CheckInDto>(`/reception/member/${userId}`);
  },

  /**
   * Get member details by QR code scan
   */
  async getMemberByQRCode(qrCode: string): Promise<ApiResponse<CheckInDto>> {
    return apiFetch<CheckInDto>(`/reception/qr/${encodeURIComponent(qrCode)}`);
  },

  /**
   * Search members by name, email, or member ID
   */
  async searchMembers(query: string): Promise<ApiResponse<MemberSearchDto[]>> {
    return apiFetch<MemberSearchDto[]>(
      `/reception/search?query=${encodeURIComponent(query)}`,
    );
  },

  /**
   * Get all members list with full details
   */
  async getAllMembers(): Promise<ApiResponse<MemberListDto[]>> {
    return apiFetch<MemberListDto[]>("/reception/members");
  },

  /**
   * Get member details by ID
   */
  async getMemberDetails(
    userId: number,
  ): Promise<ApiResponse<MemberDetailsDto>> {
    return apiFetch<MemberDetailsDto>(`/reception/members/${userId}`);
  },

  /**
   * Check in a member
   */
  async checkInMember(
    request: CheckInRequestDto,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>("/reception/checkin", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Check out a member
   */
  async checkOutMember(
    request: CheckOutRequestDto,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>("/reception/checkout", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Get live activity feed for reception dashboard
   */
  async getLiveActivities(
    limit: number = 20,
  ): Promise<ApiResponse<LiveActivityDto[]>> {
    return apiFetch<LiveActivityDto[]>(`/reception/activities?limit=${limit}`);
  },

  /**
   * Get active alerts for reception
   */
  async getAlerts(): Promise<ApiResponse<AlertDto[]>> {
    return apiFetch<AlertDto[]>("/reception/alerts");
  },

  /**
   * Get reception dashboard statistics
   */
  async getStats(): Promise<ApiResponse<ReceptionStatsDto>> {
    return apiFetch<ReceptionStatsDto>("/reception/stats");
  },

  /**
   * Create a new member with subscription and payment
   */
  async createMember(
    data: CreateMemberDto,
  ): Promise<ApiResponse<CreateMemberResponseDto>> {
    return apiFetch<CreateMemberResponseDto>("/reception/create-member", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
