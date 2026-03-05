"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  RefreshCw,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  User,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  Activity,
  FileText,
  Dumbbell,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { receptionApi, MemberDetailsDto } from "@/lib/api/reception";

function MemberDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetailsDto | null>(null);
  const [timeInside, setTimeInside] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemberDetails();
  }, [params.id]);

  const loadMemberDetails = async () => {
    setIsLoading(true);
    try {
      const response = await receptionApi.getMemberDetails(Number(params.id));
      if (response.success && response.data) {
        setMember(response.data);
      }
    } catch (error) {
      console.error("Failed to load member details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Live timer for current session
  useEffect(() => {
    if (!member?.isCurrentlyInside || !member.checkInTime) return;

    const updateTimer = () => {
      const checkIn = new Date(member.checkInTime!);
      const now = new Date();
      const diff = now.getTime() - checkIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeInside(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [member]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-muted-foreground">Member not found</div>
        <Button onClick={() => router.push("/reception/members")}>
          Back to Members
        </Button>
      </div>
    );
  }

  const handleCheckInOut = () => {
    // TODO: Implement check-in/out logic
    console.log(member.isCurrentlyInside ? "Check out" : "Check in");
  };

  const handleRenew = () => {
    // TODO: Navigate to renewal page
    router.push(`/reception/renew-membership/${member.userId}`);
  };

  const handleNewPayment = () => {
    // TODO: Navigate to payment page
    router.push(`/reception/payments?memberId=${member.userId}`);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    member.notes.unshift(newNote);
    setNewNote("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Expiring":
        return "bg-yellow-500";
      case "Expired":
        return "bg-red-500";
      case "Frozen":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "check-in":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "check-out":
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "renewal":
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Member Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Profile Photo */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>

              {/* Name & Details */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {member.name}
                  </h1>
                  <Badge
                    className={`${getStatusColor(
                      member.status
                    )} text-white border-0`}
                  >
                    {member.status}
                  </Badge>
                  {member.isCurrentlyInside && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                      <Activity className="h-3 w-3 mr-1" />
                      Inside Gym
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">
                  Member ID: {member.memberNumber}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button onClick={handleRenew} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew
              </Button>
              <Button onClick={handleNewPayment} variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Alerts Section */}
        {member.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {member.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  alert.type === "danger"
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : alert.type === "warning"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    alert.type === "danger"
                      ? "text-red-600"
                      : alert.type === "warning"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                />
                <p
                  className={`font-medium ${
                    alert.type === "danger"
                      ? "text-red-900 dark:text-red-200"
                      : alert.type === "warning"
                      ? "text-yellow-900 dark:text-yellow-200"
                      : "text-blue-900 dark:text-blue-200"
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Session / Last Visit */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              {member.isCurrentlyInside ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Current Session
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Check-In Time
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        {new Date(member.checkInTime!).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Time Inside
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Flame className="h-5 w-5" />
                        {timeInside}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Last Visit
                  </h2>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Last Checked In
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      {new Date(member.lastVisit!).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Member Information */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Member Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <User className="h-4 w-4 inline mr-2" />
                    Gender
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.gender}
                  </p>
                </div>
                {member.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Date of Birth
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(member.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Membership Details */}
            {member.membership && (
              <Card className="p-6 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Membership Details
                  </h2>
                  <Badge
                    className={`${getStatusColor(
                      member.membership.status
                    )} text-white border-0`}
                  >
                    {member.membership.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Current Plan
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {member.membership.planName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Start Date
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(member.membership.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        End Date
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(member.membership.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Days Remaining
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          member.membership.daysRemaining <= 7
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {Math.max(0, Math.floor(member.membership.daysRemaining))}
                      </p>
                    </div>
                    {typeof member.membership.visitsLeft !== 'undefined' && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Visits Left
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {member.membership.visitsLeft}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Activity Timeline
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {member.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Payments Summary */}
            {member.payments && (
              <Card className="p-6 bg-white dark:bg-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payments Summary
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Last Payment
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${member.payments.lastAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(
                        member.payments.lastPaymentDate
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Payment Method
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {member.payments.paymentMethod}
                    </p>
                  </div>

                  {member.payments.outstandingBalance > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Outstanding Balance
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        ${member.payments.outstandingBalance.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/reception/payments?memberId=${member.userId}`
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Payment History
                  </Button>
                </div>
              </Card>
            )}
            {/* Reception Notes */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Reception Notes
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {member.notes.length > 0 ? (
                  member.notes.map((note, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {note}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No notes yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1"
                />
                <Button onClick={handleAddNote} size="sm">
                  Add
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist, UserRole.Admin]}>
      <MemberDetailsContent />
    </ProtectedRoute>
  );
}
