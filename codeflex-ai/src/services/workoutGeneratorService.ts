// Workout Generator API Service
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface GenerateWorkoutRequest {
  days: number;
  level: string;
  goal: string;
  equipment?: string[];
  memberId?: number;
  coachFeedback?: string;
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  targetMuscles: string[];
  equipment: string;
  movementPattern: string;
  exerciseType: string;
  notes: string;
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;
  focusAreas: string[];
  estimatedDurationMinutes: number;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  planName: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  programDurationWeeks: number;
  days: WorkoutDay[];
}

export interface WorkoutPlanReview {
  planId: number;
  approved: boolean;
  coachComments?: string;
  modifications?: ExerciseModification[];
}

export interface ExerciseModification {
  dayNumber: number;
  exerciseIndex: number;
  newSets?: string;
  newReps?: string;
  newRest?: string;
  newNotes?: string;
}

export const workoutGeneratorApi = {
  // Generate a new workout plan
  generatePlan: async (request: GenerateWorkoutRequest, token: string) => {
    try {
      console.log(
        "🚀 Calling API:",
        `${API_BASE_URL}/api/WorkoutGenerator/generate`,
      );
      console.log("📦 Request:", request);

      const response = await axios.post<WorkoutPlan>(
        `${API_BASE_URL}/api/WorkoutGenerator/generate`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ API Error:", error);
      console.error("❌ Response:", error.response?.data);
      console.error("❌ Status:", error.response?.status);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Failed to generate workout plan",
      );
    }
  },

  // Regenerate with coach feedback
  regenerateWithFeedback: async (
    originalRequest: GenerateWorkoutRequest,
    coachFeedback: string,
    token: string,
  ) => {
    const request = {
      ...originalRequest,
      coachFeedback,
    };
    return workoutGeneratorApi.generatePlan(request, token);
  },

  // Health check
  healthCheck: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/api/WorkoutGenerator/health`,
    );
    return response.data;
  },
};
