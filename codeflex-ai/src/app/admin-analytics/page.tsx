"use client";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function AdminAnalyticsContent() {
  const stats = [
    {
      label: "Total Revenue",
      value: "$156,450",
      change: "+12.5%",
      trend: "up",
      color: "text-green-500",
      bgColor: "bg-green-100",
      icon: DollarSign,
    },
    {
      label: "Active Members",
      value: "342",
      change: "+8.2%",
      trend: "up",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      icon: Users,
    },
    {
      label: "Monthly Sessions",
      value: "1,248",
      change: "+15.3%",
      trend: "up",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      icon: Calendar,
    },
    {
      label: "Retention Rate",
      value: "94.2%",
      change: "-1.2%",
      trend: "down",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      icon: Target,
    },
  ];

  const revenueByMonth = [
    { month: "Jun", revenue: 12500 },
    { month: "Jul", revenue: 13800 },
    { month: "Aug", revenue: 15200 },
    { month: "Sep", revenue: 14100 },
    { month: "Oct", revenue: 16300 },
    { month: "Nov", revenue: 18450 },
  ];

  const membershipDistribution = [
    { type: "VIP", count: 45, percentage: 13, color: "bg-purple-500" },
    { type: "Premium", count: 142, percentage: 42, color: "bg-blue-500" },
    { type: "Basic", count: 155, percentage: 45, color: "bg-gray-500" },
  ];

  const topPerformers = [
    { name: "Coach Ahmed", metric: "48 Sessions", rating: 4.8, specialty: "Strength" },
    { name: "Coach Sara", metric: "56 Sessions", rating: 4.9, specialty: "Yoga" },
    { name: "Coach Fatma", metric: "42 Sessions", rating: 4.9, specialty: "Nutrition" },
  ];

  const peakHours = [
    { time: "6-8 AM", usage: 85, color: "bg-blue-500" },
    { time: "8-10 AM", usage: 65, color: "bg-blue-400" },
    { time: "10-12 PM", usage: 40, color: "bg-blue-300" },
    { time: "12-2 PM", usage: 35, color: "bg-blue-200" },
    { time: "2-4 PM", usage: 45, color: "bg-blue-300" },
    { time: "4-6 PM", usage: 75, color: "bg-blue-400" },
    { time: "6-8 PM", usage: 95, color: "bg-blue-500" },
    { time: "8-10 PM", usage: 70, color: "bg-blue-400" },
  ];

  const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-orange-500" />
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-500" />
              Revenue Trend
            </h3>
            <span className="text-sm text-muted-foreground">Last 6 Months</span>
          </div>
          <div className="space-y-4">
            {revenueByMonth.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{item.month}</span>
                  <span className="text-sm font-bold text-green-600">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Membership Distribution */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              Membership Distribution
            </h3>
            <span className="text-sm text-muted-foreground">342 Total</span>
          </div>
          <div className="space-y-6">
            {membershipDistribution.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{item.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} members ({item.percentage}%)
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Top Performing Coaches
            </h3>
          </div>
          <div className="space-y-4">
            {topPerformers.map((coach, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{coach.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{coach.specialty}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {coach.metric}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-lg">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">{coach.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Peak Hours */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-500" />
              Peak Usage Hours
            </h3>
            <span className="text-sm text-muted-foreground">Daily Average</span>
          </div>
          <div className="space-y-3">
            {peakHours.map((hour) => (
              <div key={hour.time}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{hour.time}</span>
                  <span className="text-sm font-bold text-purple-600">{hour.usage}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${hour.color} rounded-full transition-all duration-500`}
                    style={{ width: `${hour.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminAnalyticsContent />
    </ProtectedRoute>
  );
}
