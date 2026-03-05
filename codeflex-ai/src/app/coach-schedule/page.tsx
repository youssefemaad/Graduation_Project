"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function CoachScheduleContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data for schedule
  const sessions = [
    {
      id: 1,
      clientName: "Ahmed Hassan",
      type: "Personal Training",
      date: "2025-11-29",
      time: "10:00 AM",
      duration: "60 min",
      location: "Gym Floor",
      status: "Confirmed",
      avatar: "AH",
    },
    {
      id: 2,
      clientName: "Sara Mohamed",
      type: "Nutrition Consultation",
      date: "2025-11-29",
      time: "11:30 AM",
      duration: "45 min",
      location: "Office",
      status: "Confirmed",
      avatar: "SM",
    },
    {
      id: 3,
      clientName: "Omar Ali",
      type: "Form Check",
      date: "2025-11-29",
      time: "2:00 PM",
      duration: "30 min",
      location: "Gym Floor",
      status: "Pending",
      avatar: "OA",
    },
    {
      id: 4,
      clientName: "Fatma Ibrahim",
      type: "Personal Training",
      date: "2025-11-30",
      time: "9:00 AM",
      duration: "60 min",
      location: "Gym Floor",
      status: "Confirmed",
      avatar: "FI",
    },
    {
      id: 5,
      clientName: "Karim Youssef",
      type: "Online Coaching",
      date: "2025-11-30",
      time: "3:00 PM",
      duration: "45 min",
      location: "Virtual",
      status: "Confirmed",
      avatar: "KY",
    },
    {
      id: 6,
      clientName: "Nour Ahmed",
      type: "Group Training",
      date: "2025-12-01",
      time: "10:00 AM",
      duration: "90 min",
      location: "Studio",
      status: "Confirmed",
      avatar: "NA",
    },
  ];

  const todaySessions = sessions.filter(
    (session) => session.date === selectedDate.toISOString().split("T")[0]
  );

  const upcomingSessions = sessions.filter(
    (session) => new Date(session.date) > selectedDate
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-500/10 text-green-500";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "Cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes("Online") || type.includes("Virtual")) {
      return <Video className="h-4 w-4" />;
    } else if (type.includes("Group")) {
      return <Users className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Schedule</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your coaching sessions and appointments
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{todaySessions.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Today's Sessions</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{upcomingSessions.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Upcoming Sessions</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {sessions.filter(s => s.status === "Confirmed").length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Confirmed</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dateString = date.toISOString().split("T")[0];
                const hasSessions = sessions.some(s => s.date === dateString);
                const isSelected = dateString === selectedDate.toISOString().split("T")[0];
                const isToday = dateString === new Date().toISOString().split("T")[0];

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                      ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                      ${isToday && !isSelected ? "border-2 border-primary" : ""}
                    `}
                  >
                    {day}
                    {hasSessions && (
                      <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">
            {selectedDate.toDateString() === new Date().toDateString()
              ? "Today's Schedule"
              : selectedDate.toLocaleDateString()}
          </h2>
          <div className="space-y-3">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions scheduled</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xs font-bold">
                        {session.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{session.clientName}</div>
                        <div className="text-xs text-muted-foreground">{session.type}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{session.time} ({session.duration})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getTypeIcon(session.type)}
                    <span>{session.location}</span>
                  </div>

                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* All Upcoming Sessions */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                  {session.avatar}
                </div>
                <div>
                  <div className="font-semibold">{session.clientName}</div>
                  <div className="text-sm text-muted-foreground">{session.type}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{session.time}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {getTypeIcon(session.type)}
                  <span>{session.location}</span>
                </div>

                <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function CoachSchedulePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachScheduleContent />
    </ProtectedRoute>
  );
}
