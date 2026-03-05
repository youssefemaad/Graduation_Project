import { apiFetch, type ApiResponse } from './client';

// AI Chat Request/Response DTOs
export interface AIChatRequestDto {
    userId: number;
    message: string;
    sessionId?: number;
}

export interface AIChatResponseDto {
    success: boolean;
    data?: {
        response: string;
        tokensSpent: number;
        responseTimeMs: number;
        newBalance: number;
        sessionId: number;
        warning?: string;
    };
    message?: string;
}

export interface AIChatLogDto {
    chatLogId: number;
    userId: number;
    userMessage: string;
    aiResponse: string;
    tokensUsed: number;
    responseTimeMs: number;
    sessionId: number;
    createdAt: string;
}

export interface AIChatSessionDto {
    sessionId: number;
    userId: number;
    title: string;
    messageCount: number;
    lastMessageAt: string;
    createdAt: string;
}

export const aiApi = {
    /**
     * Send a message to the AI Coach (Gemini)
     * Cost: 1 token per message
     */
    async sendMessage(userId: number, message: string, sessionId?: number): Promise<AIChatResponseDto> {
        const response = await apiFetch<AIChatResponseDto['data']>('/ai/gemini-chat', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                message,
                sessionId, // Pass as number
            }),
        });

        if (response.success && response.data) {
            return { success: true, data: response.data };
        }
        return { success: false, message: response.message || 'Failed to send message' };
    },

    /**
     * Get chat history for a user
     */
    async getChatHistory(userId: number, limit: number = 50): Promise<ApiResponse<AIChatLogDto[]>> {
        return apiFetch<AIChatLogDto[]>(`/ai/history/${userId}?limit=${limit}`);
    },

    /**
     * Get all chat sessions for a user
     */
    async getChatSessions(userId: number): Promise<ApiResponse<{ sessions: AIChatSessionDto[] }>> {
        return apiFetch<{ sessions: AIChatSessionDto[] }>(`/ai/sessions/${userId}`);
    },

    /**
     * Get messages for a specific session
     */
    async getSessionMessages(userId: number, sessionId: number): Promise<ApiResponse<{ messages: AIChatLogDto[] }>> {
        return apiFetch<{ messages: AIChatLogDto[] }>(`/ai/sessions/${userId}/${sessionId}`);
    },
};
