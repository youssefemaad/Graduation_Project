"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Map backend role strings to frontend UserRole enum
const normalizeRole = (role: string): UserRole => {
  const roleMap: Record<string, UserRole> = {
    'Member': UserRole.Member,
    'Coach': UserRole.Coach,
    'Receptionist': UserRole.Receptionist,
    'Admin': UserRole.Admin,
  };
  return roleMap[role] || UserRole.Member;
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && user) {
        const normalizedRole = normalizeRole(user.role);
        if (!allowedRoles.includes(normalizedRole)) {
          // Redirect to appropriate dashboard if user doesn't have permission
          const roleRoutes: Record<UserRole, string> = {
            [UserRole.Member]: "/dashboard",
            [UserRole.Coach]: "/coach-dashboard",
            [UserRole.Receptionist]: "/reception-dashboard",
            [UserRole.Admin]: "/admin-dashboard",
          };
          router.push(roleRoutes[normalizedRole] || "/dashboard");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user) {
    const normalizedRole = normalizeRole(user.role);
    if (!allowedRoles.includes(normalizedRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
