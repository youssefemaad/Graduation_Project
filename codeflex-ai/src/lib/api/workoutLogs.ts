import { apiFetch, type ApiResponse } from './client';

export interface WorkoutLogDto {
  logId: number;
  userId: number;
  userName: string;
  memberPlanId?: number;
  planName?: string;
  workoutDate: string;
  durationMinutes: number;
  caloriesBurned?: number;
  notes?: string;
  exercises: LoggedExerciseDto[];
  createdAt: string;
}

export interface LoggedExerciseDto {
  logExerciseId: number;
  exerciseId: number;
  exerciseName: string;
  sets: SetLogDto[];
}

export interface SetLogDto {
  setNumber: number;
  reps: number;
  weight: number;
  isPersonalRecord: boolean;
}

export interface CreateWorkoutLogDto {
  memberPlanId?: number;
  workoutDate: string;
  durationMinutes: number;
  caloriesBurned?: number;
  notes?: string;
  exercises: CreateLoggedExerciseDto[];
}

export interface CreateLoggedExerciseDto {
  exerciseId: number;
  sets: CreateSetLogDto[];
}

export interface CreateSetLogDto {
  setNumber: number;
  reps: number;
  weight: number;
}

export interface UpdateWorkoutLogDto {
  durationMinutes?: number;
  caloriesBurned?: number;
  notes?: string;
}

export const workoutLogsApi = {
  /**
   * Create workout log
   */
  async createWorkoutLog(data: CreateWorkoutLogDto): Promise<ApiResponse<WorkoutLogDto>> {
    return apiFetch<WorkoutLogDto>('/workout-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get workout log by ID
   */
  async getWorkoutLog(id: number): Promise<ApiResponse<WorkoutLogDto>> {
    return apiFetch<WorkoutLogDto>(`/workout-logs/${id}`);
  },

  /**
   * Get user's workout logs
   */
  async getUserWorkoutLogs(userId: number): Promise<ApiResponse<WorkoutLogDto[]>> {
    return apiFetch<WorkoutLogDto[]>(`/workout-logs/user/${userId}`);
  },

  /**
   * Get workout logs by plan
   */
  async getWorkoutLogsByPlan(planId: number): Promise<ApiResponse<WorkoutLogDto[]>> {
    return apiFetch<WorkoutLogDto[]>(`/workout-logs/plan/${planId}`);
  },

  /**
   * Update workout log
   */
  async updateWorkoutLog(id: number, data: UpdateWorkoutLogDto): Promise<ApiResponse<WorkoutLogDto>> {
    return apiFetch<WorkoutLogDto>(`/workout-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete workout log
   */
  async deleteWorkoutLog(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/workout-logs/${id}`, {
      method: 'DELETE',
    });
  },
};
