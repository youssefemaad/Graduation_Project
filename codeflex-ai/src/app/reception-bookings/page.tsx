"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Clock,
  Dumbbell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  UserCheck,
  Scale,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { bookingsApi, type BookingDto } from "@/lib/api";

interface DisplayBooking {
  id: number;
  memberName: string;
  memberId: number;
  equipment: string;
  date: string;
  time: string;
  status: string;
  type: string;
  createdAt: string;
  avatar: string;
  tokensCost: number;
}

// Map booking status from number to string
const mapBookingStatus = (status: number): string => {
  switch (status) {
    case 0: return "Pending";
    case 1: return "Confirmed";
    case 2: return "Completed";
    case 3: return "Cancelled";
    default: return "Pending";
  }
};

function ReceptionBookingsContent() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<DisplayBooking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Use the bookingsApi to fetch all bookings
      const response = await bookingsApi.getAllBookings();

      if (response.success && response.data) {
        const mappedBookings: DisplayBooking[] = response.data.map((booking) => ({
          id: booking.bookingId,
          memberName: booking.userName || "Unknown",
          memberId: booking.userId,
          equipment: booking.coachName || booking.equipmentName || "Unknown",
          date: new Date(booking.startTime).toISOString().split('T')[0],
          time: `${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          status: mapBookingStatus(booking.status),
          type: booking.bookingType || (booking.coachId ? "Coach" : "Equipment"),
          createdAt: new Date(booking.createdAt).toISOString().split('T')[0],
          avatar: booking.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || "??",
          tokensCost: booking.tokensCost,
        }));
        setBookings(mappedBookings);
      } else {
        console.log("Failed to fetch bookings:", response.message);
        showToast(response.message || "Could not load bookings", "warning");
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      showToast("Failed to load bookings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmBooking = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.confirmBooking(bookingId);
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "Confirmed" } : b
          )
        );
        showToast("Booking confirmed successfully", "success");
      } else {
        showToast(response.message || "Failed to confirm booking", "error");
      }
    } catch {
      showToast("Failed to confirm booking", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.cancelBooking(bookingId, "Cancelled by receptionist");
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "Cancelled" } : b
          )
        );
        showToast("Booking cancelled", "success");
      } else {
        showToast(response.message || "Failed to cancel booking", "error");
      }
    } catch {
      showToast("Failed to cancel booking", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.checkIn(bookingId);
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "Confirmed" } : b
          )
        );
        showToast("Member checked in successfully", "success");
      } else {
        showToast(response.message || "Failed to check in", "error");
      }
    } catch {
      showToast("Failed to check in member", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.checkOut(bookingId);
      if (response.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "Completed" } : b
          )
        );
        showToast("Member checked out successfully", "success");
      } else {
        showToast(response.message || "Failed to check out", "error");
      }
    } catch {
      showToast("Failed to check out member", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-500/10 text-green-500";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "Cancelled":
        return "bg-red-500/10 text-red-500";
      case "Completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Equipment":
        return "bg-blue-500/10 text-blue-500";
      case "Coach":
        return "bg-purple-500/10 text-purple-500";
      case "InBody":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Equipment":
        return <Dumbbell className="h-4 w-4 text-muted-foreground" />;
      case "Coach":
        return <UserCheck className="h-4 w-4 text-muted-foreground" />;
      case "InBody":
        return <Scale className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Dumbbell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const confirmedBookings = bookings.filter(b => b.status === "Confirmed").length;
  const pendingBookings = bookings.filter(b => b.status === "Pending").length;
  const cancelledBookings = bookings.filter(b => b.status === "Cancelled").length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Bookings Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all equipment, coach, and InBody bookings
          </p>
        </div>
        <Button className="gap-2" onClick={fetchBookings} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{bookings.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-500">{confirmedBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Confirmed</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-500">{pendingBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">{cancelledBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Cancelled</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings by member or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === "Pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("Pending")}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "Confirmed" ? "default" : "outline"}
            onClick={() => setFilterStatus("Confirmed")}
            size="sm"
          >
            Confirmed
          </Button>
          <Button
            variant={filterStatus === "Completed" ? "default" : "outline"}
            onClick={() => setFilterStatus("Completed")}
            size="sm"
          >
            Completed
          </Button>
          <Button
            variant={filterStatus === "Cancelled" ? "default" : "outline"}
            onClick={() => setFilterStatus("Cancelled")}
            size="sm"
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Service</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Time</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Tokens</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-sm">#{booking.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                        {booking.avatar}
                      </div>
                      <span className="font-semibold">{booking.memberName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(booking.type)}
                      <span className="text-sm">{booking.equipment}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(booking.type)}`}>
                      {booking.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {booking.time}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium">
                    {booking.tokensCost} tokens
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.status === "Pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-500"
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-500"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isProcessing}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === "Confirmed" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-blue-500"
                          onClick={() => handleCheckOut(booking.id)}
                          disabled={isProcessing}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            {bookings.length === 0 
              ? "No bookings have been made yet" 
              : "Try adjusting your search or filter"}
          </p>
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View complete booking information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Booking ID</label>
                  <p className="font-semibold">#{selectedBooking.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member</label>
                  <p className="font-semibold">{selectedBooking.memberName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member ID</label>
                  <p className="font-semibold">#{selectedBooking.memberId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Service</label>
                  <p className="font-semibold">{selectedBooking.equipment}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Type</label>
                  <p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedBooking.type)}`}>
                      {selectedBooking.type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Date</label>
                  <p className="font-semibold">{new Date(selectedBooking.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Time</label>
                  <p className="font-semibold">{selectedBooking.time}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tokens Cost</label>
                  <p className="font-semibold">{selectedBooking.tokensCost} tokens</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Created</label>
                  <p className="font-semibold">{new Date(selectedBooking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedBooking?.status === "Pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-500"
                  onClick={() => {
                    handleCancelBooking(selectedBooking.id);
                    setShowDetailsDialog(false);
                  }}
                  disabled={isProcessing}
                >
                  Cancel Booking
                </Button>
                <Button 
                  onClick={() => {
                    handleConfirmBooking(selectedBooking.id);
                    setShowDetailsDialog(false);
                  }}
                  disabled={isProcessing}
                >
                  Confirm Booking
                </Button>
              </>
            )}
            {selectedBooking?.status === "Confirmed" && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => handleCheckIn(selectedBooking.id)}
                  disabled={isProcessing}
                >
                  Check In
                </Button>
                <Button 
                  onClick={() => {
                    handleCheckOut(selectedBooking.id);
                    setShowDetailsDialog(false);
                  }}
                  disabled={isProcessing}
                >
                  Complete & Check Out
                </Button>
              </>
            )}
            {(selectedBooking?.status === "Completed" || selectedBooking?.status === "Cancelled") && (
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReceptionBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionBookingsContent />
    </ProtectedRoute>
  );
}
