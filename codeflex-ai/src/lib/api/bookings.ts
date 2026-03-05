import { apiFetch, type ApiResponse } from './client';

export interface CreateBookingDto {
  userId: number;
  equipmentId?: number;
  coachId?: number;
  bookingType: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface BookingDto {
  bookingId: number;
  userId: number;
  userName: string;
  equipmentId?: number;
  equipmentName?: string;
  coachId?: number;
  coachName?: string;
  coachUserId?: number; // User ID for chat functionality
  bookingType: string;
  startTime: string;
  endTime: string;
  status: number;
  statusText: string;
  tokensCost: number;
  notes?: string;
  createdAt: string;
  checkInTime?: string;
  checkOutTime?: string;
  // New fields for coach session auto-booking
  isAutoBookedForCoachSession?: boolean;
  parentCoachBookingId?: number;
  isAiGenerated?: boolean;
}

export interface EquipmentAvailabilityCheck {
  equipmentId: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  message: string;
}

export interface CoachSessionCheck {
  userId: number;
  startTime: string;
  endTime: string;
  hasActiveCoachSession: boolean;
  canBook: boolean;
  message: string;
}

export const bookingsApi = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get booking by ID
   */
  async getBooking(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}`);
  },

  /**
   * Get all bookings (for receptionist)
   */
  async getAllBookings(): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>('/bookings');
  },

  /**
   * Get bookings by status
   */
  async getBookingsByStatus(status: string): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>(`/bookings/status/${status}`);
  },

  /**
   * Get today's bookings
   */
  async getTodaysBookings(): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>('/bookings/today');
  },

  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId: number): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>(`/bookings/user/${userId}`);
  },

  /**
   * Get all bookings for a coach
   */
  async getCoachBookings(coachId: number, startDate?: string, endDate?: string): Promise<ApiResponse<BookingDto[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return apiFetch<BookingDto[]>(`/bookings/coach/${coachId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get auto-booked equipment for a coach session
   */
  async getCoachSessionEquipment(coachBookingId: number): Promise<ApiResponse<BookingDto[]>> {
    return apiFetch<BookingDto[]>(`/bookings/${coachBookingId}/equipment`);
  },

  /**
   * Check if user can book equipment (not blocked by active coach session)
   */
  async checkUserCanBookEquipment(userId: number, startTime: string, endTime: string): Promise<ApiResponse<CoachSessionCheck>> {
    const params = new URLSearchParams({
      startTime,
      endTime,
    });
    return apiFetch<CoachSessionCheck>(`/equipment-availability/user/${userId}/can-book?${params.toString()}`);
  },

  /**
   * Check if user has active coach booking
   */
  async checkUserHasCoachBooking(userId: number, startTime: string, endTime: string): Promise<ApiResponse<{ hasCoachBooking: boolean; message: string }>> {
    const params = new URLSearchParams({
      startTime,
      endTime,
    });
    return apiFetch<{ hasCoachBooking: boolean; message: string }>(`/bookings/user/${userId}/has-coach-booking?${params.toString()}`);
  },

  /**
   * Check equipment availability for a time slot
   */
  async checkEquipmentAvailability(equipmentId: number, startTime: string, endTime: string): Promise<ApiResponse<EquipmentAvailabilityCheck>> {
    const params = new URLSearchParams({
      startTime,
      endTime,
    });
    return apiFetch<EquipmentAvailabilityCheck>(`/equipment-availability/${equipmentId}/check?${params.toString()}`);
  },

  /**
   * Confirm a booking
   */
  async confirmBooking(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/confirm`, {
      method: 'PUT',
    });
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(id: number, reason: string): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(reason),
    });
  },

  /**
   * Check in to a booking
   */
  async checkIn(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/checkin`, {
      method: 'PUT',
    });
  },

  /**
   * Check out from a booking
   */
  async checkOut(id: number): Promise<ApiResponse<BookingDto>> {
    return apiFetch<BookingDto>(`/bookings/${id}/checkout`, {
      method: 'PUT',
    });
  },
};

