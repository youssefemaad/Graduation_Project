"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { milestonesApi, type UserMilestoneDto, statsApi } from "@/lib/api";
import {
  Award,
  Trophy,
  Flame,
  CheckCircle,
  Loader2,
  Target,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function AchievementsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<UserMilestoneDto[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        // Fetch milestones
        const milestonesResponse = await milestonesApi.getUserMilestones(user.userId);
        if (milestonesResponse.success && milestonesResponse.data) {
          setMilestones(milestonesResponse.data);
        }

        // Fetch stats for additional info
        const statsResponse = await statsApi.getMemberStats(user.userId);
        if (statsResponse.success && statsResponse.data) {
          setTotalWorkouts(statsResponse.data.totalWorkoutsCompleted);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast("Failed to load achievements", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast]);

  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const inProgressMilestones = milestones.filter((m) => !m.isCompleted);

  // Calculate progress percentage
  const getProgressPercentage = (milestone: UserMilestoneDto) => {
    if (!milestone.milestoneTarget || milestone.milestoneTarget === 0) return 0;
    return Math.min(100, Math.round((milestone.currentProgress / milestone.milestoneTarget) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 dark:bg-slate-900 relative p-4 lg:p-8">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-lg opacity-10 dark:opacity-5 transform scale-105"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')"
          }}
        />
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Your Achievements</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track your progress and unlock milestones
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{completedMilestones.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{inProgressMilestones.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalWorkouts}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Workouts Done</p>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {milestones.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Milestones Yet</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Start working out and you&apos;ll unlock achievements!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Completed Milestones */}
            {completedMilestones.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed ({completedMilestones.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedMilestones.map((milestone) => (
                    <div
                      key={milestone.userMilestoneId}
                      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-green-100 dark:border-green-900/50 relative overflow-hidden"
                    >
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        {milestone.milestoneName || `Milestone #${milestone.milestoneId}`}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        {milestone.milestoneDescription || 'Achievement unlocked!'}
                      </p>
                      {milestone.completedAt && (
                        <p className="text-xs text-green-600 font-semibold">
                          Completed {new Date(milestone.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Milestones */}
            {inProgressMilestones.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  In Progress ({inProgressMilestones.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressMilestones.map((milestone) => {
                    const progress = getProgressPercentage(milestone);
                    return (
                      <div
                        key={milestone.userMilestoneId}
                        className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
                      >
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <Award className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                          {milestone.milestoneName || `Milestone #${milestone.milestoneId}`}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {milestone.milestoneDescription || 'Keep going!'}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>{milestone.currentProgress} / {milestone.milestoneTarget || '?'}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <AchievementsContent />
    </ProtectedRoute>
  );
}
