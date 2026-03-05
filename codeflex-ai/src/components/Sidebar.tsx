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
  UserCogIcon,
  SettingsIcon,
  Menu,
  TrophyIcon,
  UtensilsIcon,
  UsersIcon,
  SunIcon,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UserRole } from "@/types/gym";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Map backend role strings to frontend UserRole enum
const normalizeRole = (role: string): UserRole => {
  const roleMap: Record<string, UserRole> = {
    Member: UserRole.Member,
    Coach: UserRole.Coach,
    Receptionist: UserRole.Receptionist,
    Admin: UserRole.Admin,
  };
  return roleMap[role] || UserRole.Member;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { hasAiAccess, hasCoachAccess } = useSubscription();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Role-based navigation items — filtered by subscription plan
  const getMemberNav = () => {
    const items = [
      { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
      { href: "/programs", icon: DumbbellIcon, label: "My Program" },
      { href: "/bookings", icon: CalendarIcon, label: "Calendar" },
      { href: "/community", icon: UsersIcon, label: "Community" },
      { href: "/tokens", icon: CoinsIcon, label: "Tokens" },
      { href: "/inbody", icon: ActivityIcon, label: "Analytics" },
      { href: "/achievements", icon: TrophyIcon, label: "Achievements" },
    ];

    // AI features — only for plans that include AI
    if (hasAiAccess) {
      items.splice(2, 0, {
        href: "/ai-workout-generator",
        icon: BrainIcon,
        label: "AI Workout",
      });
      items.splice(5, 0, {
        href: "/ai-coach",
        icon: BrainIcon,
        label: "AI Chat",
      });
    }

    // Coach booking — only for plans that include coach
    if (hasCoachAccess) {
      items.splice(hasAiAccess ? 4 : 2, 0, {
        href: "/book-coach",
        icon: UserIcon,
        label: "Book Coach",
      });
    }

    return items;
  };

  const getCoachNav = () => [
    { href: "/coach-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/coach-clients", icon: Users2Icon, label: "Clients" },
    { href: "/coach-programs", icon: DumbbellIcon, label: "Programs" },
    { href: "/coach-schedule", icon: CalendarIcon, label: "Schedule" },
    { href: "/coach-profile", icon: UserIcon, label: "My Profile" },
  ];

  const getReceptionNav = () => [
    {
      href: "/reception-dashboard",
      icon: LayoutDashboardIcon,
      label: "Dashboard",
    },
    { href: "/reception-members", icon: Users2Icon, label: "Members" },
    { href: "/reception-bookings", icon: CalendarIcon, label: "Bookings" },
    { href: "/reception-checkin", icon: ActivityIcon, label: "Check-In" },
    { href: "/reception-inbody", icon: DumbbellIcon, label: "InBody" },
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

  const navItems = getNavItems();
  const activeRole = normalizeRole(user?.role || "");

  // Get dashboard URL based on normalized role
  const getDashboardUrl = () => {
    if (!user) return "/";
    switch (activeRole) {
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
    <div className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50">
      {/* Logo Area */}
      <div className="p-6 pb-2">
        <Link href={getDashboardUrl()} className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pulse<span className="text-blue-600">Gym</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
                )}
              />
              <span>{item.label}</span>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto">
        <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-700 relative">
          {/* Settings Dropdown Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <SettingsIcon size={18} />
                <span>Settings</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56"
              side="right"
              sideOffset={10}
            >
              <Link href="/profile">
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/notifications">
                <DropdownMenuItem>
                  <BellIcon className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <SunIcon className="mr-2 h-4 w-4" />
                ) : (
                  <MoonIcon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOutIcon size={18} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Dropdown components since ui/dropdown-menu is missing
import * as React from "react";
import { BellIcon, MoonIcon, ChevronRight } from "lucide-react";

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // @ts-expect-error - cloning elements with spread props
          return React.cloneElement(child, { open, setOpen });
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuTrigger = ({ asChild, children, open, setOpen }: any) => {
  const Comp = asChild ? React.Fragment : "button";
  const props = asChild
    ? { onClick: () => setOpen(!open) }
    : { onClick: () => setOpen(!open), className: "outline-none" };

  return <div onClick={() => setOpen(!open)}>{children}</div>;
};

const DropdownMenuContent = ({
  children,
  open,
  className,
  side = "right",
  sideOffset = 5,
}: any) => {
  if (!open) return null;

  // Simple positioning logic for sidebar (showing to the right)
  const style: React.CSSProperties = {
    position: "absolute",
    bottom: "100%",
    left: "0",
    marginBottom: "8px",
    zIndex: 50,
    minWidth: "200px",
  };

  return (
    <div
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 animation-fade-in ${className}`}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick }: any) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
    >
      {children}
    </div>
  );
};
