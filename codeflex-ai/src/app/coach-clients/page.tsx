"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Activity,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function CoachClientsContent() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for clients
  const clients = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed.hassan@example.com",
      phone: "+20 123 456 7890",
      membershipType: "Premium",
      joinDate: "2025-01-15",
      activeProgramsCount: 2,
      lastSession: "2025-11-27",
      progress: 85,
      avatar: "AH",
    },
    {
      id: 2,
      name: "Sara Mohamed",
      email: "sara.mohamed@example.com",
      phone: "+20 123 456 7891",
      membershipType: "Standard",
      joinDate: "2025-02-20",
      activeProgramsCount: 1,
      lastSession: "2025-11-28",
      progress: 72,
      avatar: "SM",
    },
    {
      id: 3,
      name: "Omar Ali",
      email: "omar.ali@example.com",
      phone: "+20 123 456 7892",
      membershipType: "Premium",
      joinDate: "2025-03-10",
      activeProgramsCount: 3,
      lastSession: "2025-11-29",
      progress: 90,
      avatar: "OA",
    },
    {
      id: 4,
      name: "Fatma Ibrahim",
      email: "fatma.ibrahim@example.com",
      phone: "+20 123 456 7893",
      membershipType: "Standard",
      joinDate: "2025-04-05",
      activeProgramsCount: 1,
      lastSession: "2025-11-26",
      progress: 65,
      avatar: "FI",
    },
    {
      id: 5,
      name: "Karim Youssef",
      email: "karim.youssef@example.com",
      phone: "+20 123 456 7894",
      membershipType: "Premium",
      joinDate: "2025-05-12",
      activeProgramsCount: 2,
      lastSession: "2025-11-29",
      progress: 78,
      avatar: "KY",
    },
  ];

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">My Clients</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your clients' progress
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
          <Users className="h-5 w-5 text-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">{clients.length}</div>
            <div className="text-xs opacity-90">Total Clients</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="space-y-4">
              {/* Client Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                    {client.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{client.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      client.membershipType === "Premium"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {client.membershipType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined: {new Date(client.joinDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-primary">{client.activeProgramsCount}</div>
                  <div className="text-xs text-muted-foreground">Active Programs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{client.progress}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold">{client.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all"
                    style={{ width: `${client.progress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Eye className="h-4 w-4" />
                  View Profile
                </Button>
                <Button className="flex-1 gap-2" size="sm">
                  <Activity className="h-4 w-4" />
                  Track Progress
                </Button>
              </div>

              {/* Last Session */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Last session: {new Date(client.lastSession).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No clients found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function CoachClientsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachClientsContent />
    </ProtectedRoute>
  );
}
