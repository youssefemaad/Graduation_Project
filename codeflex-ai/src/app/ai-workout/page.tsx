"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  workoutGeneratorApi,
  type WorkoutPlan,
  type GenerateWorkoutRequest,
} from "@/services/workoutGeneratorService";

export default function AIWorkoutGeneratorPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState<GenerateWorkoutRequest>({
    days: 3,
    level: "beginner",
    goal: "strength",
    equipment: [],
  });

  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const equipmentOptions = [
    "barbell",
    "dumbbell",
    "cable",
    "leverage machine",
    "body weight",
  ];

  const handleEquipmentToggle = (equipment: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment?.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...(prev.equipment || []), equipment],
    }));
  };

  const handleGenerate = async () => {
    if (!user || !token) {
      setError("Please log in to generate a workout plan");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🎯 Generating plan with:", formData);
      console.log("👤 User:", user);

      const plan = await workoutGeneratorApi.generatePlan(
        {
          ...formData,
          memberId: user.userId,
        },
        token,
      );

      console.log("✅ Plan generated:", plan);
      setGeneratedPlan(plan);
    } catch (err: any) {
      console.error("❌ Generation failed:", err);
      const errorMessage =
        err.message ||
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to generate workout plan";
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = () => {
    // Navigate to schedule/calendar page with the plan
    if (generatedPlan) {
      // Store plan in session storage for now
      sessionStorage.setItem(
        "pendingWorkoutPlan",
        JSON.stringify(generatedPlan),
      );
      router.push("/schedule");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            AI Workout Plan Generator
          </h1>
          <p className="text-white/70">
            Generate personalized workout plans using AI
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Days per week */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Days per Week
              </label>
              <select
                value={formData.days}
                onChange={(e) =>
                  setFormData({ ...formData, days: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                {[3, 4, 5, 6, 7].map((day) => (
                  <option key={day} value={day}>
                    {day} days
                  </option>
                ))}
              </select>
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Fitness Level
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Primary Goal
              </label>
              <select
                value={formData.goal}
                onChange={(e) =>
                  setFormData({ ...formData, goal: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-white/20 text-white border border-white/20 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy (Muscle)</option>
                <option value="weightloss">Weight Loss</option>
                <option value="endurance">Endurance</option>
                <option value="general">General Fitness</option>
              </select>
            </div>
          </div>

          {/* Equipment Selection */}
          <div className="mt-6">
            <label className="block text-white font-semibold mb-3">
              Available Equipment
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {equipmentOptions.map((equipment) => (
                <button
                  key={equipment}
                  onClick={() => handleEquipmentToggle(equipment)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    formData.equipment?.includes(equipment)
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-8 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Workout Plan"
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Generated Plan Display */}
        {generatedPlan && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {generatedPlan.planName}
                </h2>
                <div className="flex gap-4 text-white/70">
                  <span>📅 {generatedPlan.daysPerWeek} days/week</span>
                  <span>⏱️ {generatedPlan.programDurationWeeks} weeks</span>
                  <span>🎯 {generatedPlan.goal}</span>
                  <span>💪 {generatedPlan.fitnessLevel}</span>
                </div>
              </div>
              <button
                onClick={handleSavePlan}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                Save to Calendar
              </button>
            </div>

            {/* Days */}
            <div className="space-y-6">
              {generatedPlan.days.map((day) => (
                <div key={day.dayNumber} className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {day.dayName}
                  </h3>
                  <div className="flex gap-3 mb-4 text-sm">
                    {day.focusAreas.map((area, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full">
                      ~{day.estimatedDurationMinutes} min
                    </span>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-3">
                    {day.exercises.map((exercise, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-semibold">
                            {exercise.name}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-yellow-600/30 text-yellow-200 rounded">
                            {exercise.exerciseType}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-white/70 text-sm mb-2">
                          <span>Sets: {exercise.sets}</span>
                          <span>Reps: {exercise.reps}</span>
                          <span>Rest: {exercise.rest}</span>
                        </div>
                        <div className="text-white/50 text-xs">
                          Equipment: {exercise.equipment} | Pattern:{" "}
                          {exercise.movementPattern}
                        </div>
                        {exercise.notes && (
                          <div className="mt-2 text-white/60 text-sm italic">
                            💡 {exercise.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
