"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { bookingsApi, type BookingDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ChatDialog } from "@/components/Chat/ChatDialog";

function CoachDashboardContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [chatMemberId, setChatMemberId] = useState<number | null>(null);
  const [chatMemberName, setChatMemberName] = useState<string>("");

  // Fetch coach bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.userId) return;
      
      try {
        setIsLoadingBookings(true);
        const response = await bookingsApi.getCoachBookings(user.userId);
        
        if (response.success && response.data) {
          setBookings(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch coach bookings:', error);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    
    fetchBookings();
  }, [user?.userId]);

  // Calculate stats from real bookings
  const today = new Date();
  const todaysBookings = bookings.filter(b => {
    const bookingDate = new Date(b.startTime);
    return bookingDate.toDateString() === today.toDateString();
  });

  const confirmedBookings = bookings.filter(b => b.status === 1 || b.statusText?.toLowerCase() === 'confirmed');
  const totalEarnings = confirmedBookings.reduce((sum, b) => sum + b.tokensCost, 0);
  
  const stats = {
    activeClients: new Set(bookings.map(b => b.userId)).size,
    upcomingSessions: todaysBookings.length,
    totalBookings: bookings.length,
    monthlyEarnings: totalEarnings,
    rating: 4.8,
    totalReviews: 127,
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const handleStartSession = async (booking: BookingDto) => {
    try {
      const response = await bookingsApi.checkIn(booking.bookingId);
      if (response.success) {
        showToast(`Session with ${booking.userName} started!`, "success");
        // Refresh bookings
        if (user?.userId) {
          const updated = await bookingsApi.getCoachBookings(user.userId);
          if (updated.success && updated.data) {
            setBookings(updated.data);
          }
        }
      } else {
        showToast("Failed to start session", "error");
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      showToast("Failed to start session", "error");
    }
  };

  const handleCompleteSession = async (booking: BookingDto) => {
    try {
      const response = await bookingsApi.checkOut(booking.bookingId);
      if (response.success) {
        showToast(`Session with ${booking.userName} completed!`, "success");
        // Refresh bookings
        if (user?.userId) {
          const updated = await bookingsApi.getCoachBookings(user.userId);
          if (updated.success && updated.data) {
            setBookings(updated.data);
          }
        }
      } else {
        showToast("Failed to complete session", "error");
      }
    } catch (error) {
      console.error('Failed to complete session:', error);
      showToast("Failed to complete session", "error");
    }
  };

  const handleCancelBooking = async (booking: BookingDto) => {
    if (!confirm(`Cancel session with ${booking.userName}?`)) return;
    
    try {
      const response = await bookingsApi.cancelBooking(booking.bookingId, 'Cancelled by coach');
      if (response.success) {
        showToast(`Session with ${booking.userName} cancelled`, "success");
        // Refresh bookings
        if (user?.userId) {
          const updated = await bookingsApi.getCoachBookings(user.userId);
          if (updated.success && updated.data) {
            setBookings(updated.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cancel session:', error);
      showToast("Failed to cancel session", "error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Coach Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Star className="h-5 w-5 text-white fill-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">{stats.rating}</div>
            <div className="text-xs opacity-90">{stats.totalReviews} reviews</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.activeClients}</div>
          <div className="text-sm text-muted-foreground">Active Clients</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalBookings}</div>
          <div className="text-sm text-muted-foreground">Total Bookings</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.upcomingSessions}</div>
          <div className="text-sm text-muted-foreground">Today's Sessions</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.monthlyEarnings} tokens</div>
          <div className="text-sm text-muted-foreground">Total Earned</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-1 gap-6">

        {/* Today's Schedule */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-500" />
              Upcoming Sessions
            </h3>
            <span className="text-sm text-muted-foreground">
              {showAllSessions ? bookings.length : Math.min(5, bookings.length)} of {bookings.length} bookings
            </span>
          </div>

          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading sessions...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming sessions</p>
              <p className="text-sm mt-1">Sessions will appear here when members book with you</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {(showAllSessions ? bookings : bookings.slice(0, 5)).map((booking) => (
                  <div
                    key={booking.bookingId}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{booking.userName}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{formatTime(booking.startTime)}</span>
                        <span>•</span>
                        <span>{booking.bookingType}</span>
                        <span>•</span>
                        <span>{formatDuration(booking.startTime, booking.endTime)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          booking.checkOutTime ? 'bg-blue-100 text-blue-700' :
                          booking.checkInTime ? 'bg-green-100 text-green-700' :
                          booking.statusText === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          booking.statusText === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          booking.statusText === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.checkOutTime ? 'Completed' :
                           booking.checkInTime ? 'In Progress' :
                           booking.statusText}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {booking.userId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setChatMemberId(booking.userId);
                            setChatMemberName(booking.userName);
                          }}
                          title="Send Message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {!booking.checkInTime && booking.statusText !== 'Cancelled' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStartSession(booking)}
                          >
                            Start Session
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancelBooking(booking)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.checkInTime && !booking.checkOutTime && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleCompleteSession(booking)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete Session
                        </Button>
                      )}
                      {booking.checkOutTime && (
                        <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </span>
                      )}
                      {booking.statusText === 'Cancelled' && (
                        <span className="text-sm text-red-600 font-medium">Cancelled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {bookings.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowAllSessions(!showAllSessions)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {showAllSessions ? 'Show Less' : `View All Sessions (${bookings.length} bookings)`}
                </Button>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/coach-clients">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <Users className="h-8 w-8 text-blue-500 mb-3" />
            <h4 className="font-semibold mb-2">Manage Clients</h4>
            <p className="text-sm text-muted-foreground">View and manage all your clients</p>
          </Card>
        </Link>

        <Link href="/coach-profile">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <User className="h-8 w-8 text-purple-500 mb-3" />
            <h4 className="font-semibold mb-2">My Profile</h4>
            <p className="text-sm text-muted-foreground">Manage your profile and availability</p>
          </Card>
        </Link>

        <Link href="/coach-programs">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <ClipboardCheck className="h-8 w-8 text-orange-500 mb-3" />
            <h4 className="font-semibold mb-2">Review Programs</h4>
            <p className="text-sm text-muted-foreground">Approve or modify AI-generated plans</p>
          </Card>
        </Link>

        <Link href="/coach-analytics">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
            <h4 className="font-semibold mb-2">View Analytics</h4>
            <p className="text-sm text-muted-foreground">Track performance and earnings</p>
          </Card>
        </Link>
      </div>

      {/* Chat Dialog */}
      {chatMemberId && chatMemberName && (
        <ChatDialog
          recipientId={chatMemberId}
          recipientName={chatMemberName}
          recipientRole="member"
          onClose={() => {
            setChatMemberId(null);
            setChatMemberName("");
          }}
        />
      )}
    </div>
  );
}

export default function CoachDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachDashboardContent />
    </ProtectedRoute>
  );
}
