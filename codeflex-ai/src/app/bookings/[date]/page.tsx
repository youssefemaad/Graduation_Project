"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi, equipmentApi, type BookingDto, type EquipmentDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChevronLeft,
    Clock,
    User,
    Dumbbell,
    XCircle,
    AlertCircle,
    Calendar as CalendarIcon,
    Plus,
    Loader2,
    CheckCircle2,
    MapPin,
    Coins
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function BookingDatePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [bookings, setBookings] = useState<BookingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Parse date from params safely
    const rawDate = params?.date;
    const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate || "";
    const dateObj = new Date(dateStr + "T12:00:00");
    const isValidDate = !isNaN(dateObj.getTime()) && dateStr.length > 0;

    // Check if date is in past
    const isPastDate = dateObj < new Date(new Date().setHours(0, 0, 0, 0));

    useEffect(() => {
        if (!user || !isValidDate || !dateStr) {
            setLoading(false);
            return;
        }

        const fetchBookings = async () => {
            try {
                const response = await bookingsApi.getUserBookings(user.userId);
                if (response.success && response.data) {
                    const dayBookings = response.data.filter(b => {
                        const bDate = new Date(b.startTime).toISOString().split('T')[0];
                        return bDate === dateStr;
                    });
                    setBookings(dayBookings);
                }
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user, dateStr, isValidDate]);

    const handleCancel = async (bookingId: number) => {
        if (!confirm("Are you sure you want to cancel this booking? Tokens will be refunded.")) return;

        setProcessingId(bookingId);
        try {
            const response = await bookingsApi.cancelBooking(bookingId, "User cancelled via web");
            if (response.success) {
                showToast("Booking cancelled successfully. Tokens refunded.", "success");
                setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
            } else {
                showToast(response.message || "Failed to cancel booking", "error");
            }
        } catch (error) {
            showToast("An error occurred", "error");
        } finally {
            setProcessingId(null);
        }
    };

    if (!isValidDate) {
        return (
            <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
                <div className="min-h-screen flex flex-col items-center justify-center p-8">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Date</h1>
                    <p className="text-slate-500 mb-4">The date you're looking for doesn't exist.</p>
                    <Button onClick={() => router.push('/programs')} className="rounded-xl">
                        Go Back
                    </Button>
                </div>
            </ProtectedRoute>
        );
    }

    // Separate bookings by type
    const coachBookings = bookings.filter(b => b.coachId);
    const equipmentBookings = bookings.filter(b => b.equipmentId);

    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
            <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="bg-white hover:bg-slate-100 rounded-full h-12 w-12 border border-slate-200 shadow-sm flex-shrink-0"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CalendarIcon className="h-5 w-5 text-blue-500" />
                                <span className="text-sm font-medium text-slate-500">
                                    {dateObj.toLocaleDateString("en-US", { weekday: 'long' })}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                                {dateObj.toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {bookings.length > 0
                                    ? `${bookings.length} session${bookings.length > 1 ? 's' : ''} scheduled`
                                    : "No sessions scheduled"
                                }
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {!isPastDate && (
                        <Card className="p-5 border-none shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Add to this day</h3>
                                        <p className="text-blue-100 text-sm">Book equipment or schedule a coach session</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/book-coach">
                                        <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-bold">
                                            <User className="mr-2 h-4 w-4" />
                                            Coach
                                        </Button>
                                    </Link>
                                    <Link href="/book-equipment">
                                        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl font-bold">
                                            <Dumbbell className="mr-2 h-4 w-4" />
                                            Equipment
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : bookings.length === 0 ? (
                        /* Empty State */
                        <Card className="p-12 border-none shadow-sm bg-white rounded-3xl text-center">
                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CalendarIcon className="h-10 w-10 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">No Sessions Scheduled</h2>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                {isPastDate
                                    ? "This date has passed. You can view your history in the calendar."
                                    : "You haven't booked anything for this day yet. Start by booking equipment or scheduling a coach session."
                                }
                            </p>
                            {!isPastDate && (
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/book-coach">
                                        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6">
                                            <User className="mr-2 h-4 w-4" />
                                            Book a Coach
                                        </Button>
                                    </Link>
                                    <Link href="/book-equipment">
                                        <Button variant="outline" className="rounded-xl px-6">
                                            <Dumbbell className="mr-2 h-4 w-4" />
                                            Book Equipment
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </Card>
                    ) : (
                        /* Bookings List */
                        <div className="space-y-6">

                            {/* Coach Sessions */}
                            {coachBookings.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-900">Coach Sessions</h2>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                            {coachBookings.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {coachBookings.map(booking => (
                                            <BookingCard
                                                key={booking.bookingId}
                                                booking={booking}
                                                onCancel={handleCancel}
                                                isProcessing={processingId === booking.bookingId}
                                                isPast={isPastDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Equipment Bookings */}
                            {equipmentBookings.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-8 w-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                            <Dumbbell className="h-4 w-4" />
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-900">Equipment Reservations</h2>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            {equipmentBookings.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {equipmentBookings.map(booking => (
                                            <BookingCard
                                                key={booking.bookingId}
                                                booking={booking}
                                                onCancel={handleCancel}
                                                isProcessing={processingId === booking.bookingId}
                                                isPast={isPastDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

// Booking Card Component
function BookingCard({
    booking,
    onCancel,
    isProcessing,
    isPast
}: {
    booking: BookingDto;
    onCancel: (id: number) => void;
    isProcessing: boolean;
    isPast: boolean;
}) {
    const isCoach = !!booking.coachId;
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const isCancelled = booking.status === 2;
    const isCompleted = booking.status === 3 || isPast;

    return (
        <Card className={cn(
            "p-0 border-none shadow-sm bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md",
            isCancelled && "opacity-60"
        )}>
            <div className="flex">
                {/* Left Color Bar */}
                <div className={cn(
                    "w-2 flex-shrink-0",
                    isCoach ? "bg-blue-500" : "bg-green-500",
                    isCancelled && "bg-slate-300"
                )} />

                <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                                isCoach ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600",
                                isCancelled && "bg-slate-100 text-slate-400"
                            )}>
                                {isCoach ? <User className="h-7 w-7" /> : <Dumbbell className="h-7 w-7" />}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                                        isCancelled ? "bg-red-100 text-red-600" :
                                            isCompleted ? "bg-green-100 text-green-700" :
                                                isCoach ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                    )}>
                                        {isCancelled ? "Cancelled" : isCompleted ? "Completed" : booking.statusText || (isCoach ? "Coach Session" : "Equipment")}
                                    </span>
                                </div>

                                <h3 className={cn(
                                    "text-xl font-bold mb-1",
                                    isCancelled ? "text-slate-400 line-through" : "text-slate-900"
                                )}>
                                    {booking.coachName || booking.equipmentName || "Booking"}
                                </h3>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Coins className="h-4 w-4" />
                                        {booking.tokensCost} tokens
                                    </div>
                                </div>

                                {booking.notes && (
                                    <p className="text-sm text-slate-400 mt-2 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {booking.notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {!isCancelled && !isCompleted && !isPast && (
                            <div className="flex gap-2 sm:flex-col">
                                <Button
                                    variant="ghost"
                                    onClick={() => onCancel(booking.bookingId)}
                                    disabled={isProcessing}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <XCircle className="mr-1.5 h-4 w-4" />
                                            Cancel
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {isCompleted && !isCancelled && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-bold text-sm">Completed</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
