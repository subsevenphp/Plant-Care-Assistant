import { Plant, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface CreatePlantData {
  name: string;
  species?: string;
  notes?: string;
  imageUrl?: string;
  lastWatered?: Date;
  wateringFrequency: number;
  userId: string;
}

export interface UpdatePlantData {
  name?: string;
  species?: string;
  notes?: string;
  imageUrl?: string;
  lastWatered?: Date;
  wateringFrequency?: number;
}

export interface PlantFilters {
  search?: string;
  species?: string;
  lastWatered?: {
    from?: Date;
    to?: Date;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Plant Repository class for handling all Plant-related database operations
 * All operations are scoped to a specific userId for security
 */
export class PlantRepository {
  /**
   * Create a new plant for a specific user
   * @param plantData - The plant data to create
   * @returns Promise<Plant> - The created plant
   */
  async create(plantData: CreatePlantData): Promise<Plant> {
    try {
      const plant = await prisma.plant.create({
        data: {
          name: plantData.name,
          species: plantData.species,
          notes: plantData.notes,
          imageUrl: plantData.imageUrl,
          lastWatered: plantData.lastWatered,
          wateringFrequency: plantData.wateringFrequency,
          userId: plantData.userId,
        },
      });

      return plant;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to create plant: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find a plant by ID and userId
   * @param plantId - The plant ID
   * @param userId - The user ID (for security scoping)
   * @returns Promise<Plant | null> - The found plant or null
   */
  async findById(plantId: string, userId: string): Promise<Plant | null> {
    try {
      const plant = await prisma.plant.findFirst({
        where: {
          id: plantId,
          userId: userId,
        },
      });

      return plant;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find plant: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find all plants for a specific user with optional filtering and pagination
   * @param userId - The user ID
   * @param filters - Optional filters
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Promise<PaginatedResult<Plant>> - Paginated plant results
   */
  async findByUserId(
    userId: string,
    filters?: PlantFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Plant>> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: Prisma.PlantWhereInput = {
        userId: userId,
      };

      // Add search filter
      if (filters?.search) {
        whereClause.OR = [
          {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            species: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            notes: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Add species filter
      if (filters?.species) {
        whereClause.species = {
          equals: filters.species,
          mode: 'insensitive',
        };
      }

      // Add lastWatered date range filter
      if (filters?.lastWatered) {
        whereClause.lastWatered = {};
        if (filters.lastWatered.from) {
          whereClause.lastWatered.gte = filters.lastWatered.from;
        }
        if (filters.lastWatered.to) {
          whereClause.lastWatered.lte = filters.lastWatered.to;
        }
      }

      // Execute queries in parallel
      const [plants, total] = await Promise.all([
        prisma.plant.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        prisma.plant.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: plants,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find plants: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update a plant by ID and userId
   * @param plantId - The plant ID
   * @param userId - The user ID (for security scoping)
   * @param updateData - The data to update
   * @returns Promise<Plant | null> - The updated plant or null if not found
   */
  async update(
    plantId: string,
    userId: string,
    updateData: UpdatePlantData
  ): Promise<Plant | null> {
    try {
      // First check if the plant exists and belongs to the user
      const existingPlant = await this.findById(plantId, userId);
      if (!existingPlant) {
        return null;
      }

      const updatedPlant = await prisma.plant.update({
        where: {
          id: plantId,
        },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return updatedPlant;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return null; // Plant not found
        }
        throw new Error(`Failed to update plant: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Delete a plant by ID and userId
   * @param plantId - The plant ID
   * @param userId - The user ID (for security scoping)
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  async delete(plantId: string, userId: string): Promise<boolean> {
    try {
      // First check if the plant exists and belongs to the user
      const existingPlant = await this.findById(plantId, userId);
      if (!existingPlant) {
        return false;
      }

      await prisma.plant.delete({
        where: {
          id: plantId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // Plant not found
        }
        throw new Error(`Failed to delete plant: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find plants that need watering for a specific user
   * @param userId - The user ID
   * @returns Promise<Plant[]> - Plants that need watering
   */
  async findPlantsNeedingWater(userId: string): Promise<Plant[]> {
    try {
      const plants = await prisma.plant.findMany({
        where: {
          userId: userId,
          lastWatered: {
            not: null,
          },
        },
      });

      // Filter plants that need watering based on their frequency
      const plantsNeedingWater = plants.filter((plant) => {
        if (!plant.lastWatered) return false;
        
        const daysSinceLastWatered = Math.floor(
          (Date.now() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceLastWatered >= plant.wateringFrequency;
      });

      return plantsNeedingWater;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find plants needing water: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update the last watered date for a plant
   * @param plantId - The plant ID
   * @param userId - The user ID (for security scoping)
   * @param wateredAt - The watering date (defaults to now)
   * @returns Promise<Plant | null> - The updated plant or null if not found
   */
  async updateLastWatered(
    plantId: string,
    userId: string,
    wateredAt: Date = new Date()
  ): Promise<Plant | null> {
    try {
      return await this.update(plantId, userId, {
        lastWatered: wateredAt,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to update last watered: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get plant statistics for a user
   * @param userId - The user ID
   * @returns Promise<PlantStats> - Plant statistics
   */
  async getPlantStats(userId: string): Promise<{
    total: number;
    needsWatering: number;
    averageWateringFrequency: number;
  }> {
    try {
      const [plants, plantsNeedingWater] = await Promise.all([
        prisma.plant.findMany({
          where: {
            userId: userId,
          },
        }),
        this.findPlantsNeedingWater(userId),
      ]);

      const averageWateringFrequency = plants.length > 0
        ? plants.reduce((sum, plant) => sum + plant.wateringFrequency, 0) / plants.length
        : 0;

      return {
        total: plants.length,
        needsWatering: plantsNeedingWater.length,
        averageWateringFrequency: Math.round(averageWateringFrequency * 100) / 100,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to get plant stats: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find plants by name for a specific user (case-insensitive)
   * @param userId - The user ID
   * @param name - The plant name to search for
   * @returns Promise<Plant[]> - Plants matching the name
   */
  async findByName(userId: string, name: string): Promise<Plant[]> {
    try {
      const plants = await prisma.plant.findMany({
        where: {
          userId: userId,
          name: {
            contains: name,
            mode: 'insensitive',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return plants;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to find plants by name: ${error.message}`);
      }
      throw error;
    }
  }
}