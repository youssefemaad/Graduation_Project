import { apiFetch, apiFetchFormData, type ApiResponse } from "./client";
import { apiCache, CACHE_TTL } from "./cache";
import { UserDto } from "./auth";

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  address?: string;
  profileImageUrl?: string;
}

// Coach profile DTO with detailed information
export interface CoachDto extends UserDto {
  coachProfileId: number;
  specialization?: string;
  certifications?: string[];
  experienceYears?: number;
  bio?: string;
  hourlyRate?: number;
  rating: number;
  totalReviews: number;
  totalClients: number;
  availabilitySchedule?: string;
  isAvailable: boolean;
}

// DTOs for new endpoints
export interface UserMetricsDto {
  userId: number;
  currentWeight?: number;
  targetWeight?: number;
  height?: number;
  bmi?: number;
  age?: number;
  fitnessGoal?: string;
  fitnessLevel?: string;
  gender?: string;
  lastUpdated?: string;
}

export interface UserWorkoutSummaryDto {
  userId: number;
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  averageWorkoutDuration: number;
  averageCaloriesPerWorkout: number;
  currentStreak: number;
  longestStreak: number;
  favoriteExercises: string[];
  lastWorkoutDate?: string;
  periodStart: string;
  periodEnd: string;
}

export interface RecentWorkoutDto {
  date: string;
  type?: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity?: string;
  notes?: string;
}

export interface UserAIContextDto {
  metrics?: UserMetricsDto;
  workoutSummary?: UserWorkoutSummaryDto;
  recentWorkouts: RecentWorkoutDto[];
  healthConditions: string[];
  dietaryPreferences: string[];
}

const CACHE_KEYS = {
  COACHES: "users:coaches",
  USER: (id: number) => `users:${id}`,
  USER_METRICS: (id: number) => `users:${id}:metrics`,
  USER_WORKOUT_SUMMARY: (id: number) => `users:${id}:workout-summary`,
  USER_AI_CONTEXT: (id: number) => `users:${id}:ai-context`,
};

export const usersApi = {
  /**
   * Get user by ID (cached for 5 minutes)
   */
  async getUser(
    id: number,
    forceRefresh = false,
  ): Promise<ApiResponse<UserDto>> {
    if (!forceRefresh) {
      const cached = apiCache.get<UserDto>(CACHE_KEYS.USER(id));
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const response = await apiFetch<UserDto>(`/users/${id}`);
    if (response.success && response.data) {
      apiCache.set(CACHE_KEYS.USER(id), response.data, CACHE_TTL.MEDIUM);
    }
    return response;
  },

  /**
   * Update user profile (invalidates user cache)
   */
  async updateProfile(
    id: number,
    data: UpdateProfileDto,
  ): Promise<ApiResponse<UserDto>> {
    const response = await apiFetch<UserDto>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (response.success) {
      apiCache.invalidate(CACHE_KEYS.USER(id));
      apiCache.invalidate(CACHE_KEYS.USER_METRICS(id));
    }

    return response;
  },

  /**
   * Get user token balance
   */
  async getTokenBalance(id: number): Promise<ApiResponse<number>> {
    return apiFetch<number>(`/users/${id}/tokens`);
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(id: number): Promise<ApiResponse<boolean>> {
    const response = await apiFetch<boolean>(`/users/${id}`, {
      method: "DELETE",
    });

    if (response.success) {
      apiCache.invalidatePrefix(`users:${id}`);
    }

    return response;
  },

  /**
   * Get all coaches (cached for 30 minutes - coaches list rarely changes)
   */
  async getCoaches(forceRefresh = false): Promise<ApiResponse<UserDto[]>> {
    if (!forceRefresh) {
      const cached = apiCache.get<UserDto[]>(CACHE_KEYS.COACHES);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const response = await apiFetch<UserDto[]>("/users/coaches");
    if (response.success && response.data) {
      apiCache.set(CACHE_KEYS.COACHES, response.data, CACHE_TTL.LONG);
    }
    return response;
  },

  /**
   * Get all coaches with detailed profile information
   */
  async getCoachesWithProfiles(
    forceRefresh = false,
  ): Promise<ApiResponse<CoachDto[]>> {
    const cacheKey = "users:coaches:details";
    if (!forceRefresh) {
      const cached = apiCache.get<CoachDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const response = await apiFetch<CoachDto[]>("/users/coaches/details");
    if (response.success && response.data) {
      apiCache.set(cacheKey, response.data, CACHE_TTL.LONG);
    }
    return response;
  },

  /**
   * Get user physical metrics (cached for 5 minutes)
   */
  async getUserMetrics(
    id: number,
    forceRefresh = false,
  ): Promise<ApiResponse<UserMetricsDto>> {
    if (!forceRefresh) {
      const cached = apiCache.get<UserMetricsDto>(CACHE_KEYS.USER_METRICS(id));
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const response = await apiFetch<UserMetricsDto>(`/users/${id}/metrics`);
    if (response.success && response.data) {
      apiCache.set(
        CACHE_KEYS.USER_METRICS(id),
        response.data,
        CACHE_TTL.MEDIUM,
      );
    }
    return response;
  },

  /**
   * Get user workout summary with stats
   */
  async getUserWorkoutSummary(
    id: number,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<UserWorkoutSummaryDto>> {
    let endpoint = `/users/${id}/workout-summary`;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) endpoint += `?${params.toString()}`;

    return apiFetch<UserWorkoutSummaryDto>(endpoint);
  },

  /**
   * Get comprehensive user context for AI personalization
   */
  async getUserAIContext(
    id: number,
    forceRefresh = false,
  ): Promise<ApiResponse<UserAIContextDto>> {
    if (!forceRefresh) {
      const cached = apiCache.get<UserAIContextDto>(
        CACHE_KEYS.USER_AI_CONTEXT(id),
      );
      if (cached) {
        return { success: true, data: cached };
      }
    }

    const response = await apiFetch<UserAIContextDto>(
      `/users/${id}/ai-context`,
    );
    if (response.success && response.data) {
      // Short cache for AI context since it includes recent workout data
      apiCache.set(
        CACHE_KEYS.USER_AI_CONTEXT(id),
        response.data,
        CACHE_TTL.SHORT,
      );
    }
    return response;
  },

  /**
   * Invalidate all user-related caches for a specific user
   */
  invalidateUserCache(id: number): void {
    apiCache.invalidatePrefix(`users:${id}`);
  },

  /**
   * Upload profile image for a user
   */
  async uploadProfileImage(
    id: number,
    file: File,
  ): Promise<ApiResponse<{ profileImageUrl: string; message: string }>> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetchFormData<{ profileImageUrl: string; message: string }>(
      `/users/${id}/upload-image`,
      formData,
    );
  },
};
