import { Router } from 'express';
import { PlantController, validateCreatePlant, handlePlantErrors } from '../controllers/plants.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();
const plantController = new PlantController();

// Apply authentication middleware to all plant routes
router.use(authenticateToken);

// Apply rate limiting to plant creation (stricter limits)
const createPlantRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 plant creations per 15 minutes
  message: 'Too many plants created, please try again later.',
});

/**
 * @route   POST /api/plants
 * @desc    Create a new plant
 * @access  Private (Authenticated users only)
 * @validation Required: name, wateringInterval
 */
router.post(
  '/',
  createPlantRateLimit,
  validateCreatePlant,
  plantController.createPlant
);

/**
 * @route   GET /api/plants
 * @desc    Get all plants for authenticated user
 * @access  Private
 * @query   page, limit, search, healthStatus, location
 */
router.get('/', plantController.getUserPlants);

/**
 * @route   GET /api/plants/:id
 * @desc    Get plant by ID
 * @access  Private (Must own the plant)
 */
router.get('/:id', plantController.getPlantById);

/**
 * @route   PUT /api/plants/:id
 * @desc    Update plant by ID
 * @access  Private (Must own the plant)
 */
router.put('/:id', validateUpdatePlant, plantController.updatePlant);

/**
 * @route   DELETE /api/plants/:id
 * @desc    Delete plant by ID (soft delete)
 * @access  Private (Must own the plant)
 */
router.delete('/:id', plantController.deletePlant);

/**
 * @route   POST /api/plants/:id/water
 * @desc    Record watering event for a plant
 * @access  Private (Must own the plant)
 */
router.post('/:id/water', validateWateringEvent, plantController.recordWatering);

/**
 * @route   GET /api/plants/:id/care-events
 * @desc    Get care events for a specific plant
 * @access  Private (Must own the plant)
 */
router.get('/:id/care-events', plantController.getPlantCareEvents);

/**
 * @route   GET /api/plants/stats/overview
 * @desc    Get plant statistics for authenticated user
 * @access  Private
 */
router.get('/stats/overview', plantController.getPlantStats);

/**
 * @route   GET /api/plants/reminders/due
 * @desc    Get plants that need watering
 * @access  Private
 */
router.get('/reminders/due', plantController.getPlantsNeedingWater);

// Apply error handling middleware
router.use(handlePlantErrors);

export default router;