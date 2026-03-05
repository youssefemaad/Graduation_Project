import { apiFetch, type ApiResponse } from "./client";

// ============================================================
// WORKOUT AI SERVICE
// Flan-T5 ML Model Integration
// ============================================================

// Request Types
export interface GenerateAIWorkoutPlanRequest {
  userId: number;
  fitnessLevel: "Beginner" | "Intermediate" | "Advanced";
  goal: "Muscle" | "Strength" | "WeightLoss" | "Cardio" | "Endurance";
  daysPerWeek: number; // 3-6
  equipment: string[];
  injuries: string[];
  includeUserContext?: boolean; // Default: true
  forceRegenerate?: boolean; // Default: false (skip cache)
}

export interface SubmitWorkoutFeedbackRequest {
  workoutLogId: number;
  rating?: number; // 1-5 stars
  difficultyLevel?: string; // "too_easy" | "perfect" | "too_hard"
  exerciseFeedbacks: ExerciseFeedbackDto[];
  comments?: string;
  feedbackType: string; // "workout_completion"
}

export interface ExerciseFeedbackDto {
  exerciseId: number;
  exerciseName: string;
  actualWeight?: number;
  actualSets?: number;
  actualReps?: number;
  weightFeeling?: "too_light" | "perfect" | "too_heavy";
  difficultyFeeling?: "too_easy" | "just_right" | "too_hard";
  notes?: string;
}

// Response Types
export interface AIWorkoutPlanResult {
  success: boolean;
  planId?: number;
  planName?: string;
  planData?: AIGeneratedPlanData;
  modelVersion?: string;
  generationLatencyMs: number;
  fromCache: boolean;
  errorMessage?: string;
  generatedAt: string;
}

export interface AIGeneratedPlanData {
  schedule?: string;
  planName?: string;
  fitnessLevel?: string;
  goal?: string;
  daysPerWeek?: number;
  programDurationWeeks?: number;
  days?: AIWorkoutDay[];
  progressiveOverload?: AIProgressiveOverload;
  weeklyTips?: string[];
  notes?: string;
}

export interface AIWorkoutDay {
  dayNumber: number;
  dayName?: string; // "Upper A", "Lower B", etc.
  focus?: string; // "Chest, Shoulders, Triceps" (combined from focusAreas)
  focusAreas?: string[]; // ["chest", "shoulders", "triceps"]
  exercises?: AIExercise[];
  estimatedDurationMinutes?: number;
}

export interface AIExercise {
  exerciseId?: number;
  name: string;
  sets: string; // "4" or "3-4" - string from ML model
  reps?: string; // "8-12" or "12"
  rest?: string; // "60-90 sec" - string from ML
  weightKg?: number; // Recommended weight
  restSeconds?: number;
  tempo?: string; // "3-1-2"
  notes?: string;
  targetMuscles?: string[];
  equipment?: string;
  movementPattern?: string;
  exerciseType?: string;
  alternatives?: string[];
  imageUrl?: string; // From ML service with exercise images
  description?: string; // Exercise description and form cues
}

export interface AIProgressiveOverload {
  strategy?: string;
  weeklyWeightIncreasePercent?: number;
  deloadSchedule?: string;
  notes?: string;
}

export interface WorkoutFeedbackResult {
  success: boolean;
  feedbackId?: number;
  message?: string;
  strengthUpdates?: StrengthProfileUpdate[];
}

export interface StrengthProfileUpdate {
  exerciseId: number;
  exerciseName: string;
  oldEstimated1RM?: number;
  newEstimated1RM?: number;
  confidenceScore: number;
  changeReason?: string;
}

export interface UserStrengthProfileDto {
  userId: number;
  lastUpdated?: string;
  exercises: ExerciseStrengthDto[];
}

export interface ExerciseStrengthDto {
  exerciseId: number;
  exerciseName: string;
  estimated1RM: number;
  confidenceScore: number;
  avgWorkingWeight?: number;
  maxWeightLifted?: number;
  feedbackCount: number;
  strengthTrend?: string; // "improving" | "plateauing"
  lastWorkoutDate?: string;
}

export interface MuscleScanResultDto {
  scanId: number;
  userId: number;
  imageUrl?: string;
  imageType?: string;
  muscleScores?: Record<string, number>;
  underdevelopedMuscles?: string[];
  wellDevelopedMuscles?: string[];
  bodyFatEstimate?: number;
  muscleDefinitionScore?: number;
  postureNotes?: string;
  asymmetryDetected?: boolean;
  confidenceScore: number;
  scanDate: string;
}

