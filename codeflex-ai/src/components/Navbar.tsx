"use client";

import {
  UserIcon,
  Ticket,
  LayoutDashboardIcon,
  CalendarIcon,
  ActivityIcon,
  CoinsIcon,
  BrainIcon,
  Users2Icon,
  ShieldIcon,
  LogOutIcon,
  DumbbellIcon,
  UserCogIcon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { Button } from "./ui/button";

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

export default function Navbar() {
  const { user, isAuthenticated, isRedirecting, logout } = useAuth();

  // Don't render navbar during redirect
  if (isRedirecting) {
    return null;
  }

  // Role-based navigation items
  const getMemberNav = () => [
    { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/book-coach", icon: UserCogIcon, label: "Book Coach" },
    { href: "/bookings", icon: CalendarIcon, label: "Bookings" },
    { href: "/inbody", icon: ActivityIcon, label: "InBody" },
    { href: "/ai-coach", icon: BrainIcon, label: "AI Coach" },
    { href: "/tokens", icon: CoinsIcon, label: "Tokens" },
    { href: "/profile", icon: UserIcon, label: "Profile" },
  ];

  const getCoachNav = () => [
    { href: "/coach-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/coach-clients", icon: Users2Icon, label: "Clients" },
    { href: "/coach-programs", icon: DumbbellIcon, label: "Programs" },
    { href: "/coach-schedule", icon: CalendarIcon, label: "Schedule" },
    { href: "/coach-profile", icon: UserIcon, label: "My Profile" },
  ];

  const getReceptionNav = () => [
    { href: "/reception-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/reception-members", icon: Users2Icon, label: "Members" },
    { href: "/reception-bookings", icon: CalendarIcon, label: "Bookings" },
    { href: "/reception-checkin", icon: ActivityIcon, label: "Check-In" },
  ];

  const getAdminNav = () => [
    { href: "/admin-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/admin-users", icon: Users2Icon, label: "Create Staff" },
    { href: "/admin-coaches", icon: UserCogIcon, label: "Manage Staff" },
    { href: "/admin-equipment", icon: DumbbellIcon, label: "Equipment" },
    { href: "/admin-packages", icon: Ticket, label: "Packages" },
    { href: "/admin-analytics", icon: ActivityIcon, label: "Analytics" },
  ];

  const getNavItems = () => {
    if (!user) return [];
    const role = normalizeRole(user.role);
    switch (role) {
      case UserRole.Member:
        return getMemberNav();
      case UserRole.Coach:
        return getCoachNav();
      case UserRole.Receptionist:
        return getReceptionNav();
      case UserRole.Admin:
        return getAdminNav();
      default:
        return [];
    }
  };

  const getRoleBadgeColor = () => {
    if (!user) return "bg-gray-500";
    const role = normalizeRole(user.role);
    switch (role) {
      case UserRole.Member:
        return "bg-blue-500";
      case UserRole.Coach:
        return "bg-green-500";
      case UserRole.Receptionist:
        return "bg-purple-500";
      case UserRole.Admin:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const navItems = getNavItems();

  // Get dashboard URL based on normalized role
  const getDashboardUrl = () => {
    if (!user) return "/";
    const role = normalizeRole(user.role);
    switch (role) {
      case UserRole.Member:
        return "/dashboard";
      case UserRole.Coach:
        return "/coach-dashboard";
      case UserRole.Receptionist:
        return "/reception-dashboard";
      case UserRole.Admin:
        return "/admin-dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <Link href={isAuthenticated ? getDashboardUrl() : "/"} className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-blue-500/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            Pulse<span className="text-primary">Gym</span>
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary shadow-lg shadow-blue-500/30">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-primary transition-colors"
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {normalizeRole(user?.role || '') === UserRole.Member && (
                <Button
                  asChild
                  variant="outline"
                  className="ml-2 border-primary/50 text-primary hover:bg-primary hover:text-white shadow-sm"
                >
                  <Link href="/generate-program">Generate Program</Link>
                </Button>
              )}

            </>
          )}
        </nav>
      </div>
    </header>
  );
}
