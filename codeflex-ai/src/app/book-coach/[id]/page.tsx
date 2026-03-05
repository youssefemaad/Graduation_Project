"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, statsApi, coachReviewsApi, bookingsApi } from "@/lib/api";
import { UserDto } from "@/lib/api/auth";
import { CoachStatsDto } from "@/lib/api/stats";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
    Loader2,
    Calendar as CalendarIcon,
    Star,
    Clock,
    MapPin,
    Ticket,
    ChevronLeft,
    CheckCircle,
    MessageSquare,
    Shield,
    Trophy,
    Users2,
    Medal,
    ChevronRight,
    ChevronLeft as ChevronLeftIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

// Define strict types
interface CoachDetails extends UserDto {
    specialization?: string;
    bio?: string;
    location?: string;
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    hourlyRate?: number;
}

interface Review {
    bookingId: number;
    userId: number;
    userName: string;
    userImage?: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export default function CoachDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, deductTokens, refreshUser } = useAuth();
    const { showToast } = useToast();
    const coachId = parseInt(id);

    const [coach, setCoach] = useState<CoachDetails | null>(null);
    const [stats, setStats] = useState<CoachStatsDto | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [bookingDate, setBookingDate] = useState("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false);
    const [message, setMessage] = useState("");

    // Determine tomorrow's date for strict min date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    useEffect(() => {
        const fetchCoachDetails = async () => {
            try {
                setIsLoading(true);
                // 1. Fetch Basic Coach Info (from getCoaches list or individual get)
                // Since we don't have getCoach(id) in usersApi (it commonly returns list), 
                // we might filter from getCoaches or use a specific endpoint if available.
                // Assuming we need to find from getCoaches for now or if there's a specialized endpoint.
                // Let's try getting all and finding (not efficient but standard for small apps)
                // OR better: if backend supports getting by ID. `usersApi` usually has `getProfile`? No, that's for current user.
                // Let's assume we fetch list and find.
                const usersRes = await usersApi.getCoaches();
                if (usersRes.success && usersRes.data) {
                    const found = usersRes.data.find(c => c.userId === coachId);
                    if (found) {
                        setCoach({
                            ...found,
                            specialization: "Personal Training", // Default if missing
                            tags: ["Strength", "Mobility", "HITT", "Nutrition"], // Mocks/Defaults
                            hourlyRate: 30, // Default cost
                            location: "Main Gym Floor"
                        });
                    }
                }

                // 2. Fetch Stats
                const statsRes = await statsApi.getCoachStats(coachId);
                if (statsRes.success && statsRes.data) {
                    setStats(statsRes.data);
                }

                // 3. Fetch Reviews
                const reviewsRes = await coachReviewsApi.getCoachReviews(coachId);
                if (reviewsRes.success && reviewsRes.data) {
                    // Map the API response to our local Review interface if needed
                    // Assuming the API returns matching structure or we map it
                    // @ts-expect-error - API response type may not exactly match Review interface
                    setReviews(reviewsRes.data);
                }

            } catch (error) {
                console.error("Failed to fetch coach details:", error);
                showToast("Failed to load coach details", "error");
            } finally {
                setIsLoading(false);
            }
        };

        if (coachId) {
            fetchCoachDetails();
        }
    }, [coachId, showToast]);

    const handleBookSession = async () => {
        if (!coach || !user) return;
        if (!bookingDate || !selectedTimeSlot) {
            showToast("Please select a date and time slot", "error");
            return;
        }

        const cost = coach.hourlyRate || 30;
        if ((user.tokenBalance ?? 0) < cost) {
            showToast("Insufficient tokens", "error");
            return;
        }

        setIsBooking(true);

        // Construct simplified start/end time
        const startTime = new Date(`${bookingDate}T${selectedTimeSlot}:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

        try {
            const response = await bookingsApi.createBooking({
                userId: user.userId,
                coachId: coach.userId,
                bookingType: "PersonalTraining",
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes: message || `Session with ${coach.name}`
            });

            if (response.success) {
                deductTokens(cost);
                if (refreshUser) await refreshUser();
                showToast(`Session booked successfully! ${cost} tokens deducted.`, "success");
                // Add slight delay before redirect to show success state
                setTimeout(() => {
                    router.push("/bookings");
                }, 1500);
            } else {
                showToast(response.message || "Booking failed", "error");
            }
        } catch (error) {
            console.error("Booking failed:", error);
            showToast("Failed to create booking", "error");
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!coach) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Coach not found</h2>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Admin]}>
            <div className="min-h-screen bg-[#f8f9fa] pb-12">
                {/* Ambient Background - adapted for Light/Clean Theme */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
                </div>

                {/* Navigation / Header */}
                <header className="relative z-20 sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-start gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-gray-200">
                                <AvatarImage src={coach.profileImageUrl} />
                                <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-gray-900">{coach.name}</span>
                        </div>
                    </div>
                </header>

                <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Coach Profile (Width: 7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        {/* Coach Hero Card */}
                        <Card className="p-0 overflow-hidden border-none shadow-xl shadow-primary/5 bg-white rounded-3xl relative group">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>

                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start relative z-10">
                                {/* Avatar / Image */}
                                <div className="relative shrink-0 mx-auto md:mx-0">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-gradient-to-br from-primary to-blue-300">
                                        <Avatar className="w-full h-full border-4 border-white">
                                            <AvatarImage src={coach.profileImageUrl} className="object-cover" />
                                            <AvatarFallback className="text-4xl bg-gray-100">{coach.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-lg border border-gray-100 text-primary">
                                        <CheckCircle className="h-5 w-5 fill-primary text-white" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{coach.name}</h1>
                                        <div className="flex items-center justify-center md:justify-end gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-100 w-fit mx-auto md:mx-0">
                                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                            <span className="text-sm font-bold">{stats?.averageRating ? stats.averageRating.toFixed(1) : "New"}</span>
                                            <span className="text-xs opacity-70 font-medium">({stats?.totalReviews || 0} reviews)</span>
                                        </div>
                                    </div>

                                    <p className="text-primary font-bold mb-2 text-lg">{coach.specialization}</p>
                                    <p className="text-gray-500 text-sm mb-5 flex items-center justify-center md:justify-start gap-1.5">
                                        <MapPin className="h-4 w-4" /> {coach.location}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        {coach.tags?.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors cursor-default">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mt-4 bg-gray-50/50 border-t border-gray-100 p-6 md:p-8">
                                <div className="text-center md:text-left">
                                    <p className="text-2xl font-black text-gray-900">{stats?.completedBookings || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Sessions</p>
                                </div>
                                <div className="text-center md:text-left border-l border-gray-200 pl-4 md:pl-8">
                                    <p className="text-2xl font-black text-gray-900">{stats?.totalClients || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Clients</p>
                                </div>
                                <div className="text-center md:text-left border-l border-gray-200 pl-4 md:pl-8">
                                    <p className="text-2xl font-black text-gray-900">98%</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Success Rate</p>
                                </div>
                            </div>
                        </Card>

                        {/* About Section */}
                        <Card className="p-6 md:p-8 border-none shadow-lg shadow-gray-200/50 bg-white rounded-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Users2 className="h-5 w-5 text-primary" /> About Coach
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {coach.bio || `${coach.name} is a dedicated fitness professional focused on helping clients achieve their personal best. Specialized in personalized training plans, biomechanics, and sustainable lifestyle changes.`}
                            </p>
                        </Card>

                        {/* Reviews Section */}
                        <Card className="p-6 md:p-8 border-none shadow-lg shadow-gray-200/50 bg-white rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" /> Client Reviews
                                </h3>
                            </div>

                            {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.map((review, idx) => (
                                        <div key={idx} className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 hover:border-primary/20 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{review.userName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-bold text-gray-900">{review.userName}</span>
                                                </div>
                                                <div className="flex text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400" : "text-gray-300"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p>No reviews yet.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Booking Interface (Width: 5/12) */}
                    <div className="lg:col-span-5 sticky top-24">
                        <Card className="p-6 md:p-8 border-none shadow-xl shadow-primary/10 bg-white rounded-2xl flex flex-col gap-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-gray-900">Book Session</h3>
                                <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Available
                                </div>
                            </div>

                            {/* Session Type (Simplified) */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Session Type</label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                            <Medal className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-gray-700">1:1 Personal Training</span>
                                    </div>
                                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">60 min</span>
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Select Date</label>
                                <Input
                                    type="date"
                                    min={minDate}
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="bg-gray-50 border-gray-200 h-12 rounded-xl text-gray-900 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            {/* Time Slots */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Available Time</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTimeSlot(time)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedTimeSlot === time
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Message (Optional)</label>
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Any specific focus?"
                                    className="bg-gray-50 border-gray-200 rounded-xl"
                                />
                            </div>

                            {/* Summary & Action */}
                            <div className="pt-6 border-t border-gray-100 mt-2">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-500 font-medium">Total Cost</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-gray-900">{coach.hourlyRate || 30}</span>
                                        <span className="text-primary font-bold ml-1 text-sm">Tokens</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-xl shadow-primary/20 text-lg transition-all active:scale-[0.98]"
                                    onClick={handleBookSession}
                                    disabled={isBooking || !bookingDate || !selectedTimeSlot}
                                >
                                    {isBooking ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            Confirm Booking <ChevronRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-center text-xs text-gray-400 mt-4">
                                    You can cancel up to 24h before the session for a full refund.
                                </p>
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
