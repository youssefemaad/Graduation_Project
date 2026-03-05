"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  workoutGeneratorApi,
  type WorkoutPlan,
  type GenerateWorkoutRequest,
} from "@/services/workoutGeneratorService";

interface PlanReviewData extends WorkoutPlan {
  id: string;
  memberId: string;
  memberName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

interface Props {
  plan: PlanReviewData;
  onClose: () => void;
  onSubmit: (updatedPlan: PlanReviewData) => void;
}

export default function CoachFeedbackForm({ plan, onClose, onSubmit }: Props) {
  const { token } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackPrompts = [
    "Too much volume for this fitness level",
    "Needs more compound movements",
    "Exercise selection doesn't match the goal",
    "Rest periods are too short/long",
    "Missing muscle group coverage",
    "Progression scheme needs adjustment",
    "Equipment choices don't match available options",
  ];

  const handleAddPrompt = (prompt: string) => {
    setFeedback((prev) => (prev ? `${prev}\n\n${prompt}` : prompt));
  };

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      setError("Please provide feedback to help the AI improve");
      return;
    }

    setRegenerating(true);
    setError(null);

    try {
      // Construct original request from plan data
      const originalRequest: GenerateWorkoutRequest = {
        memberId: Number(plan.memberId),
        days: plan.daysPerWeek,
        level: plan.fitnessLevel,
        goal: plan.goal,
        equipment: [], // TODO: Extract from plan if available
        coachFeedback: feedback,
      };

      // Call regeneration endpoint
      const newPlan = await workoutGeneratorApi.regenerateWithFeedback(
        originalRequest,
        feedback,
        token!,
      );

      // Update plan with rejected status and new AI-generated content
      const updatedPlan: PlanReviewData = {
        ...newPlan,
        id: plan.id,
        memberId: plan.memberId,
        memberName: plan.memberName,
        status: "pending", // New plan pending review again
        submittedAt: new Date().toISOString(),
      };

      onSubmit(updatedPlan);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to regenerate plan. Please try again.",
      );
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl w-full max-w-3xl p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">
                Provide Feedback to AI
              </h2>
              <p className="text-white/70">
                Explain what needs improvement so the AI can generate a better
                plan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="text-red-200 font-semibold mb-1">
              Plan: {plan.planName}
            </div>
            <div className="text-red-200/70 text-sm">
              Member: {plan.memberName}
            </div>
          </div>
        </div>

        {/* Quick Feedback Prompts */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            Quick Feedback Templates (Click to Add)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {feedbackPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleAddPrompt(prompt)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-left rounded-lg transition-all text-sm"
              >
                + {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Textarea */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Detailed Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Explain what's wrong with this plan and what the AI should focus on improving...

Examples:
- This plan has too much volume for a beginner. Reduce sets per exercise.
- Need more focus on posterior chain. Add more hip hinge movements.
- Rest periods are too short for strength training. Increase to 3-5 minutes for main lifts.
- Missing direct arm work for hypertrophy goal."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 resize-none"
            rows={12}
          />
          <div className="text-white/50 text-sm mt-2">
            {feedback.length} characters • Be specific to help the AI learn
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={regenerating}
            className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating || !feedback.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {regenerating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI is Learning & Regenerating...
              </span>
            ) : (
              "🤖 Regenerate with AI Feedback"
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="text-purple-200 text-sm">
            <strong>💡 How AI Learning Works:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>
                Your feedback is analyzed and incorporated into the AI prompt
              </li>
              <li>
                The AI generates a new plan addressing your specific concerns
              </li>
              <li>The new plan will be submitted for your review again</li>
              <li>Over time, the AI learns patterns from coach feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
