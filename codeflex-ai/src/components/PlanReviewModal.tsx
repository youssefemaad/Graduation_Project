"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CoachFeedbackForm from "./CoachFeedbackForm";
import type { WorkoutPlan, Exercise } from "@/services/workoutGeneratorService";

interface PlanReviewData extends WorkoutPlan {
  id: string;
  memberId: string;
  memberName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

interface ExerciseEdit extends Exercise {
  dayIndex: number;
  exerciseIndex: number;
}

interface Props {
  plan: PlanReviewData;
  onClose: () => void;
  onUpdate: (updatedPlan: PlanReviewData) => void;
}

export default function PlanReviewModal({ plan, onClose, onUpdate }: Props) {
  const { token } = useAuth();
  const [editedPlan, setEditedPlan] = useState<PlanReviewData>(plan);
  const [editingExercise, setEditingExercise] = useState<ExerciseEdit | null>(
    null,
  );
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleExerciseEdit = (
    dayIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: any,
  ) => {
    setEditedPlan((prev) => ({
      ...prev,
      days: prev.days.map((day, dIdx) =>
        dIdx === dayIndex
          ? {
              ...day,
              exercises: day.exercises.map((ex, eIdx) =>
                eIdx === exerciseIndex ? { ...ex, [field]: value } : ex,
              ),
            }
          : day,
      ),
    }));
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      // TODO: Call API to approve plan
      // await axios.post(`${API_URL}/api/WorkoutPlan/review`, { ... })

      const approvedPlan = { ...editedPlan, status: "approved" as const };
      onUpdate(approvedPlan);
      onClose();
    } catch (error) {
      console.error("Failed to approve plan:", error);
      alert("Failed to approve plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = () => {
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = (updatedPlan: PlanReviewData) => {
    onUpdate(updatedPlan);
    onClose();
  };

  if (showFeedbackForm) {
    return (
      <CoachFeedbackForm
        plan={editedPlan}
        onClose={onClose}
        onSubmit={handleFeedbackSubmit}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">
                {editedPlan.planName}
              </h2>
              <div className="text-white/70">
                Member:{" "}
                <span className="font-semibold text-white">
                  {plan.memberName}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Plan Info */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-white/60 mb-1">Days/Week</div>
              <div className="text-white font-semibold">
                📅 {editedPlan.daysPerWeek}
              </div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Duration</div>
              <div className="text-white font-semibold">
                ⏱️ {editedPlan.programDurationWeeks} weeks
              </div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Level</div>
              <div className="text-white font-semibold">
                💪 {editedPlan.fitnessLevel}
              </div>
            </div>
            <div>
              <div className="text-white/60 mb-1">Goal</div>
              <div className="text-white font-semibold">
                🎯 {editedPlan.goal}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "✓ Approve Plan"}
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
            >
              ✕ Reject & Provide Feedback
            </button>
          </div>
        </div>

        {/* Workout Days */}
        <div className="p-6 space-y-6">
          {editedPlan.days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white/5 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-3">
                Day {day.dayNumber}: {day.dayName}
              </h3>

              <div className="flex gap-3 mb-4 flex-wrap">
                {day.focusAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
                <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm">
                  ~{day.estimatedDurationMinutes} min
                </span>
              </div>

              {/* Exercises */}
              <div className="space-y-3">
                {day.exercises.map((exercise, exerciseIndex) => (
                  <div
                    key={exerciseIndex}
                    className="bg-white/5 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-white font-semibold text-lg">
                        {exercise.name}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-yellow-600/30 text-yellow-200 rounded">
                        {exercise.exerciseType}
                      </span>
                    </div>

                    {/* Editable Fields */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">
                          Sets
                        </label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) =>
                            handleExerciseEdit(
                              dayIndex,
                              exerciseIndex,
                              "sets",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">
                          Reps
                        </label>
                        <input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) =>
                            handleExerciseEdit(
                              dayIndex,
                              exerciseIndex,
                              "reps",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">
                          Rest
                        </label>
                        <input
                          type="text"
                          value={exercise.rest}
                          onChange={(e) =>
                            handleExerciseEdit(
                              dayIndex,
                              exerciseIndex,
                              "rest",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="text-white/50 text-sm mb-2">
                      Equipment: {exercise.equipment} | Pattern:{" "}
                      {exercise.movementPattern}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">
                        Coach Notes
                      </label>
                      <textarea
                        value={exercise.notes || ""}
                        onChange={(e) =>
                          handleExerciseEdit(
                            dayIndex,
                            exerciseIndex,
                            "notes",
                            e.target.value,
                          )
                        }
                        placeholder="Add coaching notes..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
