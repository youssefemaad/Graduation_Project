"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Camera,
  Flame,
  Calendar,
  AlertTriangle,
  X,
  Dumbbell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { receptionApi, CheckInDto, MemberSearchDto, LiveActivityDto, AlertDto, ReceptionStatsDto } from "@/lib/api/reception";
import { useToast } from "@/components/ui/toast";

function ReceptionCheckInContent() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CheckInDto | null>(null);
  const [searchResults, setSearchResults] = useState<MemberSearchDto[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivityDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [stats, setStats] = useState<ReceptionStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    loadLiveActivities();
    loadAlerts();
    loadStats();
    const interval = setInterval(() => {
      loadLiveActivities();
      loadStats();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadLiveActivities = async () => {
    try {
      const response = await receptionApi.getLiveActivities(20);
      if (response.success && response.data) {
        setLiveActivities(response.data);
      }
    } catch (error) {
      console.error("Failed to load live activities:", error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await receptionApi.getAlerts();
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await receptionApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await receptionApi.searchMembers(query);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await receptionApi.getMemberForCheckIn(userId);
      if (response.success && response.data) {
        setSelectedMember(response.data);
        setSearchResults([]);
        setSearchQuery("");
      }
    } catch (error) {
      showToast("Failed to load member details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedMember) return;

    try {
      const response = await receptionApi.checkInMember({
        userId: selectedMember.userId,
        accessArea: "General Access",
      });

  const handleCheckIn = async () => {
    if (!selectedMember) return;

    try {
      const response = await receptionApi.checkInMember({
        userId: selectedMember.userId,
        accessArea: "General Access",
      });

      if (response.success) {
        showToast(`${selectedMember.name} checked in successfully`, "success");
        setSelectedMember(null);
        loadLiveActivities();
        loadStats();
      }
    } catch (error) {
      showToast("Failed to check in member", "error");
    }
  };

  const handleCancel = () => {
    setSelectedMember(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleQRScan = async (qrCode: string) => {
    setIsLoading(true);
    try {
      const response = await receptionApi.getMemberByQRCode(qrCode);
      if (response.success && response.data) {
        setSelectedMember(response.data);
        setIsScanning(false);
      }
    } catch (error) {
      showToast("Invalid QR code or member not found", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "checkin":
        return "👋";
      case "checkout":
        return "👋";
      case "payment":
        return "💳";
      default:
        return "📋";
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const capacityPercentage = stats
    ? Math.round(((stats.todayCheckIns / stats.activeMembers) * 100) || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PulseGym</h1>
                <p className="text-xs text-gray-500">STAFF PORTAL</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity</p>
              <p className="text-2xl font-bold text-blue-600">{capacityPercentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Checked In</p>
              <p className="text-2xl font-bold text-green-600">{stats?.todayCheckIns || 0}</p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate()}</p>
              <p className="text-xs text-gray-500">Alex M. - Front Desk</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Check-In Station */}
          <div className="lg:col-span-2 space-y-6">
            {/* Check-In Card */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check-In Station
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Ready to scan. Please position member QR code.
              </p>

              {/* QR Scanner / Member Display */}
              {!selectedMember ? (
                <div className="relative mb-6">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    {isScanning ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-4 border-green-500 rounded-lg w-64 h-64 animate-pulse" />
                        <div className="absolute bottom-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          Camera Active
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          onClick={() => setIsScanning(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Activate Scanner
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedMember.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedMember.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Member {selectedMember.memberNumber}
                        </p>
                        {selectedMember.subscriptionPlan && (
                          <Badge className="mt-1 bg-blue-600 text-white">
                            {selectedMember.subscriptionPlan}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Last Visit</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {selectedMember.lastVisit
                          ? new Date(selectedMember.lastVisit).toLocaleDateString()
                          : "First time"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Streak</p>
                      <p className="text-sm font-semibold flex items-center gap-2 mt-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className={selectedMember.hasActiveStreak ? "text-orange-600" : "text-gray-400"}>
                          {selectedMember.currentStreak} Days
                        </span>
                        {selectedMember.hasActiveStreak && (
                          <Badge className="bg-green-600 text-white text-xs">ACTIVE</Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedMember.todaySession && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Dumbbell className="h-4 w-4" />
                        <p className="text-sm font-semibold">PT Session Today</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        With Trainer {selectedMember.todaySession.coachName} at{" "}
                        {new Date(selectedMember.todaySession.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleCheckIn}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                    >
                      Confirm Check-In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="px-8 h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              )}

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by Name, Member ID, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                  disabled={!!selectedMember}
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {searchResults.map((member) => (
                    <div
                      key={member.userId}
                      onClick={() => handleSelectMember(member.userId)}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500">{member.memberNumber}</p>
                        </div>
                        {member.subscriptionPlan && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {member.subscriptionPlan}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            {alerts.length > 0 && (
              <Card className="p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Alerts</h3>
                  </div>
                  <Badge className="bg-red-600 text-white">{alerts.length} New</Badge>
                </div>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.alertId}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                        {alert.title}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {alert.description}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Live Feed */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Live Feed</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  VIEW ALL
                </button>
              </div>
              <div className="space-y-4">
                {liveActivities.slice(0, 5).map((activity) => (
                  <div key={activity.activityId} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {activity.userName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceptionCheckInPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionCheckInContent />
    </ProtectedRoute>
  );
}
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "Premium":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "Standard":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "Basic":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gradient-to-r from-primary to-primary/50";
    }
  };

  const handleCheckIn = () => {
    // Placeholder for check-in logic
    alert("Check-in functionality would be implemented here");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Member Check-In</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage member check-ins and check-outs
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Activity className="h-5 w-5 text-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">{currentlyCheckedIn}</div>
            <div className="text-xs opacity-90">Currently Inside</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{totalToday}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Today</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-500">{currentlyCheckedIn}</div>
              <div className="text-sm text-muted-foreground mt-1">Checked In</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-500">{checkedOut}</div>
              <div className="text-sm text-muted-foreground mt-1">Checked Out</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-500">2h 15m</div>
              <div className="text-sm text-muted-foreground mt-1">Avg Duration</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Check-In */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Quick Check-In/Out</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan card or enter member ID..."
                className="pl-10 text-lg h-12"
              />
            </div>
          </div>
          <Button className="gap-2 h-12 px-8" onClick={handleCheckIn}>
            <UserCheck className="h-5 w-5" />
            Check In
          </Button>
          <Button variant="outline" className="gap-2 h-12 px-8">
            <CheckCircle className="h-5 w-5" />
            Check Out
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={checkInType === "checkin" ? "default" : "outline"}
            onClick={() => setCheckInType("checkin")}
            size="sm"
          >
            Checked In
          </Button>
          <Button
            variant={checkInType === "checkout" ? "default" : "outline"}
            onClick={() => setCheckInType("checkout")}
            size="sm"
          >
            Checked Out
          </Button>
        </div>
      </div>

      {/* Today's Activity */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Today's Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Member ID</th>
                <th className="text-left p-4 font-semibold">Membership</th>
                <th className="text-left p-4 font-semibold">Check-In Time</th>
                <th className="text-left p-4 font-semibold">Duration</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheckIns.map((checkIn) => (
                <tr key={checkIn.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getMembershipColor(checkIn.membershipType)} flex items-center justify-center text-white font-bold text-sm`}>
                        {checkIn.avatar}
                      </div>
                      <span className="font-semibold">{checkIn.memberName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm">{checkIn.memberId}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getMembershipColor(checkIn.membershipType)}`}>
                      {checkIn.membershipType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {checkIn.checkInTime}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold">{checkIn.duration}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(checkIn.status)}`}>
                      {checkIn.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {checkIn.status === "Checked In" ? (
                        <Button size="sm" variant="outline" className="text-blue-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-green-500">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Check In Again
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
      {filteredCheckIns.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No check-ins found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function ReceptionCheckInPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionCheckInContent />
    </ProtectedRoute>
  );
}
