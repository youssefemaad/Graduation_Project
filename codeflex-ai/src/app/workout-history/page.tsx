"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { workoutLogsApi, type WorkoutLogDto } from "@/lib/api";
import {
  Dumbbell,
  Calendar,
  Clock,
  Flame,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function WorkoutHistoryContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const [selectedLog, setSelectedLog] = useState<WorkoutLogDto | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.userId) return;

      try {
        const response = await workoutLogsApi.getUserWorkoutLogs(user.userId);
        if (response.success && response.data) {
          setWorkoutLogs(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch workout logs:", error);
        showToast("Failed to load workout history", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user?.userId, showToast]);

  // Filter and search
  const filteredLogs = workoutLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const logDate = new Date(log.workoutDate);
    const now = new Date();
    let matchesPeriod = true;

    if (filterPeriod === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesPeriod = logDate >= weekAgo;
    } else if (filterPeriod === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesPeriod = logDate >= monthAgo;
    } else if (filterPeriod === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      matchesPeriod = logDate >= yearAgo;
    }

    return matchesSearch && matchesPeriod;
  });

  // Calculate stats
  const totalWorkouts = workoutLogs.length;
  const totalDuration = workoutLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const totalCalories = workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

  const handleDeleteLog = async (logId: number) => {
    setIsDeleting(true);
    try {
      const response = await workoutLogsApi.deleteWorkoutLog(logId);
      if (response.success) {
        setWorkoutLogs((prev) => prev.filter((log) => log.logId !== logId));
        showToast("Workout log deleted", "success");
        setShowDetailsModal(false);
      } else {
        showToast(response.message || "Failed to delete", "error");
      }
    } catch (error) {
      showToast("Failed to delete workout log", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetails = (log: WorkoutLogDto) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Workout History</h1>
          <p className="text-slate-500">Track your progress and review past workouts</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalWorkouts}</p>
                <p className="text-sm text-slate-500">Total Workouts</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalDuration}</p>
                <p className="text-sm text-slate-500">Total Minutes</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{totalCalories}</p>
                <p className="text-sm text-slate-500">Calories Burned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search workouts..."
              className="pl-10 h-11 border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "week", "month", "year"] as const).map((period) => (
              <Button
                key={period}
                variant={filterPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPeriod(period)}
                className="rounded-lg capitalize"
              >
                {period === "all" ? "All Time" : `This ${period}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Workout List */}
        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center bg-white border-0 shadow-sm">
            <Dumbbell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Workouts Found</h3>
            <p className="text-slate-500">
              {searchTerm ? "Try a different search term" : "Start logging your workouts to track progress"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <Card
                key={log.logId}
                className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(log)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{log.planName || "Custom Workout"}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(log.workoutDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{log.durationMinutes || 0}m</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Flame className="h-4 w-4" />
                      <span>{log.caloriesBurned || 0} kcal</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <Target className="h-4 w-4" />
                      <span>{log.exercises?.length || 0} exercises</span>
                    </div>
                  </div>
                </div>

                {log.notes && (
                  <p className="mt-4 text-sm text-slate-500 italic border-t border-slate-100 pt-4">
                    &quot;{log.notes}&quot;
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blue-600" />
              {selectedLog?.planName || "Custom Workout"}
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                new Date(selectedLog.workoutDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 mt-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-lg font-bold">{selectedLog.durationMinutes || 0}</div>
                  <div className="text-xs text-slate-500">minutes</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <div className="text-lg font-bold">{selectedLog.caloriesBurned || 0}</div>
                  <div className="text-xs text-slate-500">calories</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-bold">{selectedLog.exercises?.length || 0}</div>
                  <div className="text-xs text-slate-500">exercises</div>
                </div>
              </div>

              {/* Notes */}
              {selectedLog.notes && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-slate-600">{selectedLog.notes}</p>
                </div>
              )}

              {/* Exercises */}
              {selectedLog.exercises && selectedLog.exercises.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Exercises</h4>
                  <div className="space-y-3">
                    {selectedLog.exercises.map((exercise, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                        <h5 className="font-medium mb-2">{exercise.exerciseName}</h5>
                        {exercise.sets && exercise.sets.length > 0 && (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-500">
                                <th className="text-left py-1">Set</th>
                                <th className="text-right py-1">Weight</th>
                                <th className="text-right py-1">Reps</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((set, setIdx) => (
                                <tr key={setIdx}>
                                  <td className="py-1">{setIdx + 1}</td>
                                  <td className="text-right py-1">
                                    {set.weight ? `${set.weight} kg` : "-"}
                                  </td>
                                  <td className="text-right py-1">{set.reps || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="destructive"
              onClick={() => selectedLog && handleDeleteLog(selectedLog.logId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Log
            </Button>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkoutHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <WorkoutHistoryContent />
    </ProtectedRoute>
  );
}
