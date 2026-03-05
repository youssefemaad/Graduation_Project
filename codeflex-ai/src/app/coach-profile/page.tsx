"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Edit,
  Share2,
  Award,
  Users,
  Clock,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Loader2,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { usersApi, coachReviewsApi, bookingsApi, type UpdateProfileDto, type CoachReviewDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

function CoachProfileContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<CoachReviewDto[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form state
  const [editForm, setEditForm] = useState<UpdateProfileDto>({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: 0,
    address: "",
    profileImageUrl: "",
  });

  // Bio/specializations state (would need backend support)
  // Using _ prefix to indicate intentionally unused setters for now
  const [bio] = useState("");
  const [specializations] = useState<string[]>([
    "Strength Training",
    "HIIT",
    "Recovery",
  ]);

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch reviews
        const reviewsRes = await coachReviewsApi.getCoachReviews(user.userId);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }

        // Fetch average rating
        const ratingRes = await coachReviewsApi.getCoachAverageRating(user.userId);
        if (ratingRes.success && ratingRes.data) {
          setAverageRating(ratingRes.data);
        }

        // Fetch bookings to count sessions
        const bookingsRes = await bookingsApi.getCoachBookings(user.userId);
        if (bookingsRes.success && bookingsRes.data) {
          setTotalSessions(bookingsRes.data.filter(b => b.status === 2).length);
        }

        // Initialize edit form
        setEditForm({
          name: user.name || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
          gender: user.gender || 0,
          address: user.address || "",
          profileImageUrl: user.profileImageUrl || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.userId) return;

    try {
      setIsSaving(true);
      const response = await usersApi.updateProfile(user.userId, editForm);
      
      if (response.success) {
        showToast("Profile updated successfully!", "success");
        setShowEditModal(false);
      } else {
        showToast(response.message || response.errors?.[0] || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Failed to save profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "text-orange-500 fill-current" : "text-zinc-600"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 lg:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-blue-500/20">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">Pulse<span className="text-primary">Gym</span></h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-slate-100">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-10 py-8 space-y-8">
        {/* Hero Profile Section */}
        <section className="relative rounded-3xl overflow-hidden bg-zinc-900/60 border border-zinc-800/50 p-1">
          {/* Background Gradient */}
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-r from-zinc-900 to-zinc-800 opacity-80">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          </div>
          
          <div className="relative pt-24 px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-br from-orange-500 to-transparent shadow-[0_0_15px_rgba(244,133,37,0.4)]">
                  <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-5xl font-bold border-4 border-zinc-950">
                    {user?.name?.charAt(0) || "C"}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-zinc-950" />
              </div>

              {/* Info */}
              <div className="flex-1 mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-1">{user?.name}</h1>
                    <p className="text-zinc-400 text-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      Professional Fitness Coach
                    </p>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user?.address || "Location not set"}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-zinc-900">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800">
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Sessions Led</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-zinc-800 md:pl-8">
                <div className="flex items-center gap-1 justify-center md:justify-start">
                  <Star className="h-5 w-5 text-orange-500 fill-current" />
                  <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Rating</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-zinc-800 md:pl-8">
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Reviews</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-zinc-800 md:pl-8">
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Success Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                About Me
              </h3>
              <p className="text-zinc-300 leading-relaxed">
                {bio || `I'm ${user?.name}, a dedicated fitness professional committed to helping you achieve your health and fitness goals. With a personalized approach, I focus on building sustainable habits and unlocking your full potential.`}
              </p>
            </Card>

            {/* Specializations */}
            <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                Specializations
              </h3>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-white hover:border-orange-500/50 transition-colors"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </Card>

            {/* Reviews Section */}
            <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 text-orange-500" />
                  Client Reviews ({reviews.length})
                </h3>
              </div>
              
              {reviews.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.reviewId}
                      className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-orange-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold">
                            {review.isAnonymous ? "?" : review.userName.charAt(0)}
                          </div>
                          <span className="font-bold">
                            {review.isAnonymous ? "Anonymous" : review.userName}
                          </span>
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      <p className="text-sm text-zinc-400 italic">
                        &quot;{review.reviewText || "Great session!"}&quot;
                      </p>
                      <p className="text-xs text-zinc-500 mt-2">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            {/* Availability Card */}
            <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Availability
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Monday - Friday</span>
                  <span className="text-white">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Saturday</span>
                  <span className="text-white">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Sunday</span>
                  <span className="text-zinc-500">Closed</span>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-zinc-400">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div className="text-sm">
                  <p className="text-zinc-400">Phone</p>
                  <p className="text-white">{user?.phone || "Not provided"}</p>
                </div>
              </div>
            </Card>

            {/* Performance Summary */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                This Month
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Sessions Completed</span>
                    <span className="text-white font-bold">24</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Client Satisfaction</span>
                    <span className="text-white font-bold">98%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: "98%" }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Name</label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Phone</label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Address</label>
              <Input
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Date of Birth</label>
              <Input
                type="date"
                value={editForm.dateOfBirth || ""}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CoachProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProfileContent />
    </ProtectedRoute>
  );
}
