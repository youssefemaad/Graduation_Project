"use client";

import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Star,
  Activity,
  Award,
  Clock,
  Target,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function CoachAnalyticsContent() {
  const [timeRange, setTimeRange] = useState("month");

  // Mock analytics data
  const analyticsData = {
    totalEarnings: {
      current: 4500,
      previous: 4200,
      change: 7.1,
    },
    activeClients: {
      current: 24,
      previous: 22,
      change: 9.1,
    },
    sessionsCompleted: {
      current: 85,
      previous: 78,
      change: 9.0,
    },
    averageRating: {
      current: 4.8,
      previous: 4.7,
      change: 2.1,
    },
    programsCreated: {
      current: 12,
      previous: 10,
      change: 20.0,
    },
    clientRetention: {
      current: 92,
      previous: 89,
      change: 3.4,
    },
  };

  const earningsBreakdown = [
    { month: "Jun", earnings: 3800, sessions: 65 },
    { month: "Jul", earnings: 4100, sessions: 72 },
    { month: "Aug", earnings: 3900, sessions: 68 },
    { month: "Sep", earnings: 4300, sessions: 75 },
    { month: "Oct", earnings: 4200, sessions: 78 },
    { month: "Nov", earnings: 4500, sessions: 85 },
  ];

  const topClients = [
    { name: "Ahmed Hassan", sessions: 24, revenue: 1200, rating: 5.0 },
    { name: "Sara Mohamed", sessions: 18, revenue: 900, rating: 4.9 },
    { name: "Omar Ali", sessions: 16, revenue: 800, rating: 4.8 },
    { name: "Fatma Ibrahim", sessions: 14, revenue: 700, rating: 4.7 },
    { name: "Karim Youssef", sessions: 12, revenue: 600, rating: 4.9 },
  ];

  const sessionTypes = [
    { type: "Personal Training", count: 42, percentage: 49.4, color: "bg-blue-500" },
    { type: "Nutrition Consultation", count: 25, percentage: 29.4, color: "bg-green-500" },
    { type: "Form Check", count: 12, percentage: 14.1, color: "bg-yellow-500" },
    { type: "Online Coaching", count: 6, percentage: 7.1, color: "bg-purple-500" },
  ];

  const achievements = [
    { title: "Top Coach", description: "Ranked #3 this month", icon: Award, color: "text-yellow-500" },
    { title: "High Retention", description: "92% client retention rate", icon: Target, color: "text-green-500" },
    { title: "5-Star Reviews", description: "15 five-star reviews", icon: Star, color: "text-blue-500" },
    { title: "Consistency King", description: "30-day streak", icon: Activity, color: "text-purple-500" },
  ];

  const maxEarning = Math.max(...earningsBreakdown.map(d => d.earnings));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Analytics & Performance</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your coaching performance and earnings
          </p>
        </div>
        <div className="relative">
          <Button variant="outline" className="gap-2">
            {timeRange === "week" && "This Week"}
            {timeRange === "month" && "This Month"}
            {timeRange === "year" && "This Year"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.totalEarnings.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.totalEarnings.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">${analyticsData.totalEarnings.current}</div>
              <div className="text-xs text-muted-foreground">Total Earnings</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.activeClients.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.activeClients.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData.activeClients.current}</div>
              <div className="text-xs text-muted-foreground">Active Clients</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.sessionsCompleted.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.sessionsCompleted.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData.sessionsCompleted.current}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.averageRating.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.averageRating.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData.averageRating.current}</div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.programsCreated.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.programsCreated.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData.programsCreated.current}</div>
              <div className="text-xs text-muted-foreground">Programs</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Target className="h-5 w-5 text-cyan-500" />
              </div>
              <span className={`text-xs font-semibold ${
                analyticsData.clientRetention.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                +{analyticsData.clientRetention.change}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData.clientRetention.current}%</div>
              <div className="text-xs text-muted-foreground">Retention</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <Card className="lg:col-span-2 p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Earnings Overview</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Earnings</span>
                </div>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-2">
              {earningsBreakdown.map((data, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-12">{data.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-lg transition-all flex items-center justify-end pr-2"
                          style={{ width: `${(data.earnings / maxEarning) * 100}%` }}
                        >
                          <span className="text-xs font-semibold text-white">
                            ${data.earnings}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {data.sessions} sessions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Session Types */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Session Types</h3>
          <div className="space-y-4">
            {sessionTypes.map((session, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{session.type}</span>
                  <span className="text-muted-foreground">{session.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${session.color} transition-all`}
                    style={{ width: `${session.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {session.percentage}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Top Clients
          </h3>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.sessions} sessions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-500">${client.revenue}</div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>{client.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div key={index} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <Icon className={`h-8 w-8 ${achievement.color} mb-2`} />
                  <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Stats */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Hours</span>
              </div>
              <span className="font-bold">127.5 hrs</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Growth Rate</span>
              </div>
              <span className="font-bold text-green-500">+18.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Reviews</span>
              </div>
              <span className="font-bold">127</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Export Reports</h3>
            <p className="text-sm text-muted-foreground">Download your analytics data for offline review</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Export PDF</Button>
            <Button variant="outline">Export CSV</Button>
            <Button>Generate Report</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CoachAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachAnalyticsContent />
    </ProtectedRoute>
  );
}
