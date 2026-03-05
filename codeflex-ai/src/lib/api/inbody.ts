import { apiFetch, type ApiResponse } from "./client";

// Matches backend: Shared.DTOs.InBody.InBodyMeasurementDto
export interface InBodyMeasurementDto {
  measurementId: number;
  userId: number;
  userName: string;
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bodyWaterPercentage?: number;
  protein?: number;
  minerals?: number;
  visceralFat?: number;
  bmi?: number;
  bmr?: number;
  metabolicAge?: number;
  bodyType?: string;
  // Segmental Lean Analysis
  segmentalRightArmLean?: number;
  segmentalRightArmFat?: number;
  segmentalLeftArmLean?: number;
  segmentalLeftArmFat?: number;
  segmentalTrunkLean?: number;
  segmentalTrunkFat?: number;
  segmentalRightLegLean?: number;
  segmentalRightLegFat?: number;
  segmentalLeftLegLean?: number;
  segmentalLeftLegFat?: number;
  conductedByReceptionId?: number;
  conductedByName?: string;
  notes?: string;
  measurementDate: string;
  createdAt: string;
}

// Matches backend: Shared.DTOs.InBody.CreateInBodyMeasurementDto
export interface CreateInBodyMeasurementDto {
  userId: number;
  weight: number;
  height: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bodyWaterPercentage?: number;
  protein?: number;
  minerals?: number;
  visceralFat?: number;
  bmr?: number;
  metabolicAge?: number;
  bodyType?: string;
  // Segmental Lean Analysis
  segmentalRightArmLean?: number;
  segmentalRightArmFat?: number;
  segmentalLeftArmLean?: number;
  segmentalLeftArmFat?: number;
  segmentalTrunkLean?: number;
  segmentalTrunkFat?: number;
  segmentalRightLegLean?: number;
  segmentalRightLegFat?: number;
  segmentalLeftLegLean?: number;
  segmentalLeftLegFat?: number;
  conductedByReceptionId?: number;
  notes?: string;
  measurementDate?: string;
}

export const inbodyApi = {
  /**
   * Get all measurements for a user
   */
  async getUserMeasurements(
    userId: number,
  ): Promise<ApiResponse<InBodyMeasurementDto[]>> {
    return apiFetch<InBodyMeasurementDto[]>(`/inbody/user/${userId}`);
  },

  /**
   * Get measurement by ID
   */
  async getMeasurement(
    measurementId: number,
  ): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>(`/inbody/${measurementId}`);
  },

  /**
   * Get latest measurement for a user
   */
  async getLatestMeasurement(
    userId: number,
  ): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>(`/inbody/user/${userId}/latest`);
  },

  /**
   * Create new measurement
   */
  async createMeasurement(
    data: CreateInBodyMeasurementDto,
  ): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>("/inbody", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