export interface MLHealthResponse {
  status: string;
  message?: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Generate AI workout plan using Flan-T5 ML model
 */
export async function generateAIWorkoutPlan(
  request: GenerateAIWorkoutPlanRequest,
): Promise<ApiResponse<AIWorkoutPlanResult>> {
  return apiFetch<AIWorkoutPlanResult>("/workout-ai/generate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Submit workout feedback (updates strength profile)
 */
export async function submitWorkoutFeedback(
  request: SubmitWorkoutFeedbackRequest,
): Promise<ApiResponse<WorkoutFeedbackResult>> {
  return apiFetch<WorkoutFeedbackResult>("/workout-ai/feedback", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Check if ML service is available
 */
export async function checkMLServiceHealth(): Promise<
  ApiResponse<MLHealthResponse>
> {
  return apiFetch<MLHealthResponse>("/workout-ai/health", {
    method: "GET",
  });
}

/**
 * Get user's strength profile
 */
export async function getUserStrengthProfile(
  userId: number,
): Promise<ApiResponse<UserStrengthProfileDto>> {
  return apiFetch<UserStrengthProfileDto>(`/workout-ai/strength/${userId}`, {
    method: "GET",
  });
}

/**
 * Get user's latest muscle scan
 */
export async function getLatestMuscleScan(
  userId: number,
): Promise<ApiResponse<MuscleScanResultDto>> {
  return apiFetch<MuscleScanResultDto>(`/workout-ai/muscle-scan/${userId}`, {
    method: "GET",
  });
}

/**
 * Get feedback history
 */
export async function getFeedbackHistory(
  limit: number = 20,
): Promise<ApiResponse<any[]>> {
  return apiFetch<any[]>(`/workout-ai/feedback/history?limit=${limit}`, {
    method: "GET",
  });
}

// ============================================================
// SAVE / SHARE / SUBSTITUTE APIs
// ============================================================

export interface SaveAIWorkoutPlanRequest {
  userId: number;
  planName: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  programDurationWeeks: number;
  days: AIWorkoutDay[];
  notes?: string;
  generationLatencyMs: number;
  modelVersion: string;
  aiGenerated: boolean;
}

export interface SaveAIWorkoutPlanResponse {
  success: boolean;
  planId?: number;
  message?: string;
}

export interface SharePlanWithCoachRequest {
  planId: number;
  coachId?: number;
  message?: string;
}

export interface ExerciseSubstitution {
  originalExercise: string;
  substituteExercise: string;
  reason?: string;
}

/**
 * Save an AI-generated workout plan to the backend
 */
export async function saveAIWorkoutPlan(
  request: SaveAIWorkoutPlanRequest,
): Promise<ApiResponse<SaveAIWorkoutPlanResponse>> {
  return apiFetch<SaveAIWorkoutPlanResponse>("/workout-ai/save-plan", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Share a saved workout plan with a coach
 */
export async function sharePlanWithCoach(
  request: SharePlanWithCoachRequest,
): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return apiFetch<{ success: boolean; message?: string }>(
    "/workout-ai/share-with-coach",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

/**
 * Get alternative exercises for substitution
 */
export async function getExerciseAlternatives(
  exerciseName: string,
  equipment: string[],
  targetMuscles: string[],
): Promise<ApiResponse<AIExercise[]>> {
  return apiFetch<AIExercise[]>("/workout-ai/exercise-alternatives", {
    method: "POST",
    body: JSON.stringify({ exerciseName, equipment, targetMuscles }),
  });
}

// ============================================================
// USER AI PLANS
// ============================================================

export interface UserAIPlanExercise {
  workoutPlanExerciseId: number;
  exerciseId: number;
  exerciseName: string;
  dayNumber: number;
  orderInDay: number;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  notes?: string;
  equipmentId?: number;
  equipmentRequired?: string;
  muscleGroup?: string;
}

export interface UserAIPlanDay {
  dayNumber: number;
  dayName?: string;
  exercises: UserAIPlanExercise[];
}

export interface UserAIWorkoutPlan {
  planId: number;
  planName: string;
  description?: string;
  fitnessLevel?: string;
  goal?: string;
  daysPerWeek?: number;
  durationWeeks?: number;
  planType?: string;
  status: string;
  isActive: boolean;
  modelVersion?: string;
  generationLatencyMs?: number;
  planData?: string;
  createdAt: string;
  updatedAt: string;
  days: UserAIPlanDay[];
}

/**
 * Get the current user's saved AI workout plans
 */
export async function getMyAIPlans(): Promise<ApiResponse<UserAIWorkoutPlan[]>> {
  return apiFetch<UserAIWorkoutPlan[]>("/workout-ai/my-plans", {
    method: "GET",
  });
}
/**
 * Delete an AI workout plan
 */
export async function deleteAIPlan(planId: number): Promise<ApiResponse<void>> {
  return apiFetch<void>(`/workout-ai/my-plans/${planId}`, {
    method: "DELETE",
  });
}
