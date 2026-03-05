"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PlanReviewModal from "@/components/PlanReviewModal";
import type { WorkoutPlan } from "@/services/workoutGeneratorService";

interface PlanReviewData extends WorkoutPlan {
  id: string;
  memberId: string;
  memberName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export default function CoachReviewPage() {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState<PlanReviewData[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    // TODO: Replace with actual API call
    // For now, load from session storage (demo purposes)
    const stored = sessionStorage.getItem("pendingWorkoutPlan");
    if (stored) {
      const plan = JSON.parse(stored);
      setPlans([
        {
          ...plan,
          id: "1",
          memberId: "user123",
          memberName: "John Doe",
          status: "pending",
          submittedAt: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  const handlePlanUpdate = (updatedPlan: PlanReviewData) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
    );
    setSelectedPlan(null);
  };

  const filteredPlans = plans.filter(
    (p) => filter === "all" || p.status === filter,
  );

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-200 border-yellow-500/50",
    approved: "bg-green-500/20 text-green-200 border-green-500/50",
    rejected: "bg-red-500/20 text-red-200 border-red-500/50",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Workout Plan Reviews
          </h1>
          <p className="text-white/70">
            Review and approve AI-generated workout plans
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  filter === status
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                  {status === "all"
                    ? plans.length
                    : plans.filter((p) => p.status === status).length}
                </span>
              </button>
            ),
          )}
        </div>

        {/* Plans List */}
        {filteredPlans.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No plans found
            </h3>
            <p className="text-white/60">
              {filter === "pending"
                ? "No plans pending review at the moment"
                : `No ${filter} plans found`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/15 transition-all cursor-pointer"
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {plan.planName}
                    </h3>
                    <div className="text-white/70">
                      Member:{" "}
                      <span className="font-semibold">{plan.memberName}</span>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl border font-semibold ${statusColors[plan.status]}`}
                  >
                    {plan.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-white/70">
                    <div className="text-sm mb-1">Days/Week</div>
                    <div className="text-white font-semibold">
                      📅 {plan.daysPerWeek}
                    </div>
                  </div>
                  <div className="text-white/70">
                    <div className="text-sm mb-1">Duration</div>
                    <div className="text-white font-semibold">
                      ⏱️ {plan.programDurationWeeks} weeks
                    </div>
                  </div>
                  <div className="text-white/70">
                    <div className="text-sm mb-1">Level</div>
                    <div className="text-white font-semibold">
                      💪 {plan.fitnessLevel}
                    </div>
                  </div>
                  <div className="text-white/70">
                    <div className="text-sm mb-1">Goal</div>
                    <div className="text-white font-semibold">
                      🎯 {plan.goal}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-white/50">
                  <span>
                    Submitted: {new Date(plan.submittedAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{plan.days.length} workout days</span>
                  <span>•</span>
                  <span>
                    {plan.days.reduce((sum, d) => sum + d.exercises.length, 0)}{" "}
                    total exercises
                  </span>
                </div>

                {plan.status === "pending" && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                      }}
                      className="bg-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-all"
                    >
                      Review Plan →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPlan && (
        <PlanReviewModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onUpdate={handlePlanUpdate}
        />
      )}
    </div>
  );
}
