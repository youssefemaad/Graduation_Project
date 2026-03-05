"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus,
  X,
  Eye,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ReceptionNotificationsContent() {
  const [filter, setFilter] = useState("all");

  // Mock notification data
  const notifications = [
    {
      id: 1,
      type: "membership_expiring",
      icon: AlertCircle,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-500/10",
      title: "Membership Expiring Soon",
      message: "Ahmed Hassan's Premium membership expires in 3 days",
      time: "5 minutes ago",
      read: false,
      priority: "high",
    },
    {
      id: 2,
      type: "payment_received",
      icon: CreditCard,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      title: "Payment Received",
      message: "Sara Mohamed paid $800 for Standard membership renewal",
      time: "15 minutes ago",
      read: false,
      priority: "normal",
    },
    {
      id: 3,
      type: "new_booking",
      icon: Calendar,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      title: "New Booking Request",
      message: "Omar Ali requested to book Treadmill 3 for tomorrow at 10:00 AM",
      time: "30 minutes ago",
      read: false,
      priority: "normal",
    },
    {
      id: 4,
      type: "membership_expired",
      icon: AlertCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      title: "Membership Expired",
      message: "Fatma Ibrahim's Basic membership has expired",
      time: "1 hour ago",
      read: true,
      priority: "high",
    },
    {
      id: 5,
      type: "new_member",
      icon: UserPlus,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      title: "New Member Registration",
      message: "Karim Youssef completed registration for Premium membership",
      time: "2 hours ago",
      read: true,
      priority: "normal",
    },
    {
      id: 6,
      type: "checkin",
      icon: CheckCircle,
      iconColor: "text-cyan-500",
      iconBg: "bg-cyan-500/10",
      title: "Member Check-In",
      message: "Nour Ahmed checked in at the gym",
      time: "3 hours ago",
      read: true,
      priority: "low",
    },
    {
      id: 7,
      type: "payment_pending",
      icon: Clock,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-500/10",
      title: "Payment Pending",
      message: "Hassan Ali has a pending payment of $300 for Personal Training",
      time: "4 hours ago",
      read: true,
      priority: "high",
    },
    {
      id: 8,
      type: "booking_cancelled",
      icon: X,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      title: "Booking Cancelled",
      message: "Layla Hassan cancelled her booking for Coach Session",
      time: "5 hours ago",
      read: true,
      priority: "normal",
    },
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    if (filter === "high") return notif.priority === "high";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const highPriorityCount = notifications.filter((n) => n.priority === "high").length;

  const markAsRead = (id: number) => {
    // Logic to mark notification as read
    console.log(`Marking notification ${id} as read`);
  };

  const deleteNotification = (id: number) => {
    // Logic to delete notification
    console.log(`Deleting notification ${id}`);
  };

  const markAllAsRead = () => {
    // Logic to mark all as read
    console.log("Marking all notifications as read");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Notifications</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important alerts and activities
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>
          Mark All as Read
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{notifications.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Notifications</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Bell className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-500">{unreadCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Unread</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Eye className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">{highPriorityCount}</div>
              <div className="text-sm text-muted-foreground mt-1">High Priority</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "high" ? "default" : "outline"}
          onClick={() => setFilter("high")}
        >
          High Priority ({highPriorityCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card
              key={notification.id}
              className={`p-6 border transition-all hover:shadow-md ${
                notification.read
                  ? "border-border bg-card/30"
                  : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-full ${notification.iconBg} flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${notification.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                      <p className="text-muted-foreground">{notification.message}</p>
                    </div>
                    {notification.priority === "high" && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 whitespace-nowrap">
                        High Priority
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{notification.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card className="p-12 border border-border bg-card/50 backdrop-blur-sm">
          <div className="text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "You've read all your notifications"
                : filter === "high"
                ? "No high priority notifications"
                : "You don't have any notifications yet"}
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Users className="h-6 w-6" />
            <span className="text-sm">View Members</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Manage Bookings</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <CreditCard className="h-6 w-6" />
            <span className="text-sm">Process Payment</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm">View Reports</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function ReceptionNotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionNotificationsContent />
    </ProtectedRoute>
  );
}
