import { apiFetch, type ApiResponse } from './client';

export interface MealDto {
  mealId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  mealType?: string; // Breakfast, Lunch, Dinner, Snack
  preparationTime?: string;
  cookingInstructions?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMealDto {
  name: string;
  description?: string;
  imageUrl?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  mealType?: string;
  preparationTime?: string;
  cookingInstructions?: string;
}

export const mealsApi = {
  /**
   * Get all meals
   */
  async getAllMeals(): Promise<ApiResponse<MealDto[]>> {
    return apiFetch<MealDto[]>('/meals');
  },

  /**
   * Get active meals only
   */
  async getActiveMeals(): Promise<ApiResponse<MealDto[]>> {
    return apiFetch<MealDto[]>('/meals/active');
  },

  /**
   * Get meal by ID
   */
  async getMeal(mealId: number): Promise<ApiResponse<MealDto>> {
    return apiFetch<MealDto>(`/meals/${mealId}`);
  },

  /**
   * Create a new meal
   */
  async createMeal(data: CreateMealDto): Promise<ApiResponse<MealDto>> {
    return apiFetch<MealDto>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a meal
   */
  async updateMeal(mealId: number, data: CreateMealDto): Promise<ApiResponse<MealDto>> {
    return apiFetch<MealDto>(`/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a meal
   */
  async deleteMeal(mealId: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/meals/${mealId}`, {
      method: 'DELETE',
    });
  },
};
