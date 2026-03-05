"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  Zap,
  Clock,
  CheckCircle,
  Download,
  PlusCircle,
  ArrowRight,
  Droplets,
  Bone,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  inbodyApi,
  bookingsApi,
  type InBodyMeasurementDto,
  type BookingDto,
} from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate dynamic available slots based on current date
const generateAvailableSlots = () => {
  const slots = [];
  const today = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Skip Sundays
    if (date.getDay() === 0) continue;

    const timeSlots =
      date.getDay() === 6
        ? ["10:00 AM", "11:00 AM", "12:00 PM"] // Saturday - fewer slots
        : ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];

    slots.push({
      id: i,
      date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
      fullDate: date,
      day: dayNames[date.getDay()],
      slots: timeSlots,
    });
  }
  return slots;
};

const mapBookingStatus = (status: number): string => {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Confirmed";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    default:
      return "Pending";
  }
};

export default function InBodyPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [availableSlots] = useState(generateAvailableSlots());
  const [selectedDate, setSelectedDate] = useState<
    (typeof availableSlots)[0] | null
  >(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduledBooking, setScheduledBooking] = useState<BookingDto | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real data
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState<InBodyMeasurementDto[]>([]);
  const [latest, setLatest] = useState<InBodyMeasurementDto | null>(null);

  // Chart state
  const [chartMetric, setChartMetric] = useState<"weight" | "muscle" | "fat">(
    "weight",
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const [measurementsRes, bookingsRes] = await Promise.all([
          inbodyApi.getUserMeasurements(user.userId),
          bookingsApi.getUserBookings(user.userId),
        ]);

        if (measurementsRes.success && measurementsRes.data) {
          // Sort by date descending
          const sorted = [...measurementsRes.data].sort(
            (a, b) =>
              new Date(b.measurementDate).getTime() -
              new Date(a.measurementDate).getTime(),
          );
          setMeasurements(sorted);
          if (sorted.length > 0) setLatest(sorted[0]);
        }

        // Check for existing InBody booking
        if (bookingsRes.success && bookingsRes.data) {
          const inbodyBooking = bookingsRes.data.find(
            (b) =>
              b.bookingType === "InBody" && (b.status === 0 || b.status === 1),
          );
          if (inbodyBooking) {
            setScheduledBooking(inbodyBooking);
          }
        }
      } catch (error) {
        console.error("Failed to fetch InBody data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]);

  const handleOpenScheduleModal = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setIsScheduleModalOpen(true);
  };

  const parseTimeString = (
    timeStr: string,
  ): { hours: number; minutes: number } => {
    const [time, period] = timeStr.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;

    return { hours, minutes };
  };

  const handleConfirmSchedule = async () => {
    if (!selectedDate || !selectedTime || !user?.userId) return;
    setIsSubmitting(true);

    try {
      const { hours, minutes } = parseTimeString(selectedTime);
      const startTime = new Date(selectedDate.fullDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const response = await bookingsApi.createBooking({
        userId: user.userId,
        bookingType: "InBody",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: "InBody body composition scan",
      });

      if (response.success && response.data) {
        setScheduledBooking(response.data);
        setIsScheduleModalOpen(false);
        showToast("Scan scheduled successfully!", "success");
      } else {
        showToast(response.message || "Failed to schedule", "error");
      }
    } catch {
      showToast("Error scheduling scan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!scheduledBooking) return;
    setIsSubmitting(true);
    try {
      const response = await bookingsApi.cancelBooking(
        scheduledBooking.bookingId,
        "Cancelled by user",
      );
      if (response.success) {
        setScheduledBooking(null);
        showToast("Appointment cancelled", "success");
      } else {
        showToast(response.message || "Failed to cancel", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getComparison = (metric: "weight" | "muscle" | "fat") => {
    if (measurements.length < 2 || !latest)
      return { value: 0, text: "No prior data", percent: "0%" };
    const prev = measurements[1];
    let diff = 0;
    let percent = 0;

    if (metric === "weight") {
      diff = latest.weight - prev.weight;
      percent = prev.weight ? (diff / prev.weight) * 100 : 0;
    } else if (metric === "muscle") {
      diff = (latest.muscleMass ?? 0) - (prev.muscleMass ?? 0);
      percent = prev.muscleMass ? (diff / prev.muscleMass) * 100 : 0;
    } else if (metric === "fat") {
      diff = (latest.bodyFatPercentage ?? 0) - (prev.bodyFatPercentage ?? 0); // absolute diff for percentage
      percent = diff; // Show absolute change for % metrics
    }

    return {
      value: diff,
      percent: Math.abs(percent).toFixed(1) + "%",
      isPositive: diff > 0,
      label:
        metric === "weight"
          ? "vs last scan"
          : metric === "muscle"
            ? "Muscle Mass"
            : "Body Fat",
    };
  };

  const chartData = [...measurements].reverse().map((m) => ({
    date: new Date(m.measurementDate).toLocaleDateString("en-US", {
      month: "short",
    }),
    weight: m.weight,
    muscle: m.muscleMass,
    fat: m.bodyFatPercentage,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs rounded-lg p-2 shadow-xl border border-slate-700">
          <p className="font-bold mb-1">{label}</p>
          <p>{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const hasData = measurements.length > 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 p-4 lg:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header - Compact */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                My Body Composition
              </h1>
              {latest && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(latest.bmi ?? 0) < 25 && (latest.bmi ?? 0) > 18.5 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {(latest.bmi ?? 0) < 25 && (latest.bmi ?? 0) > 18.5
                    ? "Healthy"
                    : "Check BMI"}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
              Latest Scan:{" "}
              {latest
                ? new Date(latest.measurementDate).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "No scans yet"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs h-9 rounded-xl gap-2 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
            <Button
              onClick={handleOpenScheduleModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-2 shadow-md shadow-blue-200"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              {scheduledBooking ? "Reschedule" : "Schedule Scan"}
            </Button>
          </div>
        </div>

        {scheduledBooking && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs font-bold text-green-800 dark:text-green-300">
                  Scan Scheduled:{" "}
                  {new Date(scheduledBooking.startTime).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  {mapBookingStatus(scheduledBooking.status)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelBooking}
              className="text-green-700 dark:text-green-400 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 text-[10px] h-6 font-bold"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Top Stats Cards - Compact */}
        {latest ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Weight */}
            <Card className="p-4 border-0 shadow-sm bg-white dark:bg-slate-800 rounded-[18px] relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Total Weight
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {latest.weight}
                    </span>
                    <span className="text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>
                <div
                  className={`p-1.5 rounded-full ${getComparison("weight").value <= 0 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {getComparison("weight").value <= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
              {measurements.length > 1 && (
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-2 ${getComparison("weight").value <= 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {getComparison("weight").percent}
                  <span className="text-slate-400 font-medium ml-1">
                    vs last
                  </span>
                </div>
              )}
            </Card>

            {/* Muscle */}
            <Card className="p-4 border-0 shadow-sm bg-white dark:bg-slate-800 rounded-[18px] relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Muscle Mass
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {latest.muscleMass}
                    </span>
                    <span className="text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>
                <div
                  className={`p-1.5 rounded-full ${getComparison("muscle").value >= 0 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
              </div>
              {measurements.length > 1 && (
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-2 ${getComparison("muscle").value >= 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {getComparison("muscle").percent}
                  <span className="text-slate-400 font-medium ml-1">
                    Improved
                  </span>
                </div>
              )}
            </Card>

            {/* Fat */}
            <Card className="p-4 border-0 shadow-sm bg-white dark:bg-slate-800 rounded-[18px] relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase mb-1">
                    Body Fat
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {latest.bodyFatPercentage}
                    </span>
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>
                <div
                  className={`p-1.5 rounded-full ${getComparison("fat").value <= 0 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {getComparison("fat").value <= 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
              {measurements.length > 1 && (
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-2 ${getComparison("fat").value <= 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {getComparison("fat").percent}
                  <span className="text-slate-400 font-medium ml-1">
                    Leaner
                  </span>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-6 text-center bg-white dark:bg-slate-800 border-0 shadow-sm rounded-[20px]">
            <Scale className="h-10 w-10 mx-auto text-slate-200 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Data Available
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
              Complete your first scan to see your stats.
            </p>
          </Card>
        )}

        {/* Charts & Insights */}
        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5 border-0 shadow-sm bg-white dark:bg-slate-800 rounded-[22px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Composition History
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Last 6 Months Trend
                  </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  {(["weight", "muscle", "fat"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${chartMetric === m ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorMetric"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={
                            chartMetric === "fat" ? "#F97316" : "#3b82f6"
                          }
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            chartMetric === "fat" ? "#F97316" : "#3b82f6"
                          }
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={chartMetric}
                      stroke={chartMetric === "fat" ? "#F97316" : "#3b82f6"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 border-0 shadow-md bg-blue-600 text-white rounded-[22px] relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                    Pulse AI Insight
                  </span>
                </div>
                <h3 className="text-xl font-black mb-2 leading-tight">
                  Goal On Track!
                </h3>
                <p className="text-blue-100 text-xs leading-relaxed mb-4">
                  Your skeletal muscle mass has increased by{" "}
                  <span className="font-bold text-white">
                    {getComparison("muscle").percent}
                  </span>{" "}
                  this month. Great job!
                </p>

                <div className="bg-blue-500/50 rounded-xl p-3 border border-blue-400/50 mb-4">
                  <h4 className="flex items-center gap-2 font-bold text-yellow-300 text-[10px] uppercase mb-1">
                    <Activity className="h-3 w-3" /> Attention Needed
                  </h4>
                  <p className="text-[10px] text-blue-100">
                    Hydration levels dropped slightly. Drink more water.
                  </p>
                </div>
              </div>

              <Button className="w-full bg-white text-blue-600 font-bold hover:bg-blue-50 border-0 h-9 text-xs">
                View Recommendations
              </Button>

              {/* Decorative */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            </Card>
          </div>
        )}

        {/* Bottom Section: Metrics & Segmental Analysis - Ultra Compact */}
        {latest && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            {/* Left: Key Metrics Grid (Takes up 5 columns for better proportion with smaller cards) */}
            <div className="xl:col-span-5 grid grid-cols-2 gap-3">
              {[
                {
                  title: "BMI",
                  icon: Activity,
                  color: "text-slate-400",
                  val:
                    latest.bmi != null ? Number(latest.bmi).toFixed(1) : "--",
                  unit: (latest.bmi ?? 0) < 25 ? "Normal" : "High",
                  unitColor:
                    (latest.bmi ?? 0) < 25
                      ? "text-green-500"
                      : "text-orange-500",
                },
                {
                  title: "Body Water",
                  icon: Droplets,
                  color: "text-blue-400",
                  val: latest.bodyWaterPercentage ?? "--",
                  unit: "Pct %",
                  unitColor: "text-slate-400",
                },
                {
                  title: "Protein",
                  icon: Bone,
                  color: "text-slate-400",
                  val: latest.protein ?? "--",
                  unit: "kg",
                  unitColor: "text-slate-400",
                },
                {
                  title: "Minerals",
                  icon: Bone,
                  color: "text-orange-400",
                  val: latest.minerals ?? "--",
                  unit: "kg",
                  unitColor: "text-slate-400",
                },
                {
                  title: "Visceral Fat",
                  icon: Flame,
                  color: "text-red-400",
                  val: latest.visceralFat ?? "--",
                  unit: "Level",
                  unitColor: "text-slate-400",
                },
                {
                  title: "BMR",
                  icon: Zap,
                  color: "text-yellow-500",
                  val: latest.bmr ?? "--",
                  unit: "kcal",
                  unitColor: "text-slate-400",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="p-3 bg-white dark:bg-slate-800 border-0 shadow-sm rounded-[18px] flex flex-col justify-between h-24 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {item.title}
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                      {item.val}
                    </p>
                    <p
                      className={`text-[9px] font-bold mt-1 ${item.unitColor}`}
                    >
                      {item.unit}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Right: Segmental Lean Analysis (Takes up 7 columns) */}
            <Card className="xl:col-span-7 p-5 bg-white dark:bg-slate-800 border-0 shadow-sm rounded-[24px] flex flex-col items-center justify-center">
              <div className="w-full flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Segmental Lean Analysis
                </h3>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 font-bold text-[10px] h-7 px-3 rounded-lg"
                >
                  View Details
                </Button>
              </div>

              <div className="w-full flex flex-row items-center justify-between gap-6 px-2">
                {/* Body Visual - Compact */}
                <div className="relative w-32 h-48 flex items-center justify-center shrink-0">
                  {/* Head */}
                  <div className="absolute top-2 w-8 h-8 bg-slate-200 rounded-full"></div>

                  {/* Torso */}
                  <div className="absolute top-12 w-14 h-20 bg-emerald-500 rounded-[12px] z-10"></div>

                  {/* Arms */}
                  <div className="absolute top-12 left-0 w-6 h-16 bg-emerald-500 rounded-[8px]"></div>
                  <div className="absolute top-12 right-0 w-6 h-16 bg-emerald-500 rounded-[8px]"></div>

                  {/* Legs */}
                  <div className="absolute top-34 left-6 w-6 h-12 bg-emerald-500 rounded-b-[8px] rounded-t-[4px]"></div>
                  <div className="absolute top-34 right-6 w-6 h-12 bg-emerald-500 rounded-b-[8px] rounded-t-[4px]"></div>

                  {/* Floating Badges - Simplified */}
                  <div className="absolute top-20 -left-8 bg-white py-0.5 px-1.5 rounded-md shadow-sm border border-slate-100 flex items-center gap-1 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[8px] font-bold text-slate-700">
                      --
                    </span>
                  </div>
                  <div className="absolute top-20 -right-8 bg-white py-0.5 px-1.5 rounded-md shadow-sm border border-slate-100 flex items-center gap-1 z-20">
                    <span className="text-[8px] font-bold text-slate-700">
                      --
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                </div>

                {/* Analysis Table - Compact */}
                <div className="flex-1 w-full max-w-xs">
                  <div className="grid grid-cols-12 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 border-b border-slate-100 pb-1">
                    <div className="col-span-4">Segment</div>
                    <div className="col-span-4 text-right">Lean</div>
                    <div className="col-span-4 text-right">Fat</div>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { name: "Right Arm", lean: "--", fat: "--" },
                      { name: "Left Arm", lean: "--", fat: "--" },
                      { name: "Trunk", lean: "--", fat: "--" },
                      { name: "Right Leg", lean: "--", fat: "--" },
                      { name: "Left Leg", lean: "--", fat: "--" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-12 items-center p-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="col-span-4 font-bold text-slate-700 text-[10px]">
                          {row.name}
                        </div>
                        <div className="col-span-4 text-right font-black text-emerald-600 text-[11px] group-hover:scale-105 transition-transform">
                          {row.lean}{" "}
                          <span className="text-[8px] font-medium text-slate-400 opacity-0 group-hover:opacity-100">
                            kg
                          </span>
                        </div>
                        <div className="col-span-4 text-right font-medium text-slate-400 text-[10px]">
                          {row.fat}{" "}
                          <span className="text-[8px] font-medium text-slate-300 opacity-0 group-hover:opacity-100">
                            kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Schedule Modal */}
        <Dialog
          open={isScheduleModalOpen}
          onOpenChange={setIsScheduleModalOpen}
        >
          <DialogContent className="bg-white rounded-[24px] border-0 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Schedule InBody Scan
              </DialogTitle>
              <DialogDescription>
                Choose a time for your assessment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <p className="font-bold text-sm mb-2">Select Date</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => {
                        setSelectedDate(slot);
                        setSelectedTime(null);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${selectedDate?.id === slot.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-slate-200"}`}
                    >
                      <span className="text-xs font-medium text-slate-400">
                        {slot.day.slice(0, 3)}
                      </span>
                      <span className="text-lg font-bold">
                        {slot.date.split(" ")[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <p className="font-bold text-sm mb-2">Select Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDate.slots.map((t) => (
                      <div
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 px-2 rounded-xl text-center text-sm font-bold cursor-pointer transition-all ${selectedTime === t ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSchedule}
                disabled={isSubmitting || !selectedDate || !selectedTime}
                className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl"
              >
                {isSubmitting ? "Scheduling..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
