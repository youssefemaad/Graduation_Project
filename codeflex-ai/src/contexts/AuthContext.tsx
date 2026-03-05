"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/gym";
import { authApi, getAuthToken } from "@/lib/api";
import { tokenTransactionsApi } from "@/lib/api/tokenTransactions";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, role: string, phone?: string, gender?: number) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  // modify token balance by a signed integer (positive to add, negative to deduct)
  adjustTokens: (amount: number) => void;
  // convenience: deduct tokens (positive number -> decreases balance)
  deductTokens: (amount?: number) => void;
  // refresh user data from server (e.g., after token purchase)
  refreshUser: () => Promise<void>;
  // Change password (for first-login flow)
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  // Complete first login setup
  completeFirstLoginSetup: () => Promise<void>;
  // Admin: Create user with role
  adminCreateUser: (email: string, password: string, name: string, role: string, phone?: string, gender?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const storedToken = getAuthToken() || sessionStorage.getItem("auth_token"); // Use auth_token from API client

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      // Single API call - backend detects role from database
      const response = await authApi.login({ email, password });

      if (!response?.success || !response.data) {
        throw new Error("Invalid credentials");
      }

      const { user: userData, token: authToken } = response.data;

      // Map backend role string to frontend UserRole enum
      const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Receptionist,
        'Admin': UserRole.Admin,
      };

      const mappedRole = roleMap[userData.role];

      if (!mappedRole) {
        throw new Error(`Unknown role: ${userData.role}`);
      }

      // Convert backend UserDto to frontend User type
      const userObj: User = {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        role: userData.role, // Keep as string from backend
        profileImageUrl: userData.profileImageUrl,
        address: userData.address,
        tokenBalance: userData.tokenBalance,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
        lastLoginAt: userData.lastLoginAt,
        createdAt: userData.createdAt,
        mustChangePassword: userData.mustChangePassword,
        isFirstLogin: userData.isFirstLogin,
      };

      // Save to state and localStorage
      setUser(userObj);
      setToken(authToken);

      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(userObj));
        localStorage.setItem("auth_token", authToken);
      } else {
        sessionStorage.setItem("user", JSON.stringify(userObj));
        sessionStorage.setItem("auth_token", authToken);
      }

      // Set redirecting state
      setIsRedirecting(true);

      // Check if user needs to complete first-login setup (for Coach/Receptionist created by admin)
      if (userData.mustChangePassword || userData.isFirstLogin) {
        window.location.href = "/setup-account";
        return;
      }

      // Redirect based on role returned from backend
      const roleRoutes: Record<UserRole, string> = {
        [UserRole.Member]: "/dashboard",
        [UserRole.Coach]: "/coach-dashboard",
        [UserRole.Receptionist]: "/reception-dashboard",
        [UserRole.Admin]: "/admin-dashboard",
      };

      // Force immediate redirect using window.location
      window.location.href = roleRoutes[mappedRole];
    } catch (error) {
      console.error("Login error:", error);
      setIsRedirecting(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: string, phone?: string, gender?: number) => {
    try {
      console.log('Registering with:', { email, name, phone, gender, role });
      const response = await authApi.register({
        email,
        password,
        name,
        phone,
        gender,
        role
      });

      console.log('Registration response:', response);
      console.log('Response data:', response.data);
      console.log('Response success:', response.success);

      if (!response.success || !response.data) {
        console.error('Registration failed:', response);
        throw new Error(response.message || "Registration failed");
      }

      const { user: userData, token: authToken } = response.data;

      // Map backend role string to frontend UserRole enum
      const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Receptionist,
        'Admin': UserRole.Admin,
      };

      const mappedRole = roleMap[userData.role] || UserRole.Member;

      const userObj: User = {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        role: userData.role, // Keep as string from backend
        profileImageUrl: userData.profileImageUrl,
        address: userData.address,
        tokenBalance: userData.tokenBalance,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
        lastLoginAt: userData.lastLoginAt,
        createdAt: userData.createdAt,
        mustChangePassword: userData.mustChangePassword,
        isFirstLogin: userData.isFirstLogin,
      };

      // Redirect based on role
      const roleRoutes: Record<UserRole, string> = {
        [UserRole.Member]: "/dashboard",
        [UserRole.Coach]: "/coach-dashboard",
        [UserRole.Receptionist]: "/reception-dashboard",
        [UserRole.Admin]: "/admin-dashboard",
      };

      // Save to state and localStorage
      setUser(userObj);
      setToken(authToken);
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("auth_token", authToken);

      // Set redirecting state
      setIsRedirecting(true);

      // Force immediate redirect using window.location
      window.location.href = roleRoutes[mappedRole];
    } catch (error) {
      console.error("Registration error:", error);
      setIsRedirecting(false);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to change password");
      }

      // Update user state to reflect password change
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  };

  const completeFirstLoginSetup = async () => {
    try {
      const response = await authApi.completeSetup();

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to complete setup");
      }

      // Update user state with new data
      const userData = response.data;
      const updatedUser: User = {
        ...user!,
        mustChangePassword: userData.mustChangePassword,
        isFirstLogin: userData.isFirstLogin,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Redirect to appropriate dashboard
      const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Receptionist,
        'Admin': UserRole.Admin,
      };

      const roleRoutes: Record<UserRole, string> = {
        [UserRole.Member]: "/dashboard",
        [UserRole.Coach]: "/coach-dashboard",
        [UserRole.Receptionist]: "/reception-dashboard",
        [UserRole.Admin]: "/admin-dashboard",
      };

      const mappedRole = roleMap[updatedUser.role] || UserRole.Member;
      window.location.href = roleRoutes[mappedRole];
    } catch (error) {
      console.error("Complete setup error:", error);
      throw error;
    }
  };

  const adminCreateUser = async (email: string, password: string, name: string, role: string, phone?: string, gender?: number) => {
    try {
      const response = await authApi.createUserWithRole({
        email,
        password,
        name,
        phone,
        gender,
        role,
      }, role);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to create user");
      }

      // Return the created user data (don't log in as them)
      return;
    } catch (error) {
      console.error("Admin create user error:", error);
      throw error;
    }
  };

  const adjustTokens = (amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newBalance = Math.max(0, (prev.tokenBalance ?? 0) + amount);
      const updated = { ...prev, tokenBalance: newBalance } as User;
      if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const deductTokens = (amount: number = 1) => {
    adjustTokens(-Math.abs(amount));
  };

  const refreshUser = async () => {
    if (!user?.userId) return;

    try {
      // Fetch the latest token balance from the server
      const balanceResponse = await tokenTransactionsApi.getUserTokenBalance(user.userId);

      if (balanceResponse.success && balanceResponse.data !== undefined) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, tokenBalance: balanceResponse.data! } as User;
          if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = () => {
    authApi.logout(); // Clear token from API client
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    router.push("/login");
  };

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

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const normalizedRole = normalizeRole(user.role);
    return roleArray.includes(normalizedRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        adjustTokens,
        deductTokens,
        refreshUser,
        isLoading,
        isRedirecting,
        login,
        register,
        logout,
        hasRole,
        changePassword,
        completeFirstLoginSetup,
        adminCreateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
