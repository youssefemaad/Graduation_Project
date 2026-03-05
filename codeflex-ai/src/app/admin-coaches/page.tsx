"use client";

import { useState } from "react";
import {
  UserCog,
  Search,
  Star,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";

function AdminCoachesContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const coaches = [
    {
      id: 1,
      name: "Coach Ahmed",
      email: "coach@pulsegym.com",
      phone: "+20 100 123 4567",
      specialization: "Strength & Conditioning",
      status: "Active",
      rating: 4.8,
      totalClients: 24,
      sessionsThisMonth: 48,
      monthlyEarnings: 4500,
      joinDate: "Jan 2024",
      certifications: ["NASM-CPT", "CrossFit Level 2"],
    },
    {
      id: 2,
      name: "Coach Sara",
      email: "sara.coach@pulsegym.com",
      phone: "+20 100 234 5678",
      specialization: "Yoga & Flexibility",
      status: "Active",
      rating: 4.9,
      totalClients: 32,
      sessionsThisMonth: 56,
      monthlyEarnings: 5200,
      joinDate: "Mar 2024",
      certifications: ["RYT-500", "NASM-CPT"],
    },
    {
      id: 3,
      name: "Coach Omar",
      email: "omar.coach@pulsegym.com",
      phone: "+20 100 345 6789",
      specialization: "HIIT & Cardio",
      status: "Active",
      rating: 4.7,
      totalClients: 18,
      sessionsThisMonth: 36,
      monthlyEarnings: 3800,
      joinDate: "Jun 2024",
      certifications: ["ACE-CPT", "HIIT Specialist"],
    },
    {
      id: 4,
      name: "Coach Fatma",
      email: "fatma.coach@pulsegym.com",
      phone: "+20 100 456 7890",
      specialization: "Nutrition & Wellness",
      status: "Active",
      rating: 4.9,
      totalClients: 28,
      sessionsThisMonth: 42,
      monthlyEarnings: 4800,
      joinDate: "Feb 2024",
      certifications: ["Certified Nutritionist", "Wellness Coach"],
    },
    {
      id: 5,
      name: "Coach Mahmoud",
      email: "mahmoud.coach@pulsegym.com",
      phone: "+20 100 567 8901",
      specialization: "Bodybuilding",
      status: "On Leave",
      rating: 4.6,
      totalClients: 15,
      sessionsThisMonth: 12,
      monthlyEarnings: 2200,
      joinDate: "Sep 2024",
      certifications: ["ISSA-CPT", "Bodybuilding Specialist"],
    },
  ];

  const stats = [
    { label: "Total Coaches", value: "12", color: "text-purple-500", icon: UserCog },
    { label: "Active Coaches", value: "10", color: "text-green-500", icon: CheckCircle },
    { label: "Avg Rating", value: "4.8", color: "text-yellow-500", icon: Star },
    { label: "Total Sessions", value: "194", color: "text-blue-500", icon: Calendar },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "On Leave":
        return "bg-orange-100 text-orange-700";
      case "Inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredCoaches = coaches.filter((coach) => {
    return coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           coach.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           coach.specialization.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <UserCog className="h-10 w-10 text-purple-500" />
            Manage Coaches
          </h1>
          <p className="text-muted-foreground mt-2">View and manage all gym coaches</p>
        </div>
        <Link href="/admin-users">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <UserCog className="h-4 w-4 mr-2" />
            Create New Staff
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Coaches Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.map((coach) => (
          <Card key={coach.id} className="p-6 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{coach.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{coach.specialization}</p>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(coach.status)}`}>
                  {coach.status}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                <span className="font-semibold text-yellow-700">{coach.rating}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Clients:</span>
                <span className="font-semibold">{coach.totalClients}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-semibold">{coach.sessionsThisMonth} this month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Earnings:</span>
                <span className="font-semibold">${coach.monthlyEarnings}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-semibold">{coach.joinDate}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold">Certifications</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {coach.certifications.map((cert, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">
                <div>{coach.email}</div>
                <div>{coach.phone}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminCoachesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminCoachesContent />
    </ProtectedRoute>
  );
}
