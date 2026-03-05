"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { notificationsApi, type NotificationDto } from "@/lib/api";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Dumbbell,
  Calendar,
  Gift,
  MessageSquare,
  AlertCircle,
  Info,
  Trophy,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Notification type icons and colors
const notificationStyles: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  workout: { icon: <Dumbbell className="h-5 w-5" />, color: "text-blue-500", bg: "bg-blue-100" },
  session: { icon: <Calendar className="h-5 w-5" />, color: "text-green-500", bg: "bg-green-100" },
  reward: { icon: <Gift className="h-5 w-5" />, color: "text-purple-500", bg: "bg-purple-100" },
  message: { icon: <MessageSquare className="h-5 w-5" />, color: "text-cyan-500", bg: "bg-cyan-100" },
  alert: { icon: <AlertCircle className="h-5 w-5" />, color: "text-red-500", bg: "bg-red-100" },
  achievement: { icon: <Trophy className="h-5 w-5" />, color: "text-yellow-500", bg: "bg-yellow-100" },
  info: { icon: <Info className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-100" },
  default: { icon: <Bell className="h-5 w-5" />, color: "text-slate-500", bg: "bg-slate-100" },
};

function NotificationsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await notificationsApi.getUserNotifications(user.userId);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      showToast("Failed to load notifications", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationStyle = (notification: NotificationDto) => {
    const notificationType = notification.type?.toLowerCase() || "";
    if (notificationType.includes("workout")) return notificationStyles.workout;
    if (notificationType.includes("session") || notificationType.includes("booking")) return notificationStyles.session;
    if (notificationType.includes("reward") || notificationType.includes("token")) return notificationStyles.reward;
    if (notificationType.includes("message") || notificationType.includes("coach")) return notificationStyles.message;
    if (notificationType.includes("alert") || notificationType.includes("warning")) return notificationStyles.alert;
    if (notificationType.includes("achievement") || notificationType.includes("milestone")) return notificationStyles.achievement;
    if (notificationType.includes("info")) return notificationStyles.info;
    return notificationStyles.default;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch {
      showToast("Failed to mark as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.userId) return;
    setIsProcessing(true);

    try {
      const response = await notificationsApi.markAllAsRead(user.userId);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        showToast("All notifications marked as read", "success");
      }
    } catch {
      showToast("Failed to mark all as read", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    setIsProcessing(true);

    try {
      const response = await notificationsApi.deleteNotification(
        selectedNotification.notificationId
      );
      if (response.success) {
        setNotifications((prev) =>
          prev.filter((n) => n.notificationId !== selectedNotification.notificationId)
        );
        showToast("Notification deleted", "success");
        setShowDeleteDialog(false);
        setSelectedNotification(null);
      }
    } catch {
      showToast("Failed to delete notification", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">Notifications</h1>
            <p className="text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isProcessing}
              className="rounded-xl font-bold gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "unread", "read"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="rounded-lg capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center bg-white border-0 shadow-sm">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-500">
              {filter === "unread"
                ? "You've read all your notifications"
                : "You don't have any notifications yet"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const style = getNotificationStyle(notification);

              return (
                <Card
                  key={notification.notificationId}
                  className={`p-5 bg-white border-0 shadow-sm transition-all ${!notification.isRead ? "ring-2 ring-blue-100" : ""
                    }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.color}`}>
                      {style.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{notification.title}</h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {notification.type && (
                          <span className="text-xs font-semibold text-blue-600 uppercase">
                            {notification.type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          className="h-8 w-8 p-0"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
