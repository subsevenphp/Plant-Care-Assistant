import apiClient from './api';

export interface Plant {
  id: string;
  name: string;
  species?: string;
  notes?: string;
  imageUrl?: string;
  lastWatered?: string;
  wateringFrequency: number;
  location?: string;
  needsWater: boolean;
  nextWatering: string;
  healthStatus: string;
  acquisitionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantRequest {
  name: string;
  species?: string;
  notes?: string;
  wateringFrequency: number;
  location?: string;
  imageUri?: string;
}

export interface UpdatePlantRequest extends Partial<CreatePlantRequest> {
  id: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlantsResponse {
  plants: Plant[];
  total: number;
  page: number;
  limit: number;
}

class PlantService {
  async getPlants(page = 1, limit = 10): Promise<PlantsResponse> {
    try {
      const response = await apiClient.get<PaginatedResponse<Plant[]>>('/plants', {
        params: { page, limit },
      });
      
      return {
        plants: response.data,
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
      };
    } catch (error) {
      console.error('Get plants service error:', error);
      throw error;
    }
  }

  async getPlantById(id: string): Promise<Plant> {
    try {
      const response = await apiClient.get<ApiResponse<Plant>>(`/plants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get plant by ID service error:', error);
      throw error;
    }
  }

  async createPlant(plantData: CreatePlantRequest): Promise<Plant> {
    try {
      const formData = new FormData();
      
      // Add plant data fields
      formData.append('name', plantData.name);
      if (plantData.species) formData.append('species', plantData.species);
      if (plantData.notes) formData.append('notes', plantData.notes);
      if (plantData.location) formData.append('location', plantData.location);
      formData.append('wateringFrequency', plantData.wateringFrequency.toString());

      // Add image if present
      if (plantData.imageUri) {
        formData.append('image', {
          uri: plantData.imageUri,
          type: 'image/jpeg',
          name: 'plant-image.jpg',
        } as any);
      }

      const response = await apiClient.uploadFile<ApiResponse<Plant>>('/plants', formData);
      return response.data;
    } catch (error) {
      console.error('Create plant service error:', error);
      throw error;
    }
  }

  async updatePlant(plantData: UpdatePlantRequest): Promise<Plant> {
    try {
      const { id, ...updateData } = plantData;
      const formData = new FormData();
      
      // Add plant data fields (only if they exist)
      if (updateData.name) formData.append('name', updateData.name);
      if (updateData.species) formData.append('species', updateData.species);
      if (updateData.notes) formData.append('notes', updateData.notes);
      if (updateData.location) formData.append('location', updateData.location);
      if (updateData.wateringFrequency) formData.append('wateringFrequency', updateData.wateringFrequency.toString());

      // Add image if present
      if (updateData.imageUri) {
        formData.append('image', {
          uri: updateData.imageUri,
          type: 'image/jpeg',
          name: 'plant-image.jpg',
        } as any);
      }

      const response = await apiClient.uploadFile<ApiResponse<Plant>>(`/plants/${id}`, formData, {
        method: 'PUT',
      });
      return response.data;
    } catch (error) {
      console.error('Update plant service error:', error);
      throw error;
    }
  }

  async deletePlant(id: string): Promise<void> {
    try {
      await apiClient.delete(`/plants/${id}`);
    } catch (error) {
      console.error('Delete plant service error:', error);
      throw error;
    }
  }

  async waterPlant(id: string): Promise<Plant> {
    try {
      const response = await apiClient.post<ApiResponse<Plant>>(`/plants/${id}/water`);
      return response.data;
    } catch (error) {
      console.error('Water plant service error:', error);
      throw error;
    }
  }

  async getPlantsNeedingWater(): Promise<Plant[]> {
    try {
      const response = await apiClient.get<ApiResponse<Plant[]>>('/plants/needs-water');
      return response.data;
    } catch (error) {
      console.error('Get plants needing water service error:', error);
      throw error;
    }
  }
}

export const plantService = new PlantService();