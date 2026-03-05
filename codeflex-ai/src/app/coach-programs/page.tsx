"use client";

import { useState } from "react";
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function CoachProgramsContent() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for programs
  const programs = [
    {
      id: 1,
      name: "Strength Building Program",
      type: "Workout",
      description: "12-week strength training program focused on compound movements",
      duration: "12 weeks",
      activeClients: 8,
      createdDate: "2025-10-15",
      difficulty: "Intermediate",
      sessionsPerWeek: 4,
      status: "Active",
    },
    {
      id: 2,
      name: "Weight Loss Journey",
      type: "Full Program",
      description: "Combined workout and nutrition plan for healthy weight loss",
      duration: "16 weeks",
      activeClients: 12,
      createdDate: "2025-09-20",
      difficulty: "Beginner",
      sessionsPerWeek: 5,
      status: "Active",
    },
    {
      id: 3,
      name: "Athletic Performance",
      type: "Workout",
      description: "Advanced program for athletes focusing on speed and agility",
      duration: "8 weeks",
      activeClients: 5,
      createdDate: "2025-11-01",
      difficulty: "Advanced",
      sessionsPerWeek: 6,
      status: "Active",
    },
    {
      id: 4,
      name: "Muscle Gain Nutrition",
      type: "Nutrition",
      description: "High-protein meal plan optimized for muscle growth",
      duration: "12 weeks",
      activeClients: 10,
      createdDate: "2025-10-10",
      difficulty: "All Levels",
      sessionsPerWeek: 0,
      status: "Active",
    },
    {
      id: 5,
      name: "Beginner Fitness Basics",
      type: "Workout",
      description: "Foundation program for gym newcomers",
      duration: "8 weeks",
      activeClients: 15,
      createdDate: "2025-08-15",
      difficulty: "Beginner",
      sessionsPerWeek: 3,
      status: "Active",
    },
    {
      id: 6,
      name: "Recovery & Flexibility",
      type: "Workout",
      description: "Low-impact program focusing on mobility and recovery",
      duration: "6 weeks",
      activeClients: 4,
      createdDate: "2025-11-10",
      difficulty: "All Levels",
      sessionsPerWeek: 3,
      status: "Draft",
    },
  ];

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/10 text-green-500";
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-500";
      case "Advanced":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Workout":
        return <Dumbbell className="h-4 w-4" />;
      case "Nutrition":
        return <Calendar className="h-4 w-4" />;
      case "Full Program":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Training Programs</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage workout and nutrition programs
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{programs.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Programs</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {programs.reduce((sum, p) => sum + p.activeClients, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Clients</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {programs.filter(p => p.status === "Active").length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Programs</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs by name or type..."
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

      {/* Programs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="space-y-4">
              {/* Program Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(program.type)}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{program.type}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    program.status === "Active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}>
                    {program.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{program.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {program.description}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(program.difficulty)}`}>
                  {program.difficulty}
                </span>
                {program.sessionsPerWeek > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                    {program.sessionsPerWeek}x/week
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{program.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{program.activeClients}</div>
                    <div className="text-xs text-muted-foreground">Clients</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Created Date */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Created: {new Date(program.createdDate).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No programs found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function CoachProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProgramsContent />
    </ProtectedRoute>
  );
}
