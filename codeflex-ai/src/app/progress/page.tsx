"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  inbodyApi,
  workoutLogsApi,
  statsApi,
  type InBodyMeasurementDto,
  type WorkoutLogDto,
  type MemberStatsDto,
} from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Dumbbell,
  Flame,
  Target,
  Calendar,
  Scale,
  Percent,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ProgressContent() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MemberStatsDto | null>(null);
  const [measurements, setMeasurements] = useState<InBodyMeasurementDto[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        const [statsRes, measurementsRes, logsRes] = await Promise.all([
          statsApi.getMemberStats(user.userId),
          inbodyApi.getUserMeasurements(user.userId),
          workoutLogsApi.getUserWorkoutLogs(user.userId),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (measurementsRes.success && measurementsRes.data) setMeasurements(measurementsRes.data);
        if (logsRes.success && logsRes.data) setWorkoutLogs(logsRes.data);
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]);

  // Calculate stats from data
  const calculateStreak = () => {
    if (workoutLogs.length === 0) return 0;
    // Simple streak calculation - count consecutive days with workouts
    const sortedLogs = [...workoutLogs].sort(
      (a, b) => new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasWorkout = sortedLogs.some((log) => {
        const logDate = new Date(log.workoutDate);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === checkDate.getTime();
      });
      if (hasWorkout) streak++;
      else if (i > 0) break; // Allow today to be missing
    }
    return streak;
  };

  const getWeightChange = () => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    return {
      current: latest.weight,
      change: latest.weight - previous.weight,
      percentage: ((latest.weight - previous.weight) / previous.weight) * 100,
    };
  };

  const getBodyFatChange = () => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    return {
      current: latest.bodyFatPercentage,
      change: (latest.bodyFatPercentage ?? 0) - (previous.bodyFatPercentage ?? 0),
    };
  };

  const workoutStreak = calculateStreak();
  const weightChange = getWeightChange();
  const bodyFatChange = getBodyFatChange();
  const totalWorkouts = workoutLogs.length;
  const thisWeekWorkouts = workoutLogs.filter((log) => {
    const logDate = new Date(log.workoutDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  }).length;

  const totalCaloriesBurned = workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Your </span>
            <span className="text-primary">Progress</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your fitness journey and achievements
          </p>
        </div>
        <Link href="/inbody">
          <Button>
            <Scale className="h-4 w-4 mr-2" />
            New Measurement
          </Button>
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">Workout Streak</span>
          </div>
          <div className="text-3xl font-bold">{workoutStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Dumbbell className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">This Week</span>
          </div>
          <div className="text-3xl font-bold">{thisWeekWorkouts}</div>
          <div className="text-xs text-muted-foreground">workouts</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Total Workouts</span>
          </div>
          <div className="text-3xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-muted-foreground">completed</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground">Calories Burned</span>
          </div>
          <div className="text-3xl font-bold">{totalCaloriesBurned.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">total kcal</div>
        </Card>
      </div>

      {/* Body Composition */}
      <Card className="p-6 border border-border bg-card/50">
        <h2 className="text-xl font-bold mb-6">
          <span className="text-foreground">Body </span>
          <span className="text-primary">Composition</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Weight */}
          <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Weight</span>
              <Scale className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {stats?.currentWeight ? `${stats.currentWeight} kg` : "N/A"}
            </div>
            {weightChange && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${weightChange.change < 0 ? "text-green-500" : "text-red-500"}`}>
                {weightChange.change < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                <span>{Math.abs(weightChange.change).toFixed(1)} kg</span>
                <span className="text-muted-foreground">vs last</span>
              </div>
            )}
          </div>

          {/* Body Fat */}
          <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Body Fat</span>
              <Percent className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {stats?.currentBodyFat ? `${stats.currentBodyFat}%` : "N/A"}
            </div>
            {bodyFatChange && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${bodyFatChange.change < 0 ? "text-green-500" : "text-red-500"}`}>
                {bodyFatChange.change < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                <span>{Math.abs(bodyFatChange.change).toFixed(1)}%</span>
                <span className="text-muted-foreground">vs last</span>
              </div>
            )}
          </div>

          {/* BMI */}
          <div className="p-5 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">BMI</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              {stats?.latestBmi ? stats.latestBmi.toFixed(1) : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {stats?.latestBmi && (
                stats.latestBmi < 18.5 ? "Underweight" :
                  stats.latestBmi < 25 ? "Normal" :
                    stats.latestBmi < 30 ? "Overweight" : "Obese"
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Measurement History */}
      <Card className="p-6 border border-border bg-card/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <span className="text-foreground">Measurement </span>
            <span className="text-primary">History</span>
          </h2>
          <Link href="/inbody">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {measurements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No measurements yet</p>
            <p className="text-sm mt-1">Schedule an InBody scan to start tracking</p>
            <Link href="/inbody" className="mt-4 inline-block">
              <Button>Schedule Scan</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Weight</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Body Fat</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Muscle Mass</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">BMI</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice(0, 5).map((m) => (
                  <tr key={m.measurementId} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="py-3 px-4 text-sm">
                      {new Date(m.measurementDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{m.weight} kg</td>
                    <td className="py-3 px-4 text-sm text-right">{m.bodyFatPercentage ?? "--"}%</td>
                    <td className="py-3 px-4 text-sm text-right">{m.muscleMass ?? "--"} kg</td>
                    <td className="py-3 px-4 text-sm text-right">{m.bmi?.toFixed(1) ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Workouts */}
      <Card className="p-6 border border-border bg-card/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            <span className="text-foreground">Recent </span>
            <span className="text-primary">Workouts</span>
          </h2>
          <Link href="/workout-history">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {workoutLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No workouts logged yet</p>
            <p className="text-sm mt-1">Complete a workout to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workoutLogs.slice(0, 5).map((log) => (
              <div
                key={log.logId}
                className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{log.planName || "Custom Workout"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.workoutDate).toLocaleDateString()}
                      </span>
                      <span>{log.durationMinutes} min</span>
                      {log.caloriesBurned && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {log.caloriesBurned} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.exercises?.length || 0} exercises
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CTA */}
      <Card className="p-6 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Earn Achievements</span>
            </h3>
            <p className="text-muted-foreground">
              Complete milestones to earn badges and bonus tokens
            </p>
          </div>
          <Link href="/achievements">
            <Button size="lg">
              View Achievements
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProgressContent />
    </ProtectedRoute>
  );
}
