import { apiFetch, API_BASE_URL, type ApiResponse as BaseApiResponse } from "./client";

export interface PaymentDto {
  paymentId: number;
  userId: number;
  memberName: string;
  memberNumber: string;
  memberPhoto?: string;
  planOrService: string;
  amount: number;
  paymentMethod: string;
  cardLastFour?: string;
  paymentDate: string;
  status: "Completed" | "Pending" | "Refunded";
  notes?: string;
}

export interface PaymentStatsDto {
  todayRevenue: number;
  todayRevenueChange: number;
  weeklyRevenue: number;
  weeklyRevenueChange: number;
  monthlyGrowth: number;
  monthlyGrowthChange: number;
}

export interface PaymentFilterDto {
  searchQuery?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaymentCreateDto {
  userId: number;
  planOrService: string;
  amount: number;
  paymentMethod: string;
  cardLastFour?: string;
  notes?: string;
}

export interface PaymentListResponseDto {
  payments: PaymentDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const paymentsApi = {
  async getPayments(filter: PaymentFilterDto): Promise<ApiResponse<PaymentListResponseDto>> {
    const params = new URLSearchParams();
    if (filter.searchQuery) params.append("searchQuery", filter.searchQuery);
    if (filter.status) params.append("status", filter.status);
    if (filter.startDate) params.append("startDate", filter.startDate);
    if (filter.endDate) params.append("endDate", filter.endDate);
    if (filter.pageNumber) params.append("pageNumber", filter.pageNumber.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());

    return await apiFetch<PaymentListResponseDto>(`/reception/payments?${params.toString()}`);
  },

  async getStats(): Promise<ApiResponse<PaymentStatsDto>> {
    return await apiFetch<PaymentStatsDto>("/reception/payments/stats");
  },

  async getPaymentById(paymentId: number): Promise<ApiResponse<PaymentDto>> {
    return await apiFetch<PaymentDto>(`/reception/payments/${paymentId}`);
  },

  async processPayment(payment: PaymentCreateDto): Promise<ApiResponse<PaymentDto>> {
    return await apiFetch<PaymentDto>("/reception/payments", {
      method: "POST",
      body: JSON.stringify(payment),
    });
  },

  async refundPayment(paymentId: number, reason?: string): Promise<ApiResponse<void>> {
    return await apiFetch<void>(`/reception/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason: reason || "No reason provided" }),
    });
  },

  async downloadInvoice(paymentId: number): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/reception/payments/${paymentId}/invoice`, {
      headers,
    });
    return response.blob();
  },

  async emailInvoice(paymentId: number): Promise<ApiResponse<void>> {
    return await apiFetch<void>(`/reception/payments/${paymentId}/email-invoice`, {
      method: "POST",
    });
  },
};
