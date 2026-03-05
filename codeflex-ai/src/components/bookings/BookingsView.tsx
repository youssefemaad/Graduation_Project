"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi, type BookingDto } from "@/lib/api";
import {
    Calendar as CalendarIcon,
    Dumbbell,
    User,
    ChevronLeft,
    ChevronRight,
    Clock,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LocalBooking {
    id: number;
    type: "equipment" | "coach";
    name: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    status: number;
    tokensCost: number;
}

export function BookingsView({ showHeader = true }: { showHeader?: boolean }) {
    const router = useRouter();
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<LocalBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Generate calendar days
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days: { day: number | null; fullDate: Date | null }[] = [];

        // Previous month padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, fullDate: null });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, fullDate: new Date(year, month, i) });
        }

        return days;
    }, [currentDate]);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const response = await bookingsApi.getUserBookings(user.userId);
                if (response.success && response.data) {
                    const mappedBookings: LocalBooking[] = response.data.map((b: BookingDto) => ({
                        id: b.bookingId,
                        type: b.coachId ? "coach" : "equipment",
                        name: b.coachName || b.equipmentName || "Booking",
                        date: new Date(b.startTime),
                        startTime: new Date(b.startTime),
                        endTime: new Date(b.endTime),
                        status: b.status,
                        tokensCost: b.tokensCost
                    }));
                    setBookings(mappedBookings);
                }
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [user]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (date: Date) => isSameDay(date, new Date());

    const getDayBookings = (date: Date) => {
        return bookings.filter(b => isSameDay(b.date, date) && b.status !== 2); // Exclude cancelled
    };

    const handleDayClick = (date: Date) => {
        const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
        router.push(`/bookings/${dateStr}`);
    };

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const upcoming = bookings.filter(b => b.date >= now && b.status !== 2).length;
        const thisMonth = bookings.filter(b =>
            b.date.getMonth() === now.getMonth() &&
            b.date.getFullYear() === now.getFullYear() &&
            b.status !== 2
        ).length;
        return { upcoming, thisMonth };
    }, [bookings]);

    return (
        <div className="w-full relative z-10">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                {showHeader && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">My Schedule</h1>
                            <p className="text-slate-500 mt-1">View and manage your gym sessions</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/book-coach">
                                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
                                    <User className="h-4 w-4" />
                                    Book Coach
                                </Button>
                            </Link>
                            <Link href="/book-equipment">
                                <Button variant="outline" className="gap-2 rounded-xl border-slate-200">
                                    <Dumbbell className="h-4 w-4" />
                                    Book Equipment
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-6">

                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Quick Stats */}
                        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl">
                            <h3 className="font-bold text-slate-900 mb-4">Overview</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                        <CalendarIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900">{stats.upcoming}</p>
                                        <p className="text-xs text-slate-500">Upcoming</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                        <Dumbbell className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900">{stats.thisMonth}</p>
                                        <p className="text-xs text-slate-500">This Month</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Legend */}
                        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl">
                            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Legend</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm text-slate-600">Coach Sessions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm text-slate-600">Equipment</span>
                                </div>
                            </div>
                        </Card>

                        {/* Upcoming Today Card */}
                        {getDayBookings(new Date()).length > 0 && (
                            <Card className="p-5 border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl">
                                <h3 className="font-bold mb-3">Today's Sessions</h3>
                                <div className="space-y-2">
                                    {getDayBookings(new Date()).slice(0, 3).map(booking => (
                                        <div key={booking.id} className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                                            {booking.type === 'coach' ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Dumbbell className="h-4 w-4" />
                                            )}
                                            <span className="text-sm font-medium truncate">{booking.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={() => handleDayClick(new Date())}
                                    className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white border-0 rounded-lg"
                                >
                                    View All
                                </Button>
                            </Card>
                        )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="lg:col-span-9">
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            {/* Calendar Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-black text-slate-900">
                                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                                    <button
                                        onClick={prevMonth}
                                        className="p-2 hover:bg-white rounded-lg transition-all"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white rounded-lg transition-all"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 hover:bg-white rounded-lg transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Loading */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <div className="p-5">
                                    {/* Week Days Header */}
                                    <div className="grid grid-cols-7 mb-2">
                                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Days */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarData.map((day, idx) => {
                                            const hasDay = day.day !== null && day.fullDate;
                                            const dayBookings = hasDay ? getDayBookings(day.fullDate!) : [];
                                            const hasCoach = dayBookings.some(b => b.type === 'coach');
                                            const hasEquipment = dayBookings.some(b => b.type === 'equipment');
                                            const isTodayDate = hasDay && isToday(day.fullDate!);

                                            return (
                                                <div
                                                    key={`${day.day || 'empty'}-${idx}`}
                                                    onClick={() => hasDay && handleDayClick(day.fullDate!)}
                                                    className={cn(
                                                        "min-h-[90px] p-2 rounded-xl transition-all cursor-pointer relative group",
                                                        hasDay && "hover:bg-slate-50",
                                                        !hasDay && "bg-transparent cursor-default",
                                                        isTodayDate && "bg-blue-50 ring-2 ring-blue-500 ring-inset"
                                                    )}
                                                >
                                                    {hasDay && (
                                                        <>
                                                            {/* Day Number */}
                                                            <div className={cn(
                                                                "text-sm font-bold mb-1",
                                                                isTodayDate ? "text-blue-600" : "text-slate-700"
                                                            )}>
                                                                {day.day}
                                                            </div>

                                                            {/* Booking Indicators */}
                                                            {dayBookings.length > 0 && (
                                                                <div className="space-y-1">
                                                                    {dayBookings.slice(0, 2).map(booking => (
                                                                        <div
                                                                            key={booking.id}
                                                                            className={cn(
                                                                                "text-[10px] px-1.5 py-1 rounded truncate font-medium",
                                                                                booking.type === 'coach'
                                                                                    ? "bg-blue-100 text-blue-700"
                                                                                    : "bg-green-100 text-green-700"
                                                                            )}
                                                                        >
                                                                            {booking.name}
                                                                        </div>
                                                                    ))}
                                                                    {dayBookings.length > 2 && (
                                                                        <div className="text-[10px] text-slate-500 font-bold pl-1">
                                                                            +{dayBookings.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Dot indicators for quick glance */}
                                                            {dayBookings.length > 0 && (
                                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                                                    {hasCoach && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                                                                    {hasEquipment && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                                                                </div>
                                                            )}

                                                            {/* Hover indicator */}
                                                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl transition-all pointer-events-none"></div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
