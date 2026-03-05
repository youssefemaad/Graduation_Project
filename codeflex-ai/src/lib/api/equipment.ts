import { apiFetch, type ApiResponse } from './client';
import { apiCache, CACHE_TTL } from './cache';

export interface EquipmentDto {
  equipmentId: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
  category?: string; // Alias for categoryName for backwards compatibility
  description?: string;
  status: number;
  statusText?: string;
  location?: string;
  maintenanceSchedule?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  tokensCostPerHour?: number;
  tokensCost?: number; // Alias for tokensCostPerHour
}

const CACHE_KEYS = {
  ALL_EQUIPMENT: 'equipment:all',
  AVAILABLE_EQUIPMENT: 'equipment:available',
  EQUIPMENT_BY_ID: (id: number) => `equipment:${id}`,
};

export const equipmentApi = {
  /**
   * Get all equipment (cached for 30 minutes)
   */
  async getAllEquipment(forceRefresh = false): Promise<ApiResponse<EquipmentDto[]>> {
    if (!forceRefresh) {
      const cached = apiCache.get<EquipmentDto[]>(CACHE_KEYS.ALL_EQUIPMENT);
      if (cached) {
        return { success: true, data: cached };
      }
    }
    
    const response = await apiFetch<EquipmentDto[]>('/equipment');
    if (response.success && response.data) {
      apiCache.set(CACHE_KEYS.ALL_EQUIPMENT, response.data, CACHE_TTL.LONG);
    }
    return response;
  },

  /**
   * Get available equipment only (cached for 5 minutes - changes more frequently)
   */
  async getAvailableEquipment(forceRefresh = false): Promise<ApiResponse<EquipmentDto[]>> {
    if (!forceRefresh) {
      const cached = apiCache.get<EquipmentDto[]>(CACHE_KEYS.AVAILABLE_EQUIPMENT);
      if (cached) {
        return { success: true, data: cached };
      }
    }
    
    const response = await apiFetch<EquipmentDto[]>('/equipment/available');
    if (response.success && response.data) {
      apiCache.set(CACHE_KEYS.AVAILABLE_EQUIPMENT, response.data, CACHE_TTL.MEDIUM);
    }
    return response;
  },

  /**
   * Get equipment by ID (cached for 30 minutes)
   */
  async getEquipment(id: number, forceRefresh = false): Promise<ApiResponse<EquipmentDto>> {
    if (!forceRefresh) {
      const cached = apiCache.get<EquipmentDto>(CACHE_KEYS.EQUIPMENT_BY_ID(id));
      if (cached) {
        return { success: true, data: cached };
      }
    }
    
    const response = await apiFetch<EquipmentDto>(`/equipment/${id}`);
    if (response.success && response.data) {
      apiCache.set(CACHE_KEYS.EQUIPMENT_BY_ID(id), response.data, CACHE_TTL.LONG);
    }
    return response;
  },

  /**
   * Update equipment status (Admin/Reception only)
   * Also invalidates relevant caches
   */
  async updateEquipmentStatus(id: number, status: number): Promise<ApiResponse<EquipmentDto>> {
    const response = await apiFetch<EquipmentDto>(`/equipment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
    
    // Invalidate caches on successful update
    if (response.success) {
      apiCache.invalidate(CACHE_KEYS.ALL_EQUIPMENT);
      apiCache.invalidate(CACHE_KEYS.AVAILABLE_EQUIPMENT);
      apiCache.invalidate(CACHE_KEYS.EQUIPMENT_BY_ID(id));
    }
    
    return response;
  },

  /**
   * Force refresh all equipment caches
   */
  invalidateCache(): void {
    apiCache.invalidatePrefix('equipment:');
  },
};
