import { apiFetch, type ApiResponse } from './client';

// Matches backend: Shared.DTOs.WorkoutPlan.WorkoutPlanDto
export interface WorkoutPlanDto {
  planId: number;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  coachName?: string;
  durationWeeks: number;
  difficultyLevel: number;
  goals?: string;
  isTemplate: boolean;
  isActive: boolean;
  createdAt: string;
}

// Matches backend: Shared.DTOs.WorkoutPlan.MemberWorkoutPlanDto
export interface MemberWorkoutPlanDto {
  memberPlanId: number;
  memberId: number;
  memberName: string;
  planId: number;
  planName: string;
  assignedByCoachId?: number;
  coachName?: string;
  startDate: string;
  endDate?: string;
  status: number;
  statusText: string;
  completedWorkouts?: number;
  totalWorkouts?: number;
  notes?: string;
  createdAt: string;
}

export interface AssignWorkoutPlanDto {
  memberId: number;
  planId: number;
  assignedByCoachId?: number;
  startDate: string;
  notes?: string;
}

export interface UpdateProgressDto {
  workoutsCompleted: number;
  currentWeek: number;
  notes?: string;
}

export const workoutPlansApi = {
  /**
   * Get all workout templates
   */
  async getAllTemplates(): Promise<ApiResponse<WorkoutPlanDto[]>> {
    return apiFetch<WorkoutPlanDto[]>('/workout-plans/templates');
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<ApiResponse<WorkoutPlanDto>> {
    return apiFetch<WorkoutPlanDto>(`/workout-plans/templates/${id}`);
  },

  /**
   * Get member's workout plans
   */
  async getMemberPlans(memberId: number): Promise<ApiResponse<MemberWorkoutPlanDto[]>> {
    return apiFetch<MemberWorkoutPlanDto[]>(`/workout-plans/member/${memberId}`);
  },

  /**
   * Get member plan details
   */
  async getMemberPlanDetails(memberPlanId: number): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}`);
  },

  /**
   * Assign plan to member
   */
  async assignPlanToMember(data: AssignWorkoutPlanDto): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>('/workout-plans/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update progress
   */
  async updateProgress(memberPlanId: number, data: UpdateProgressDto): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete plan
   */
  async completePlan(memberPlanId: number): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}/complete`, {
      method: 'PUT',
    });
  },
};
