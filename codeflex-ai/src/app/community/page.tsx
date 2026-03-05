"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { activityFeedApi, type ActivityFeedDto } from "@/lib/api";
import {
    MessageSquare,
    Heart,
    Share2,
    Search,
    Filter,
    MoreHorizontal,
    Loader2,
    Calendar,
    Dumbbell,
    Trophy,
    Activity
} from "lucide-react";

function CommunityContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activities, setActivities] = useState<ActivityFeedDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await activityFeedApi.getRecentActivities(50);
                if (response.success && response.data) {
                    setActivities(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch activities:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, []);

    // Filter activities by search query
    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get icon based on activity type
    const getActivityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'booking':
            case 'session':
                return <Calendar className="h-4 w-4" />;
            case 'workout':
            case 'exercise':
                return <Dumbbell className="h-4 w-4" />;
            case 'achievement':
            case 'milestone':
                return <Trophy className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    // Format time ago
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen relative p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Community Feed</h1>
                        <p className="text-slate-500 mt-1">See what other members are up to.</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search activities..."
                            className="pl-10 bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filteredActivities.length === 0 ? (
                    /* Empty State */
                    <Card className="p-12 text-center border-slate-200 shadow-sm">
                        <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Activities Yet</h3>
                        <p className="text-slate-500">
                            {searchQuery
                                ? "No activities match your search."
                                : "Be the first to complete a workout or book a session!"}
                        </p>
                    </Card>
                ) : (
                    /* Feed */
                    <div className="space-y-4">
                        {filteredActivities.map((activity) => (
                            <Card key={activity.activityId} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <Avatar className="h-10 w-10 border-2 border-white shadow">
                                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                                            {activity.userName?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">{activity.userName || "Member"}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">{getTimeAgo(activity.createdAt)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                {getActivityIcon(activity.activityType)}
                                                {activity.activityType}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-slate-900 mb-1">{activity.title}</h4>
                                        {activity.description && (
                                            <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-6 pt-4 mt-4 border-t border-slate-100">
                                    <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors">
                                        <Heart className="h-4 w-4" />
                                        <span className="text-xs font-medium">Like</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-xs font-medium">Comment</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors ml-auto">
                                        <Share2 className="h-4 w-4" />
                                        <span className="text-xs font-medium">Share</span>
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function CommunityPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Receptionist, UserRole.Admin]}>
            <CommunityContent />
        </ProtectedRoute>
    );
}
