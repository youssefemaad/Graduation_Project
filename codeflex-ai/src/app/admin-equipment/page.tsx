"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell,
  Search,
  Plus,
  Edit,
  Trash2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { equipmentApi, type EquipmentDto } from "@/lib/api/equipment";

// Equipment Status enum matching backend
enum EquipmentStatus {
  Available = 0,
  InUse = 1,
  UnderMaintenance = 2,
  OutOfService = 3,
}

function AdminEquipmentContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await equipmentApi.getAllEquipment(true);

      if (response.success && response.data) {
        setEquipment(response.data);
      } else {
        setError(response.errors?.[0] || "Failed to load equipment");
      }
    } catch (err) {
      setError("Failed to fetch equipment. Please try again.");
      console.error("Equipment fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: number): string => {
    switch (status) {
      case EquipmentStatus.Available:
        return "Available";
      case EquipmentStatus.InUse:
        return "In Use";
      case EquipmentStatus.UnderMaintenance:
        return "Under Maintenance";
      case EquipmentStatus.OutOfService:
        return "Out of Service";
      default:
        return "Unknown";
    }
  };

  const calculateStats = () => {
    const total = equipment.length;
    const available = equipment.filter(
      (e) => e.status === EquipmentStatus.Available,
    ).length;
    const inUse = equipment.filter(
      (e) => e.status === EquipmentStatus.InUse,
    ).length;
    const maintenance = equipment.filter(
      (e) => e.status === EquipmentStatus.UnderMaintenance,
    ).length;
    const outOfService = equipment.filter(
      (e) => e.status === EquipmentStatus.OutOfService,
    ).length;

    return [
      {
        label: "Total Equipment",
        value: total.toString(),
        color: "text-green-500",
        icon: Package,
      },
      {
        label: "Available",
        value: available.toString(),
        color: "text-blue-500",
        icon: CheckCircle,
      },
      {
        label: "Under Maintenance",
        value: maintenance.toString(),
        color: "text-orange-500",
        icon: Wrench,
      },
      {
        label: "Out of Service",
        value: outOfService.toString(),
        color: "text-red-500",
        icon: AlertTriangle,
      },
    ];
  };

  const stats = calculateStats();

  const getStatusColor = (status: number) => {
    switch (status) {
      case EquipmentStatus.Available:
        return "bg-green-100 text-green-700";
      case EquipmentStatus.InUse:
        return "bg-blue-100 text-blue-700";
      case EquipmentStatus.UnderMaintenance:
        return "bg-orange-100 text-orange-700";
      case EquipmentStatus.OutOfService:
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case EquipmentStatus.Available:
        return <CheckCircle className="h-4 w-4" />;
      case EquipmentStatus.InUse:
        return <Dumbbell className="h-4 w-4" />;
      case EquipmentStatus.UnderMaintenance:
        return <Wrench className="h-4 w-4" />;
      case EquipmentStatus.OutOfService:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesStatus =
      statusFilter === "all" || getStatusText(item.status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Dumbbell className="h-10 w-10 text-green-500" />
            Equipment Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all gym equipment
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
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

      {/* Search and Filter */}
      <Card className="p-6 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "Available" ? "default" : "outline"}
              onClick={() => setStatusFilter("Available")}
            >
              Available
            </Button>
            <Button
              variant={statusFilter === "In Use" ? "default" : "outline"}
              onClick={() => setStatusFilter("In Use")}
            >
              In Use
            </Button>
            <Button
              variant={
                statusFilter === "Under Maintenance" ? "default" : "outline"
              }
              onClick={() => setStatusFilter("Under Maintenance")}
            >
              Maintenance
            </Button>
            <Button
              variant={
                statusFilter === "Out of Service" ? "default" : "outline"
              }
              onClick={() => setStatusFilter("Out of Service")}
            >
              Out of Service
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <span className="ml-2 text-lg">Loading equipment...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 border border-red-200 bg-red-50">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Equipment
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={fetchEquipment}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && equipment.length === 0 && (
        <Card className="p-8 border border-border">
          <div className="flex flex-col items-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Equipment Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first piece of equipment.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>
        </Card>
      )}

      {/* Equipment Grid */}
      {!loading && !error && filteredEquipment.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <Card
              key={item.equipmentId}
              className="p-6 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.categoryName || "Uncategorized"}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                >
                  {getStatusIcon(item.status)}
                  {getStatusText(item.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipment ID:</span>
                  <span className="font-semibold">#{item.equipmentId}</span>
                </div>
                {item.location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-semibold">{item.location}</span>
                  </div>
                )}
                {item.lastMaintenanceDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Last Maintenance:
                    </span>
                    <span className="font-semibold">
                      {new Date(item.lastMaintenanceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {item.nextMaintenanceDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Next Maintenance:
                    </span>
                    <span
                      className={`font-semibold ${new Date(item.nextMaintenanceDate) < new Date() ? "text-red-600" : ""}`}
                    >
                      {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {(item.tokensCostPerHour ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booking Cost:</span>
                    <span className="font-semibold">
                      {item.tokensCostPerHour} tokens/hr
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Wrench className="h-3 w-3 mr-2" />
                  Maintain
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results for Filter */}
      {!loading &&
        !error &&
        equipment.length > 0 &&
        filteredEquipment.length === 0 && (
          <Card className="p-8 border border-border">
            <div className="flex flex-col items-center text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Matching Equipment
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </Card>
        )}
    </div>
  );
}

export default function AdminEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminEquipmentContent />
    </ProtectedRoute>
  );
}
