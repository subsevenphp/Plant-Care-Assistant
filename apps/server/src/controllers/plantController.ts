import { Request, Response } from 'express';
import { PlantRepository } from '../repositories';
import {
  CreatePlantRequest,
  UpdatePlantRequest,
  GetPlantByIdRequest,
  DeletePlantRequest,
  GetPlantsRequest,
  WaterPlantRequest,
} from '../utils/validation';
import { getImageUploadService } from '../services/ImageUploadService';

export class PlantController {
  private plantRepository: PlantRepository;

  constructor() {
    this.plantRepository = new PlantRepository();
  }

  /**
   * Get all plants for the authenticated user
   * GET /api/plants
   */
  getPlants = async (req: Request & GetPlantsRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { page, limit, search, species, lastWateredFrom, lastWateredTo } = req.query;

      // Build filters
      const filters = {
        search,
        species,
        lastWatered: (lastWateredFrom || lastWateredTo) ? {
          from: lastWateredFrom,
          to: lastWateredTo,
        } : undefined,
      };

      // Remove undefined filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      );

      const result = await this.plantRepository.findByUserId(
        userId,
        Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Plants retrieved successfully',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error('Error getting plants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plants',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get a single plant by ID
   * GET /api/plants/:id
   */
  getPlantById = async (req: Request & GetPlantByIdRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const plant = await this.plantRepository.findById(id, userId);

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Plant retrieved successfully',
        data: plant,
      });
    } catch (error) {
      console.error('Error getting plant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Create a new plant
   * POST /api/plants
   */
  createPlant = async (req: Request & CreatePlantRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, species, notes, wateringFrequency, lastWatered } = req.body;

      // Handle image upload if present
      let imageUrl: string | undefined;
      if (req.file) {
        try {
          const imageUploadService = getImageUploadService();
          const uploadResult = await imageUploadService.uploadImage(req.file, 'plants');
          imageUrl = uploadResult.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload image',
            error: uploadError instanceof Error ? uploadError.message : 'Upload error',
          });
        }
      }

      // Check if user already has a plant with the same name
      const existingPlants = await this.plantRepository.findByName(userId, name);
      if (existingPlants.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have a plant with this name',
        });
      }

      // Create the plant
      const plantData = {
        name,
        species: species || undefined,
        notes: notes || undefined,
        imageUrl,
        wateringFrequency,
        lastWatered: lastWatered || undefined,
        userId,
      };

      const plant = await this.plantRepository.create(plantData);

      res.status(201).json({
        success: true,
        message: 'Plant created successfully',
        data: plant,
      });
    } catch (error) {
      console.error('Error creating plant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create plant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update an existing plant
   * PUT /api/plants/:id
   */
  updatePlant = async (req: Request & UpdatePlantRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, species, notes, wateringFrequency, lastWatered } = req.body;

      // Check if plant exists and belongs to user
      const existingPlant = await this.plantRepository.findById(id, userId);
      if (!existingPlant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      // Handle image upload if present
      let imageUrl: string | undefined = existingPlant.imageUrl || undefined;
      if (req.file) {
        try {
          const imageUploadService = getImageUploadService();
          const uploadResult = await imageUploadService.updateImage(
            req.file,
            existingPlant.imageUrl || undefined,
            'plants'
          );
          imageUrl = uploadResult.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload image',
            error: uploadError instanceof Error ? uploadError.message : 'Upload error',
          });
        }
      }

      // Check if updating name conflicts with existing plant
      if (name && name !== existingPlant.name) {
        const existingPlants = await this.plantRepository.findByName(userId, name);
        if (existingPlants.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'You already have a plant with this name',
          });
        }
      }

      // Prepare update data (only include defined values)
      const updateData = {
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(notes !== undefined && { notes }),
        ...(wateringFrequency !== undefined && { wateringFrequency }),
        ...(lastWatered !== undefined && { lastWatered }),
        ...(imageUrl !== existingPlant.imageUrl && { imageUrl }),
      };

      const updatedPlant = await this.plantRepository.update(id, userId, updateData);

      if (!updatedPlant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found or could not be updated',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Plant updated successfully',
        data: updatedPlant,
      });
    } catch (error) {
      console.error('Error updating plant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update plant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Delete a plant
   * DELETE /api/plants/:id
   */
  deletePlant = async (req: Request & DeletePlantRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await this.plantRepository.delete(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Plant deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting plant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete plant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Water a plant (update lastWatered date)
   * POST /api/plants/:id/water
   */
  waterPlant = async (req: Request & WaterPlantRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { wateredAt } = req.body;

      const updatedPlant = await this.plantRepository.updateLastWatered(
        id,
        userId,
        wateredAt
      );

      if (!updatedPlant) {
        return res.status(404).json({
          success: false,
          message: 'Plant not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Plant watered successfully',
        data: updatedPlant,
      });
    } catch (error) {
      console.error('Error watering plant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to water plant',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get plants that need watering
   * GET /api/plants/needs-water
   */
  getPlantsNeedingWater = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const plants = await this.plantRepository.findPlantsNeedingWater(userId);

      res.status(200).json({
        success: true,
        message: 'Plants needing water retrieved successfully',
        data: plants,
        count: plants.length,
      });
    } catch (error) {
      console.error('Error getting plants needing water:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plants needing water',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get plant statistics for user
   * GET /api/plants/stats
   */
  getPlantStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const stats = await this.plantRepository.getPlantStats(userId);

      res.status(200).json({
        success: true,
        message: 'Plant statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting plant stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plant statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Upload image endpoint (standalone for frontend)
   * POST /api/plants/upload-image
   */
  uploadImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const imageUploadService = getImageUploadService();
      const uploadResult = await imageUploadService.uploadImage(req.file, 'plants');

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: uploadResult.imageUrl,
          key: uploadResult.key,
        },
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}