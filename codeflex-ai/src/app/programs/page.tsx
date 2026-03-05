"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  workoutPlansApi,
  nutritionPlansApi,
  bookingsApi,
  workoutLogsApi,
  equipmentApi,
  type MemberWorkoutPlanDto,
  type NutritionPlanDto,
  type BookingDto,
  type WorkoutLogDto,
  type EquipmentDto,
} from "@/lib/api";
import {
  getMyAIPlans,
  deleteAIPlan,
  type UserAIWorkoutPlan,
  type UserAIPlanDay,
  type UserAIPlanExercise,
} from "@/lib/api/workoutAI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dumbbell,
  Utensils,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  User,
  Loader2,
  Plus,
  Target,
  Flame,
  TrendingUp,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Zap,
  Eye,
  X,
  MapPin,
  Ticket,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

// ---- Equipment Modal ----
function EquipmentModal({
  exercise,
  equipmentList,
  onClose,
  onBookSuccess,
  userId,
}: {
  exercise: UserAIPlanExercise;
  equipmentList: EquipmentDto[];
  onClose: () => void;
  onBookSuccess: (msg: string) => void;
  userId: number;
}) {
  const [bookingEqId, setBookingEqId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Filter equipment relevant to this exercise
  const relevant = useMemo(() => {
    const keyword = (
      exercise.equipmentRequired ||
      exercise.exerciseName ||
      ""
    ).toLowerCase();
    const matched = equipmentList.filter((eq) => {
      const name = eq.name.toLowerCase();
      const cat = (eq.categoryName || eq.category || "").toLowerCase();
      return keyword
        .split(/[\s,]+/)
        .some((w) => w.length > 2 && (name.includes(w) || cat.includes(w)));
    });
    return matched.length > 0
      ? matched
      : equipmentList.filter((eq) => eq.status === 0).slice(0, 6);
  }, [exercise, equipmentList]);

  const statusLabel = (s: number) =>
    s === 0 ? "Available" : s === 1 ? "In Use" : "Maintenance";
  const statusColor = (s: number) =>
    s === 0
      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
      : s === 1
        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
        : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";

  // Set default date to today
  useEffect(() => {
    if (!bookingDate) {
      const today = new Date().toISOString().split("T")[0];
      setBookingDate(today);
    }
  }, []);

  const handleDirectBook = async (
    equipmentId: number,
    equipmentName: string,
    tokensCost: number,
  ) => {
    setBookingError("");

    if (!bookingDate || !startTime || !endTime) {
      setBookingError("Please select date, start time, and end time");
      return;
    }

    const bookingStartTime = new Date(`${bookingDate}T${startTime}:00`);
    const bookingEndTime = new Date(`${bookingDate}T${endTime}:00`);

    if (bookingStartTime >= bookingEndTime) {
      setBookingError("End time must be after start time");
      return;
    }
    if (bookingStartTime < new Date()) {
      setBookingError("Cannot book in the past");
      return;
    }

    try {
      setIsBooking(true);
      const response = await bookingsApi.createBooking({
        userId,
        equipmentId,
        bookingType: "Equipment",
        startTime: bookingStartTime.toISOString(),
        endTime: bookingEndTime.toISOString(),
        notes: `Booked ${equipmentName} for exercise: ${exercise.exerciseName}`,
      });
      if (response.success) {
        onBookSuccess(
          `Booked ${equipmentName} — ${tokensCost || 0} tokens deducted`,
        );
        onClose();
      } else {
        setBookingError(response.message || "Failed to book");
      }
    } catch {
      setBookingError("Failed to book equipment");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {exercise.exerciseName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {exercise.muscleGroup && (
                <span className="mr-2">💪 {exercise.muscleGroup}</span>
              )}
              {exercise.sets && <span>{exercise.sets} sets</span>}
              {exercise.reps && <span> × {exercise.reps} reps</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Booking Time Picker */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Booking Time
          </p>
          {bookingError && (
            <p className="text-xs text-red-500 font-medium mb-2">
              {bookingError}
            </p>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Date
              </label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  // Auto-set end time to +20 minutes
                  if (e.target.value && !endTime) {
                    const [h, m] = e.target.value.split(":").map(Number);
                    const totalMin = h * 60 + m + 20;
                    setEndTime(
                      `${String(Math.min(Math.floor(totalMin / 60), 23)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`,
                    );
                  }
                }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="p-5 overflow-y-auto max-h-[45vh] space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {exercise.equipmentRequired
              ? `Equipment: ${exercise.equipmentRequired}`
              : "Available Equipment"}
          </p>
          {relevant.length === 0 && (
            <div className="text-center py-8">
              <Dumbbell className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No matching equipment found
              </p>
            </div>
          )}
          {relevant.map((eq) => (
            <div
              key={eq.equipmentId}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600/30 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {eq.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold",
                      statusColor(eq.status),
                    )}
                  >
                    {statusLabel(eq.status)}
                  </span>
                  {eq.location && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {eq.location}
                    </span>
                  )}
                  {(eq.tokensCostPerHour || eq.tokensCost) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      {eq.tokensCostPerHour || eq.tokensCost} tokens/hr
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                disabled={eq.status !== 0 || isBooking}
                onClick={() =>
                  handleDirectBook(
                    eq.equipmentId,
                    eq.name,
                    eq.tokensCostPerHour || eq.tokensCost || 0,
                  )
                }
                className="ml-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
              >
                {isBooking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Book"
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Empty State ----
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="p-10 text-center border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl">
      <div className="h-20 w-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100 dark:border-slate-600">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <Link href={actionHref}>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      </Link>
    </Card>
  );
}

// ---- Macro Card ----
function MacroCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const cm: Record<string, string> = {
    orange:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    yellow:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20",
    purple:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
  };
  return (
    <div
      className={`rounded-xl p-4 text-center border ${cm[color] || cm.blue}`}
    >
      <p className="text-2xl font-black">
        {value}
        <span className="text-sm font-medium">{unit}</span>
      </p>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mt-1">
        {label}
      </p>
    </div>
  );
}

// ---- Main Page ----
function ProgramsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
  const [aiPlans, setAiPlans] = useState<UserAIWorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);
  const [allEquipment, setAllEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "coach" | "nutrition">(
    "ai",
  );
  const [selectedExercise, setSelectedExercise] =
    useState<UserAIPlanExercise | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          workoutRes,
          aiPlansRes,
          nutritionRes,
          bookingsRes,
          logsRes,
          equipRes,
        ] = await Promise.all([
          workoutPlansApi.getMemberPlans(user.userId),
          getMyAIPlans(),
          nutritionPlansApi.getMemberPlans(user.userId),
          bookingsApi.getUserBookings(user.userId),
          workoutLogsApi.getUserWorkoutLogs(user.userId),
          equipmentApi.getAvailableEquipment(),
        ]);
        if (workoutRes.success && workoutRes.data)
          setWorkoutPlans(workoutRes.data);
        if (aiPlansRes.success && aiPlansRes.data) setAiPlans(aiPlansRes.data);
        if (nutritionRes.success && nutritionRes.data)
          setNutritionPlans(nutritionRes.data);
        if (bookingsRes.success && bookingsRes.data)
          setBookings(bookingsRes.data);
        if (logsRes.success && logsRes.data)
          setWorkoutLogs(Array.isArray(logsRes.data) ? logsRes.data : []);

        // Handle potential double-wrapped response for equipment
        if (equipRes.success && equipRes.data) {
          const rawData = equipRes.data as any;
          if (rawData.data && Array.isArray(rawData.data)) {
            setAllEquipment(rawData.data);
          } else if (Array.isArray(rawData)) {
            setAllEquipment(rawData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const activeWorkoutPlan = useMemo(
    () => workoutPlans.find((p) => p.status === 1) || workoutPlans[0],
    [workoutPlans],
  );
  const activeNutritionPlan = useMemo(
    () => nutritionPlans.find((p) => p.isActive) || nutritionPlans[0],
    [nutritionPlans],
  );
  const workoutProgress = activeWorkoutPlan
    ? Math.round(
        ((activeWorkoutPlan.completedWorkouts || 0) /
          (activeWorkoutPlan.totalWorkouts || 1)) *
          100,
      )
    : 0;

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    return bookings
      .filter((b) => {
        const d = new Date(b.startTime);
        return d >= now && d <= week && b.status !== 2;
      })
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .slice(0, 5);
  }, [bookings]);

  const todaysBookings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return bookings.filter(
      (b) =>
        new Date(b.startTime).toISOString().split("T")[0] === today &&
        b.status !== 2,
    );
  }, [bookings]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    try {
      const res = await bookingsApi.cancelBooking(bookingId, "User cancelled");
      if (res.success) {
        setBookings((p) => p.filter((b) => b.bookingId !== bookingId));
        showToast("Cancelled", "success");
      } else showToast(res.message || "Failed", "error");
    } catch {
      showToast("Error", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this workout plan?")) return;
    try {
      const res = await deleteAIPlan(planId);
      if (res.success) {
        setAiPlans((prev) => prev.filter((p) => p.planId !== planId));
        if (expandedPlanId === planId) setExpandedPlanId(null);
        showToast("Workout plan has been removed", "success");
        // Refresh the list
        // Note: fetchData is defined in useEffect and not directly accessible here.
        // You might need to refactor fetchData to be a useCallback or move it outside useEffect
        // if you intend to call it directly from other functions.
        // For now, keeping it as per instruction, assuming it will be handled.
        // fetchData();
      } else {
        showToast("Failed to delete plan", "error");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      showToast("Failed to delete plan", "error");
    } finally {
    }
  };

  const handleBookEquipmentSuccess = (msg: string) => {
    showToast(msg, "success");
    // Refresh bookings
    if (user?.userId) {
      bookingsApi.getUserBookings(user.userId).then((res) => {
        if (res.success && res.data) setBookings(res.data);
      });
    }
  };

  const goalGradient: Record<string, string> = {
    Muscle: "from-blue-500 to-indigo-600",
    Strength: "from-red-500 to-orange-600",
    WeightLoss: "from-green-500 to-emerald-600",
    Cardio: "from-pink-500 to-rose-600",
    General: "from-purple-500 to-violet-600",
  };
  const goalBadge: Record<string, string> = {
    Muscle: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    Strength: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    WeightLoss:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    Cardio: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
    General:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">
            Loading your programs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] relative p-4 md:p-6">
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-[#111827] text-white shadow-xl min-h-[140px]">
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-30 blur-[2px]"
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 min-h-[120px]">
            <div className="text-white max-w-2xl mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-slate-300">
                  {todaysBookings.length > 0
                    ? `${todaysBookings.length} session${todaysBookings.length > 1 ? "s" : ""} today`
                    : "No sessions today"}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                My Programs
              </h2>
              <p className="text-lg text-slate-200 font-light">
                Welcome back,{" "}
                <span className="font-semibold">
                  {user?.name?.split(" ")[0] || "Athlete"}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/generate-program">
                <Button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/30 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95">
                  <Sparkles className="h-5 w-5" />
                  Generate AI Plan
                </Button>
              </Link>
              <Link href="/book-coach">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md hover:bg-white/20 border-white/20"
                >
                  <User className="h-5 w-5" />
                  Book Coach
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <Zap className="h-5 w-5 text-blue-500" />,
              bg: "bg-blue-50/80 dark:bg-blue-500/10",
              label: "AI Plans",
              value: aiPlans.length,
              tag: "AI",
            },
            {
              icon: <Target className="h-5 w-5 text-green-500" />,
              bg: "bg-green-50/80 dark:bg-green-500/10",
              label: "Completion",
              value: `${workoutProgress}%`,
              tag: "Progress",
            },
            {
              icon: <Flame className="h-5 w-5 text-orange-500" />,
              bg: "bg-orange-50/80 dark:bg-orange-500/10",
              label: "Calories",
              value: activeNutritionPlan?.dailyCalories || 0,
              tag: "Daily",
            },
            {
              icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
              bg: "bg-purple-50/80 dark:bg-purple-500/10",
              label: "Workouts",
              value: workoutLogs.length,
              tag: "Total",
            },
          ].map((s, i) => (
            <Card
              key={i}
              className="p-4 border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${s.bg} rounded-2xl`}>{s.icon}</div>
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                  {s.tag}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {s.label}
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {s.value}
              </h3>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Card className="p-1.5 border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl">
              <div className="flex items-center gap-1">
                {(["ai", "coach", "nutrition"] as const).map((tab) => {
                  const icons = {
                    ai: <Sparkles className="h-4 w-4" />,
                    coach: <Dumbbell className="h-4 w-4" />,
                    nutrition: <Utensils className="h-4 w-4" />,
                  };
                  const labels = {
                    ai: "AI Plans",
                    coach: "Coach Plans",
                    nutrition: "Nutrition",
                  };
                  const count = tab === "ai" ? aiPlans.length : 0;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all outline-none focus:outline-none",
                        activeTab === tab
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700",
                      )}
                    >
                      {icons[tab]}
                      {labels[tab]}
                      {count > 0 && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs",
                            activeTab === tab
                              ? "bg-white/20"
                              : "bg-slate-100 dark:bg-slate-600",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* AI Plans */}
            {activeTab === "ai" && (
              <div className="space-y-5">
                {aiPlans.length > 0 ? (
                  aiPlans.map((plan) => {
                    const gradient =
                      goalGradient[plan.goal || "General"] ||
                      goalGradient.General;
                    const badge =
                      goalBadge[plan.goal || "General"] || goalBadge.General;
                    const totalEx = plan.days.reduce(
                      (a, d) => a + d.exercises.length,
                      0,
                    );
                    const isExpanded = expandedPlanId === plan.planId;

                    return (
                      <Card
                        key={plan.planId}
                        className="border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div
                                className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                              >
                                <Sparkles className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-lg truncate text-slate-900 dark:text-white">
                                  {plan.planName}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${badge}`}
                                  >
                                    {plan.goal || "General"}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    ·
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {plan.fitnessLevel || "Intermediate"}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    ·
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(
                                      plan.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {plan.isActive && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex-shrink-0">
                                  Active
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePlan(plan.planId);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors outline-none focus:outline-none"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 mt-5 py-3 px-5 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                            {[
                              {
                                icon: <Calendar className="h-3.5 w-3.5" />,
                                text: `${plan.daysPerWeek || plan.days.length} days/week`,
                              },
                              {
                                icon: <Dumbbell className="h-3.5 w-3.5" />,
                                text: `${totalEx} exercises`,
                              },
                              {
                                icon: <Clock className="h-3.5 w-3.5" />,
                                text: `${plan.durationWeeks || 8} weeks`,
                              },
                            ].map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5"
                              >
                                <span className="text-slate-400 dark:text-slate-500">
                                  {item.icon}
                                </span>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              setExpandedPlanId(isExpanded ? null : plan.planId)
                            }
                            className="flex items-center gap-2 mt-4 w-full text-sm text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors outline-none focus:outline-none"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">
                              {isExpanded ? "Hide Details" : "View Exercises"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 ml-auto transition-transform",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </button>
                        </div>

                        {/* Expanded Days */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-6 space-y-4">
                            {plan.days.map((day) => {
                              const dayKey = `${plan.planId}-${day.dayNumber}`;
                              const isDayOpen = expandedDayKey === dayKey;
                              return (
                                <div
                                  key={day.dayNumber}
                                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm"
                                >
                                  <button
                                    onClick={() =>
                                      setExpandedDayKey(
                                        isDayOpen ? null : dayKey,
                                      )
                                    }
                                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                  >
                                    <div
                                      className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white`}
                                    >
                                      {day.dayNumber}
                                    </div>
                                    <div className="text-left flex-1">
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                        {day.dayName || `Day ${day.dayNumber}`}
                                      </h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {day.exercises.length} exercises · Click
                                        to {isDayOpen ? "collapse" : "expand"}
                                      </p>
                                    </div>
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 text-slate-400 transition-transform",
                                        isDayOpen && "rotate-180",
                                      )}
                                    />
                                  </button>
                                  {isDayOpen && (
                                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/50">
                                      {day.exercises.map((ex, idx) => (
                                        <button
                                          key={ex.workoutPlanExerciseId || idx}
                                          onClick={() =>
                                            setSelectedExercise(ex)
                                          }
                                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors text-left group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono w-5">
                                              {ex.orderInDay || idx + 1}
                                            </span>
                                            <div>
                                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {ex.exerciseName}
                                              </span>
                                              {ex.muscleGroup && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                  {ex.muscleGroup}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs">
                                            {ex.sets && (
                                              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-500 dark:text-slate-400">
                                                {ex.sets}s
                                              </span>
                                            )}
                                            {ex.reps && (
                                              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-500 dark:text-slate-400">
                                                {ex.reps}r
                                              </span>
                                            )}
                                            {ex.restSeconds && (
                                              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium text-slate-500 dark:text-slate-400">
                                                {ex.restSeconds}s rest
                                              </span>
                                            )}
                                            <Dumbbell className="h-3.5 w-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={
                      <Sparkles className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                    }
                    title="No AI Plans Yet"
                    description="Generate your first AI-powered workout plan"
                    actionLabel="Generate AI Plan"
                    actionHref="/generate-program"
                  />
                )}
              </div>
            )}

            {/* Coach Tab */}
            {activeTab === "coach" &&
              (activeWorkoutPlan ? (
                <Card className="p-6 border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                        <Dumbbell className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {activeWorkoutPlan.planName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 rounded-full font-bold">
                            {activeWorkoutPlan.statusText}
                          </span>
                          {activeWorkoutPlan.coachName && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              by Coach {activeWorkoutPlan.coachName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/programs/${activeWorkoutPlan.memberPlanId}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-600 gap-1"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500 dark:text-slate-400">
                        Progress
                      </span>
                      <span className="text-blue-500 font-bold">
                        {workoutProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${workoutProgress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ) : (
                <EmptyState
                  icon={
                    <Dumbbell className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                  }
                  title="No Coach Plans"
                  description="Book a coach for a personalized plan"
                  actionLabel="Book a Coach"
                  actionHref="/book-coach"
                />
              ))}

            {/* Nutrition Tab */}
            {activeTab === "nutrition" &&
              (activeNutritionPlan ? (
                <Card className="p-6 border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-2xl">
                      <Utensils className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Nutrition Plan
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Daily macro targets
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MacroCard
                      label="Calories"
                      value={activeNutritionPlan.dailyCalories || 0}
                      unit=""
                      color="orange"
                    />
                    <MacroCard
                      label="Protein"
                      value={activeNutritionPlan.proteinGrams || 0}
                      unit="g"
                      color="blue"
                    />
                    <MacroCard
                      label="Carbs"
                      value={activeNutritionPlan.carbsGrams || 0}
                      unit="g"
                      color="yellow"
                    />
                    <MacroCard
                      label="Fats"
                      value={activeNutritionPlan.fatGrams || 0}
                      unit="g"
                      color="purple"
                    />
                  </div>
                </Card>
              ) : (
                <EmptyState
                  icon={
                    <Utensils className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                  }
                  title="No Nutrition Plan"
                  description="Get a customized nutrition plan"
                  actionLabel="Generate with AI"
                  actionHref="/generate-program"
                />
              ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Upcoming Sessions
                </h3>
                <Link href="/bookings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 text-xs gap-1 h-7 px-2"
                  >
                    All <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="p-4">
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-2.5">
                    {upcomingBookings.map((b) => {
                      const d = new Date(b.startTime);
                      const isToday =
                        d.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={b.bookingId}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                  isToday
                                    ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-600/50 dark:text-slate-400",
                                )}
                              >
                                {isToday
                                  ? "Today"
                                  : d.toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                                {b.coachName || b.equipmentName}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {d.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCancelBooking(b.bookingId)}
                              disabled={cancellingId === b.bookingId}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              {cancellingId === b.bookingId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      No upcoming sessions
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link href="/book-coach">
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl text-xs"
                        >
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          Book Coach
                        </Button>
                      </Link>
                      <Link href="/book-equipment">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl text-xs border-slate-200 dark:border-slate-600"
                        >
                          <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
                          Book Equipment
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 border-2 border-primary/20 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Quick Actions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      AI-powered tools
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/generate-program">
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20">
                      <Sparkles className="h-4 w-4" />
                      AI Workout Generator
                    </Button>
                  </Link>
                  <Link href="/ai-coach">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-bold text-sm border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 gap-2"
                    >
                      Talk to AI Coach
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Equipment Booking Modal */}
      {selectedExercise && user && (
        <EquipmentModal
          exercise={selectedExercise}
          equipmentList={allEquipment}
          onClose={() => setSelectedExercise(null)}
          onBookSuccess={handleBookEquipmentSuccess}
          userId={user.userId}
        />
      )}
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
      <ProgramsContent />
    </ProtectedRoute>
  );
}
