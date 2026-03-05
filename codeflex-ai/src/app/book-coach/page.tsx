"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  User,
  Calendar,
  Loader2,
  MessageSquare,
  Sparkles,
  Filter,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, bookingsApi, coachReviewsApi, type CoachDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Coach with display-ready fields
interface CoachWithDisplay extends CoachDto {
  tags: string[];
  status: "available" | "busy" | "offline";
  displayImageUrl: string;
}

// Default coach images for fallback
const defaultCoachImages = [
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1581065184285-800d989f6d19?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60',
];

function BookCoachContent() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [coaches, setCoaches] = useState<CoachWithDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([20, 150]);
  const [selectedCategory, setSelectedCategory] = useState("All Coaches");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [instantBooking, setInstantBooking] = useState(false);

  // Booking Modal
  const [selectedCoach, setSelectedCoach] = useState<CoachWithDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Auto-booked equipment success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [autoBookedEquipment, setAutoBookedEquipment] = useState<Array<{ equipmentName: string; bookingId: number }>>([]);
  const [lastBookedCoach, setLastBookedCoach] = useState<string>("");
  const [lastBookingTime, setLastBookingTime] = useState<string>("");

  // Available categories from coaches specializations
  const categories = ["All Coaches", "Yoga", "HIIT", "Strength", "Cardio", "CrossFit", "Pilates"];

  // Fetch coaches with real profile data
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await usersApi.getCoachesWithProfiles();
        if (response.success && response.data) {
          const coachesWithDisplay: CoachWithDisplay[] = response.data.map((coach, idx) => {
            // Build tags from specialization and certifications
            const tags: string[] = [];
            if (coach.specialization) tags.push(coach.specialization);
            if (coach.certifications && coach.certifications.length > 0) {
              tags.push(...coach.certifications.slice(0, 2));
            }

            return {
              ...coach,
              tags: tags.length > 0 ? tags : ["Personal Training"],
              status: coach.isAvailable ? "available" : "busy",
              displayImageUrl: coach.profileImageUrl || defaultCoachImages[idx % defaultCoachImages.length],
            };
          });
          setCoaches(coachesWithDisplay);
        }
      } catch (error) {
        console.error("Failed to load coaches", error);
        showToast("Failed to load coaches", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoaches();
  }, [showToast]);

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (coach.specialization?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All Coaches" ||
      coach.tags.includes(selectedCategory) ||
      coach.specialization === selectedCategory;
    const matchesAvailability = !onlyAvailable || coach.status === 'available';

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleBookClick = (coach: CoachWithDisplay) => {
    setSelectedCoach(coach);
    setIsModalOpen(true);
  };

  const handleChatClick = (coachId: string | number) => {
    // Navigate to chat or open chat modal
    // For now, let's route to the chat page or show a toast
    showToast("Chat feature coming soon!", "info");
    // Ideally: router.push(`/chat/${coachId}`);
  };

  const confirmBooking = async () => {
    if (!user || !selectedCoach || !bookingDate || !bookingTime) {
      showToast("Please select date and time", "error");
      return;
    }

    setIsBooking(true);
    const startTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    try {
      const res = await bookingsApi.createBooking({
        userId: user.userId,
        coachId: selectedCoach.userId,
        bookingType: "Session",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: `Session with ${selectedCoach.name}`
      });

      if (res.success && res.data) {
        setIsModalOpen(false);
        refreshUser();

        // Store booking info for success modal
        setLastBookedCoach(selectedCoach.name);
        setLastBookingTime(`${bookingDate} at ${bookingTime}`);

        // Fetch auto-booked equipment for this coach session
        try {
          const equipmentRes = await bookingsApi.getCoachSessionEquipment(res.data.bookingId);
          if (equipmentRes.success && equipmentRes.data && equipmentRes.data.length > 0) {
            setAutoBookedEquipment(
              equipmentRes.data.map(eq => ({
                equipmentName: eq.equipmentName || "Equipment",
                bookingId: eq.bookingId
              }))
            );
            setShowSuccessModal(true);
          } else {
            // No auto-booked equipment, just show success toast
            showToast(`Booked session with ${selectedCoach.name}!`, "success");
          }
        } catch (eqError) {
          console.error("Error fetching auto-booked equipment:", eqError);
          showToast(`Booked session with ${selectedCoach.name}!`, "success");
        }
      } else {
        showToast(res.message || "Failed to book session", "error");
      }
    } catch (error) {
      showToast("Failed to create booking", "error");
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 text-white';
      case 'busy': return 'bg-red-500 text-white';
      case 'offline': return 'bg-slate-400 text-white';
      default: return 'bg-slate-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 relative pb-24">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Find Your Perfect Coach</h1>
          <p className="text-slate-500 text-lg">Browse elite trainers powered by AI to reach your fitness goals faster.</p>
        </div>

        {/* Search & Top Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                      px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border
                      ${selectedCategory === cat
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}
                   `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="space-y-6 hidden lg:block">
            {/* Availability */}
            <Card className="p-6 border-none shadow-sm bg-white rounded-[24px]">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-green-500" />
                <h3 className="font-bold text-slate-900">Availability</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Available Today</span>
                  <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Instant Booking</span>
                  <Switch checked={instantBooking} onCheckedChange={setInstantBooking} />
                </div>
              </div>
            </Card>

            {/* Rating */}
            <Card className="p-6 border-none shadow-sm bg-white rounded-[24px]">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h3 className="font-bold text-slate-900">Rating</h3>
              </div>
              <div className="space-y-3">
                {[4, 3, 2].map(rating => (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded border border-slate-200 flex items-center justify-center bg-slate-50 group-hover:border-green-500 transition-colors">
                      <Check className="h-3.5 w-3.5 text-white opacity-0" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{rating}.5 Stars & up</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Coach Grid */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <div key={coach.userId} className="bg-white rounded-[24px] p-4 shadow-sm hover:shadow-lg transition-all border border-slate-100 group">
                  {/* Image Card */}
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img
                      src={coach.displayImageUrl}
                      alt={coach.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 right-3">
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor(coach.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        {coach.status}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      {coach.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{coach.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-slate-900">{(coach.rating || 0).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({coach.totalReviews || 0} reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-green-500">{coach.hourlyRate || 0} T<span className="text-xs text-slate-400 font-normal">/hr</span></div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {coach.bio || `Specializing in ${coach.specialization || 'fitness training'} and helping clients reach their peak performance through personalized plans.`}
                    </p>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{coach.experienceYears || 0} Years Exp.</span>

                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-xl border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                          onClick={() => handleChatClick(coach.userId)}
                          title="Chat with Coach"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          className="h-9 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl px-4"
                          onClick={() => handleBookClick(coach)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* AI Recommendation Button (Floating) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button className="flex items-center gap-3 bg-white pl-2 pr-6 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hover:scale-105 transition-transform">
          <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">Let AI recommend a coach for you</span>
        </button>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Session with {selectedCoach?.name}</DialogTitle>
            <DialogDescription>
              Select a time for your personal training session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Date</label>
              <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Time</label>
              <Input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 flex justify-between items-center">
              <span>Session Cost</span>
              <span className="font-bold text-slate-900">{selectedCoach?.hourlyRate || 0} Tokens</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmBooking} disabled={isBooking} className="bg-green-500 hover:bg-green-600">
              {isBooking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Booked Equipment Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Session Booked Successfully!
            </DialogTitle>
            <DialogDescription>
              Your session with {lastBookedCoach} on {lastBookingTime} has been confirmed.
            </DialogDescription>
          </DialogHeader>

          {autoBookedEquipment.length > 0 && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    🏋️
                  </span>
                  Equipment Auto-Reserved
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Based on your workout plan, the following equipment has been automatically booked for your session:
                </p>
                <ul className="space-y-2">
                  {autoBookedEquipment.map((eq, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{eq.equipmentName}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-500">
                💡 This equipment is reserved exclusively for your coach session. No additional tokens were charged.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setAutoBookedEquipment([]);
              }}
              className="bg-green-500 hover:bg-green-600 w-full"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookCoachPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <BookCoachContent />
    </ProtectedRoute>
  );
}
