import { apiFetch, setAuthToken, removeAuthToken, type ApiResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number; // 0 = Male, 1 = Female
  role: string; // Member, Coach, Receptionist, Admin
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserDto {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  role: string;
  profileImageUrl?: string;
  address?: string;
  tokenBalance: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
  expiresAt: string;
}


export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    // Store token if login successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Register new user (public - always creates Member)
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });

    // Store token if registration successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Admin-only: Create user with specific role (Coach, Receptionist, Admin)
   */
  async createUserWithRole(data: RegisterRequest, role: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>(`/auth/create-with-role?role=${encodeURIComponent(role)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  },

  /**
   * Change password (for authenticated users)
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete first login setup (marks isFirstLogin=false, mustChangePassword=false)
   */
  async completeSetup(): Promise<ApiResponse<UserDto>> {
    return apiFetch<UserDto>('/auth/complete-setup', {
      method: 'POST',
    });
  },

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/auth/email-exists?email=${encodeURIComponent(email)}`, { skipAuth: true });
  },

  /**
   * Logout user (clear token)
   */
  logout() {
    removeAuthToken();
  },
};
