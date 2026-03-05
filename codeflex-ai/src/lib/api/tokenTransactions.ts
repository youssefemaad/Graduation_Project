import { apiFetch, type ApiResponse } from './client';

export interface TokenTransactionDto {
  transactionId: number;
  userId: number;
  amount: number;
  transactionType: string;
  description: string;
  referenceType?: string;
  referenceId?: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface CreateTokenTransactionDto {
  amount: number;
  transactionType: string;
  description: string;
  referenceType?: string;
  referenceId?: number;
}

export const tokenTransactionsApi = {
  /**
   * Create a new token transaction (purchase, spend, etc.)
   */
  async createTransaction(data: CreateTokenTransactionDto): Promise<ApiResponse<TokenTransactionDto>> {
    return apiFetch<TokenTransactionDto>('/token-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(id: number): Promise<ApiResponse<TokenTransactionDto>> {
    return apiFetch<TokenTransactionDto>(`/token-transactions/${id}`);
  },

  /**
   * Get all transactions for a specific user
   */
  async getUserTransactions(userId: number): Promise<ApiResponse<TokenTransactionDto[]>> {
    return apiFetch<TokenTransactionDto[]>(`/token-transactions/user/${userId}`);
  },

  /**
   * Get user's current token balance
   */
  async getUserTokenBalance(userId: number): Promise<ApiResponse<number>> {
    return apiFetch<number>(`/token-transactions/user/${userId}/balance`);
  },
};
