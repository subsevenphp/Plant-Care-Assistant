// Plant-related TypeScript interfaces and types

export interface CreatePlantRequest {
  name: string;
  species?: string;
  wateringInterval: number;
  description?: string;
  lightRequirement?: 'low' | 'medium' | 'high';
  soilType?: string;
  fertilizingInterval?: number;
  location?: string;
  acquisitionDate?: Date;
}

export interface UpdatePlantRequest extends Partial<CreatePlantRequest> {
  lastWatered?: Date;
  healthStatus?: 'healthy' | 'warning' | 'critical';
  isActive?: boolean;
  careNotes?: string;
  imageUrl?: string;
}

export interface PlantResponse {
  id: string;
  name: string;
  species: string;
  description?: string;
  imageUrl?: string;
  wateringInterval: number;
  lastWatered?: Date;
  nextWateringDue?: Date;
  lightRequirement?: string;
  soilType?: string;
  fertilizingInterval?: number;
  lastFertilized?: Date;
  healthStatus: string;
  isActive: boolean;
  location?: string;
  careNotes?: string;
  acquisitionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantFilters {
  userId: string;
  search?: string;
  healthStatus?: string;
  location?: string;
  isActive?: boolean;
}

export interface PlantWithCareEvents extends PlantResponse {
  careEvents?: CareEventResponse[];
  upcomingCareEvents?: CareEventResponse[];
}

export interface CareEventResponse {
  id: string;
  type: string;
  notes?: string;
  imageUrl?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  isCompleted: boolean;
  reminderEnabled: boolean;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantStats {
  totalPlants: number;
  healthyPlants: number;
  plantsNeedingWater: number;
  plantsNeedingFertilizer: number;
  averageWateringInterval: number;
}

export interface WateringReminderData {
  plantId: string;
  plantName: string;
  userId: string;
  userEmail: string;
  daysOverdue: number;
  nextWateringDue: Date;
  wateringInterval: number;
}