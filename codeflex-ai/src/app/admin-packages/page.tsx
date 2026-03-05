"use client";

import { useState } from "react";
import {
  Ticket,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";

function AdminPackagesContent() {
  const [packages] = useState([
    {
      id: 1,
      name: "Standard Tier",
      price: 49,
      duration: "Monthly",
      members: 450,
      active: true,
      features: ["Basic Gym Analytics", "Up to 50 Members", "Email Support (24h)"],
      description: "Perfect for fitness beginners",
      tag: "CURRENT",
    },
    {
      id: 2,
      name: "Professional Tier",
      price: 99,
      duration: "Monthly",
      members: 850,
      active: true,
      features: ["Advanced ROI Insights", "Up to 250 Members", "Priority Chat Support"],
      description: "For serious fitness enthusiasts",
      popular: true,
      tag: "MOST POPULAR",
    },
    {
      id: 3,
      name: "Elite Enterprise",
      price: 199,
      duration: "Monthly",
      members: 320,
      active: true,
      features: ["Full White-label App", "Unlimited Members", "Dedicated Success Manager"],
      description: "Premium all-inclusive package",
    },
  ]);

  const [coupons] = useState([
    {
      id: 1,
      code: "SUMMER24",
      discount: "35% OFF Monthly Plans",
      usage: "142/250 used",
      status: "active",
      color: "bg-blue-100",
      icon: "🎫",
    },
    {
      id: 2,
      code: "FIRSTWEEKFREE",
      discount: "7 Days Trial Subscription",
      usage: "88/150 used",
      status: "active",
      color: "bg-green-100",
      icon: "📅",
    },
    {
      id: 3,
      code: "FOUNDER50",
      discount: "50% Lifetime Discount",
      usage: "—",
      status: "expired",
      color: "bg-gray-200 dark:bg-gray-700",
      icon: "👤",
    },
  ]);

  const stats = [
    {
      label: "Total Revenue",
      value: "$12,450",
      change: "+12.4%",
    },
    {
      label: "Active Coupons",
      value: "14",
      change: "No change this week",
    },
    {
      label: "Churn Rate",
      value: "2.4%",
      change: "-0.5%",
    },
    {
      label: "Pending Recovery",
      value: "8",
      change: "+2",
    },
  ];

  const recoveryData = [
    {
      member: "James Dalton",
      amount: 99.0,
      status: "RETRY SCHEDULED",
      action: "RETRY NOW",
      statusColor: "bg-orange-100 text-orange-700",
      actionColor: "text-orange-600",
    },
    {
      member: "Sarah Koenig",
      amount: 49.0,
      status: "PAYMENT FAILURE",
      action: "MANUAL LOG",
      statusColor: "bg-red-100 text-red-700",
      actionColor: "text-red-600",
    },
    {
      member: "Bruce Tyrell",
      amount: 199.0,
      status: "FINAL RETRY",
      action: "RETRY NOW",
      statusColor: "bg-red-100 text-red-700",
      actionColor: "text-red-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Packages & Plans Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage your gym's financial ecosystem and subscription tiers
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                {stat.label}
              </p>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Subscription Plans */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Active Subscription Plans</h2>
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">
            VIEW MORE →
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-border rounded-lg p-6 space-y-4 relative transition-all hover:border-indigo-300"
            >
              {pkg.tag && (
                <div className="absolute top-4 right-4">
                  {pkg.popular ? (
                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {pkg.tag}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                      {pkg.tag}
                    </span>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  {pkg.name}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-4xl font-bold">
                  ${pkg.price}
                  <span className="text-base font-normal text-muted-foreground">
                    /{pkg.duration}
                  </span>
                </div>
              </div>

              <Link href="/admin-packages/edit">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  ✏️ Modify Plan
                </Button>
              </Link>

              <div className="space-y-2 pt-4 border-t border-border">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue Recovery & Active Coupons */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Recovery */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Revenue Recovery
            </h3>
            <p className="text-xs text-muted-foreground">Auto-retry failed/late payments</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground uppercase mb-4">
              <div>Member</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {recoveryData.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 gap-2 items-center py-3 border-b border-border last:border-b-0"
              >
                <div className="text-sm font-medium">{item.member}</div>
                <div className="text-sm font-semibold">${item.amount.toFixed(2)}</div>
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <button className={`text-xs font-bold ${item.actionColor} hover:underline`}>
                  {item.action}
                </button>
              </div>
            ))}

            <div className="pt-4 text-center">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                View Full Running Logs →
              </a>
            </div>
          </div>
        </Card>

        {/* Active Coupons */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Active Coupons</h3>
            <button className="text-indigo-600 hover:text-indigo-700">
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Discount codes & marketing incentives
          </p>

          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`p-4 rounded-lg border border-border flex items-center justify-between ${coupon.color}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{coupon.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{coupon.code}</p>
                    <p className="text-xs text-muted-foreground">{coupon.discount}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{coupon.usage}</p>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            + Add Coupon
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPackagesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminPackagesContent />
    </ProtectedRoute>
  );
}
