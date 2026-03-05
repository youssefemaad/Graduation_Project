"use client";

import { useEffect, useState } from "react";
import {
  Dumbbell,
  Calendar,
  Activity,
  Brain,
  TrendingUp,
  Trophy,
  Ticket,
  User,
  MessageCircle,
  Star,
  X,
  UserCheck,
  CheckCircle,
  XCircle,
  Search,
  AlertTriangle,
  Loader2,
  Clock, // Added Clock here
  Plus, // Added Plus here
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UserRole } from "@/types/gym";
import {
  statsApi,
  bookingsApi,
  inbodyApi,
  usersApi,
  MemberStatsDto,
  BookingDto,
} from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ChatDialog } from "@/components/Chat/ChatDialog";

function DashboardContent() {
  const { user, refreshUser } = useAuth();
  const { hasAiAccess, hasCoachAccess } = useSubscription();
  const { showToast } = useToast();
  const [stats, setStats] = useState<MemberStatsDto | null>(null);
  const [bodyFatChange, setBodyFatChange] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<{
    id: number; // CoachProfile ID
    userId: number; // User ID for chat
    name: string;
    specialization: string;
    rating: number;
    upcomingSession: string | null;
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) return;

      try {
        // Refresh user data to get latest token balance from the server
        if (refreshUser) {
          await refreshUser();
        }

        const response = await statsApi.getMemberStats(user.userId);
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch member stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchInBodyStats = async () => {
      if (!user?.userId) return;
      try {
        const response = await inbodyApi.getUserMeasurements(user.userId);
        if (response.success && response.data && response.data.length >= 2) {
          // Sort by date descending
          const sorted = [...response.data].sort(
            (a, b) =>
              new Date(b.measurementDate).getTime() -
              new Date(a.measurementDate).getTime(),
          );
          const current = sorted[0]?.bodyFatPercentage;
          const previous = sorted[1]?.bodyFatPercentage;

          if (typeof current === "number" && typeof previous === "number") {
            setBodyFatChange(current - previous);
          }
        }
      } catch (error) {
        console.error("Failed to fetch inbody stats:", error);
      }
    };

    const fetchWorkoutSummary = async () => {
      if (!user?.userId) return;
      try {
        const response = await usersApi.getUserWorkoutSummary(user.userId);
        if (response.success && response.data) {
          setCurrentStreak(response.data.currentStreak ?? 0);
          // Convert total minutes this week to hours
          setWeeklyHours(
            Math.round(((response.data.totalDurationMinutes ?? 0) / 60) * 10) /
              10,
          );
        }
      } catch (error) {
        console.error("Failed to fetch workout summary:", error);
      }
    };

    fetchStats();
    fetchInBodyStats();
    fetchWorkoutSummary();
  }, [user?.userId, refreshUser]);

  // Recent bookings state
  const [recentBookings, setRecentBookings] = useState<BookingDto[]>([]);

  // Fetch user's recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!user?.userId) return;

      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          // Get latest 4 bookings
          setRecentBookings(response.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch recent bookings:", error);
      }
    };

    fetchRecentBookings();
  }, [user?.userId]);

  // Fetch user's coach from recent bookings
  useEffect(() => {
    const fetchCoachInfo = async () => {
      if (!user?.userId) return;

      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          // Find most recent coach booking
          const coachBookings = response.data.filter(
            (b: BookingDto) => b.coachId && b.coachName,
          );
          if (coachBookings.length > 0) {
            // Sort by startTime descending to get most recent
            const sortedBookings = [...coachBookings].sort(
              (a, b) =>
                new Date(b.startTime).getTime() -
                new Date(a.startTime).getTime(),
            );
            const latestCoach = sortedBookings[0];

            // Find next upcoming session (future bookings only)
            const now = new Date();
            const upcomingSession = coachBookings.find(
              (b: BookingDto) =>
                (b.status === 0 || b.status === 1) && // pending or confirmed
                new Date(b.startTime) > now,
            );

            setAssignedCoach({
              id: latestCoach.coachId!,
              userId: latestCoach.coachUserId || latestCoach.coachId!, // Use coachUserId for chat
              name: latestCoach.coachName!,
              specialization: "Personal Training",
              rating: 5.0, // Default fallback
              upcomingSession: upcomingSession
                ? new Date(upcomingSession.startTime).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )
                : null,
            });

            // Fetch real coach stats
            try {
              const statsRes = await statsApi.getCoachStats(
                latestCoach.coachId!,
              );
              if (statsRes.success && statsRes.data) {
                setAssignedCoach((prev) =>
                  prev
                    ? {
                        ...prev,
                        rating: statsRes.data!.averageRating || 5.0,
                      }
                    : null,
                );
              }
            } catch (ignore) {
              /* ignore error, keep fallback */
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch coach info:", error);
      }
    };

    fetchCoachInfo();
  }, [user?.userId]);

  // Handle cancel booking
  const handleCancelBooking = async (
    bookingId: number,
    bookingName: string,
  ) => {
    if (
      !confirm(`Are you sure you want to cancel booking for ${bookingName}?`)
    ) {
      return;
    }

    try {
      const response = await bookingsApi.cancelBooking(
        bookingId,
        "Cancelled by user",
      );

      if (response.success) {
        showToast("Booking cancelled successfully", "success");
        // Refresh bookings
        if (user?.userId) {
          const bookingsResponse = await bookingsApi.getUserBookings(
            user.userId,
          );
          if (bookingsResponse.success && bookingsResponse.data) {
            setRecentBookings(bookingsResponse.data.slice(0, 4));
          }
        }
      } else {
        showToast(response.message || "Failed to cancel booking", "error");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      showToast("Failed to cancel booking", "error");
    }
  };

  // Use stats from API or fallback to defaults
  const displayStats = {
    tokenBalance: user?.tokenBalance ?? 0,
    activeWorkoutPlan: (stats?.activeWorkoutPlans ?? 0) > 0,
    activeDietPlan: (stats?.activeNutritionPlans ?? 0) > 0,
    upcomingBookings: stats?.totalBookings ?? 0,
    completedWorkouts: stats?.totalWorkoutsCompleted ?? 0,
    currentWeight: stats?.currentWeight ?? 0,
    bodyFatPercentage: stats?.currentBodyFat ?? 0,
  };

  const quickActions = [
    // AI Coach Chat — only with AI plan
    ...(hasAiAccess
      ? [
          {
            icon: Brain,
            title: "AI Coach Chat",
            description: "Get instant fitness advice",
            href: "/ai-coach",
            color: "text-purple-500",
            bgColor: "bg-purple-50",
            hoverBgColor: "group-hover:bg-purple-500",
            bgImage:
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
          },
        ]
      : []),
    // Book a Coach — only with Coach plan
    ...(hasCoachAccess
      ? [
          {
            icon: User,
            title: "Book a Coach",
            description: "Book sessions with coaches",
            href: "/book-coach",
            color: "text-emerald-500",
            bgColor: "bg-emerald-50",
            hoverBgColor: "group-hover:bg-emerald-500",
            bgImage:
              "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
          },
        ]
      : []),
    // Book Equipment — all plans
    {
      icon: Dumbbell,
      title: "Book Equipment",
      description: "Reserve gym equipment",
      href: "/book-equipment",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      hoverBgColor: "group-hover:bg-orange-500",
      bgImage:
        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    },
    // InBody — all plans
    {
      icon: Activity,
      title: "InBody Scan",
      description: "Track body composition",
      href: "/inbody",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      hoverBgColor: "group-hover:bg-blue-500",
      bgImage:
        "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&q=80",
    },
    // View Programs — all plans
    {
      icon: Calendar,
      title: "View Programs",
      description: "Your workout & diet plans",
      href: "/programs",
      color: "text-green-500",
      bgColor: "bg-green-50",
      hoverBgColor: "group-hover:bg-green-500",
      bgImage:
        "https://images.unsplash.com/photo-1549476464-37392f717541?w=400&q=80",
    },
    // Generate Program — only with AI plan
    ...(hasAiAccess
      ? [
          {
            icon: TrendingUp,
            title: "Generate Program",
            description: "Generate AI workout plan",
            href: "/generate-program",
            color: "text-pink-500",
            bgColor: "bg-pink-50",
            hoverBgColor: "group-hover:bg-pink-500",
            bgImage:
              "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
          },
        ]
      : []),
  ];

  // Helper function to get status badge
  // Backend enum: Pending=0, Confirmed=1, Cancelled=2, Completed=3, NoShow=4
  const getStatusBadge = (
    status: number,
    checkInTime?: string,
    checkOutTime?: string,
  ) => {
    // If checked in but not checked out, show "In Progress"
    if (status === 1 && checkInTime && !checkOutTime) {
      return { text: "In Progress", color: "text-blue-600", bg: "bg-blue-100" };
    }
    switch (status) {
      case 0:
        return {
          text: "Pending",
          color: "text-orange-600",
          bg: "bg-orange-100",
        };
      case 1:
        return {
          text: "Confirmed",
          color: "text-green-600",
          bg: "bg-green-100",
        };
      case 2:
        return { text: "Cancelled", color: "text-red-600", bg: "bg-red-100" };
      case 3:
        return {
          text: "Completed",
          color: "text-purple-600",
          bg: "bg-purple-100",
        };
      case 4:
        return { text: "No Show", color: "text-gray-600", bg: "bg-gray-100" };
      default:
        return { text: "Unknown", color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] relative p-3">
      <div className="relative z-10 mx-auto max-w-7xl space-y-2">
        {/* Hero Section with Background Image */}
        <div className="relative overflow-hidden rounded-[20px] bg-[#111827] text-white shadow-xl min-h-[140px]">
          {/* Background Image with Blur */}
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-40 blur-[2px]"
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop"
              alt="Modern gym with weights and equipment"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-4 min-h-[120px]">
            <div className="text-white max-w-2xl mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                Good{" "}
                {new Date().getHours() < 12
                  ? "Morning"
                  : new Date().getHours() < 18
                    ? "Afternoon"
                    : "Evening"}
                , {user?.name?.split(" ")[0] || "Member"}!
              </h2>
              <p className="text-lg text-slate-200 mb-6 font-light">
                Ready to crush your fitness goals? Let&apos;s make today count!
              </p>
              <div className="flex gap-3 flex-wrap">
                {hasAiAccess && (
                  <Link href="/generate-program">
                    <Button className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/30 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95">
                      <Ticket className="h-5 w-5" />
                      Generate Program
                    </Button>
                  </Link>
                )}
                <Link href="/book-equipment">
                  <Button
                    variant={hasAiAccess ? "outline" : "default"}
                    className={`flex items-center gap-2 rounded-full px-6 py-3 font-bold ${hasAiAccess ? "bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border-white/20" : "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95"}`}
                  >
                    <Dumbbell className="h-5 w-5" />
                    Book Equipment
                  </Button>
                </Link>
                <Link href="/bookings">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-bold text-white backdrop-blur-md hover:bg-white/20 border-white/20"
                  >
                    <Calendar className="h-5 w-5" />
                    View Schedule
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[120px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Ticket className="h-5 w-5 text-yellow-300" />
                  <span className="text-3xl font-bold text-white">
                    {user?.tokenBalance ?? 0}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">AI Tokens</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[120px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="h-5 w-5 text-orange-300" />
                  <span className="text-3xl font-bold text-white">
                    {isLoading ? "..." : displayStats.completedWorkouts}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">Workouts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Wallet Card */}
          <Card className="p-4 border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-white rounded-[16px] hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50/80 rounded-2xl">
                <Ticket className="h-5 w-5 text-blue-500" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                Wallet
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-medium">
                Token Balance
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {user?.tokenBalance ?? 0}
                </h3>
                <span className="text-xs font-bold text-blue-500 cursor-pointer hover:underline">
                  Buy More
                </span>
              </div>
            </div>
          </Card>

          {/* Streak Card */}
          <Card className="p-4 border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-white rounded-[16px] hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50/80 rounded-2xl">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                Streak
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-medium">
                Current Streak
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {currentStreak}
                </h3>
                <span className="text-xs font-bold text-emerald-500">Days</span>
              </div>
            </div>
          </Card>

          {/* Activity Card */}
          <Card className="p-4 border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-white rounded-[16px] hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-50/80 rounded-2xl">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                Weekly
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-slate-500 text-xs font-medium">
                  Activity Hours
                </p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-black text-slate-900">
                    {weeklyHours.toFixed(1)}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    /6h
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 relative">
                <svg
                  className="h-full w-full rotate-[-90deg]"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="text-orange-500"
                    strokeDasharray={`${Math.min(Math.round((weeklyHours / 6) * 100), 100)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </div>
            </div>
          </Card>

          {/* Upcoming Card */}
          <Card className="p-4 border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-white rounded-[16px] hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50/80 rounded-2xl">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
                Upcoming
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-medium">
                Active Bookings
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {displayStats.upcomingBookings}
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  Sessions
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Layout: Quick Actions & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Left Column: Quick Actions (Span 2) */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="relative overflow-hidden border border-slate-200/50 shadow-md hover:shadow-xl transition-all cursor-pointer group h-[140px] rounded-[20px]">
                    {/* Background Image - Always visible */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('${action.bgImage}')` }}
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/20 group-hover:from-slate-900/90 group-hover:via-slate-900/50 transition-all" />

                    {/* Content */}
                    <div className="relative z-10 p-4 h-full flex flex-col items-center justify-center text-center">
                      <div
                        className={`p-2.5 rounded-xl mb-2 transition-all ${action.bgColor} backdrop-blur-sm group-hover:scale-110 group-hover:shadow-lg`}
                      >
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <h3 className="font-bold text-white text-sm mb-0.5 drop-shadow-md">
                        {action.title}
                      </h3>
                      <p className="text-[10px] text-white/70 line-clamp-1">
                        {action.description}
                      </p>
                    </div>

                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Recent Pages / Active Plans (Simplified) */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h3>
                <Link
                  href="/bookings"
                  className="text-sm font-bold text-blue-500 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentBookings.slice(0, 2).map((booking) => (
                  <div
                    key={booking.bookingId}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${booking.coachId ? "bg-purple-50" : "bg-blue-50"}`}
                      >
                        {booking.coachId ? (
                          <User className="h-5 w-5 text-purple-500" />
                        ) : (
                          <Dumbbell className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {booking.coachName ||
                            booking.equipmentName ||
                            "Workout Session"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 1 ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
                    >
                      {booking.status === 1 ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* My Coach Card */}
            {hasCoachAccess && assignedCoach && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-purple-500" />
                  My Coach
                </h3>
                <Card className="p-6 border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-[20px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {assignedCoach.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                          {assignedCoach.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {assignedCoach.specialization}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-slate-700">
                            {assignedCoach.rating.toFixed(1)}
                          </span>
                          {assignedCoach.upcomingSession && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500">
                                Next: {assignedCoach.upcomingSession}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsChatOpen(true)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 shadow-lg shadow-purple-500/20 transition-transform hover:scale-105"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat with Coach
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: Schedule (Span 1) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Schedule</h2>
              <span className="text-sm font-bold text-blue-500 cursor-pointer hover:underline">
                View All
              </span>
            </div>

            <Card className="p-6 border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-white rounded-[24px] h-fit">
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 py-2">
                {recentBookings
                  .filter(
                    (b) =>
                      b.status !== 2 && new Date(b.startTime) >= new Date(),
                  )
                  .slice(0, 3).length > 0 ? (
                  recentBookings
                    .filter(
                      (b) =>
                        b.status !== 2 && new Date(b.startTime) >= new Date(),
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime(),
                    )
                    .slice(0, 3)
                    .map((booking, index) => {
                      const startDate = new Date(booking.startTime);
                      const isToday =
                        startDate.toDateString() === new Date().toDateString();
                      const isTomorrow =
                        startDate.toDateString() ===
                        new Date(Date.now() + 86400000).toDateString();
                      const dateLabel = isToday
                        ? "TODAY"
                        : isTomorrow
                          ? "TOMORROW"
                          : startDate
                              .toLocaleDateString("en-US", { weekday: "short" })
                              .toUpperCase();
                      const timeLabel = startDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      const statusBadge = getStatusBadge(
                        booking.status,
                        booking.checkInTime ?? undefined,
                        booking.checkOutTime ?? undefined,
                      );

                      return (
                        <div key={booking.bookingId} className="relative pl-8">
                          <div
                            className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ring-4 ${
                              index === 0 && isToday
                                ? "bg-green-500 ring-green-50"
                                : "bg-slate-300 ring-slate-50"
                            }`}
                          ></div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400">
                                {dateLabel}, {timeLabel}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge.bg} ${statusBadge.color}`}
                              >
                                {statusBadge.text.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900">
                              {booking.coachName ||
                                booking.equipmentName ||
                                "Session"}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {booking.coachId
                                ? `Coach Session`
                                : booking.equipmentId
                                  ? "Equipment Booking"
                                  : "Gym Session"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-400">
                      No upcoming sessions
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Book a coach or equipment to get started
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <Link href={hasCoachAccess ? "/book-coach" : "/book-equipment"}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 shadow-lg shadow-blue-500/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Book New Session
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA Banner — only shown for plans with AI access */}
        {hasAiAccess && (
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Ready for Your AI-Powered Program?
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-lg">
                  Generate a personalized workout and nutrition plan through an
                  intelligent AI voice conversation
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-yellow-500" />
                    50 tokens
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-primary" />
                    ~3 min conversation
                  </span>
                </div>
              </div>
              <Link href="/generate-program">
                <Button
                  size="lg"
                  className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-blue-500/30"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Generate Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Chat Dialog */}
        {isChatOpen && assignedCoach && (
          <ChatDialog
            recipientId={assignedCoach.userId}
            recipientName={assignedCoach.name}
            recipientRole="coach"
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
