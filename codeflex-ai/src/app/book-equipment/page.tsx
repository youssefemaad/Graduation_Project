"use client";

import { useState, useEffect } from "react";
import {
    Dumbbell,
    Search,
    Filter,
    Clock,
    MapPin,
    Ticket,
    ChevronLeft,
    CheckCircle,
    Loader2,
    X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { equipmentApi, bookingsApi, type EquipmentDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface EquipmentWithDetails extends EquipmentDto {
    category: string;
    location: string;
    tokensCost: number;
    imageUrl?: string;
}

// Equipment images for gym vibe
const equipmentImages: Record<string, string> = {
    "treadmill": "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80",
    "bench press": "https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=800&q=80",
    "squat rack": "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800&q=80",
    "leg press": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    "cable machine": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
    "dumbbells": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
    "rowing machine": "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=800&q=80",
    "elliptical": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    "default": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

const getEquipmentImage = (name: string): string => {
    const lowerName = name.toLowerCase();
    for (const [key, url] of Object.entries(equipmentImages)) {
        if (lowerName.includes(key)) return url;
    }
    return equipmentImages.default;
};

const mapEquipmentStatus = (status: number): "available" | "in_use" | "maintenance" => {
    switch (status) {
        case 0: return "available";
        case 1: return "in_use";
        case 2: return "maintenance";
        default: return "available";
    }
};

function BookEquipmentContent() {
    const { user, deductTokens, refreshUser } = useAuth();
    const { showToast } = useToast();

    const [equipment, setEquipment] = useState<EquipmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Booking modal state
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails | null>(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(60);
    const [bookingDate, setBookingDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isBooking, setIsBooking] = useState(false);

    // Coach session blocking state
    const [isCheckingCoachSession, setIsCheckingCoachSession] = useState(false);
    const [hasCoachSession, setHasCoachSession] = useState(false);
    const [coachSessionMessage, setCoachSessionMessage] = useState("");

    // Duration options
    const durationOptions = [
        { value: 30, label: "30 minutes" },
        { value: 45, label: "45 minutes" },
        { value: 60, label: "1 hour" },
        { value: 90, label: "1.5 hours" },
    ];

    // Fetch equipment
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                setIsLoading(true);
                const response = await equipmentApi.getAllEquipment();

                if (response.success && response.data) {
                    const mappedEquipment = response.data.map((eq: EquipmentDto) => ({
                        ...eq,
                        category: (eq.categoryName || eq.category || "strength").toLowerCase(),
                        location: eq.location || "Main Floor",
                        tokensCost: eq.tokensCostPerHour || eq.tokensCost || 5,
                        imageUrl: getEquipmentImage(eq.name),
                    }));
                    setEquipment(mappedEquipment);
                }
            } catch (error) {
                console.error("Failed to fetch equipment:", error);
                showToast("Failed to load equipment", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEquipment();
    }, [showToast]);

    // Filter equipment
    const filteredEquipment = equipment.filter(eq => {
        const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || eq.category === filterCategory;
        const status = mapEquipmentStatus(eq.status);
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Get unique categories
    const categories = [...new Set(equipment.map(eq => eq.category))];

    // Check if user has a coach session for selected time slot
    const checkCoachSessionForTimeSlot = async (date: string, start: string, end: string) => {
        if (!user?.userId || !date || !start || !end) return;

        try {
            setIsCheckingCoachSession(true);
            const startDateTime = new Date(`${date}T${start}:00`).toISOString();
            const endDateTime = new Date(`${date}T${end}:00`).toISOString();

            const response = await bookingsApi.checkUserHasCoachBooking(
                user.userId,
                startDateTime,
                endDateTime
            );

            if (response.success && response.data) {
                setHasCoachSession(response.data.hasCoachBooking);
                setCoachSessionMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error checking coach session:", error);
        } finally {
            setIsCheckingCoachSession(false);
        }
    };

    // Effect to check coach session when time slot changes
    useEffect(() => {
        if (bookingModalOpen && bookingDate && startTime && endTime) {
            checkCoachSessionForTimeSlot(bookingDate, startTime, endTime);
        }
    }, [bookingDate, startTime, endTime, bookingModalOpen]);

    const handleBookEquipment = async () => {
        if (!selectedEquipment || !user?.userId) return;

        // Validate date and time inputs
        if (!bookingDate || !startTime || !endTime) {
            showToast("Please select booking date, start time, and end time", "error");
            return;
        }

        // Check if user has active coach session
        if (hasCoachSession) {
            showToast("You cannot book equipment during your coach session. Equipment is automatically booked based on your workout plan.", "error");
            return;
        }

        const cost = selectedEquipment.tokensCost;
        if ((user.tokenBalance ?? 0) < cost) {
            showToast("Insufficient tokens", "error");
            return;
        }

        // Create booking times from user input
        const bookingStartTime = new Date(`${bookingDate}T${startTime}:00`);
        const bookingEndTime = new Date(`${bookingDate}T${endTime}:00`);

        // Validate times
        if (bookingStartTime >= bookingEndTime) {
            showToast("End time must be after start time", "error");
            return;
        }

        if (bookingStartTime < new Date()) {
            showToast("Cannot book in the past", "error");
            return;
        }

        try {
            setIsBooking(true);
            const response = await bookingsApi.createBooking({
                userId: user.userId,
                equipmentId: selectedEquipment.equipmentId,
                bookingType: "Equipment",
                startTime: bookingStartTime.toISOString(),
                endTime: bookingEndTime.toISOString(),
                notes: `Booked ${selectedEquipment.name} from ${startTime} to ${endTime}`,
            });

            if (response.success) {
                deductTokens(cost);
                if (refreshUser) await refreshUser();

                // Update equipment status
                setEquipment(prev => prev.map(eq =>
                    eq.equipmentId === selectedEquipment.equipmentId
                        ? { ...eq, status: 1 }
                        : eq
                ));

                showToast(`Booked ${selectedEquipment.name} — ${cost} tokens`, "success");
                setBookingModalOpen(false);
            } else {
                // Check if error is about coach session
                if (response.message?.toLowerCase().includes("coach session")) {
                    setHasCoachSession(true);
                    setCoachSessionMessage(response.message);
                }
                showToast(response.message || "Failed to book", "error");
            }
        } catch (error) {
            console.error("Booking error:", error);
            showToast("Failed to book equipment", "error");
        } finally {
            setIsBooking(false);
        }
    };

    const getStatusBadge = (status: number) => {
        const statusStr = mapEquipmentStatus(status);
        const badges = {
            available: { text: "Available", color: "bg-green-500", textColor: "text-white" },
            in_use: { text: "In Use", color: "bg-amber-500", textColor: "text-white" },
            maintenance: { text: "Maintenance", color: "bg-red-500", textColor: "text-white" },
        };
        const badge = badges[statusStr];
        return (
            <span className={`px-2.5 py-1 rounded-md ${badge.color} ${badge.textColor} text-xs font-bold uppercase tracking-wider flex items-center gap-1`}>
                {statusStr === "available" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                {badge.text}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f8f7] dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-900 dark:text-white relative">
            {/* Header */}
            <header className="relative z-20 sticky top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <Dumbbell className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">Book Equipment</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
                                <Ticket className="h-4 w-4 text-primary" />
                                <span className="font-bold text-slate-900 dark:text-white">{user?.tokenBalance ?? 0}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">tokens</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        Reserve Your Equipment
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Book gym equipment in advance to ensure it&apos;s ready when you are.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center mb-8 sticky top-20 z-10">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                            placeholder="Search equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-700 dark:border-slate-600">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="in_use">In Use</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Equipment Grid */}
                {filteredEquipment.length === 0 ? (
                    <Card className="p-12 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No equipment found</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredEquipment.map((eq) => {
                            const status = mapEquipmentStatus(eq.status);
                            return (
                                <Card
                                    key={eq.equipmentId}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
                                >
                                    {/* Equipment Image */}
                                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                            style={{ backgroundImage: `url('${eq.imageUrl}')` }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3 z-10">
                                            {getStatusBadge(eq.status)}
                                        </div>

                                        {/* Category Tag */}
                                        <div className="absolute bottom-3 left-3 flex gap-2">
                                            <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-md">
                                                {eq.category.charAt(0).toUpperCase() + eq.category.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {eq.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {eq.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">
                                                    {eq.tokensCost} T
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/hr</span>
                                                </p>
                                            </div>
                                        </div>

                                        {eq.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                {eq.description}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                                <Clock className="h-4 w-4" />
                                                <span>30-90 min slots</span>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelectedEquipment(eq);
                                                    setBookingModalOpen(true);
                                                    // Set default date to today
                                                    const today = new Date().toISOString().split('T')[0];
                                                    setBookingDate(today);
                                                    // Set default start time to next hour
                                                    const now = new Date();
                                                    const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
                                                    const startTimeStr = nextHour.toTimeString().slice(0, 5);
                                                    setStartTime(startTimeStr);
                                                    // Set default end time to 1 hour after start
                                                    const endHour = new Date(nextHour.setHours(nextHour.getHours() + 1));
                                                    const endTimeStr = endHour.toTimeString().slice(0, 5);
                                                    setEndTime(endTimeStr);
                                                }}
                                                disabled={status !== "available"}
                                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${status === "available"
                                                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md"
                                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                {status === "available" ? "Book Now" : "Unavailable"}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Dumbbell className="h-5 w-5 text-primary" />
                            Book {selectedEquipment?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEquipment && (
                        <div className="space-y-6">
                            {/* Equipment Image */}
                            <div
                                className="h-40 rounded-xl bg-cover bg-center"
                                style={{ backgroundImage: `url('${selectedEquipment.imageUrl}')` }}
                            />

                            {/* Date and Time Selection */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Booking Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Start Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            End Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Coach Session Warning */}
                            {isCheckingCoachSession && (
                                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                    <span className="text-sm text-slate-500">Checking availability...</span>
                                </div>
                            )}

                            {hasCoachSession && !isCheckingCoachSession && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <X className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-amber-800">Coach Session Active</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                {coachSessionMessage || "You have a coach session during this time. Equipment will be automatically booked based on your workout plan."}
                                            </p>
                                            <p className="text-xs text-amber-600 mt-2">
                                                💡 Tip: Book equipment for a different time slot, or check your booked coach sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500">Equipment</span>
                                    <span className="font-medium">{selectedEquipment.name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium">{bookingDate || "Not selected"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500">Time</span>
                                    <span className="font-medium">{startTime && endTime ? `${startTime} - ${endTime}` : "Not selected"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                    <span className="text-slate-500">Total Cost</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xl font-bold text-slate-900">{selectedEquipment.tokensCost}</span>
                                        <Ticket className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setBookingModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`flex-1 ${hasCoachSession ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                                    onClick={handleBookEquipment}
                                    disabled={isBooking || hasCoachSession || isCheckingCoachSession}
                                >
                                    {isBooking ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : hasCoachSession ? (
                                        <>
                                            <X className="mr-2 h-4 w-4" />
                                            Blocked by Coach Session
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirm Booking
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function BookEquipmentPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member]}>
            <BookEquipmentContent />
        </ProtectedRoute>
    );
}
