import { apiFetch, type ApiResponse } from './client';

export interface CoachReviewDto {
  reviewId: number;
  coachId: number;
  coachName: string;
  userId: number;
  userName: string;
  bookingId?: number;
  rating: number;
  reviewText?: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoachReviewDto {
  coachId: number;
  bookingId?: number;
  rating: number;
  reviewText?: string;
  isAnonymous?: boolean;
}

export interface UpdateCoachReviewDto {
  rating?: number;
  reviewText?: string;
  isAnonymous?: boolean;
}

export const coachReviewsApi = {
  /**
   * Create review
   */
  async createReview(data: CreateCoachReviewDto): Promise<ApiResponse<CoachReviewDto>> {
    return apiFetch<CoachReviewDto>('/coach-reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get review by ID
   */
  async getReview(id: number): Promise<ApiResponse<CoachReviewDto>> {
    return apiFetch<CoachReviewDto>(`/coach-reviews/${id}`);
  },

  /**
   * Get coach's reviews
   */
  async getCoachReviews(coachId: number): Promise<ApiResponse<CoachReviewDto[]>> {
    return apiFetch<CoachReviewDto[]>(`/coach-reviews/coach/${coachId}`);
  },

  /**
   * Get coach's average rating
   */
  async getCoachAverageRating(coachId: number): Promise<ApiResponse<number>> {
    return apiFetch<number>(`/coach-reviews/coach/${coachId}/rating`);
  },

  /**
   * Update review
   */
  async updateReview(id: number, data: UpdateCoachReviewDto): Promise<ApiResponse<CoachReviewDto>> {
    return apiFetch<CoachReviewDto>(`/coach-reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete review
   */
  async deleteReview(id: number): Promise<ApiResponse<void>> {
    return apiFetch<void>(`/coach-reviews/${id}`, {
      method: 'DELETE',
    });
  },
};
