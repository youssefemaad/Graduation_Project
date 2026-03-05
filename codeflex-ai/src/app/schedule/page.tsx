"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import {
  bookingsApi,
  workoutPlansApi,
  inbodyApi,
  type BookingDto,
  type MemberWorkoutPlanDto,
  type InBodyMeasurementDto,
} from "@/lib/api";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
  Loader2,
  Sparkles,
  Activity,
  CheckCircle2,
  ArrowRight,
  Scale,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkoutPlan } from "@/services/workoutGeneratorService";

interface ScheduleEvent {
  id: string;
  type: "booking" | "workout" | "ai-workout" | "inbody";
  title: string;
  time: string;
  date: Date;
  description?: string;
  status?: string;
  equipmentNeeded?: string[];
  exercises?: any[];
}

function ScheduleContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
  const [inbodyMeasurements, setInbodyMeasurements] = useState<
    InBodyMeasurementDto[]
  >([]);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<WorkoutPlan | null>(
    null,
  );
  const [showAiPlanModal, setShowAiPlanModal] = useState(false);
  const [showInBodyModal, setShowInBodyModal] = useState(false);
  const [selectedInBody, setSelectedInBody] =
    useState<InBodyMeasurementDto | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  // Check for pending AI-generated plan
  useEffect(() => {
    const pendingPlan = sessionStorage.getItem("pendingWorkoutPlan");
    if (pendingPlan) {
      setAiGeneratedPlan(JSON.parse(pendingPlan));
      setShowAiPlanModal(true);
      sessionStorage.removeItem("pendingWorkoutPlan");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        const [bookingsRes, workoutRes, inbodyRes] = await Promise.all([
          bookingsApi.getUserBookings(user.userId),
          workoutPlansApi.getMemberPlans(user.userId),
          inbodyApi.getUserMeasurements(user.userId),
        ]);

        if (bookingsRes.success && bookingsRes.data) {
          setBookings(bookingsRes.data);
        }
        if (workoutRes.success && workoutRes.data) {
          setWorkoutPlans(workoutRes.data);
        }
        if (inbodyRes.success && inbodyRes.data) {
          setInbodyMeasurements(inbodyRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch schedule data:", error);
        showToast("Failed to load schedule", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast]);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Convert bookings to schedule events
  const getScheduleEvents = (): ScheduleEvent[] => {
    const events: ScheduleEvent[] = [];

    // Add bookings
    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.startTime);
      events.push({
        id: `booking-${booking.bookingId}`,
        type: "booking",
        title: booking.coachName || booking.equipmentName || "Booking",
        time: bookingDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: bookingDate,
        description: booking.notes,
        status: booking.statusText,
      });
    });

    // Add AI-generated workout plan if available
    if (aiGeneratedPlan) {
      aiGeneratedPlan.days.forEach((day) => {
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(dayDate.getDate() + day.dayNumber - 1);
        const equipmentList = [
          ...new Set(
            day.exercises.map((ex: any) => ex.equipment).filter(Boolean),
          ),
        ];
        events.push({
          id: `ai-workout-${day.dayNumber}`,
          type: "ai-workout",
          title: `🤖 ${day.dayName}`,
          time: "AI Generated",
          date: dayDate,
          description: `${day.exercises.length} exercises • ${day.estimatedDurationMinutes} min`,
          status: "pending-review",
          equipmentNeeded: equipmentList,
          exercises: day.exercises,
        });
      });
    }

    // Add InBody measurements
    inbodyMeasurements.forEach((measurement) => {
      const measurementDate = new Date(measurement.measurementDate);
      events.push({
        id: `inbody-${measurement.measurementId}`,
        type: "inbody",
        title: "📊 InBody",
        time: measurementDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: measurementDate,
        description: `${measurement.weight}kg • Fat: ${measurement.bodyFatPercentage || "N/A"}%`,
        status: "completed",
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const events = getScheduleEvents();

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Accept workout day → redirect to equipment booking
  const handleAcceptPlanDay = (dayIndex: number) => {
    if (!aiGeneratedPlan) return;
    const day = aiGeneratedPlan.days[dayIndex];
    if (!day) return;
    const equipmentNeeded = [
      ...new Set(day.exercises.map((ex: any) => ex.equipment).filter(Boolean)),
    ];
    sessionStorage.setItem(
      "workoutEquipmentNeeds",
      JSON.stringify({
        dayName: day.dayName,
        exercises: day.exercises.map((ex: any) => ({
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.sets,
          reps: ex.reps,
        })),
        equipmentNeeded,
      }),
    );
    router.push("/book-equipment");
    showToast(`Redirecting to book equipment for ${day.dayName}`, "success");
  };

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) >= new Date() && b.status !== 3,
  );

  const latestInBody =
    inbodyMeasurements.length > 0
      ? [...inbodyMeasurements].sort(
          (a, b) =>
            new Date(b.measurementDate).getTime() -
            new Date(a.measurementDate).getTime(),
        )[0]
      : null;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Schedule</h1>
            <p className="text-slate-500">Manage your bookings and workouts</p>
          </div>
          <div className="flex gap-3">
            <Link href="/book-coach">
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2">
                <Plus className="h-4 w-4" />
                Book Coach
              </Button>
            </Link>
            <Link href="/book-equipment">
              <Button variant="outline" className="rounded-xl font-bold gap-2">
                <Plus className="h-4 w-4" />
                Book Equipment
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Link href="/book-coach" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12">
              <Plus className="mr-2 h-5 w-5" />
              Book a Session
            </Button>
          </Link>
          <Link href="/ai-workout-generator" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl h-12">
              <Sparkles className="mr-2 h-5 w-5" />
              Generate AI Workout
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {upcomingBookings.length}
                </p>
                <p className="text-sm text-slate-500">Upcoming Bookings</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {workoutPlans.length}
                </p>
                <p className="text-sm text-slate-500">Active Plans</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {bookings.length}
                </p>
                <p className="text-sm text-slate-500">Total Bookings</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Scale className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {inbodyMeasurements.length}
                </p>
                <p className="text-sm text-slate-500">InBody Records</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Latest InBody Summary */}
        {latestInBody && (
          <Card
            className="mb-8 bg-gradient-to-r from-purple-500 to-pink-500 border-0 shadow-lg text-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => {
              setSelectedInBody(latestInBody);
              setShowInBodyModal(true);
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Scale className="h-6 w-6" />
                  <h3 className="text-lg font-bold">
                    Latest InBody Measurement
                  </h3>
                </div>
                <span className="text-sm opacity-80">
                  {new Date(latestInBody.measurementDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm opacity-80">Weight</p>
                  <p className="text-2xl font-black">
                    {latestInBody.weight} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Body Fat</p>
                  <p className="text-2xl font-black">
                    {latestInBody.bodyFatPercentage}%
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Muscle Mass</p>
                  <p className="text-2xl font-black">
                    {latestInBody.muscleMass} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80">BMI</p>
                  <p className="text-2xl font-black">{latestInBody.bmi}</p>
                </div>
              </div>
              <p className="text-sm mt-3 opacity-80 flex items-center gap-1">
                Click to view full details <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </Card>
        )}

        {/* AI Workout Plan Days - Accept & Book Equipment */}
        {aiGeneratedPlan &&
          aiGeneratedPlan.days &&
          aiGeneratedPlan.days.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Workout Plan Days
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {aiGeneratedPlan.days.map((day: any, idx: number) => {
                  const equipmentList: string[] = [
                    ...new Set(
                      day.exercises
                        .map((ex: any) => ex.equipment)
                        .filter(Boolean),
                    ),
                  ] as string[];
                  return (
                    <Card
                      key={idx}
                      className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="h-4 w-4 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">
                          {day.dayName}
                        </h3>
                      </div>
                      <div className="flex gap-1 flex-wrap mb-3">
                        {day.focusAreas?.map((area: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {day.exercises.length} exercises • ~
                        {day.estimatedDurationMinutes} min
                      </p>
                      {equipmentList.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1">
                            Equipment needed:
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {equipmentList.map((eq: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-xs font-bold gap-1"
                        onClick={() => handleAcceptPlanDay(idx)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accept & Book Equipment
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        {/* Week Navigation */}
        <Card className="bg-white border-0 shadow-sm mb-8">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                {formatWeekRange()}
              </h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-8 px-3 text-sm font-semibold"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const dayName = date.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const dayNum = date.getDate();

              return (
                <div
                  key={idx}
                  className={`min-h-[200px] p-3 ${isToday(date) ? "bg-blue-50" : ""}`}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      {dayName}
                    </p>
                    <p
                      className={`text-lg font-bold ${isToday(date) ? "text-blue-600" : "text-slate-700"}`}
                    >
                      {dayNum}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded-lg text-xs cursor-pointer hover:opacity-80 transition ${
                          event.type === "booking"
                            ? "bg-blue-100 border-l-2 border-blue-500 text-blue-800"
                            : event.type === "ai-workout"
                              ? "bg-purple-100 border-l-2 border-purple-500 text-purple-800"
                              : event.type === "inbody"
                                ? "bg-pink-100 border-l-2 border-pink-500 text-pink-800"
                                : "bg-green-100 border-l-2 border-green-500 text-green-800"
                        }`}
                        onClick={() => {
                          if (event.type === "ai-workout") {
                            setShowAiPlanModal(true);
                          } else if (event.type === "inbody") {
                            const measurement = inbodyMeasurements.find(
                              (m) => `inbody-${m.measurementId}` === event.id,
                            );
                            if (measurement) {
                              setSelectedInBody(measurement);
                              setShowInBodyModal(true);
                            }
                          }
                        }}
                      >
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-[10px] opacity-80">{event.time}</p>
                        {event.description && (
                          <p className="text-[10px] opacity-70 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Bookings List */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Upcoming Bookings
          </h2>
          {upcomingBookings.length === 0 ? (
            <Card className="p-8 text-center bg-white border-0 shadow-sm">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming bookings</p>
              <Link href="/book-coach">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Book a Session
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <Card
                  key={booking.bookingId}
                  className="p-4 bg-white border-0 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        {booking.coachId ? (
                          <Calendar className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Dumbbell className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {booking.coachName ||
                            booking.equipmentName ||
                            "Booking"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(booking.startTime).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )}{" "}
                          at{" "}
                          {new Date(booking.startTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {booking.statusText}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* InBody Measurement History */}
        {inbodyMeasurements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-pink-600" />
              InBody Measurement History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inbodyMeasurements
                .sort(
                  (a, b) =>
                    new Date(b.measurementDate).getTime() -
                    new Date(a.measurementDate).getTime(),
                )
                .map((m) => (
                  <Card
                    key={m.measurementId}
                    className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedInBody(m);
                      setShowInBodyModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-900">
                        {new Date(m.measurementDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                      <span className="text-xs text-slate-500">
                        by {m.conductedByName || "Staff"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Weight:</span>{" "}
                        <span className="font-semibold">{m.weight} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fat:</span>{" "}
                        <span className="font-semibold">
                          {m.bodyFatPercentage}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Muscle:</span>{" "}
                        <span className="font-semibold">{m.muscleMass} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-500">BMI:</span>{" "}
                        <span className="font-semibold">{m.bmi}</span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* InBody Detail Modal */}
        {showInBodyModal && selectedInBody && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900">
                    InBody Measurement Details
                  </h3>
                  <button
                    onClick={() => {
                      setShowInBodyModal(false);
                      setSelectedInBody(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(selectedInBody.measurementDate).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Weight</p>
                    <p className="text-2xl font-black text-blue-800">
                      {selectedInBody.weight} kg
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-600 mb-1">Height</p>
                    <p className="text-2xl font-black text-green-800">
                      {selectedInBody.height} cm
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-red-600 mb-1">Body Fat</p>
                    <p className="text-2xl font-black text-red-800">
                      {selectedInBody.bodyFatPercentage}%
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-purple-600 mb-1">Muscle Mass</p>
                    <p className="text-2xl font-black text-purple-800">
                      {selectedInBody.muscleMass} kg
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-yellow-600 mb-1">BMI</p>
                    <p className="text-2xl font-black text-yellow-800">
                      {selectedInBody.bmi}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-orange-600 mb-1">BMR</p>
                    <p className="text-2xl font-black text-orange-800">
                      {selectedInBody.bmr}
                    </p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-teal-600 mb-1">Body Water</p>
                    <p className="text-2xl font-black text-teal-800">
                      {selectedInBody.bodyWaterPercentage}%
                    </p>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-pink-600 mb-1">Minerals</p>
                    <p className="text-2xl font-black text-pink-800">
                      {selectedInBody.minerals} kg
                    </p>
                  </div>
                </div>
                {selectedInBody.visceralFat !== undefined &&
                  selectedInBody.visceralFat !== null && (
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                      <p className="text-sm text-slate-600 mb-1">
                        Visceral Fat
                      </p>
                      <p className="text-2xl font-black text-slate-800">
                        {selectedInBody.visceralFat}
                      </p>
                    </div>
                  )}
                {selectedInBody.notes && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 mb-1">Notes</p>
                    <p className="text-slate-800">{selectedInBody.notes}</p>
                  </div>
                )}
                <div className="text-sm text-slate-500 text-center">
                  Conducted by: {selectedInBody.conductedByName || "Staff"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Workout Plan Modal */}
        {showAiPlanModal && aiGeneratedPlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">
                      🤖 {aiGeneratedPlan.planName}
                    </h3>
                    <p className="text-slate-600">
                      AI-Generated Workout Plan • Pending Coach Review
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAiPlanModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 mb-1">Days/Week</div>
                    <div className="font-semibold text-slate-900">
                      📅 {aiGeneratedPlan.daysPerWeek}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Duration</div>
                    <div className="font-semibold text-slate-900">
                      ⏱️ {aiGeneratedPlan.programDurationWeeks} weeks
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Level</div>
                    <div className="font-semibold text-slate-900">
                      💪 {aiGeneratedPlan.fitnessLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Goal</div>
                    <div className="font-semibold text-slate-900">
                      🎯 {aiGeneratedPlan.goal}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {aiGeneratedPlan.days.map((day, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-bold text-slate-900">
                        {day.dayName}
                      </h4>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-xs font-bold gap-1"
                        onClick={() => handleAcceptPlanDay(idx)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accept & Book Equipment
                      </Button>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {day.focusAreas.map((area, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        ~{day.estimatedDurationMinutes} min
                      </span>
                    </div>
                    {/* Equipment Summary for this day */}
                    {(() => {
                      const dayEquipment: string[] = [
                        ...new Set(
                          day.exercises.map((e) => e.equipment).filter(Boolean),
                        ),
                      ] as string[];
                      return dayEquipment.length > 0 ? (
                        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-xs text-orange-700 font-semibold mb-1">
                            Equipment Needed:
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {dayEquipment.map((eq, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs"
                              >
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    <div className="space-y-3">
                      {day.exercises.map((exercise, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg p-4 border border-slate-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-slate-900">
                              {exercise.name}
                            </h5>
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              {exercise.exerciseType}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-slate-600 text-sm mb-2">
                            <span>Sets: {exercise.sets}</span>
                            <span>Reps: {exercise.reps}</span>
                            <span>Rest: {exercise.rest}</span>
                          </div>
                          <div className="text-slate-500 text-xs">
                            Equipment: {exercise.equipment} | Pattern:{" "}
                            {exercise.movementPattern}
                          </div>
                          {exercise.notes && (
                            <div className="mt-2 text-slate-600 text-sm italic">
                              💡 {exercise.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                  <strong>⏳ Pending Coach Review:</strong> This AI-generated
                  plan will be reviewed by your coach. Once approved, it will be
                  added to your schedule.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ScheduleContent />
    </ProtectedRoute>
  );
}
