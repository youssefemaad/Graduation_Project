"use client";

import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Dumbbell,
  UserCog,
  Ticket,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";

function AdminDashboardContent() {
  const { user } = useAuth();

  // Mock data for admin
  const mockStats = {
    totalMembers: 342,
    monthlyRevenue: 45680,
    activeCoaches: 12,
    equipmentCount: 156,
    todayCheckIns: 87,
    tokensSold: 12450,
    pendingIssues: 5,
    systemUptime: 99.8,
  };

  const revenueData = [
    { month: "Jan", revenue: 38200, members: 298 },
    { month: "Feb", revenue: 42100, members: 315 },
    { month: "Mar", revenue: 45680, members: 342 },
  ];

  const systemAlerts = [
    { id: 1, type: "maintenance", message: "Treadmill 5 requires maintenance", severity: "warning", time: "2 hours ago" },
    { id: 2, type: "payment", message: "Payment gateway experiencing delays", severity: "critical", time: "4 hours ago" },
    { id: 3, type: "booking", message: "High booking volume for tomorrow", severity: "info", time: "6 hours ago" },
  ];

  const topCoaches = [
    { id: 1, name: "Sarah Johnson", clients: 24, rating: 4.9, revenue: 4500 },
    { id: 2, name: "Mike Williams", clients: 21, rating: 4.8, revenue: 4200 },
    { id: 3, name: "Emily Davis", clients: 19, rating: 4.7, revenue: 3800 },
  ];

  const recentActivities = [
    { id: 1, type: "member", text: "New member registered: Ahmed Hassan", time: "10 min ago", icon: Users, color: "text-blue-500" },
    { id: 2, type: "revenue", text: "Premium subscription purchased by Sara Mohamed", time: "25 min ago", icon: DollarSign, color: "text-green-500" },
    { id: 3, type: "equipment", text: "Equipment maintenance completed: Bench Press 3", time: "1 hour ago", icon: Dumbbell, color: "text-purple-500" },
    { id: 4, type: "coach", text: "Coach approved: Omar Ali", time: "2 hours ago", icon: UserCog, color: "text-orange-500" },
  ];

  const quickActions = [
    { icon: UserCog, label: "Manage Staff", color: "text-purple-500", bgColor: "bg-purple-100", href: "/admin-coaches" },
    { icon: UserPlus, label: "Create Staff", color: "text-emerald-500", bgColor: "bg-emerald-100", href: "/admin-users" },
    { icon: Dumbbell, label: "Equipment Management", color: "text-green-500", bgColor: "bg-green-100", href: "/admin-equipment" },
    { icon: BarChart3, label: "Analytics & Reports", color: "text-orange-500", bgColor: "bg-orange-100", href: "/admin-analytics" },
    { icon: Ticket, label: "Packages", color: "text-red-500", bgColor: "bg-red-100", href: "/admin-packages" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span> • System Administrator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg border border-green-400">
            <div className="text-white">
              <div className="text-xs font-medium opacity-90">System Uptime</div>
              <div className="text-2xl font-bold">{mockStats.systemUptime}%</div>
            </div>
          </div>
          {mockStats.pendingIssues > 0 && (
            <div className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg border border-red-400">
              <div className="text-white">
                <div className="text-xs font-medium opacity-90">Pending Issues</div>
                <div className="text-2xl font-bold">{mockStats.pendingIssues}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.totalMembers}</div>
          <div className="text-sm text-blue-700 font-medium">Total Members</div>
          <div className="text-xs text-blue-600 mt-1">+15 this month</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">${mockStats.monthlyRevenue.toLocaleString()}</div>
          <div className="text-sm text-green-700 font-medium">Monthly Revenue</div>
          <div className="text-xs text-green-600 mt-1">+8.5% from last month</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-full">
              <UserCog className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.activeCoaches}</div>
          <div className="text-sm text-purple-700 font-medium">Active Coaches</div>
          <div className="text-xs text-purple-600 mt-1">All available today</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <CheckCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.equipmentCount}</div>
          <div className="text-sm text-orange-700 font-medium">Equipment Items</div>
          <div className="text-xs text-orange-600 mt-1">95% operational</div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.todayCheckIns}</div>
              <div className="text-sm text-muted-foreground">Check-ins Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.tokensSold.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Tokens Sold (Month)</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{mockStats.pendingIssues}</div>
              <div className="text-sm text-muted-foreground">Pending Issues</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-border">
        <h3 className="text-xl font-bold mb-5">Quick Actions</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <div className={`p-4 ${action.bgColor} rounded-full`}>
                    <Icon className={`h-7 w-7 ${action.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-center">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              System Alerts
            </h3>
            {mockStats.pendingIssues > 0 && (
              <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                {mockStats.pendingIssues} Active
              </span>
            )}
          </div>

          <div className="space-y-4">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-500 dark:bg-red-950"
                    : alert.severity === "warning"
                    ? "bg-orange-50 border-orange-500 dark:bg-orange-950"
                    : "bg-blue-50 border-blue-500 dark:bg-blue-950"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          alert.severity === "critical"
                            ? "bg-red-200 text-red-800"
                            : alert.severity === "warning"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    
                  </div>
                  <Button size="sm" variant="outline" className="ml-3">
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Alerts
          </Button>
        </Card>

        {/* Top Coaches */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6 text-purple-500" />
              Top Performing Coaches
            </h3>
            <Link href="/admin-coaches">
              <Button size="sm" variant="outline">View All</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {topCoaches.map((coach, index) => (
              <div
                key={coach.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full font-bold text-primary">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{coach.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{coach.clients} clients</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ⭐ {coach.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">${coach.revenue}</div>
                  <div className="text-xs text-muted-foreground">this month</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Recent System Activities
          </h3>
          <Link href="/admin-activity-log">
            <Button size="sm" variant="outline">View Full Log</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 ${activity.color.replace('text-', 'bg-').replace('500', '100')} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue Chart Placeholder */}
      <Card className="p-6 border border-border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-green-500" />
          Revenue Overview (Last 3 Months)
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {revenueData.map((data) => (
            <div key={data.month} className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-muted-foreground mb-2">{data.month}</div>
              <div className="text-3xl font-bold text-green-600 mb-1">${(data.revenue / 1000).toFixed(1)}k</div>
              <div className="text-xs text-muted-foreground">{data.members} members</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
