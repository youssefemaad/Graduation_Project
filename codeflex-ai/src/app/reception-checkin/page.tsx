"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Camera,
  Flame,
  Calendar,
  AlertTriangle,
  X,
  Dumbbell,
  CreditCard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import {
  receptionApi,
  CheckInDto,
  MemberSearchDto,
  LiveActivityDto,
  AlertDto,
  ReceptionStatsDto,
} from "@/lib/api/reception";
import { useToast } from "@/components/ui/toast";
import { Html5Qrcode } from "html5-qrcode";

function ReceptionCheckInContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CheckInDto | null>(null);
  const [searchResults, setSearchResults] = useState<MemberSearchDto[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivityDto[]>([]);
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [stats, setStats] = useState<ReceptionStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrReaderElementId = "qr-reader";

  // Load initial data
  useEffect(() => {
    loadLiveActivities();
    loadAlerts();
    loadStats();
    loadInitialMembers(); // Load members on page load
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
    } else if (searchQuery.trim().length === 0) {
      // Reload all members when search is cleared
      loadInitialMembers();
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

  const loadInitialMembers = async () => {
    setIsLoading(true);
    try {
      // Load all members by searching with empty string or a common character
      const response = await receptionApi.searchMembers("");
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setIsLoading(false);
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
    stopScanner();
  };

  const startScanner = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext;
      if (
        !isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        showToast(
          "Camera access requires HTTPS. Please use localhost or HTTPS.",
          "error",
        );
        return;
      }

      // Request camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        // Stop the test stream immediately
        stream.getTracks().forEach((track) => track.stop());
      } catch (permError: any) {
        if (permError.name === "NotAllowedError") {
          showToast(
            "Camera permission denied. Please allow camera access in your browser settings.",
            "error",
          );
        } else if (permError.name === "NotFoundError") {
          showToast("No camera found on this device.", "error");
        } else if (permError.name === "NotReadableError") {
          showToast(
            "Camera is already in use by another application.",
            "error",
          );
        } else {
          showToast(`Camera error: ${permError.message}`, "error");
        }
        return;
      }

      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(qrReaderElementId);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const cameraId = cameras[0].id;

        await html5QrcodeRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR Code scanned successfully
            console.log("QR Code detected:", decodedText);
            handleQRScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Scanning error (can be ignored, happens continuously)
          },
        );

        setIsScanning(true);
        showToast("Camera started. Point at a QR code to scan.", "success");
      } else {
        showToast("No cameras found on this device", "error");
      }
    } catch (error: any) {
      console.error("Error starting scanner:", error);
      showToast(
        `Failed to start camera: ${error.message || "Unknown error"}`,
        "error",
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }
      setIsScanning(false);
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

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
    ? Math.round((stats.todayCheckIns / stats.activeMembers) * 100 || 0)
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PulseGym
                </h1>
                <p className="text-xs text-gray-500">STAFF PORTAL</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button
              onClick={() => router.push("/reception/payments")}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            >
              <CreditCard className="h-4 w-4" />
              Payments
            </Button>
            <Button
              onClick={() => router.push("/reception/member-details/1")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Search className="h-4 w-4" />
              Member Details
            </Button>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Capacity
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {capacityPercentage}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Checked In
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.todayCheckIns || 0}
              </p>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate()}
              </p>
              <p className="text-xs text-gray-500">
                {user?.name || "Front Desk"}
              </p>
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
                      <>
                        {/* QR Reader Container */}
                        <div id={qrReaderElementId} className="w-full h-full" />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 z-10">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          Camera Active
                        </div>
                        <Button
                          onClick={stopScanner}
                          variant="ghost"
                          size="sm"
                          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white z-10"
                        >
                          <X className="h-5 w-5 mr-2" />
                          Stop Scanner
                        </Button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          onClick={startScanner}
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
                        {selectedMember.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Last Visit
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {selectedMember.lastVisit
                          ? new Date(
                              selectedMember.lastVisit,
                            ).toLocaleDateString()
                          : "First time"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Streak
                      </p>
                      <p className="text-sm font-semibold flex items-center gap-2 mt-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span
                          className={
                            selectedMember.hasActiveStreak
                              ? "text-orange-600"
                              : "text-gray-400"
                          }
                        >
                          {selectedMember.currentStreak} Days
                        </span>
                        {selectedMember.hasActiveStreak && (
                          <Badge className="bg-green-600 text-white text-xs">
                            ACTIVE
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedMember.todaySession && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Dumbbell className="h-4 w-4" />
                        <p className="text-sm font-semibold">
                          PT Session Today
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        With Trainer {selectedMember.todaySession.coachName} at{" "}
                        {new Date(
                          selectedMember.todaySession.startTime,
                        ).toLocaleTimeString([], {
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
                          <p className="text-sm text-gray-500">
                            {member.memberNumber}
                          </p>
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
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Alerts
                    </h3>
                  </div>
                  <Badge className="bg-red-600 text-white">
                    {alerts.length} New
                  </Badge>
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
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Live Feed
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  VIEW ALL
                </button>
              </div>
              <div className="space-y-4">
                {liveActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.activityId}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {activity.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activity.userName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.timeAgo}
                      </p>
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
