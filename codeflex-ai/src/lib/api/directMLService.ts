/**
 * Direct ML API Service - Frontend calls FastAPI directly for optimal performance
 * Uses RAG pattern: FastAPI retrieves user context from PostgreSQL
 * Then frontend saves the result to C# backend asynchronously
 */

import { useState } from "react";

// Configuration
const ML_API_BASE_URL =
  process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:5301";
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5025";

// ============================================================
// Request/Response Types
// ============================================================

export interface DirectWorkoutRequest {
  user_id: number;
  fitness_level: "Beginner" | "Intermediate" | "Advanced";
  goal: "Muscle" | "Strength" | "Endurance" | "Weight Loss" | "General";
  days_per_week: number;
  equipment?: string[];
  injuries?: string[];
  include_user_context?: boolean; // Default: true
}

export interface DirectWorkoutResponse {
  plan: any | null;
  is_valid_json: boolean;
  model_version: string;
  generation_latency_ms: number;
  user_context_retrieved: boolean;
  error?: string;
}

export interface SavePlanRequest {
  userId: number;
  planName: string;
  fitnessLevel: string;
  goal: string;
  daysPerWeek: number;
  programDurationWeeks: number;
  days: any[];
  notes?: string;
  generationLatencyMs: number;
  modelVersion: string;
  aiGenerated: boolean;
}

export interface SavePlanResponse {
  success: boolean;
  planId?: number;
  message?: string;
  error?: string;
}

// ============================================================
// Direct ML API Service
// ============================================================

export class DirectMLService {
  /**
   * Generate workout plan - Calls FastAPI directly with RAG
   * Step 1: Frontend → FastAPI (includes database RAG for user context)
   */
  static async generateWorkoutPlan(
    request: DirectWorkoutRequest,
    onProgress?: (status: string) => void,
  ): Promise<DirectWorkoutResponse> {
    try {
      if (onProgress) onProgress("🚀 Connecting to AI model...");

      const response = await fetch(`${ML_API_BASE_URL}/generate-direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `ML API error: ${response.status} ${response.statusText}`,
        );
      }

      if (onProgress) onProgress("🤖 AI model processing...");

      const result: DirectWorkoutResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (onProgress) {
        const contextMsg = result.user_context_retrieved
          ? " (with personalized context)"
          : "";
        onProgress(
          `✅ Plan generated in ${result.generation_latency_ms}ms${contextMsg}`,
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ Direct ML API Error:", error);
      throw new Error(
        error.message || "Failed to generate workout plan from ML service",
      );
    }
  }

  /**
   * Save generated plan to backend database
   * Step 2: Frontend → C# Backend (async save)
   */
  static async savePlanToBackend(
    request: SavePlanRequest,
    token: string,
  ): Promise<SavePlanResponse> {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/api/workout-ai/save-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backend save error: ${response.status} - ${errorText}`,
        );
      }

      const result: SavePlanResponse = await response.json();
      return result;
    } catch (error: any) {
      console.error("❌ Backend Save Error:", error);
      throw new Error(error.message || "Failed to save plan to backend");
    }
  }

  /**
   * Complete workflow: Generate + Save
   * This combines both steps for convenience
   */
  static async generateAndSave(
    mlRequest: DirectWorkoutRequest,
    token: string,
    onProgress?: (status: string) => void,
  ): Promise<{ plan: any; planId: number; latency: number }> {
    try {
      // Step 1: Generate plan via ML API
      if (onProgress) onProgress("🎯 Step 1/2: Generating AI plan...");
      const mlResponse = await this.generateWorkoutPlan(mlRequest, onProgress);

      if (!mlResponse.plan || !mlResponse.is_valid_json) {
        throw new Error(mlResponse.error || "Failed to generate valid plan");
      }

      // Step 2: Save plan to backend
      if (onProgress) onProgress("💾 Step 2/2: Saving to database...");

      const saveRequest: SavePlanRequest = {
        userId: mlRequest.user_id,
        planName: mlResponse.plan.plan_name || "AI Generated Plan",
        fitnessLevel: mlRequest.fitness_level,
        goal: mlRequest.goal,
        daysPerWeek: mlRequest.days_per_week,
        programDurationWeeks: mlResponse.plan.program_duration_weeks || 8,
        days: mlResponse.plan.days || [],
        notes: mlResponse.plan.notes,
        generationLatencyMs: mlResponse.generation_latency_ms,
        modelVersion: mlResponse.model_version,
        aiGenerated: true,
      };

      const saveResponse = await this.savePlanToBackend(saveRequest, token);

      if (!saveResponse.success || !saveResponse.planId) {
        throw new Error(saveResponse.error || "Failed to save plan");
      }

      if (onProgress) onProgress("✅ Complete! Plan generated and saved.");

      return {
        plan: mlResponse.plan,
        planId: saveResponse.planId,
        latency: mlResponse.generation_latency_ms,
      };
    } catch (error: any) {
      console.error("❌ Generate and Save Error:", error);
      throw error;
    }
  }

  /**
   * Check ML service health
   */
  static async checkHealth(): Promise<{
    status: string;
    model_version: string;
    device: string;
    database_connected: boolean;
  }> {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error("❌ ML Service Health Check Failed:", error);
      throw error;
    }
  }
}

// ============================================================
// React Hook for Easy Integration
// ============================================================

export function useDirectMLService() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const generateAndSave = async (
    request: DirectWorkoutRequest,
    token: string,
  ): Promise<{ plan: any; planId: number; latency: number } | null> => {
    setLoading(true);
    setError(null);
    setProgress("Starting...");

    try {
      const result = await DirectMLService.generateAndSave(
        request,
        token,
        setProgress,
      );
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await DirectMLService.checkHealth();
      console.log("✅ ML Service Health:", health);
      return health;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  return {
    loading,
    progress,
    error,
    generateAndSave,
    checkHealth,
  };
}

// ============================================================
// Export default for convenience
// ============================================================

export default DirectMLService;

/**
 * Usage Example:
 *
 * import DirectMLService from '@/lib/api/directMLService';
 *
 * // In your component
 * const handleGenerate = async () => {
 *   const request: DirectWorkoutRequest = {
 *     user_id: currentUser.id,
 *     fitness_level: 'Intermediate',
 *     goal: 'Muscle',
 *     days_per_week: 4,
 *     equipment: ['dumbbells', 'barbell'],
 *     injuries: [],
 *     include_user_context: true // RAG: retrieve from database
 *   };
 *
 *   const result = await DirectMLService.generateAndSave(
 *     request,
 *     authToken,
 *     (status) => console.log(status) // Progress callback
 *   );
 *
 *   console.log('Plan ID:', result.planId);
 *   console.log('Latency:', result.latency, 'ms');
 * };
 *
 * // Or use the hook
 * const { loading, progress, error, generateAndSave } = useDirectMLService();
 */
