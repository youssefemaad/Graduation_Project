import { apiFetch, type ApiResponse } from './client';

// Updated to match backend DTO structure
export interface NutritionPlanDto {
  planId: number;
  memberId: number;
  memberName: string;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  coachName?: string;
  createdByAiAgentId?: number;
  startDate: string;
  endDate?: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  status: number;
  statusText: string;
  isActive: boolean;
  createdAt: string;
}

export interface GenerateNutritionPlanDto {
  memberId: number;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  fitnessGoal?: string;
  dietaryRestrictions?: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  startDate?: string;
  endDate?: string;
}

export const nutritionPlansApi = {
  /**
   * Get member's nutrition plans
   */
  async getMemberPlans(memberId: number): Promise<ApiResponse<NutritionPlanDto[]>> {
    return apiFetch<NutritionPlanDto[]>(`/nutrition-plans/member/${memberId}`);
  },

  /**
   * Get plan details
   */
  async getPlanDetails(planId: number): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}`);
  },

  /**
   * Generate new plan
   */
  async generatePlan(data: GenerateNutritionPlanDto): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>('/nutrition-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update plan
   */
  async updatePlan(planId: number, data: GenerateNutritionPlanDto): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivate plan
   */
  async deactivatePlan(planId: number): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}/deactivate`, {
      method: 'PUT',
    });
  },
};
