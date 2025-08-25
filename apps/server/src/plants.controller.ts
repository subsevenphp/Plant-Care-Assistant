import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PlantRepository } from '../repositories/plant.repository';
import { AuthenticatedRequest } from '../types/auth.types';
import { CreatePlantRequest, PlantResponse } from '../types/plant.types';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// Validation rules for plant creation
export const validateCreatePlant = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plant name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Plant name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'".()]+$/)
    .withMessage('Plant name contains invalid characters'),

  body('species')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Species name must not exceed 100 characters'),

  body('wateringInterval')
    .notEmpty()
    .withMessage('Watering interval is required')
    .isInt({ min: 1, max: 365 })
    .withMessage('Watering interval must be between 1 and 365 days')
    .toInt(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('lightRequirement')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Light requirement must be one of: low, medium, high'),

  body('soilType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Soil type must not exceed 50 characters'),

  body('fertilizingInterval')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Fertilizing interval must be between 1 and 365 days')
    .toInt(),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Location must not exceed 50 characters'),

  body('acquisitionDate')
    .optional()
    .isISO8601()
    .withMessage('Acquisition date must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('Acquisition date cannot be in the future');
      }
      return true;
    }),
];

// Plant controller class
export class PlantController {
  private plantRepository: PlantRepository;

  constructor() {
    this.plantRepository = new PlantRepository();
  }

  /**
   * Create a new plant
   * POST /api/plants
   */
  public createPlant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value
        }));

        logger.warn('Plant creation validation failed', {
          userId: req.user?.id,
          errors: errorMessages,
          body: req.body
        });

        throw new ApiError(400, 'Validation failed', errorMessages);
      }

      // Extract user ID from authenticated request
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'User authentication required');
      }

      // Extract and validate request body
      const plantData: CreatePlantRequest = {
        name: req.body.name,
        species: req.body.species || '',
        wateringInterval: req.body.wateringInterval,
        description: req.body.description,
        lightRequirement: req.body.lightRequirement,
        soilType: req.body.soilType,
        fertilizingInterval: req.body.fertilizingInterval,
        location: req.body.location,
        acquisitionDate: req.body.acquisitionDate ? new Date(req.body.acquisitionDate) : undefined,
      };

      logger.info('Creating new plant', {
        userId,
        plantName: plantData.name,
        species: plantData.species
      });

      // Check if user already has a plant with the same name
      const existingPlant = await this.plantRepository.findByNameAndUser(
        plantData.name, 
        userId
      );

      if (existingPlant) {
        throw new ApiError(409, 'A plant with this name already exists in your collection');
      }

      // Create the plant
      const newPlant = await this.plantRepository.create({
        ...plantData,
        userId,
      });

      logger.info('Plant created successfully', {
        userId,
        plantId: newPlant.id,
        plantName: newPlant.name
      });

      // Format response
      const response: PlantResponse = {
        id: newPlant.id,
        name: newPlant.name,
        species: newPlant.species,
        description: newPlant.description,
        imageUrl: newPlant.imageUrl,
        wateringInterval: newPlant.wateringInterval,
        lastWatered: newPlant.lastWatered,
        nextWateringDue: newPlant.nextWateringDue,
        lightRequirement: newPlant.lightRequirement,
        soilType: newPlant.soilType,
        fertilizingInterval: newPlant.fertilizingInterval,
        lastFertilized: newPlant.lastFertilized,
        healthStatus: newPlant.healthStatus,
        isActive: newPlant.isActive,
        location: newPlant.location,
        careNotes: newPlant.careNotes,
        acquisitionDate: newPlant.acquisitionDate,
        createdAt: newPlant.createdAt,
        updatedAt: newPlant.updatedAt,
      };

      res.status(201).json({
        success: true,
        message: 'Plant created successfully',
        data: response,
      });

    } catch (error) {
      logger.error('Error creating plant', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body
      });

      next(error);
    }
  };

  /**
   * Get all plants for authenticated user
   * GET /api/plants
   */
  public getUserPlants = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'User authentication required');
      }

      const { page = 1, limit = 10, search, healthStatus, location } = req.query;

      const filters = {
        userId,
        search: search as string,
        healthStatus: healthStatus as string,
        location: location as string,
        isActive: true,
      };

      const result = await this.plantRepository.findByUserWithFilters(
        filters,
        Number(page),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Plants retrieved successfully',
        data: result.plants,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });

    } catch (error) {
      logger.error('Error retrieving user plants', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      next(error);
    }
  };

  /**
   * Get plant by ID
   * GET /api/plants/:id
   */
  public getPlantById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const plantId = req.params.id;

      if (!userId) {
        throw new ApiError(401, 'User authentication required');
      }

      if (!plantId) {
        throw new ApiError(400, 'Plant ID is required');
      }

      const plant = await this.plantRepository.findByIdAndUser(plantId, userId);

      if (!plant) {
        throw new ApiError(404, 'Plant not found');
      }

      res.status(200).json({
        success: true,
        message: 'Plant retrieved successfully',
        data: plant,
      });

    } catch (error) {
      logger.error('Error retrieving plant', {
        userId: req.user?.id,
        plantId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      next(error);
    }
  };
}

// Error handling middleware specifically for plant operations
export const handlePlantErrors = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle known API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Handle Prisma/Database errors
  if (error.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A plant with this name already exists',
    });
    return;
  }

  if (error.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Plant not found',
    });
    return;
  }

  // Handle validation errors from other sources
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details,
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error in plant operations', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    }),
  });
};