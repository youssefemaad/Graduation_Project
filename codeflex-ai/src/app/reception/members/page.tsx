"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { receptionApi, MemberListDto } from "@/lib/api/reception";

function MembersListContent() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberListDto[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberListDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Expired" | "Frozen">("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const response = await receptionApi.getAllMembers();
      if (response.success && response.data) {
        setMembers(response.data);
        setFilteredMembers(response.data);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter members based on search and status
    let filtered = members;

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.memberNumber.toLowerCase().includes(query) ||
          m.phone.includes(query)
      );
    }

    setFilteredMembers(filtered);
  }, [searchQuery, statusFilter, members]);

  const handleMemberClick = (userId: number) => {
    router.push(`/reception/member-details/${userId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Expired":
        return "bg-red-500";
      case "Frozen":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Expired":
        return <XCircle className="h-4 w-4" />;
      case "Frozen":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "Active").length,
    expired: members.filter((m) => m.status === "Expired").length,
    frozen: members.filter((m) => m.status === "Frozen").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Members Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and view all gym members
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Frozen</p>
                <p className="text-2xl font-bold text-blue-600">{stats.frozen}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 bg-white dark:bg-gray-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, member ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "All" ? "default" : "outline"}
                onClick={() => setStatusFilter("All")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "Active" ? "default" : "outline"}
                onClick={() => setStatusFilter("Active")}
                className={statusFilter === "Active" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "Expired" ? "default" : "outline"}
                onClick={() => setStatusFilter("Expired")}
                className={statusFilter === "Expired" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Expired
              </Button>
              <Button
                variant={statusFilter === "Frozen" ? "default" : "outline"}
                onClick={() => setStatusFilter("Frozen")}
                className={statusFilter === "Frozen" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                Frozen
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </Card>

        {/* Members List */}
        <Card className="bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleMemberClick(member.userId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.memberNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900 dark:text-white mb-1">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {member.phone}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.membershipPlan}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Joined {new Date(member.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={`${getStatusColor(
                          member.status
                        )} text-white border-0 flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(member.status)}
                        {member.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.lastVisit
                        ? new Date(member.lastVisit).toLocaleDateString()
                        : "Never"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberClick(member.userId);
                        }}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No Results */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No members found</p>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredMembers.length} of {members.length} members
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist, UserRole.Admin]}>
      <MembersListContent />
    </ProtectedRoute>
  );
}
